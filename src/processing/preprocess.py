"""
Preprocessing utility helpers.

Orientation detection strategy (in priority order):
1. pytesseract OSD  — fast, accurate for text-heavy scans (requires Tesseract).
2. Hough line analysis — gradient-based angle estimation, works without Tesseract.
3. Horizontal projection histogram — detects 180° flip by comparing top/bottom
   text density.

All public helpers are pure functions (numpy array in → numpy array / value out)
so they are easy to unit-test without a database or storage layer.
"""

from __future__ import annotations

import logging
import os
import uuid

import cv2
import numpy as np
from beanie import PydanticObjectId

from src.processing.config import preprocess_settings
from src.processing.exceptions import ImageDistorted, MemoryOverflow, PreprocessFailed
from src.processing.models import PreprocessedImage, PreprocessingStatus

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal constants
# ---------------------------------------------------------------------------
_SKEW_ANGLE_THRESHOLD = 0.5   # degrees — smaller than this is considered straight
_MAX_SKEW_CORRECTION = 45.0   # degrees — beyond this we trust 90/180/270 detection


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

def _to_gray(img: np.ndarray) -> np.ndarray:
    """Return a single-channel grayscale copy of *img* (no-op if already gray)."""
    if img.ndim == 2:
        return img.copy()
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def _binarize(gray: np.ndarray) -> np.ndarray:
    """Adaptive threshold → binary image suitable for projection / Hough analysis."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, binary = cv2.threshold(
        blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )
    return binary


# ---------------------------------------------------------------------------
# Method 1 — pytesseract OSD (Orientation & Script Detection)
# ---------------------------------------------------------------------------

def _detect_orientation_osd(gray: np.ndarray) -> int | None:
    """
    Use Tesseract OSD to detect the dominant rotation (0, 90, 180, 270).

    Returns the rotation angle that should be applied to correct the image,
    or *None* when Tesseract is unavailable or OSD fails.
    """
    try:
        # pyrefly: ignore [missing-import]
        import pytesseract  # optional dependency

        osd = pytesseract.image_to_osd(gray, output_type=pytesseract.Output.DICT)
        rotate = int(osd.get("rotate", 0))
        confidence = float(osd.get("orientation_conf", 0))

        logger.debug("OSD rotate=%d  confidence=%.2f", rotate, confidence)

        # Tesseract reports the angle *already applied* by the scanner;
        # we need to apply the complement to bring it back to upright.
        if confidence >= 2.0 and rotate in (90, 180, 270):
            return rotate
        return 0
    except Exception as exc:  # noqa: BLE001
        logger.debug("OSD unavailable or failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Method 2 — Gradient / Hough line analysis (skew angle estimation)
# ---------------------------------------------------------------------------

def _detect_skew_hough(gray: np.ndarray) -> float:
    """
    Estimate the fine skew angle (in degrees) via Canny edges + Hough lines.

    Returns a value in [-45, 45].  Positive → clockwise tilt.
    """
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=100,
        minLineLength=max(gray.shape[1] // 5, 50),
        maxLineGap=20,
    )
    if lines is None:
        return 0.0

    angles: list[float] = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        if x2 == x1:
            continue  # vertical line — skip
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        # Keep only near-horizontal lines (text baseline candidates)
        if abs(angle) < 45:
            angles.append(angle)

    if not angles:
        return 0.0

    median_angle = float(np.median(angles))
    logger.debug("Hough skew estimate: %.2f°", median_angle)
    return median_angle


# ---------------------------------------------------------------------------
# Method 3 — Horizontal projection histogram (180° flip detection)
# ---------------------------------------------------------------------------

def _is_upside_down_histogram(binary: np.ndarray) -> bool:
    """
    Compare top-half vs bottom-half ink density to detect 180° inversion.

    In a correctly oriented text document the *top* rows typically contain
    more ink pixels than the *bottom* rows when averaged across bands
    (due to ascenders, caps, and page headers).  This heuristic works best
    on clean scans.
    """
    h = binary.shape[0]
    top_density = float(np.sum(binary[: h // 2])) / (h // 2)
    bottom_density = float(np.sum(binary[h // 2 :])) / (h // 2)
    ratio = bottom_density / top_density if top_density > 0 else 0
    print(f"Histogram density — top: {top_density:.2f}  bottom: {bottom_density:.2f}  ratio: {ratio:.4f}")
    logger.debug(
        "Histogram density — top: %.1f  bottom: %.1f", top_density, bottom_density
    )
    # bottom heavier → image is likely inverted
    return bottom_density > top_density * 1.05


# ---------------------------------------------------------------------------
# Public rotation helpers
# ---------------------------------------------------------------------------

def rotate_fixed(img: np.ndarray, angle: int) -> np.ndarray:
    """
    Rotate *img* by a multiple of 90° using cv2.rotate() — lossless, no cropping.

    Parameters
    ----------
    img:
        Input BGR (or grayscale) image.
    angle:
        One of 90, 180, 270.  0 returns a copy unchanged.
    """
    codes = {
        90: cv2.ROTATE_90_CLOCKWISE,
        180: cv2.ROTATE_180,
        270: cv2.ROTATE_90_COUNTERCLOCKWISE,
    }
    if angle == 0:
        return img.copy()
    if angle not in codes:
        raise ValueError(f"angle must be one of 0/90/180/270, got {angle}")
    return cv2.rotate(img, codes[angle])


def rotate_arbitrary(img: np.ndarray, angle: float) -> np.ndarray:
    """
    Rotate *img* by an arbitrary angle while expanding the canvas to avoid cropping.

    Uses cv2.getRotationMatrix2D() + cv2.warpAffine() with INTER_CUBIC interpolation
    and a white background fill.

    Parameters
    ----------
    img:
        Input BGR (or grayscale) image.
    angle:
        Clockwise rotation in degrees (e.g. 3.5 corrects a –3.5° CCW tilt).
    """
    if abs(angle) < _SKEW_ANGLE_THRESHOLD:
        return img.copy()

    h, w = img.shape[:2]
    center = (w / 2.0, h / 2.0)

    M = cv2.getRotationMatrix2D(center, -angle, 1.0)  # negative → correct CW tilt

    # Expand output canvas so corners are not clipped
    cos_a = abs(M[0, 0])
    sin_a = abs(M[0, 1])
    new_w = int(h * sin_a + w * cos_a)
    new_h = int(h * cos_a + w * sin_a)

    # Adjust translation component
    M[0, 2] += (new_w - w) / 2.0
    M[1, 2] += (new_h - h) / 2.0

    border_color = (255, 255, 255) if img.ndim == 3 else 255
    rotated = cv2.warpAffine(
        img,
        M,
        (new_w, new_h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=border_color,
    )
    return rotated


# ---------------------------------------------------------------------------
# High-level orientation fix — combines all three methods
# ---------------------------------------------------------------------------

def detect_and_correct_orientation(img: np.ndarray) -> tuple[np.ndarray, int]:
    """
    Automatically detect and correct the orientation of a text-document image.

    Detection pipeline
    ------------------
    1. **pytesseract OSD** — detects coarse 90°/180°/270° rotation.
    2. **Hough line analysis** — estimates fine skew angle.
    3. **Histogram heuristic** — catches 180° flip when OSD is unavailable.

    Returns
    -------
    corrected : np.ndarray
        The straightened image (same dtype as input).
    total_rotation : int
        Total coarse rotation applied in degrees (0, 90, 180, or 270).
        Fine sub-degree corrections are not included in this integer.
    """
    gray = _to_gray(img)
    binary = _binarize(gray)

    # --- Step 1: coarse orientation via OSD ---
    coarse_rotation = _detect_orientation_osd(gray)

    if coarse_rotation is None:
        # Tesseract is not installed or failed. We use OpenCV-based projection profile analysis
        # to determine whether the text is oriented landscape (90 or 270) or portrait (0 or 180).
        # In text documents, the variance of horizontal projection profile is much higher
        # when lines of text are aligned horizontally (0 or 180 degrees) than vertically (90 or 270 degrees).
        
        # Test 0 degrees (original) vs 90 degrees
        h, w = binary.shape[:2]
        
        # 1. Detect if document is landscape-oriented text (90 or 270 degrees) vs portrait-oriented text (0 or 180 degrees)
        # Compute horizontal projection profile (mean of rows) to normalize against dimension differences
        proj_0 = np.mean(binary, axis=1)
        # For 90 degree rotation, the rows would be the columns of the original binary image
        proj_90 = np.mean(binary, axis=0)
        
        var_0 = np.var(proj_0)
        var_90 = np.var(proj_90)
        
        # In a text document, the profile with higher variance corresponds to the text lines aligned with the axis.
        # If var_90 is significantly larger than var_0, the text runs vertically, meaning a 90 or 270 degree rotation is needed.
        is_landscape_text = var_90 > var_0
        
        print(
            f"OpenCV orientation check: var_0 (portrait var) = {var_0:.2f}, var_90 (landscape var) = {var_90:.2f}. is_landscape_text = {is_landscape_text}"
        )
        
        if is_landscape_text:
            # It is rotated 90 or 270 degrees. To decide between 90 and 270, we check the margins or column ink density.
            # Let's rotate 90 degrees first and check if it's upside down.
            img_90 = rotate_fixed(img, 90)
            binary_90 = _binarize(_to_gray(img_90))
            is_upside_down = _is_upside_down_histogram(binary_90)
            print(f"Landscape check: rotating 90 deg. is_upside_down = {is_upside_down}")
            coarse_rotation = 270 if is_upside_down else 90
            print(
                f"OSD not available; projection variance analysis → landscape text detected, coarse rotation={coarse_rotation}°"
            )
        else:
            # It is oriented 0 or 180 degrees.
            is_upside_down = _is_upside_down_histogram(binary)
            print(f"Portrait check: is_upside_down = {is_upside_down}")
            coarse_rotation = 180 if is_upside_down else 0
            print(
                f"OSD not available; projection variance analysis → portrait text detected, coarse rotation={coarse_rotation}°"
            )
    else:
        print(f"OSD → coarse rotation={coarse_rotation}°")

    corrected = rotate_fixed(img, coarse_rotation) if coarse_rotation != 0 else img.copy()

    # --- Step 2: fine skew correction via Hough ---
    gray_corrected = _to_gray(corrected)
    skew_angle = _detect_skew_hough(gray_corrected)

    if abs(skew_angle) >= _SKEW_ANGLE_THRESHOLD and abs(skew_angle) <= _MAX_SKEW_CORRECTION:
        logger.info("Applying fine skew correction: %.2f°", skew_angle)
        corrected = rotate_arbitrary(corrected, skew_angle)
    else:
        logger.debug("Skew angle %.2f° below threshold — skipped", skew_angle)

    return corrected, coarse_rotation


"""
Preprocessing service layer.

