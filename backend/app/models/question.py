import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    examination_id = Column(String(36), ForeignKey("examinations.id", ondelete="SET NULL"), nullable=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    subject = Column(String(100), nullable=False, index=True)
    topic = Column(String(100), nullable=False, index=True)
    difficulty = Column(String(20), nullable=False, default="MEDIUM")  # EASY, MEDIUM, HARD
    marks = Column(Integer, nullable=False, default=1)
    
    # Primary question text
    primary_text = Column(Text, nullable=False)
    
    # Standard option dictionary: {"A": "text", "B": "text", "C": "text", "D": "text"}
    options = Column(JSON, nullable=False)
    
    # Key of correct option in base options: e.g. "A"
    correct_option = Column(String(10), nullable=False)
    
    # Predefined academically equivalent variants:
    # [{"variant_id": "VAR_1", "text": "..."}, {"variant_id": "VAR_2", "text": "..."}]
    variants = Column(JSON, nullable=True, default=list)
    
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    examination = relationship("Examination", back_populates="questions")
    fingerprints = relationship("PaperFingerprint", back_populates="question")

    def __repr__(self):
        return f"<Question code={self.code} topic={self.topic} marks={self.marks}>"

