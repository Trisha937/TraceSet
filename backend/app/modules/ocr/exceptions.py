class OCRBaseError(Exception):
    status_code = 500


class FileValidationError(OCRBaseError):
    status_code = 400


class ExtractionError(OCRBaseError):
    status_code = 422


class OCRUnavailableError(OCRBaseError):
    status_code = 503
