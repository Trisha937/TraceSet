
from backend.app.database import SessionLocal
from backend.app.models.examination import Examination
from backend.app.models.centre import Centre
from backend.app.models.question import Question
from backend.app.models.paper_version import PaperVersion

from backend.app.modules.paper_generation.service import (
    generate_and_store_paper_versions,
)

from sample_data.sample_exam_data import (
    SAMPLE_EXAMINATION,
    SAMPLE_CENTRES,
    SAMPLE_QUESTIONS,
)


def seed_database():
    db = SessionLocal()

    try:
        # 1. Create examination if it does not exist
        exam = (
            db.query(Examination)
            .filter_by(code=SAMPLE_EXAMINATION["code"])
            .first()
        )

        if exam is None:
            exam = Examination(**SAMPLE_EXAMINATION)
            db.add(exam)
            db.commit()
            db.refresh(exam)
            print("Created sample examination.")
        else:
            print("Sample examination already exists.")

        # 2. Create centres if they do not exist
        centres = []

        for centre_data in SAMPLE_CENTRES:
            centre = (
                db.query(Centre)
                .filter_by(code=centre_data["code"])
                .first()
            )

            if centre is None:
                centre = Centre(**centre_data)
                db.add(centre)
                db.commit()
                db.refresh(centre)
                print(f"Created centre: {centre.code}")
            else:
                print(f"Centre already exists: {centre.code}")

            centres.append(centre)

        # 3. Create questions if they do not exist
        for question_data in SAMPLE_QUESTIONS:
            question = (
                db.query(Question)
                .filter_by(code=question_data["code"])
                .first()
            )

            if question is None:
                question = Question(
                    **question_data,
                    examination_id=exam.id,
                )
                db.add(question)
                db.commit()
                print(f"Created question: {question.code}")
            else:
                print(f"Question already exists: {question.code}")

        # 4. Generate paper versions if none exist
        existing_versions = (
            db.query(PaperVersion)
            .filter_by(examination_id=exam.id)
            .count()
        )

        if existing_versions == 0:
            generate_and_store_paper_versions(
                db=db,
                examination_id=exam.id,
                version_codes=["SET_A", "SET_B", "SET_C"],
                centre_ids=[centre.id for centre in centres],
                num_questions=10,
                target_difficulty={
                    "EASY": 3,
                    "MEDIUM": 5,
                    "HARD": 2,
                },
                seed=42,
            )
            print("Generated three paper versions and fingerprints.")
        else:
            print(
                f"Paper versions already exist: {existing_versions}. "
                "Skipping generation."
            )

        print("\nSample database setup completed.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
