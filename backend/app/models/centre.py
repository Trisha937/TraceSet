import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Centre(Base):
    __tablename__ = "centres"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    contact_email = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    paper_versions = relationship("PaperVersion", back_populates="centre")

    def __repr__(self):
        return f"<Centre code={self.code} name={self.name}>"

