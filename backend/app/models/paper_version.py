import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class PaperVersion(Base):
    __tablename__ = "paper_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    examination_id = Column(String(36), ForeignKey("examinations.id", ondelete="CASCADE"), nullable=False, index=True)
    centre_id = Column(String(36), ForeignKey("centres.id", ondelete="RESTRICT"), nullable=False, index=True)
    version_code = Column(String(20), nullable=False, index=True)  # e.g., "SET_A", "SET_B", "SET_C"
    
    total_marks = Column(Integer, nullable=False, default=100)
    total_questions = Column(Integer, nullable=False, default=10)
    difficulty_summary = Column(JSON, nullable=True)  # e.g. {"EASY": 3, "MEDIUM": 5, "HARD": 2}
    
    status = Column(String(30), default="GENERATED")  # GENERATED, ASSIGNED, ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    examination = relationship("Examination", back_populates="paper_versions")
    centre = relationship("Centre", back_populates="paper_versions")
    fingerprints = relationship(
        "PaperFingerprint",
        back_populates="paper_version",
        cascade="all, delete-orphan",
        order_by="PaperFingerprint.question_order"
    )

    def __repr__(self):
        return f"<PaperVersion version_code={self.version_code} exam_id={self.examination_id} centre_id={self.centre_id}>"

