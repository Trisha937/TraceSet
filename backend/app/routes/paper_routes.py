from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.paper import (
    ExaminationCreate,
    ExaminationResponse,
    CentreCreate,
    CentreResponse,
    QuestionCreate,
    QuestionResponse,
    PaperGenerateRequest,
    PaperVersionSummary,
    PaperVersionDetail,
    PaperFingerprintResponse
)
from backend.app.schemas.shared import APIResponse
from backend.app.models.examination import Examination
from backend.app.models.centre import Centre
from backend.app.models.question import Question
from backend.app.modules.paper_generation.service import (
    create_examination,
    create_centre,
    add_question,
    generate_and_store_paper_versions,
    get_all_paper_versions,
    get_paper_version_detail,
    get_reference_fingerprints_for_matching
)
from backend.app.modules.paper_generation.generator import PaperGenerationError

router = APIRouter(prefix="/api/papers", tags=["Paper Generation & Fingerprinting"])


# ---------------- Examination Endpoints ----------------

@router.post("/examinations", response_model=APIResponse[ExaminationResponse], status_code=status.HTTP_201_CREATED)
def api_create_examination(payload: ExaminationCreate, db: Session = Depends(get_db)):
    exam = create_examination(db, payload.model_dump())
    return APIResponse(message="Examination created successfully", data=exam)


@router.get("/examinations", response_model=APIResponse[List[ExaminationResponse]])
def api_list_examinations(db: Session = Depends(get_db)):
    exams = db.query(Examination).all()
    return APIResponse(data=exams)


# ---------------- Centre Endpoints ----------------

@router.post("/centres", response_model=APIResponse[CentreResponse], status_code=status.HTTP_201_CREATED)
def api_create_centre(payload: CentreCreate, db: Session = Depends(get_db)):
    centre = create_centre(db, payload.model_dump())
    return APIResponse(message="Centre registered successfully", data=centre)


@router.get("/centres", response_model=APIResponse[List[CentreResponse]])
def api_list_centres(db: Session = Depends(get_db)):
    centres = db.query(Centre).all()
    return APIResponse(data=centres)


# ---------------- Question Bank Endpoints ----------------

@router.post("/questions", response_model=APIResponse[QuestionResponse], status_code=status.HTTP_201_CREATED)
def api_add_question(payload: QuestionCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    q = add_question(db, data)
    return APIResponse(message="Question added to bank", data=q)


@router.get("/questions", response_model=APIResponse[List[QuestionResponse]])
def api_list_questions(
    subject: Optional[str] = None,
    examination_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Question)
    if subject:
        query = query.filter(Question.subject == subject)
    if examination_id:
        query = query.filter((Question.examination_id == examination_id) | (Question.examination_id.is_(None)))
    questions = query.all()
    return APIResponse(data=questions)


# ---------------- Paper Generation Endpoints ----------------

@router.post("/generate", response_model=APIResponse[List[PaperVersionSummary]])
def api_generate_papers(payload: PaperGenerateRequest, db: Session = Depends(get_db)):
    """
    Generates paper versions A, B, C with assigned examination centres,
    controlled variations, equal difficulty distribution, and digital fingerprints.
    """
    try:
        created = generate_and_store_paper_versions(
            db=db,
            examination_id=payload.examination_id,
            version_codes=payload.version_codes,
            centre_ids=payload.centre_ids,
            num_questions=payload.num_questions,
            target_difficulty=payload.target_difficulty_distribution,
            seed=payload.random_seed
        )
        return APIResponse(
            message=f"Generated {len(created)} paper versions with fingerprints",
            data=created
        )
    except PaperGenerationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.get("/versions", response_model=APIResponse[List[PaperVersionSummary]])
def api_list_paper_versions(
    examination_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lists all generated paper versions and their centre assignments."""
    versions = get_all_paper_versions(db, examination_id=examination_id)
    return APIResponse(data=versions)


@router.get("/versions/{version_id}", response_model=APIResponse[PaperVersionDetail])
def api_get_paper_version(version_id: str, db: Session = Depends(get_db)):
    """Views a specific paper version with rendered questions and options."""
    detail = get_paper_version_detail(db, version_id=version_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Paper version not found")
    return APIResponse(data=detail)


@router.get("/fingerprints", response_model=APIResponse[List[PaperFingerprintResponse]])
def api_get_reference_fingerprints(
    examination_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Primary API used by Member 3 (AI Matching Engine) and Member 4 (Frontend)
    to retrieve reference paper versions, question order, variant phrasing,
    and option order maps for matching against leaked content.
    """
    fingerprints = get_reference_fingerprints_for_matching(db, examination_id=examination_id)
    return APIResponse(
        message=f"Retrieved reference fingerprints for {len(fingerprints)} versions",
        data=fingerprints
    )
