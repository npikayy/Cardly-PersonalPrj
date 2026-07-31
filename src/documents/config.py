from pydantic_settings import BaseSettings, SettingsConfigDict


class IntakeConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MAX_SIZE_MB: int = 10
    ALLOWED_MIMES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_FOLDER: str = "cardly"


intake_settings = IntakeConfig()


class ReviewConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SESSION_TIMEOUT_HOURS: int = 24


review_settings = ReviewConfig()
