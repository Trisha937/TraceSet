
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pathlib import Path
from backend.app.modules.ocr.config import UPLOAD_DIR

from backend.app.database import get_db
from backend.app.modules.ocr.exceptions import (
    FileValidationError,
    ExtractionError,
    OCRUnavailableError,
)
from backend.app.modules.ocr.repository import (
    create_upload_record,
    get_upload,
    list_uploads,
    load_extracted_questions,
    save_extracted_questions,
)
from backend.app.modules.ocr.schemas import TextInputRequest
from backend.app.modules.ocr.service import (
    process_leak_file,
    process_leak_text,
    save_uploaded_file,
)


router = APIRouter(prefix="/api/leaks", tags=["leaks"])


def _question_to_dict(question):
    """Convert OCR output into the shared database field names."""
    data = (
        question.model_dump()
        if hasattr(question, "model_dump")
        else dict(question)
    )

    return {
        "detected_question_number": data.get("question_number"),
        "detected_order": data.get("position_index", 0) + 1,
        "extracted_text": data.get("raw_text") or data.get("question_text", ""),
        "cleaned_text": data.get("cleaned_text") or data.get("question_text", ""),
        "options": data.get("options", {}),
        "detected_option_order": data.get("option_order", []),
        "page_number": data.get("page_number", 1),
        "extraction_quality": data.get(
            "extraction_quality", "medium"
        ).upper(),
        "is_partial": (
            "NO" if data.get("is_complete", False) else "YES"
        ),
        "warnings": data.get("warnings", []),
    }


def _save_questions(db, upload_id, questions):
    save_extracted_questions(
        db,
        upload_id,
        [_question_to_dict(question) for question in questions],
    )


@router.post("/text")
def process_text_input(
    payload: TextInputRequest,
    db: Session = Depends(get_db),
):
    try:
        result = process_leak_text(payload.text, payload.title)

        upload = create_upload_record(
            db,
            filename=payload.title or "pasted_text.txt",
            file_path="",
            file_type="text",
            file_size_bytes=len(payload.text.encode("utf-8")),
            total_pages=1,
            status="EXTRACTED",
        )

        upload.processing_warnings = result.warnings
        _save_questions(db, upload.id, result.questions)

        return {
            "upload": upload.id,
            "result": result.model_dump(),
        }

    except FileValidationError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
        ) from exc


@router.post("/upload")
async def upload_leak_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file was uploaded.",
        )

    data = await file.read()

    try:
        processed = process_leak_file(
            data,
            file.filename,
            raise_on_unavailable=True,
        )

        stored_path, _digest = save_uploaded_file(
            data,
            file.filename,
        )

        upload = create_upload_record(
            db,
            filename=file.filename,
            file_path=stored_path,
            file_type=(
                file.filename.rsplit(".", 1)[-1].lower()
                if "." in file.filename
                else "unknown"
            ),
            file_size_bytes=len(data),
            total_pages=max(len(processed.pages), 1),
            status="EXTRACTED",
        )

        upload.processing_warnings = processed.warnings
        _save_questions(db, upload.id, processed.questions)

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "upload": {
                    "id": upload.id,
                    "filename": upload.filename,
                },
                "result": processed.model_dump(),
            },
        )

    except FileValidationError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
        ) from exc

    except OCRUnavailableError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
        ) from exc

    except ExtractionError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
        ) from exc


@router.get("")
def list_leak_uploads(db: Session = Depends(get_db)):
    return [
        {
            "id": item.id,
            "filename": item.filename,
            "file_type": item.file_type,
            "status": item.status,
            "total_pages": item.total_pages,
            "created_at": (
                item.created_at.isoformat()
                if item.created_at
                else None
            ),
        }
        for item in list_uploads(db)
    ]

@router.delete("/{upload_id}")
def delete_leak_upload(
    upload_id: str,
    db: Session = Depends(get_db),
):
    upload = get_upload(db, upload_id)

    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found.",
        )

    stored_path = upload.file_path

    try:
        db.delete(upload)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete upload.",
        )

    if stored_path:
        upload_dir = Path(UPLOAD_DIR).resolve()
        file_path = Path(stored_path).resolve()

        if file_path.is_relative_to(upload_dir):
            try:
                file_path.unlink(missing_ok=True)
            except OSError:
                pass

    return {
        "success": True,
        "message": "Upload deleted successfully.",
        "upload_id": upload_id,
    }
@router.get("/{upload_id}")
def get_leak_upload(
    upload_id: str,
    db: Session = Depends(get_db),
):
    upload = get_upload(db, upload_id)

    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found.",
        )

    return {
        "id": upload.id,
        "filename": upload.filename,
        "file_type": upload.file_type,
        "file_size_bytes": upload.file_size_bytes,
        "status": upload.status,
        "total_pages": upload.total_pages,
        "processing_warnings": upload.processing_warnings,
        "created_at": (
            upload.created_at.isoformat()
            if upload.created_at
            else None
        ),
    }


@router.get("/{upload_id}/questions")
def get_questions_for_upload(
    upload_id: str,
    db: Session = Depends(get_db),
):
    upload = get_upload(db, upload_id)

    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found.",
        )

    questions = load_extracted_questions(db, upload_id)

    return [
        {
            "id": item.id,
            "detected_question_number": item.detected_question_number,
            "detected_order": item.detected_order,
            "extracted_text": item.extracted_text,
            "cleaned_text": item.cleaned_text,
            "options": item.options,
            "detected_option_order": item.detected_option_order,
            "page_number": item.page_number,
            "extraction_quality": item.extraction_quality,
            "is_partial": item.is_partial,
            "warnings": item.warnings,
        }
        for item in questions
    ]
