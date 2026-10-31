import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    upload_id = Column(String(36), ForeignKey("leak_uploads.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="COMPLETED")  # possible_match, ambiguous_match, insufficient_evidence, no_match, error
    
    # Candidate version information
    top_candidate_version_id = Column(String(36), ForeignKey("paper_versions.id", ondelete="SET NULL"), nullable=True)
    top_candidate_centre_id = Column(String(36), ForeignKey("centres.id", ondelete="SET NULL"), nullable=True)
    top_similarity_score = Column(Float, nullable=True)
    
    # Summary of findings
    total_matched_questions = Column(Integer, default=0)
    explanation = Column(Text, nullable=True)
    ranked_candidates = Column(JSON, default=list)  # Full ranking list with scores and features
    warnings = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    upload = relationship("LeakUpload", back_populates="analysis_results")
    matching_evidence = relationship(
        "MatchingEvidence",
        back_populates="analysis_result",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<AnalysisResult id={self.id} status={self.status} score={self.top_similarity_score}>"


class MatchingEvidence(Base):
    __tablename__ = "matching_evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_result_id = Column(String(36), ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_version_id = Column(String(36), ForeignKey("paper_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    feature_type = Column(String(50), nullable=False)  # text_similarity, option_order, question_order, semantic_similarity
    score = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    analysis_result = relationship("AnalysisResult", back_populates="matching_evidence")

    def __repr__(self):
        return f"<MatchingEvidence feature={self.feature_type} score={self.score}>"

