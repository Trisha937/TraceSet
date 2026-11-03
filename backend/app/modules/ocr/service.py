import hashlib
import uuid
from pathlib import Path

from backend.app.modules.ocr.config import (
    OCR_MAX_TEXT_CHARS,
    UPLOAD_DIR,
    max_file_size_bytes,
)
from backend.app.modules.ocr.exceptions import (
    ExtractionError,
    FileValidationError,
    OCRUnavailableError,
)
from backend.app.modules.ocr.extractors import (
    extract_image_text,
    extract_pdf_pages,
)
from backend.app.modules.ocr.question_parser import parse_mcq_questions
from backend.app.modules.ocr.schemas import (
    ExtractionResult,
    PageSchema,
    QuestionSchema,
)
from backend.app.modules.ocr.text_cleaning import clean_text


def _validate_upload_bytes(file_bytes: bytes, filename: str | None = None):
    if not file_bytes:
        raise FileValidationError("Uploaded file is empty.")

    if len(file_bytes) > max_file_size_bytes():
        raise FileValidationError("File is too large.")

    name = (filename or "upload").lower()
    allowed = (".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".txt")

    if not any(name.endswith(ext) for ext in allowed):
        raise FileValidationError("Unsupported file type.")


def _score_extraction_quality(question: dict, confidence: float) -> str:
    text_ok = bool(question.get("question_text", "").strip())
    option_count = len(question.get("options", {}))
    warnings = question.get("warnings", [])

    ambiguous = any(
        "normalized" in str(item).lower()
        or "uncertain" in str(item).lower()
        or "partial" in str(item).lower()
        for item in warnings
    )

    if (
        confidence >= 80
        and text_ok
        and option_count >= 4
        and not ambiguous
        and set(question.get("option_order", [])) == {"A", "B", "C", "D"}
    ):
        return "high"

    if text_ok and option_count >= 2:
        return "medium"

    if text_ok and option_count:
        return "medium"

    return "low"


def _build_extraction_result(
    raw_text: str,
    pages: list[dict],
    page_models: list[PageSchema],
):
    parsed_questions = parse_mcq_questions(raw_text)

    # Only include actual OCR confidence values.
    confidence_values = [
        float(page.get("ocr_confidence", 0.0))
        for page in pages
        if float(page.get("ocr_confidence", 0.0)) > 0
    ]

    avg_confidence = (
        round(sum(confidence_values) / len(confidence_values), 2)
        if confidence_values
        else 100.0 if any(p.get("raw_text") for p in pages) else 0.0
    )

    questions = []

    for index, question in enumerate(parsed_questions):
        confidence = float(question.get("ocr_confidence", avg_confidence))
        option_order = question.get("option_order", [])

        question["is_complete"] = (
            bool(question.get("question_text", "").strip())
            and set(option_order) == {"A", "B", "C", "D"}
        )

        question["extraction_quality"] = _score_extraction_quality(
            question,
            confidence,
        )

        question_text = question.get("question_text", "")

        questions.append(
            QuestionSchema(
                question_number=question.get("question_number", index + 1),
                position_index=question.get("position_index", index),
                question_text=question_text,
                raw_text=question.get("raw_text", ""),
                cleaned_text=clean_text(question_text),
                options=question.get("options", {}),
                option_order=option_order,
                page_number=question.get("page_number", 1),
                extraction_quality=question.get(
                    "extraction_quality", "medium"
                ),
                is_complete=bool(question.get("is_complete", False)),
                ocr_confidence=confidence,
                warnings=question.get("warnings", []),
            )
        )

    warnings = []

    if not questions:
        warnings.append(
            "No questions were detected in the supplied text."
        )

    status = "completed_with_warnings" if warnings else "completed"

    return ExtractionResult(
        status=status,
        warnings=warnings,
        questions=questions,
        pages=page_models,
        average_ocr_confidence=avg_confidence,
    )


def process_leak_text(
    text: str,
    title: str | None = None,
) -> ExtractionResult:
    if text is None or not str(text).strip():
        raise FileValidationError("Text is empty.")

    cleaned = clean_text(str(text))

    if not cleaned:
        raise FileValidationError("Text is empty.")

    if len(cleaned) > OCR_MAX_TEXT_CHARS:
        raise FileValidationError(
            "Text exceeds the configured extraction limit."
        )

    page = PageSchema(
        page_number=1,
        raw_text=text,
        cleaned_text=cleaned,
        ocr_confidence=100.0,
    )

    return _build_extraction_result(cleaned, [{"ocr_confidence": 100.0, "raw_text": text}], [page])


def process_leak_file(
    file_bytes: bytes,
    filename: str,
    *,
    raise_on_unavailable: bool = False,
) -> ExtractionResult:
    _validate_upload_bytes(file_bytes, filename)

    name = (filename or "upload").lower()

    try:
        if name.endswith(".pdf"):
            pages = extract_pdf_pages(file_bytes)

        elif name.endswith(".txt"):
            txt_content = file_bytes.decode("utf-8", errors="ignore")
            cleaned = clean_text(txt_content)
            pages = [{
                "page_number": 1,
                "raw_text": txt_content,
                "cleaned_text": cleaned,
                "ocr_confidence": 100.0,
            }]

        elif name.endswith((".png", ".jpg", ".jpeg", ".tif", ".tiff")):
            pages = extract_image_text(file_bytes)

        else:
            raise FileValidationError("Unsupported file type.")

        combined = "\n\n".join(
            page.get("cleaned_text", "")
            for page in pages
            if page.get("cleaned_text")
        )

        extracted_pages = [
            PageSchema(
                page_number=page["page_number"],
                raw_text=page.get("raw_text", ""),
                cleaned_text=page.get("cleaned_text", ""),
                ocr_confidence=float(
                    page.get("ocr_confidence", 0.0)
                ),
            )
            for page in pages
        ]

        return _build_extraction_result(
            combined,
            pages,
            extracted_pages,
        )

    except OCRUnavailableError as exc:
        if raise_on_unavailable:
            raise

        return ExtractionResult(
            status="completed_with_warnings",
            warnings=[str(exc)],
            questions=[],
            pages=[
                PageSchema(
                    page_number=1,
                    raw_text="",
                    cleaned_text="",
                    ocr_confidence=0.0,
                )
            ],
            average_ocr_confidence=0.0,
        )

    except Exception as exc:
        if isinstance(exc, (FileValidationError, ExtractionError)):
            raise

        raise ExtractionError(
            f"Unable to extract text from the uploaded file: {exc}"
        ) from exc


def save_uploaded_file(
    file_bytes: bytes,
    filename: str,
) -> tuple[str, str]:
    upload_dir = Path(UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    digest = hashlib.sha256(file_bytes).hexdigest()

    suffix = Path(filename).suffix or ".bin"
    stored_name = f"{uuid.uuid4().hex}{suffix}"

    stored_path = upload_dir / stored_name
    stored_path.write_bytes(file_bytes)

    return str(stored_path), digest
