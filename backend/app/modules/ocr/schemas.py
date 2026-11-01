
from pydantic import BaseModel, Field


class TextInputRequest(BaseModel):
    text: str
    title: str | None = None


class QuestionSchema(BaseModel):
    question_number: int = 0
    position_index: int = 0
    question_text: str = ""
    raw_text: str = ""
    cleaned_text: str = ""
    options: dict[str, str] = Field(default_factory=dict)
    option_order: list[str] = Field(default_factory=list)
    page_number: int = 1
    extraction_quality: str = "medium"
    is_complete: bool = False
    ocr_confidence: float = 0.0
    warnings: list[str] = Field(default_factory=list)


class PageSchema(BaseModel):
    page_number: int = 1
    raw_text: str = ""
    cleaned_text: str = ""
    ocr_confidence: float = 0.0


class ExtractionResult(BaseModel):
    status: str = "completed"
    warnings: list[str] = Field(default_factory=list)
    questions: list[QuestionSchema] = Field(default_factory=list)
    pages: list[PageSchema] = Field(default_factory=list)
    average_ocr_confidence: float = 0.0

    model_config = {"extra": "ignore"}


# Shared name expected by the TraceSet OCR module documentation
OCRExtractionResult = ExtractionResult


class UploadSummary(BaseModel):
    id: str
    filename: str
    file_type: str
    status: str
    total_pages: int = 1
