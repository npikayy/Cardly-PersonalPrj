import functools
import os
from pathlib import Path

from google import genai

from src.processing.config import ocr_settings


@functools.lru_cache(maxsize=1)
def get_gemini_client():
    return genai.Client(api_key=ocr_settings.GEMINI_API_KEY)


def _configure_paddle_cache() -> None:
    project_root = Path(__file__).resolve().parents[3]
    paddle_home = project_root / ".cache" / "paddle_home"
    paddle_home.mkdir(parents=True, exist_ok=True)

    # PaddleOCR and PaddlePaddle call expanduser("~") during import.
    os.environ["USERPROFILE"] = str(paddle_home)


@functools.lru_cache(maxsize=1)
def get_ocr_engine():
    _configure_paddle_cache()

    from paddleocr import PaddleOCR

    return PaddleOCR(
        use_textline_orientation=True,
        lang=ocr_settings.OCR_LANGUAGE,
    )
