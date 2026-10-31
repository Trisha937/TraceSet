import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import SessionLocal, engine, Base
import backend.app.models
from backend.app.models.examination import Examination
from backend.app.models.centre import Centre
from backend.app.models.question import Question
from backend.app.models.paper_version import PaperVersion
from backend.app.modules.paper_generation.service import (
    create_centre,
    create_examination,
    add_question,
    generate_and_store_paper_versions,
    get_reference_fingerprints_for_matching
)
from sample_data.sample_exam_data import SAMPLE_EXAMINATION, SAMPLE_CENTRES, SAMPLE_QUESTIONS


def seed_database():
    print("=" * 60)
    print("TraceSet Member 1: Initializing Database & Seed Data")
    print("=" * 60)

    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 2. Check / Insert Examination
        exam = db.query(Examination).filter(Examination.code == SAMPLE_EXAMINATION["code"]).first()
        if not exam:
            print(f"Creating examination: {SAMPLE_EXAMINATION['name']} ({SAMPLE_EXAMINATION['code']})")
            exam = create_examination(db, SAMPLE_EXAMINATION)
        else:
            print(f"Examination exists: {exam.name} ({exam.id})")

        # 3. Check / Insert Centres
        centre_ids = []
        for c_data in SAMPLE_CENTRES:
            centre = db.query(Centre).filter(Centre.code == c_data["code"]).first()
            if not centre:
                print(f"Creating centre: {c_data['name']} [{c_data['code']}]")
                centre = create_centre(db, c_data)
            else:
                print(f"Centre exists: {centre.name} [{centre.code}] ({centre.id})")
            centre_ids.append(centre.id)

        # 4. Check / Insert Questions
        print(f"\nSeeding {len(SAMPLE_QUESTIONS)} questions into Question Bank...")
        for q_data in SAMPLE_QUESTIONS:
            existing_q = db.query(Question).filter(Question.code == q_data["code"]).first()
            if not existing_q:
                q_payload = dict(q_data)
                q_payload["examination_id"] = exam.id
                add_question(db, q_payload)

        total_questions = db.query(Question).count()
        print(f"Total questions in Question Bank: {total_questions}")

        # 5. Check if paper versions are already generated
        existing_versions = db.query(PaperVersion).filter(PaperVersion.examination_id == exam.id).all()
        if not existing_versions:
            print("\nGenerating 3 Paper Versions (SET_A, SET_B, SET_C) for Centres...")
            version_codes = ["SET_A", "SET_B", "SET_C"]
            created = generate_and_store_paper_versions(
                db=db,
                examination_id=exam.id,
                version_codes=version_codes,
                centre_ids=centre_ids[:3],
                num_questions=10,
                target_difficulty={"EASY": 3, "MEDIUM": 5, "HARD": 2},
                seed=2026
            )
            print(f"Successfully generated {len(created)} paper versions with fingerprints!")
        else:
            print(f"\nFound {len(existing_versions)} existing paper versions for examination.")

        # 6. Retrieve reference fingerprints for verification (as Member 3 will do)
        print("\nVerifying Reference Fingerprint Retrieval (Member 3 Interface)...")
        ref_fingerprints = get_reference_fingerprints_for_matching(db, examination_id=exam.id)
        for ver in ref_fingerprints:
            print(f"\n--- Paper Version: {ver['version_code']} ---")
            print(f"    Centre: {ver['centre_name']} ({ver['centre_code']})")
            print(f"    Total Questions: {ver['total_questions']} | Total Marks: {ver['total_marks']}")
            print(f"    Difficulty Distribution: {ver['difficulty_summary']}")
            print(f"    Stored Fingerprint Items: {len(ver['fingerprints'])}")
            print("    Sample Question 1:")
            q1 = ver['fingerprints'][0]
            print(f"      Q_Pos: {q1['question_order']} | Code: {q1['question_code']} | Variant: {q1['variant_id']}")
            print(f"      Text: {q1['variant_text'][:70]}...")
            print(f"      Option Mapping: {q1['option_order']}")

        print("\n" + "=" * 60)
        print("DATABASE INITIALIZATION & MEMBER 1 VERIFICATION COMPLETED")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

