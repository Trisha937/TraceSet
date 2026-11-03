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
        fname = data.filename
        if not fname and data.upload_id:
            try:
                from backend.app.database import SessionLocal
                from backend.app.models.leak import LeakUpload
                db_s = SessionLocal()
                up = db_s.query(LeakUpload).filter_by(id=data.upload_id).first()
                if up and up.filename:
                    fname = up.filename
                db_s.close()
            except Exception:
                pass

        result = calculate_match_score(
            data.leaked_questions,
            data.official_paper_versions,
            filename=fname
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
