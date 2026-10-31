import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.examination import Examination
from backend.app.models.centre import Centre
from backend.app.models.paper_version import PaperVersion
from backend.app.modules.paper_generation.service import (
    get_reference_fingerprints_for_matching,
    get_all_paper_versions,
    get_paper_version_detail
)
from backend.app.modules.paper_generation.generator import (
    generate_controlled_paper_versions,
    balance_question_selection
)
from sample_data.sample_exam_data import SAMPLE_QUESTIONS


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="module")
def api_client():
    return TestClient(app)


def test_balance_question_selection():
    """Verify question selection satisfies target count and difficulty criteria."""
    selected = balance_question_selection(
        questions=SAMPLE_QUESTIONS,
        target_count=8,
        target_difficulty={"EASY": 2, "MEDIUM": 4, "HARD": 2}
    )
    assert len(selected) == 8
    difficulties = [q["difficulty"] for q in selected]
    assert difficulties.count("EASY") == 2
    assert difficulties.count("MEDIUM") == 4
    assert difficulties.count("HARD") == 2


def test_controlled_variations_and_equivalence():
    """
    Test requirement 8:
    - Different versions contain intended controlled differences.
    - All versions maintain equivalent marks and difficulty distributions.
    - Fingerprints are different where expected.
    """
    version_codes = ["SET_A", "SET_B", "SET_C"]
    centre_ids = ["CID_1", "CID_2", "CID_3"]

    versions = generate_controlled_paper_versions(
        base_questions=SAMPLE_QUESTIONS,
        version_codes=version_codes,
        centre_ids=centre_ids,
        num_questions=10,
        target_difficulty={"EASY": 3, "MEDIUM": 5, "HARD": 2},
        seed=42
    )

    assert len(versions) == 3

    # 1. Verify exact marks equivalence
    marks = [v["total_marks"] for v in versions]
    assert marks[0] == marks[1] == marks[2] == 50

    # 2. Verify exact difficulty parity
    for v in versions:
        assert v["difficulty_summary"]["EASY"] == 3
        assert v["difficulty_summary"]["MEDIUM"] == 5
        assert v["difficulty_summary"]["HARD"] == 2

    # 3. Verify question sequence differs across versions (controlled permutation)
    q_orders = [[q["question_id"] for q in v["rendered_questions"]] for v in versions]
    # At least two versions should have distinct question orders
    assert q_orders[0] != q_orders[1] or q_orders[0] != q_orders[2]

    # 4. Verify variant phrasings exist and distinguish versions
    variant_ids_set = set()
    for v in versions:
        for q in v["rendered_questions"]:
            variant_ids_set.add(q["variant_id"])
    assert "DEFAULT" in variant_ids_set
    assert any("VAR_" in vid for vid in variant_ids_set)


def test_centre_association_in_database(db_session):
    """Test requirement 8: Correct centre is associated with each version."""
    exam = db_session.query(Examination).filter_by(code="EXAM-2026-CS101").first()
    assert exam is not None

    versions = db_session.query(PaperVersion).filter_by(examination_id=exam.id).all()
    assert len(versions) >= 3

    centre_codes_found = {v.centre.code for v in versions if v.centre}
    assert "CENTRE_A" in centre_codes_found
    assert "CENTRE_B" in centre_codes_found
    assert "CENTRE_C" in centre_codes_found


def test_fingerprints_retrieval(db_session):
    """Test requirement 8: Fingerprints can be retrieved successfully for matching module."""
    exam = db_session.query(Examination).filter_by(code="EXAM-2026-CS101").first()
    assert exam is not None

    ref_fps = get_reference_fingerprints_for_matching(db_session, examination_id=exam.id)
    assert len(ref_fps) >= 3

    for ver in ref_fps:
        assert "paper_version_id" in ver
        assert "centre_id" in ver
        assert "fingerprints" in ver
        assert len(ver["fingerprints"]) == 10

        # Check fingerprint items contain required matching fields
        first_fp = ver["fingerprints"][0]
        assert "variant_text" in first_fp
        assert "option_order" in first_fp
        assert "rendered_options" in first_fp
        assert "distinguishing_features" in first_fp


def test_api_health(api_client):
    """Test system health check endpoint."""
    response = api_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["modules"]["member_1_paper_generation"] == "ONLINE"


def test_api_list_paper_versions(api_client):
    """Test API endpoint to list paper versions."""
    response = api_client.get("/api/papers/versions")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert len(res_json["data"]) >= 3


def test_api_get_reference_fingerprints(api_client):
    """Test API endpoint used by Member 3 to get reference fingerprints."""
    response = api_client.get("/api/papers/fingerprints")
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert len(res_json["data"]) >= 3

