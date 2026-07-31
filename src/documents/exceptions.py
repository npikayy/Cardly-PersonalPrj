from src.exceptions import AppException


class FileTooLarge(AppException):
    status_code = 422
    code = "FILE_TOO_LARGE"
    message = "File exceeds 10 MB limit"


class InvalidMime(AppException):
    status_code = 422
    code = "INVALID_MIME"
    message = "File type not supported. Use JPG, PNG, WEBP or PDF"


class DuplicateFile(AppException):
    status_code = 422
    code = "DUPLICATE_FILE"
    message = "This file has already been uploaded"


class CorruptedFile(AppException):
    status_code = 422
    code = "VALIDATION_ERROR"
    message = "File is corrupted or unreadable"


class InvalidState(AppException):
    status_code = 400
    code = "INVALID_STATE"
    message = "Document is not in a valid state for this operation"


class AlreadyFinalized(AppException):
    status_code = 400
    code = "INVALID_STATE"
    message = "Document has already been finalized"


class SessionExpired(AppException):
    status_code = 400
    code = "INVALID_STATE"
    message = "Review session has expired"
