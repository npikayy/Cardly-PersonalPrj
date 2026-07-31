from src.exceptions import AppException


class PreprocessFailed(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "Image preprocessing failed"


class ImageDistorted(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "Image distortion detected during preprocessing"


class MemoryOverflow(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "Memory overflow during image processing"


class OcrFailed(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "OCR extraction failed"


class CardNotDetected(AppException):
    status_code = 500
    code = "CARD_NOT_DETECTED"
    message = "Card not detected"


class ExtractionTimeout(AppException):
    status_code = 500
    code = "EXTRACTION_TIMEOUT"
    message = "Extraction timeout"


class VisionApiError(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "AI Vision API error"


class AiModelUnavailable(AppException):
    status_code = 503
    code = "AI_MODEL_UNAVAILABLE"
    message = "AI model is temporarily unavailable. Please try again later."


class ApiQuotaExceeded(AppException):
    status_code = 429
    code = "PIPELINE_FAILED"
    message = "Vision API quota exceeded"


class MappingFailed(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "Business field mapping failed"


class SchemaMismatch(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "OCR output does not match expected schema"


class UnknownDocType(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "Unknown document type"

class DocumentNotFound(AppException):
    status_code = 404
    code = "NOT_FOUND"
    message = "Document not found"


class ScoringFailed(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "Confidence scoring failed"


class UnsupportedDocumentType(AppException):
    status_code = 422
    code = "UNSUPPORTED_DOCUMENT_TYPE"
    message = "P6 confidence scoring currently supports business_card only"

class PipelineFailed(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "Pipeline execution failed"


class StageTimeout(AppException):
    status_code = 500
    code = "PIPELINE_FAILED"
    message = "Pipeline stage timed out"
