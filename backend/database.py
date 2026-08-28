from sqlalchemy import create_engine, Column, String, Float, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import uuid
import os

if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/interview_panel.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "interview_panel.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class JobModel(Base):
    __tablename__ = "jobs"
    job_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class CandidateModel(Base):
    __tablename__ = "candidates"
    candidate_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    resume_text = Column(Text, default="")
    transcript_text = Column(Text, default="")
    profile = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    evidence_items = relationship("EvidenceModel", back_populates="candidate", cascade="all, delete-orphan")
    evaluations = relationship("AgentEvaluationModel", back_populates="candidate", cascade="all, delete-orphan")
    debate_messages = relationship("DebateMessageModel", back_populates="candidate", cascade="all, delete-orphan")
    opinion_changes = relationship("OpinionChangeModel", back_populates="candidate", cascade="all, delete-orphan")
    final_decisions = relationship("FinalDecisionModel", back_populates="candidate", cascade="all, delete-orphan")

class EvidenceModel(Base):
    __tablename__ = "evidence"
    evidence_id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.candidate_id"), nullable=False)
    source_type = Column(String, nullable=False) # "resume" or "transcript"
    section = Column(String, nullable=False)
    quote = Column(Text, nullable=False)
    supports = Column(JSON, default=list)
    metadata_info = Column(JSON, default=dict)

    candidate = relationship("CandidateModel", back_populates="evidence_items")

class AgentEvaluationModel(Base):
    __tablename__ = "agent_evaluations"
    evaluation_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.candidate_id"), nullable=False)
    agent_type = Column(String, nullable=False)
    stage = Column(String, nullable=False) # "initial" | "post_debate"
    recommendation = Column(String, nullable=False)
    confidence = Column(String, nullable=False)
    confidence_score = Column(Float, default=0.8)
    reasoning = Column(Text, nullable=False)
    evidence_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("CandidateModel", back_populates="evaluations")

class DebateMessageModel(Base):
    __tablename__ = "debate_messages"
    message_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.candidate_id"), nullable=False)
    round_number = Column(Integer, default=1) if False else Column(String, default="1") # mapped as String or Integer
    agent_type = Column(String, nullable=False)
    target_agent = Column(String, nullable=True)
    stance = Column(String, nullable=False) # "AGREE" | "DISAGREE" | "PARTIAL" | "CLARIFY"
    message = Column(Text, nullable=False)
    evidence_ids = Column(JSON, default=list)
    response_to = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("CandidateModel", back_populates="debate_messages")

class OpinionChangeModel(Base):
    __tablename__ = "opinion_changes"
    change_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.candidate_id"), nullable=False)
    agent_type = Column(String, nullable=False)
    initial_recommendation = Column(String, nullable=False)
    final_recommendation = Column(String, nullable=False)
    initial_confidence = Column(String, nullable=False)
    final_confidence = Column(String, nullable=False)
    changed = Column(Boolean, default=False)
    reason = Column(Text, nullable=False)
    trigger_message_id = Column(String, nullable=True)

    candidate = relationship("CandidateModel", back_populates="opinion_changes")

class FinalDecisionModel(Base):
    __tablename__ = "final_decisions"
    decision_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.candidate_id"), nullable=False)
    recommendation = Column(String, nullable=False)
    confidence = Column(String, nullable=False)
    reasoning = Column(Text, nullable=False)
    strengths = Column(JSON, default=list)
    concerns = Column(JSON, default=list)
    unresolved_disagreements = Column(JSON, default=list)
    evidence_ids = Column(JSON, default=list)
    reasoning_steps = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("CandidateModel", back_populates="final_decisions")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
