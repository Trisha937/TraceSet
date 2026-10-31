from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


# ---------------- Question Schemas ----------------

class QuestionVariant(BaseModel):
    variant_id: str = Field(..., description="Unique variant identifier, e.g. VAR_1")
    text: str = Field(..., description="Academically equivalent question phrasing")


class QuestionBase(BaseModel):
    code: str
    subject: str
    topic: str
    difficulty: str = Field(default="MEDIUM", description="EASY, MEDIUM, or HARD")
    marks: int = Field(default=1, ge=1)
    primary_text: str
    options: Dict[str, str] = Field(..., description="Key-value mapping e.g. {'A': '...', 'B': '...'}")
    correct_option: str
    variants: Optional[List[QuestionVariant]] = Field(default_factory=list)
    explanation: Optional[str] = None


class QuestionCreate(QuestionBase):
    examination_id: Optional[str] = None


class QuestionResponse(QuestionBase):
    id: str
    examination_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- Centre Schemas ----------------

class CentreBase(BaseModel):
    code: str
    name: str
    city: str
    state: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None


class CentreCreate(CentreBase):
    pass


class CentreResponse(CentreBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- Examination Schemas ----------------

class ExaminationBase(BaseModel):
    code: str
    name: str
    subject: str
    exam_date: Optional[datetime] = None
    total_marks: int = 100
    duration_minutes: int = 180
    instructions: Optional[str] = None


class ExaminationCreate(ExaminationBase):
    pass


class ExaminationResponse(ExaminationBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- Fingerprint Schemas ----------------

class FingerprintFeatureItem(BaseModel):
    question_order: int
    question_id: str
    question_code: str
    variant_id: str
    variant_text: str
    option_order: Dict[str, str]
    rendered_options: Dict[str, str]
    marks: int
    difficulty: str
    distinguishing_features: Dict[str, Any]


class PaperFingerprintResponse(BaseModel):
    paper_version_id: str
    version_code: str
    examination_id: str
    examination_code: str
    centre_id: str
    centre_code: str
    centre_name: str
    total_questions: int
    total_marks: int
    difficulty_summary: Dict[str, int]
    fingerprints: List[FingerprintFeatureItem]


# ---------------- Paper Version Generation & Retrieval Schemas ----------------

class PaperGenerateRequest(BaseModel):
    examination_id: str
    version_codes: List[str] = Field(default=["SET_A", "SET_B", "SET_C"], description="Paper version codes")
    centre_ids: List[str] = Field(..., description="List of Centre IDs matching version_codes 1:1")
    num_questions: int = Field(default=10, ge=1, le=100)
    target_difficulty_distribution: Optional[Dict[str, int]] = Field(
        default=None,
        description="Optional count of EASY, MEDIUM, HARD questions"
    )
    random_seed: Optional[int] = Field(default=None, description="Deterministic seed for reproducible generation")


class PaperVersionSummary(BaseModel):
    id: str
    version_code: str
    examination_id: str
    centre_id: str
    centre_code: Optional[str] = None
    centre_name: Optional[str] = None
    total_marks: int
    total_questions: int
    difficulty_summary: Optional[Dict[str, int]] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RenderedQuestionItem(BaseModel):
    order: int
    question_id: str
    question_code: str
    variant_id: str
    text: str
    options: Dict[str, str]
    marks: int
    difficulty: str


class PaperVersionDetail(PaperVersionSummary):
    questions: List[RenderedQuestionItem]
