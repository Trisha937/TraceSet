from backend.app.database import Base
from backend.app.models.examination import Examination
from backend.app.models.centre import Centre
from backend.app.models.question import Question
from backend.app.models.paper_version import PaperVersion
from backend.app.models.paper_fingerprint import PaperFingerprint
from backend.app.models.leak import LeakUpload, ExtractedQuestion
from backend.app.models.analysis import AnalysisResult, MatchingEvidence

__all__ = [
    "Base",
    "Examination",
    "Centre",
    "Question",
    "PaperVersion",
    "PaperFingerprint",
    "LeakUpload",
    "ExtractedQuestion",
    "AnalysisResult",
    "MatchingEvidence",
]