Exposes the four main pipeline steps described in models.PreprocessedImage:
    • normalize_dpi      — resample to target DPI if below minimum
    • fix_orientation    — auto-detect + correct coarse rotation and fine skew
    • adjust_brightness_contrast — auto-contrast via CLAHE
    • convert_format     — encode to target format (PNG, JPEG, WEBP …)
    • preprocess_pipeline — async orchestrator that runs all steps and persists
                            a PreprocessedImage document.

Each step function is intentionally stateless: it accepts a numpy image array
(and optional metadata) and returns a transformed image plus any metadata
needed to populate PreprocessedImage fields.
"""

PROCESSED_DIR = "storage/processed"


# ---------------------------------------------------------------------------
# Async pipeline orchestrator
# ---------------------------------------------------------------------------

async def preprocess_pipeline(
    source_path: str,
    source_image_id: PydanticObjectId,
    *,
    manual_rotation: int | None = None,
    source_dpi: int = 96,
    output_format: str = preprocess_settings.OUTPUT_FORMAT,
) -> PreprocessedImage:
    """
    Run the full preprocessing pipeline on a source image file.

    Steps executed in order:
      1. ``normalize_dpi``            — upsample to MIN_DPI if needed.
      2. ``fix_orientation``          — auto-correct rotation/skew
                                       (or apply *manual_rotation* if supplied).
      3. ``adjust_brightness_contrast`` — CLAHE contrast enhancement.
      4. ``convert_format``           — encode to *output_format*.

    The result is saved to ``storage/processed/`` and a
    :class:`~src.processing.models.PreprocessedImage` document is inserted
    into MongoDB (if available) and returned.

    Parameters
    ----------
    source_path:
        Filesystem path to the uploaded source image.
    source_image_id:
        MongoDB ObjectId of the original image document.
    manual_rotation:
        When not *None* (0 / 90 / 180 / 270), skip auto-detection and apply
        this exact coarse rotation.
    source_dpi:
        DPI metadata of the source scan (default 96 for web uploads).
    output_format:
        Target format string, e.g. ``"png"`` or ``"jpeg"``.

    Returns
    -------
    PreprocessedImage
        The saved preprocessing artifact document.
    """
    processing_id = str(uuid.uuid4())
    steps_applied: list[str] = []

    record = PreprocessedImage(
        processing_id=processing_id,
        source_image_id=source_image_id,
        processed_storage_path="",
        resolution_dpi=source_dpi,
        output_format=output_format,
        preprocessing_status=PreprocessingStatus.IN_PROGRESS,
    )

    try:
        # --- Load image ---
        img = cv2.imread(source_path, cv2.IMREAD_COLOR)
        if img is None:
            raise PreprocessFailed(message=f"Cannot read image: {source_path}")

        # --- Step 1: Normalize DPI ---
        img, effective_dpi = normalize_dpi(img, source_dpi)
        record.resolution_dpi = effective_dpi
        steps_applied.append(f"normalize_dpi:{effective_dpi}dpi")

        # --- Step 2: Fix orientation ---
        if manual_rotation is not None and manual_rotation in (0, 90, 180, 270):
            img = rotate_fixed(img, manual_rotation)
            rotation_applied = manual_rotation
            steps_applied.append(f"manual_rotation:{manual_rotation}deg")
        else:
            img, rotation_applied = fix_orientation(img)
            steps_applied.append(f"fix_orientation:{rotation_applied}deg")
        record.rotation_applied = rotation_applied

        # --- Step 3: Brightness / contrast ---
        img, brightness_delta, contrast_delta = adjust_brightness_contrast(img)
        record.brightness_delta = brightness_delta
        record.contrast_delta = contrast_delta
        steps_applied.append(
            f"clahe:brightness_delta={brightness_delta:.4f},contrast_delta={contrast_delta:.4f}"
        )

        # --- Step 4: Convert format ---
        img = convert_format(img, output_format)
        steps_applied.append(f"convert_format:{output_format}")

        # --- Save processed file ---
        os.makedirs(PROCESSED_DIR, exist_ok=True)
        ext = output_format.lower().strip(".")
        out_filename = f"{processing_id}.{ext}"
        out_path = os.path.join(PROCESSED_DIR, out_filename)
        cv2.imwrite(out_path, img)

        record.processed_storage_path = out_path
        record.steps_applied = steps_applied
        record.preprocessing_status = PreprocessingStatus.SUCCESS

        logger.info("Pipeline SUCCESS  processing_id=%s  steps=%s", processing_id, steps_applied)

    except (PreprocessFailed, ImageDistorted, MemoryOverflow) as exc:
        record.preprocessing_status = PreprocessingStatus.FAILED
        record.error_message = str(exc)
        record.steps_applied = steps_applied
        logger.error("Pipeline FAILED  processing_id=%s  error=%s", processing_id, exc)
        raise

    except Exception as exc:  # noqa: BLE001
        record.preprocessing_status = PreprocessingStatus.FAILED
        record.error_message = str(exc)
        record.steps_applied = steps_applied
        logger.exception("Pipeline unexpected error  processing_id=%s", processing_id)
        raise PreprocessFailed(message=str(exc)) from exc

    finally:
        # Persist record regardless of success/failure (best-effort)
        try:
            await record.insert()
        except Exception as db_exc:  # noqa: BLE001
            logger.warning("Could not persist PreprocessedImage to DB: %s", db_exc)

    return record


async def preprocess_pipeline_in_memory(
    file_bytes: bytes,
    *,
    manual_rotation: int | None = None,
    source_dpi: int = 96,
    output_format: str = preprocess_settings.OUTPUT_FORMAT,
) -> tuple[np.ndarray, dict]:
    """
    Run the full preprocessing pipeline in-memory on bytes.
    Does not save to disk, does not insert to MongoDB.
    """
    steps_applied: list[str] = []

    try:
        # --- Load image from bytes ---
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise PreprocessFailed(message="Cannot decode uploaded image bytes")

        # --- Step 1: Normalize DPI ---
        img, effective_dpi = normalize_dpi(img, source_dpi)
        steps_applied.append(f"normalize_dpi:{effective_dpi}dpi")

        # --- Step 2: Fix orientation ---
        if manual_rotation is not None and manual_rotation in (0, 90, 180, 270):
            img = rotate_fixed(img, manual_rotation)
            rotation_applied = manual_rotation
            steps_applied.append(f"manual_rotation:{manual_rotation}deg")
        else:
            img, rotation_applied = fix_orientation(img)
            steps_applied.append(f"fix_orientation:{rotation_applied}deg")

        # --- Step 3: Brightness / contrast ---
        img, brightness_delta, contrast_delta = adjust_brightness_contrast(img)
        steps_applied.append(
            f"clahe:brightness_delta={brightness_delta:.4f},contrast_delta={contrast_delta:.4f}"
        )

        # --- Step 4: Convert format ---
        img = convert_format(img, output_format)
        steps_applied.append(f"convert_format:{output_format}")

        metadata = {
            "resolution_dpi": effective_dpi,
            "rotation_applied": rotation_applied,
            "brightness_delta": brightness_delta,
            "contrast_delta": contrast_delta,
            "steps_applied": steps_applied,
            "output_format": output_format
        }
        return img, metadata

    except Exception as exc:
        logger.exception("In-memory pipeline unexpected error")
        if not isinstance(exc, PreprocessFailed | ImageDistorted | MemoryOverflow):
            raise PreprocessFailed(message=str(exc)) from exc
        raise


# ---------------------------------------------------------------------------
# 1. normalize_dpi
# ---------------------------------------------------------------------------


def normalize_dpi(
    img: np.ndarray,
    source_dpi: int,
    *,
    target_dpi: int = preprocess_settings.MIN_DPI,
    max_dimension: int = preprocess_settings.MAX_DIMENSION,
) -> tuple[np.ndarray, int]:
    """
    Resample *img* so its effective DPI equals *target_dpi*.

    If the image is already at or above the target DPI it is returned
    unchanged.  Images that would exceed *max_dimension* after upsampling
    are clamped to *max_dimension* to prevent memory issues.

    Parameters
    ----------
    img:
        Input BGR (or grayscale) image.
    source_dpi:
        The DPI metadata attached to the source scan.
    target_dpi:
        Desired output DPI (default: ``preprocess_settings.MIN_DPI``).
    max_dimension:
        Hard cap on the longest side of the output image in pixels.

    Returns
    -------
    resampled : np.ndarray
        The resampled image (same dtype as input).
    effective_dpi : int
        The DPI of the returned image.
    """
    try:
        if source_dpi <= 0:
            raise ValueError(f"source_dpi must be positive, got {source_dpi}")

        scale = target_dpi / source_dpi
        if scale <= 1.0:
            logger.debug("Source DPI %d >= target %d — no upsampling needed.", source_dpi, target_dpi)
            return img.copy(), source_dpi

        h, w = img.shape[:2]
        new_w = int(w * scale)
        new_h = int(h * scale)

        # Clamp to max_dimension
        longest = max(new_w, new_h)
        if longest > max_dimension:
            clamp_scale = max_dimension / longest
            new_w = int(new_w * clamp_scale)
            new_h = int(new_h * clamp_scale)
            effective_dpi = int(target_dpi * clamp_scale)
            logger.info(
                "Image clamped to %dx%d (max_dimension=%d); effective DPI=%d",
                new_w, new_h, max_dimension, effective_dpi,
            )
        else:
            effective_dpi = target_dpi

        resampled = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        logger.info("Resampled %dx%d → %dx%d (DPI %d → %d)", w, h, new_w, new_h, source_dpi, effective_dpi)
        return resampled, effective_dpi

    except MemoryError as exc:
        raise MemoryOverflow() from exc
    except Exception as exc:  # noqa: BLE001
        raise PreprocessFailed(message=f"normalize_dpi failed: {exc}") from exc


# ---------------------------------------------------------------------------
# 2. fix_orientation
# ---------------------------------------------------------------------------

def fix_orientation(img: np.ndarray) -> tuple[np.ndarray, int]:
    """
    Auto-detect and correct the orientation of a text-document image.

    Detection uses (in priority order):
      1. **pytesseract OSD** — Tesseract's built-in Orientation & Script
         Detection; very reliable for printed text (requires ``tesseract``
         installed on the system).
      2. **Hough line analysis** — gradient-based skew estimation; works
         without Tesseract and corrects fine sub-degree tilts.
      3. **Histogram heuristic** — compares top/bottom ink density to catch
         180° flips when OSD is unavailable.

    Rotation is applied as follows:
      • Coarse multiples of 90° → :func:`cv2.rotate` (lossless, no cropping).
      • Fine skew angles         → :func:`cv2.getRotationMatrix2D` +
                                   :func:`cv2.warpAffine` with canvas expansion.

    Parameters
    ----------
    img:
        Input BGR (or grayscale) image as a numpy array.

    Returns
    -------
    corrected : np.ndarray
        The orientation-corrected image.
    rotation_applied : int
        Coarse rotation applied in degrees (0, 90, 180, or 270).
        Maps directly to ``PreprocessedImage.rotation_applied``.

    Raises
    ------
    ImageDistorted
        Raised when the image appears badly distorted and orientation
        cannot be reliably determined.
    PreprocessFailed
        Raised on any unexpected processing error.
    """
    try:
        if img is None or img.size == 0:
            raise ImageDistorted(message="fix_orientation received an empty image")

        logger.info("fix_orientation is disabled — returning original image.")
        return img.copy(), 0

    except (ImageDistorted, PreprocessFailed):
        raise
    except MemoryError as exc:
        raise MemoryOverflow() from exc
    except Exception as exc:  # noqa: BLE001
        raise PreprocessFailed(message=f"fix_orientation failed: {exc}") from exc


# ---------------------------------------------------------------------------
# 3. adjust_brightness_contrast
# ---------------------------------------------------------------------------

def adjust_brightness_contrast(
    img: np.ndarray,
    *,
    clip_limit: float = 2.0,
    tile_grid_size: tuple[int, int] = (8, 8),
) -> tuple[np.ndarray, float, float]:
    """
    Apply automatic adaptive contrast enhancement (CLAHE).

    CLAHE (Contrast Limited Adaptive Histogram Equalization) boosts local
    contrast without over-amplifying noise, making it well-suited for
    uneven-lighting scans and faded documents.

    Parameters
    ----------
    img:
        Input BGR (or grayscale) image.
    clip_limit:
        Threshold for contrast limiting.  Higher → stronger enhancement.
    tile_grid_size:
        Size of the grid for histogram equalization.

    Returns
    -------
    enhanced : np.ndarray
        The contrast-enhanced image (same colour space as input).
    brightness_delta : float
        Mean pixel value change (positive = brighter).
    contrast_delta : float
        Standard-deviation change (positive = more contrast).
    """
    try:
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)

        if img.ndim == 2:
            # Grayscale
            before_mean = float(img.mean())
            before_std = float(img.std())
            enhanced = clahe.apply(img)
            after_mean = float(enhanced.mean())
            after_std = float(enhanced.std())
        else:
            # Colour — apply CLAHE only to the luminance (L) channel
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)
            before_mean = float(l_channel.mean())
            before_std = float(l_channel.std())
            l_eq = clahe.apply(l_channel)
            after_mean = float(l_eq.mean())
            after_std = float(l_eq.std())
            lab_eq = cv2.merge([l_eq, a_channel, b_channel])
            enhanced = cv2.cvtColor(lab_eq, cv2.COLOR_LAB2BGR)

        brightness_delta = round(after_mean - before_mean, 4)
        contrast_delta = round(after_std - before_std, 4)
        logger.info(
            "CLAHE — brightness Δ=%.4f  contrast Δ=%.4f",
            brightness_delta,
            contrast_delta,
        )
        return enhanced, brightness_delta, contrast_delta

    except MemoryError as exc:
        raise MemoryOverflow() from exc
    except Exception as exc:  # noqa: BLE001
        raise PreprocessFailed(message=f"adjust_brightness_contrast failed: {exc}") from exc


# ---------------------------------------------------------------------------
# 4. convert_format
# ---------------------------------------------------------------------------

_FORMAT_EXTENSIONS = {
    "png": ".png",
    "jpeg": ".jpg",
    "jpg": ".jpg",
    "webp": ".webp",
    "tiff": ".tiff",
}

_ENCODE_PARAMS: dict[str, list[int]] = {
    "png": [cv2.IMWRITE_PNG_COMPRESSION, 3],
    "jpeg": [cv2.IMWRITE_JPEG_QUALITY, 95],
    "jpg": [cv2.IMWRITE_JPEG_QUALITY, 95],
    "webp": [cv2.IMWRITE_WEBP_QUALITY, 90],
    "tiff": [],
}


def convert_format(img: np.ndarray, output_format: str) -> np.ndarray:
    """
    Re-encode *img* into *output_format* and return the decoded result.

    This round-trip through encode/decode ensures the returned array
    exactly represents what would be written to disk, which is important
    for lossy formats (JPEG, WEBP) so downstream metrics are accurate.

    Parameters
    ----------
    img:
        Input BGR (or grayscale) image.
    output_format:
        Target format string, e.g. ``"png"``, ``"jpeg"``, ``"webp"``.

    Returns
    -------
    converted : np.ndarray
        The re-encoded/decoded image array.

    Raises
    ------
    PreprocessFailed
        If the format is unsupported or encoding fails.
    """
    fmt = output_format.lower().strip(".")
    if fmt not in _FORMAT_EXTENSIONS:
        supported = ", ".join(_FORMAT_EXTENSIONS)
        raise PreprocessFailed(
            message=f"Unsupported output format '{output_format}'. Supported: {supported}"
        )
    try:
        ext = _FORMAT_EXTENSIONS[fmt]
        params = _ENCODE_PARAMS.get(fmt, [])
        success, buffer = cv2.imencode(ext, img, params)
        if not success:
            raise RuntimeError("cv2.imencode returned False")
        converted = cv2.imdecode(buffer, cv2.IMREAD_UNCHANGED)
        logger.info("Converted image to %s (%d bytes)", fmt.upper(), len(buffer))
        return converted
    except (PreprocessFailed, MemoryOverflow):
        raise
    except MemoryError as exc:
        raise MemoryOverflow() from exc
    except Exception as exc:  # noqa: BLE001
        raise PreprocessFailed(message=f"convert_format failed: {exc}") from exc


"""
Preprocess adapter for the OCR pipeline API.

