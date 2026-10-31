import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.examination import Examination
from backend.app.models.centre import Centre
from backend.app.models.question import Question
from backend.app.models.paper_version import PaperVersion
from backend.app.models.paper_fingerprint import PaperFingerprint
from backend.app.modules.paper_generation.generator import (
    generate_controlled_paper_versions,
    PaperGenerationError
)


def create_centre(db: Session, centre_data: Dict[str, Any]) -> Centre:
    centre = Centre(
        id=str(uuid.uuid4()),
        code=centre_data["code"],
        name=centre_data["name"],
        city=centre_data["city"],
        state=centre_data.get("state"),
        address=centre_data.get("address"),
        contact_email=centre_data.get("contact_email")
    )
    db.add(centre)
    db.commit()
    db.refresh(centre)
    return centre


def create_examination(db: Session, exam_data: Dict[str, Any]) -> Examination:
    exam = Examination(
        id=str(uuid.uuid4()),
        code=exam_data["code"],
        name=exam_data["name"],
        subject=exam_data["subject"],
        exam_date=exam_data.get("exam_date"),
        total_marks=exam_data.get("total_marks", 100),
        duration_minutes=exam_data.get("duration_minutes", 180),
        instructions=exam_data.get("instructions")
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def add_question(db: Session, question_data: Dict[str, Any]) -> Question:
    question = Question(
        id=str(uuid.uuid4()),
        examination_id=question_data.get("examination_id"),
        code=question_data["code"],
        subject=question_data["subject"],
        topic=question_data["topic"],
        difficulty=question_data.get("difficulty", "MEDIUM"),
        marks=question_data.get("marks", 1),
        primary_text=question_data["primary_text"],
        options=question_data["options"],
        correct_option=question_data["correct_option"],
        variants=question_data.get("variants", []),
        explanation=question_data.get("explanation")
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def get_examination_questions(db: Session, examination_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = db.query(Question)
    if examination_id:
        query = query.filter((Question.examination_id == examination_id) | (Question.examination_id.is_(None)))
    db_questions = query.all()
    
    questions = []
    for q in db_questions:
        questions.append({
            "id": q.id,
            "code": q.code,
            "subject": q.subject,
            "topic": q.topic,
            "difficulty": q.difficulty,
            "marks": q.marks,
            "primary_text": q.primary_text,
            "options": q.options,
            "correct_option": q.correct_option,
            "variants": q.variants or [],
            "explanation": q.explanation
        })
    return questions


def generate_and_store_paper_versions(
    db: Session,
    examination_id: str,
    version_codes: List[str],
    centre_ids: List[str],
    num_questions: int = 10,
    target_difficulty: Optional[Dict[str, int]] = None,
    seed: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Generates paper versions A, B, C for an examination, maps them to centres,
    and commits all paper version records and question-level digital fingerprints.
    """
    # Verify examination exists
    exam = db.query(Examination).filter(Examination.id == examination_id).first()
    if not exam:
        raise PaperGenerationError(f"Examination with ID {examination_id} does not exist.")

    # Verify centres exist
    for cid in centre_ids:
        centre = db.query(Centre).filter(Centre.id == cid).first()
        if not centre:
            raise PaperGenerationError(f"Centre with ID {cid} does not exist.")

    # Fetch question pool
    question_pool = get_examination_questions(db, examination_id=examination_id)
    if len(question_pool) < num_questions:
        raise PaperGenerationError(
            f"Question bank has only {len(question_pool)} questions; {num_questions} requested."
        )

    # Run core generation algorithm
    generated_plans = generate_controlled_paper_versions(
        base_questions=question_pool,
        version_codes=version_codes,
        centre_ids=centre_ids,
        num_questions=num_questions,
        target_difficulty=target_difficulty,
        seed=seed
    )

    created_versions = []

    for plan in generated_plans:
        # Create PaperVersion record
        version_record = PaperVersion(
            id=str(uuid.uuid4()),
            examination_id=examination_id,
            centre_id=plan["centre_id"],
            version_code=plan["version_code"],
            total_marks=plan["total_marks"],
            total_questions=plan["total_questions"],
            difficulty_summary=plan["difficulty_summary"],
            status="GENERATED"
        )
        db.add(version_record)
        db.flush()  # Obtain ID for foreign keys

        # Create PaperFingerprint records for each question
        for fp_item in plan["fingerprints"]:
            fp_record = PaperFingerprint(
                id=str(uuid.uuid4()),
                paper_version_id=version_record.id,
                question_id=fp_item["question_id"],
                question_order=fp_item["question_order"],
                variant_id=fp_item["variant_id"],
                variant_text=fp_item["variant_text"],
                option_order=fp_item["option_order"],
                rendered_options=fp_item["rendered_options"],
                distinguishing_features=fp_item["distinguishing_features"]
            )
            db.add(fp_record)

        created_versions.append({
            "id": version_record.id,
            "version_code": version_record.version_code,
            "examination_id": version_record.examination_id,
            "centre_id": version_record.centre_id,
            "total_marks": version_record.total_marks,
            "total_questions": version_record.total_questions,
            "difficulty_summary": version_record.difficulty_summary,
            "status": version_record.status,
            "created_at": version_record.created_at,
            "rendered_questions": plan["rendered_questions"]
        })

    db.commit()
    return created_versions


def get_all_paper_versions(db: Session, examination_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = db.query(PaperVersion)
    if examination_id:
        query = query.filter(PaperVersion.examination_id == examination_id)
    records = query.all()

    result = []
    for r in records:
        result.append({
            "id": r.id,
            "version_code": r.version_code,
            "examination_id": r.examination_id,
            "centre_id": r.centre_id,
            "centre_code": r.centre.code if r.centre else None,
            "centre_name": r.centre.name if r.centre else None,
            "total_marks": r.total_marks,
            "total_questions": r.total_questions,
            "difficulty_summary": r.difficulty_summary,
            "status": r.status,
            "created_at": r.created_at
        })
    return result


def get_paper_version_detail(db: Session, version_id: str) -> Optional[Dict[str, Any]]:
    record = db.query(PaperVersion).filter(PaperVersion.id == version_id).first()
    if not record:
        return None

    questions = []
    for fp in record.fingerprints:
        questions.append({
            "order": fp.question_order,
            "question_id": fp.question_id,
            "question_code": fp.question.code if fp.question else "",
            "variant_id": fp.variant_id,
            "text": fp.variant_text,
            "options": fp.rendered_options,
            "marks": fp.question.marks if fp.question else 1,
            "difficulty": fp.question.difficulty if fp.question else "MEDIUM"
        })

    return {
        "id": record.id,
        "version_code": record.version_code,
        "examination_id": record.examination_id,
        "centre_id": record.centre_id,
        "centre_code": record.centre.code if record.centre else None,
        "centre_name": record.centre.name if record.centre else None,
        "total_marks": record.total_marks,
        "total_questions": record.total_questions,
        "difficulty_summary": record.difficulty_summary,
        "status": record.status,
        "created_at": record.created_at,
        "questions": questions
    }


def get_reference_fingerprints_for_matching(
    db: Session,
    examination_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    CRUCIAL FUNCTION FOR MEMBER 3 (Matching Module):
    Returns all generated paper fingerprints grouped by paper version.
    Allows the AI matching engine to evaluate leaked questions against
    exact variant text, option order permutations, and question order.
    """
    query = db.query(PaperVersion)
    if examination_id:
        query = query.filter(PaperVersion.examination_id == examination_id)
    versions = query.all()

    reference_data = []

    for ver in versions:
        fp_items = []
        for fp in ver.fingerprints:
            fp_items.append({
                "question_order": fp.question_order,
                "question_id": fp.question_id,
                "question_code": fp.question.code if fp.question else "",
                "variant_id": fp.variant_id,
                "variant_text": fp.variant_text,
                "option_order": fp.option_order,
                "rendered_options": fp.rendered_options,
                "marks": fp.question.marks if fp.question else 1,
                "difficulty": fp.question.difficulty if fp.question else "MEDIUM",
                "distinguishing_features": fp.distinguishing_features or {}
            })

        reference_data.append({
            "paper_version_id": ver.id,
            "version_code": ver.version_code,
            "examination_id": ver.examination_id,
            "examination_code": ver.examination.code if ver.examination else "",
            "centre_id": ver.centre_id,
            "centre_code": ver.centre.code if ver.centre else "",
            "centre_name": ver.centre.name if ver.centre else "",
            "total_questions": ver.total_questions,
            "total_marks": ver.total_marks,
            "difficulty_summary": ver.difficulty_summary or {},
            "fingerprints": fp_items
        })

    return reference_data

