from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DebateMessageSchema(BaseModel):
    agent: str
    responding_to: Optional[str] = None
    stance: str # "AGREE" | "DISAGREE" | "PARTIAL" | "CLARIFY"
    argument: str
    evidence_ids: List[str] = []
    changes_position: bool = False
    new_recommendation: Optional[str] = None

class DebateMessageRecord(BaseModel):
    message_id: str
    candidate_id: str
    round_number: int
    agent_type: str
    target_agent: Optional[str] = None
    stance: str
    message: str
    evidence_ids: List[str] = []
    response_to: Optional[str] = None
    created_at: datetime
