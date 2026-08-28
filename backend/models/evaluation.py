from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EvidenceClaimReason(BaseModel):
    evidence_id: str
    claim: str
    reason: str

class AgentEvaluationSchema(BaseModel):
    agent: str # "technical" | "hr_culture" | "hiring_manager" | "skeptic"
    recommendation: str # "HIRE" | "STRONG HIRE" | "BORDERLINE" | "NO HIRE" | "STRONG NO HIRE" | "INSUFFICIENT EVIDENCE"
    confidence: str # "HIGH" | "MEDIUM" | "LOW"
    confidence_score: Optional[float] = 0.8
    strengths: List[str] = []
    concerns: List[str] = []
    evidence: List[EvidenceClaimReason] = []
    reasoning: str

class AgentEvaluationRecord(BaseModel):
    evaluation_id: str
    candidate_id: str
    agent_type: str
    stage: str # "initial" | "post_debate"
    recommendation: str
    confidence: str
    confidence_score: float
    reasoning: str
    evidence_ids: List[str] = []
    created_at: datetime
