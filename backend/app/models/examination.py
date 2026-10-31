import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Examination(Base):
    __tablename__ = "examinations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=False)
    exam_date = Column(DateTime, nullable=True)
    total_marks = Column(Integer, default=100)
    duration_minutes = Column(Integer, default=180)
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    questions = relationship("Question", back_populates="examination")
    paper_versions = relationship("PaperVersion", back_populates="examination", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Examination code={self.code} name={self.name}>"

