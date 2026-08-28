from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class RequirementTier(BaseModel):
    required_core: List[str]
    nice_to_have: List[str]

class JobCreate(BaseModel):
    title: str
    description: str
    requirements: RequirementTier

class JobResponse(BaseModel):
    job_id: str
    title: str
    description: str
    requirements: RequirementTier
    created_at: datetime

class EvidenceItem(BaseModel):
    evidence_id: str
    source: str # "resume" or "transcript"
    section: str # e.g. "Technical", "Behavioral", "Experience"
    quote: str
    supports: List[str]
    candidate: str

class CandidateProfile(BaseModel):
    candidate_name: str
    target_role: str
    education: List[str] = []
    experience: List[str] = []
    skills: List[str] = []
    projects: List[str] = []
    certifications: List[str] = []
    resume_claims: List[str] = []
    interview_claims: List[str] = []
    demonstrated_capabilities: List[str] = []
    gaps: List[str] = []
    contradictions: List[str] = []
    evidence: List[EvidenceItem] = []

class CandidateCreate(BaseModel):
    name: str
    resume_text: Optional[str] = ""
    transcript_text: Optional[str] = ""

class CandidateResponse(BaseModel):
    candidate_id: str
    name: str
    resume_text: str
    transcript_text: str
    profile: Optional[CandidateProfile] = None
    created_at: datetime
