from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class OpinionChangeRecord(BaseModel):
    change_id: str
    candidate_id: str
    agent_type: str
    initial_recommendation: str
    final_recommendation: str
    initial_confidence: str
    final_confidence: str
    changed: bool
    reason: str
    trigger_message_id: Optional[str] = None

class FinalDecisionSchema(BaseModel):
    candidate: str
    recommendation: str # "STRONG HIRE" | "HIRE" | "BORDERLINE / FURTHER INTERVIEW" | "NO HIRE" | "STRONG NO HIRE" | "INSUFFICIENT EVIDENCE"
    confidence: str # "HIGH" | "MEDIUM" | "LOW"
    strengths: List[str] = []
    concerns: List[str] = []
    critical_evidence: List[str] = []
    agent_consensus: List[str] = []
    unresolved_disagreements: List[str] = []
    final_reasoning: str
    reasoning_steps: Optional[List[Dict[str, Any]]] = []

class FinalDecisionRecord(BaseModel):
    decision_id: str
    candidate_id: str
    recommendation: str
    confidence: str
    reasoning: str
    strengths: List[str] = []
    concerns: List[str] = []
    unresolved_disagreements: List[str] = []
    evidence_ids: List[str] = []
    reasoning_steps: List[Dict[str, Any]] = []
    created_at: datetime
