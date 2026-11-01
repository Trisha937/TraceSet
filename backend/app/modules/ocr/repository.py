
import uuid
from typing import Any

from sqlalchemy.orm import Session

from backend.app.models.leak import ExtractedQuestion, LeakUpload


def create_upload_record(
    db: Session,
    *,
    filename: str,
    file_path: str,
    file_type: str,
    file_size_bytes: int,
    total_pages: int = 1,
    status: str = "PENDING",
    processing_warnings: list[str] | None = None,
) -> LeakUpload:
    upload = LeakUpload(
        id=str(uuid.uuid4()),
        filename=filename,
        file_path=file_path,
        file_type=file_type,
        file_size_bytes=file_size_bytes,
        total_pages=total_pages,
        status=status,
        processing_warnings=processing_warnings or [],
    )

    try:
        db.add(upload)
        db.commit()
        db.refresh(upload)
        return upload
    except Exception:
        db.rollback()
        raise


def save_extracted_questions(
    db: Session,
    upload_id: str,
    questions: list[dict[str, Any]],
) -> None:
    try:
        for index, question in enumerate(questions):
            record = ExtractedQuestion(
                id=str(uuid.uuid4()),
                upload_id=upload_id,
                detected_question_number=question.get(
                    "detected_question_number"
                ),
                detected_order=question.get("detected_order", index + 1),
                extracted_text=question.get("extracted_text", ""),
                cleaned_text=question.get("cleaned_text", ""),
                options=question.get("options", {}),
                detected_option_order=question.get(
                    "detected_option_order", []
                ),
                page_number=question.get("page_number", 1),
                extraction_quality=question.get(
                    "extraction_quality", "MEDIUM"
                ),
                is_partial=question.get("is_partial", "YES"),
                warnings=question.get("warnings", []),
            )

            db.add(record)

        db.commit()

    except Exception:
        db.rollback()
        raise


def get_upload(db: Session, upload_id: str):
    return (
        db.query(LeakUpload)
        .filter(LeakUpload.id == upload_id)
        .first()
    )


def list_uploads(db: Session):
    return (
        db.query(LeakUpload)
        .order_by(LeakUpload.created_at.desc())
        .all()
    )


def load_extracted_questions(db: Session, upload_id: str):
    return (
        db.query(ExtractedQuestion)
        .filter(ExtractedQuestion.upload_id == upload_id)
        .order_by(ExtractedQuestion.detected_order.asc())
        .all()
    )