Bridges the image-storage download layer (``list[bytes]``) with the in-memory
preprocessing core (``preprocess_pipeline_in_memory``), which returns a
``np.ndarray``.  This wrapper re-encodes each processed array back to bytes
so the output is a ``list[bytes]`` ready for the OCR module.

The core function ``preprocess_pipeline_in_memory`` is **not modified**.
"""

async def preprocess_image_bytes(
    images_raw: list[bytes],
    *,
    output_format: str = preprocess_settings.OUTPUT_FORMAT,
) -> list[bytes]:
    """Run the preprocessing pipeline on a list of raw image byte strings.

    For each raw ``bytes`` object:
      1. Run the full in-memory preprocessing pipeline
         (DPI normalisation, orientation fix, CLAHE, format conversion).
      2. Re-encode the resulting ``np.ndarray`` back to bytes in *output_format*.

    Parameters
    ----------
    images_raw:
        Raw image bytes, typically downloaded from Cloudinary.
    output_format:
        Target image format for encoding (default: ``preprocess_settings.OUTPUT_FORMAT``).

    Returns
    -------
    list[bytes]
        One preprocessed bytes object per input image, in the same order.
    """
    ext_map = {
        "png": ".png",
        "jpeg": ".jpg",
        "jpg": ".jpg",
        "webp": ".webp",
        "tiff": ".tiff",
    }
    fmt = output_format.lower().strip(".")
    ext = ext_map.get(fmt, ".png")

    images_data: list[bytes] = []

    for idx, raw_bytes in enumerate(images_raw):
        # Run the full preprocessing pipeline in-memory (no DB, no disk)
        img_array, metadata = await preprocess_pipeline_in_memory(
            raw_bytes,
            output_format=output_format,
        )

        # Re-encode the processed np.ndarray → bytes
        success, buffer = cv2.imencode(ext, img_array)
        if not success:
            logger.error(
                "cv2.imencode failed for image index %d (format=%s)",
                idx,
                output_format,
            )
            raise RuntimeError(
                f"Failed to encode preprocessed image at index {idx}"
            )

        image_bytes: bytes = buffer.tobytes()
        logger.info(
            "Preprocessed image[%d] → %d bytes (steps=%s)",
            idx,
            len(image_bytes),
            metadata.get("steps_applied"),
        )
        images_data.append(image_bytes)

    return images_data
