import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class LeakUpload(Base):
    __tablename__ = "leak_uploads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf, image/jpeg, image/png
    file_size_bytes = Column(Integer, nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, PROCESSING, EXTRACTED, FAILED
    total_pages = Column(Integer, default=1)
    processing_warnings = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    extracted_questions = relationship(
        "ExtractedQuestion",
        back_populates="upload",
        cascade="all, delete-orphan",
        order_by="ExtractedQuestion.detected_order"
    )
    analysis_results = relationship(
        "AnalysisResult",
        back_populates="upload",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<LeakUpload id={self.id} filename={self.filename} status={self.status}>"


class ExtractedQuestion(Base):
    __tablename__ = "extracted_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    upload_id = Column(String(36), ForeignKey("leak_uploads.id", ondelete="CASCADE"), nullable=False, index=True)
    detected_question_number = Column(Integer, nullable=True)
    detected_order = Column(Integer, nullable=False, default=1)
    extracted_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=True)
    options = Column(JSON, nullable=True, default=dict)  # {"A": "...", "B": "..."}
    detected_option_order = Column(JSON, nullable=True, default=list)  # ["A", "B", "C", "D"]
    page_number = Column(Integer, default=1)
    extraction_quality = Column(String(30), default="HIGH")  # HIGH, MEDIUM, LOW, UNCERTAIN
    is_partial = Column(String(10), default="NO")
    warnings = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    upload = relationship("LeakUpload", back_populates="extracted_questions")

    def __repr__(self):
        return f"<ExtractedQuestion id={self.id} q_num={self.detected_question_number} quality={self.extraction_quality}>"

