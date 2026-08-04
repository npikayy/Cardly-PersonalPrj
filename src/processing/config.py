from pydantic_settings import BaseSettings, SettingsConfigDict


class PreprocessConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MIN_DPI: int = 300
    MAX_DIMENSION: int = 4096
    OUTPUT_FORMAT: str = "png"


preprocess_settings = PreprocessConfig()


class OcrConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    GEMINI_API_KEY: str = ""
    OCR_ENGINE: str = "gemini"   # "tesseract" | "gemini"
    OCR_LANGUAGE: str = "vi"
    MODEL_NAME: str = "gemini-1.5-pro"


ocr_settings = OcrConfig()


class MappingConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MAPPER_VERSION: str = "1.0.0"


mapping_settings = MappingConfig()


class ConfidenceConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    HIGH_THRESHOLD: float = 0.95
    LOW_THRESHOLD: float = 0.70


confidence_settings = ConfidenceConfig()
