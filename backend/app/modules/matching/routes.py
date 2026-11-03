from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.app.modules.matching.engine import calculate_match_score

router = APIRouter(prefix="/matching", tags=["AI Matching"])

class MatchRequest(BaseModel):
    leaked_questions: List[Dict[str, Any]]
    official_paper_versions: List[Dict[str, Any]]
    upload_id: Optional[str] = None
    filename: Optional[str] = None

@router.post("/analyze")
def analyze_leak(data: MatchRequest):
    """
    API endpoint to process matching between extracted leak data and official fingerprints.
    """
    try:
        result = calculate_match_score(
            data.leaked_questions,
            data.official_paper_versions,
            filename=data.filename
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
