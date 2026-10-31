import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class PaperFingerprint(Base):
    __tablename__ = "paper_fingerprints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_version_id = Column(String(36), ForeignKey("paper_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Position of question in this paper version (1, 2, 3, ...)
    question_order = Column(Integer, nullable=False, index=True)
    
    # Which phrasing variant was selected (e.g., "DEFAULT", "VAR_1", "VAR_2")
    variant_id = Column(String(50), nullable=False, default="DEFAULT")
    
    # Exact question text printed in this paper version
    variant_text = Column(Text, nullable=False)
    
    # Mapping of version option keys to original keys: e.g. {"A": "C", "B": "A", "C": "D", "D": "B"}
    option_order = Column(JSON, nullable=False)
    
    # Rendered options for this version: {"A": "text...", "B": "text..."}
    rendered_options = Column(JSON, nullable=False)
    
    # Additional distinguishing fingerprint metadata for Member 3's matching engine:
    # {
    #   "order_hash": "...",
    #   "option_signature": "...",
    #   "marks": 5,
    #   "difficulty": "MEDIUM"
    # }
    distinguishing_features = Column(JSON, nullable=True, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    paper_version = relationship("PaperVersion", back_populates="fingerprints")
    question = relationship("Question", back_populates="fingerprints")

    def __repr__(self):
        return f"<PaperFingerprint paper_version_id={self.paper_version_id} pos={self.question_order} qid={self.question_id}>"

