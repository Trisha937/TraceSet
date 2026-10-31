from typing import List, Dict, Optional, Any, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation successful"
    data: Optional[T] = None
    errors: Optional[List[str]] = None


# ---------------- Member 2 Shared Contract: OCR Extraction ----------------

class ExtractedQuestionItem(BaseModel):
    question_number: Optional[int] = None
    question_text: str
    options: Dict[str, str] = Field(default_factory=dict)
    page_number: int = 1
    extraction_quality: str = Field(default="high", description="high, medium, low, uncertain")


class OCRExtractionResult(BaseModel):
    questions: List[ExtractedQuestionItem]
    warnings: List[str] = Field(default_factory=list)


# ---------------- Member 3 Shared Contract: Matching Engine ----------------

class CandidateRankItem(BaseModel):
    paper_version_id: str
    centre_id: str
    centre_code: Optional[str] = None
    centre_name: Optional[str] = None
    similarity_score: float = Field(..., description="Calculated matching score (0-100)")
    matched_questions: int
    evidence: List[str] = Field(default_factory=list)
    detailed_evidence: Optional[List[Dict[str, Any]]] = None


class MatchingAnalysisResult(BaseModel):
    status: str = Field(
        ...,
        description="possible_match, multiple_candidates, insufficient_evidence, no_match, processing_error"
    )
    ranked_candidates: List[CandidateRankItem] = Field(default_factory=list)
    explanation: str
    warnings: List[str] = Field(default_factory=list)

