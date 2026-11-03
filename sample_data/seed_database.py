import uuid
from backend.app.database import SessionLocal
from backend.app.models.examination import Examination
from backend.app.models.centre import Centre
from backend.app.models.question import Question
from backend.app.models.paper_version import PaperVersion
from backend.app.models.leak import LeakUpload, ExtractedQuestion

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

        # 5. Pre-seed or refresh demo leak upload
        existing_leak = db.query(LeakUpload).filter_by(filename="leak_centre_B_mumbai.pdf").first()
        if existing_leak is None:
            demo_upload = LeakUpload(
                id=str(uuid.uuid4()),
                filename="leak_centre_B_mumbai.pdf",
                file_path="sample_data/demo_leaks/leak_centre_B_mumbai.pdf",
                file_type="pdf",
                file_size_bytes=2671,
                total_pages=1,
                status="EXTRACTED",
                processing_warnings=[]
            )
            db.add(demo_upload)
            db.commit()
            db.refresh(demo_upload)
        else:
            demo_upload = existing_leak
            db.query(ExtractedQuestion).filter_by(upload_id=demo_upload.id).delete()
            db.commit()

        # Seed questions matching Centre B (SET_B) forensic fingerprints
        q1 = ExtractedQuestion(
            id=str(uuid.uuid4()),
            upload_id=demo_upload.id,
            detected_question_number=1,
            detected_order=1,
            extracted_text="Which optimization objective defines the principal components in PCA?",
            cleaned_text="Which optimization objective defines the principal components in PCA?",
            options={
                "A": "Maximizing variance of projected data points onto orthogonal eigenvectors",
                "B": "Maximizing the margin between distinct class boundaries",
                "C": "Minimizing the L1 norm of the sparse feature representation",
                "D": "Minimizing the cross-entropy loss between latent classes"
            },
            detected_option_order=["A", "B", "C", "D"],
            page_number=1,
            extraction_quality="HIGH",
            is_partial="NO",
            warnings=[]
        )
        q2 = ExtractedQuestion(
            id=str(uuid.uuid4()),
            upload_id=demo_upload.id,
            detected_question_number=2,
            detected_order=2,
            extracted_text="To guarantee finding the optimal path in A* tree search, what property must the heuristic h(n) possess?",
            cleaned_text="To guarantee finding the optimal path in A* tree search, what property must the heuristic h(n) possess?",
            options={
                "A": "Strict positivity: h(n) must always be greater than zero for all nodes",
                "B": "Monotonicity: h(n) must monotonically increase along all search paths",
                "C": "Consistency: h(n) <= c(n, a, n') + h(n')",
                "D": "Admissibility: h(n) must never overestimate the true cost to reach the goal"
            },
            detected_option_order=["A", "B", "C", "D"],
            page_number=1,
            extraction_quality="HIGH",
            is_partial="NO",
            warnings=[]
        )
        q3 = ExtractedQuestion(
            id=str(uuid.uuid4()),
            upload_id=demo_upload.id,
            detected_question_number=3,
            detected_order=3,
            extracted_text="In deep architectures, what is the underlying cause of the vanishing gradient phenomenon?",
            cleaned_text="In deep architectures, what is the underlying cause of the vanishing gradient phenomenon?",
            options={
                "A": "Initializing weights with excessively high random variance",
                "B": "Repeated multiplication of small derivatives through many hidden layers with saturating activations",
                "C": "Using an excessively large learning rate in stochastic gradient descent",
                "D": "Applying L2 weight decay regularization to convolutional layers"
            },
            detected_option_order=["A", "B", "C", "D"],
            page_number=1,
            extraction_quality="HIGH",
            is_partial="NO",
            warnings=[]
        )
        db.add_all([q1, q2, q3])
        db.commit()
        print("Configured demo leak questions matching Centre B fingerprints.")

        print("\nSample database setup completed.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
