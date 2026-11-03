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

        # 5. Pre-seed and heal demo leak uploads in PostgreSQL
        demo_files = [
            ("leak_centre_B_mumbai.pdf", "pdf", 2671, "full"),
            ("leak_photo_incomplete.png", "png", 47535, "incomplete"),
            ("leak_photo_mumbai_blurry.png", "png", 454126, "blurry"),
            ("leak_photo_mumbai_clean.png", "png", 126332, "full"),
            ("leak_centre_B_mumbai.txt", "txt", 1189, "full"),
            ("leak_insufficient_evidence.txt", "txt", 202, "insufficient"),
        ]

        def get_demo_questions_for_mode(upload_id_val, mode):
            q_pca = ExtractedQuestion(
                id=str(uuid.uuid4()),
                upload_id=upload_id_val,
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
            q_astar = ExtractedQuestion(
                id=str(uuid.uuid4()),
                upload_id=upload_id_val,
                detected_question_number=2 if mode != "blurry" else 1,
                detected_order=2 if mode != "blurry" else 1,
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
                extraction_quality="MEDIUM" if mode == "blurry" else "HIGH",
                is_partial="NO",
                warnings=["Low OCR contrast detected; calibrated matching enabled"] if mode == "blurry" else []
            )
            q_gradient = ExtractedQuestion(
                id=str(uuid.uuid4()),
                upload_id=upload_id_val,
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
            q_insufficient = ExtractedQuestion(
                id=str(uuid.uuid4()),
                upload_id=upload_id_val,
                detected_question_number=1,
                detected_order=1,
                extracted_text="What is machine learning in general context?",
                cleaned_text="What is machine learning in general context?",
                options={
                    "A": "Artificial Intelligence branch",
                    "B": "Hardware architecture",
                    "C": "Compiler theory",
                    "D": "Network routing protocol"
                },
                detected_option_order=["A", "B", "C", "D"],
                page_number=1,
                extraction_quality="LOW",
                is_partial="YES",
                warnings=["Fragment does not contain examination security markers"]
            )

            if mode == "blurry":
                return [q_astar]
            elif mode == "incomplete":
                return [q_pca, q_astar]
            elif mode == "insufficient":
                return [q_insufficient]
            else:
                return [q_pca, q_astar, q_gradient]

        # Scan ALL existing uploads in database and heal stale questions
        all_uploads = db.query(LeakUpload).all()
        for up in all_uploads:
            fname = (up.filename or "").lower()
            if "blurry" in fname:
                m = "blurry"
            elif "incomplete" in fname:
                m = "incomplete"
            elif "insufficient" in fname:
                m = "insufficient"
            elif "mumbai" in fname or "clean" in fname:
                m = "full"
            else:
                continue

            # Check if questions need healing (e.g. legacy OSI / BST questions or missing)
            curr_qs = db.query(ExtractedQuestion).filter_by(upload_id=up.id).all()
            is_stale = (
                not curr_qs or
                any("osi" in (q.extracted_text or "").lower() or "binary search" in (q.extracted_text or "").lower() for q in curr_qs)
            )
            if is_stale:
                db.query(ExtractedQuestion).filter_by(upload_id=up.id).delete()
                new_qs = get_demo_questions_for_mode(up.id, m)
                db.add_all(new_qs)
                db.commit()
                print(f"Healed extracted questions for existing upload: {up.filename} ({up.id})")

        # Also ensure standard demo leak entries exist
        for fname, ftype, fsize, mode in demo_files:
            existing = db.query(LeakUpload).filter_by(filename=fname).first()
            if not existing:
                demo_upload = LeakUpload(
                    id=str(uuid.uuid4()),
                    filename=fname,
                    file_path=f"sample_data/demo_leaks/{fname}",
                    file_type=ftype,
                    file_size_bytes=fsize,
                    total_pages=1,
                    status="EXTRACTED",
                    processing_warnings=[]
                )
                db.add(demo_upload)
                db.commit()
                db.refresh(demo_upload)
                qs = get_demo_questions_for_mode(demo_upload.id, mode)
                db.add_all(qs)
                db.commit()
                print(f"Created and seeded demo upload: {fname}")

        print("\nSample database setup completed.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
