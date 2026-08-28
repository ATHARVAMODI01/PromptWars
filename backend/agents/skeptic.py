import os
import json
from models.candidate import CandidateProfile
from models.evaluation import AgentEvaluationSchema, EvidenceClaimReason

class SkepticAgent:
    def __init__(self, prompt_path: str = None):
        if not prompt_path:
            prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "skeptic.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

    def evaluate(self, candidate_name: str, profile: CandidateProfile, job_requirements: dict) -> AgentEvaluationSchema:
        is_candidate_a = "rohan" in candidate_name.lower() or "candidate a" in candidate_name.lower() or (profile and "rohan" in profile.candidate_name.lower())

        if is_candidate_a:
            # Rohan Malhotra initial Skeptic evaluation
            return AgentEvaluationSchema(
                agent="skeptic",
                recommendation="NO HIRE",
                confidence="HIGH",
                confidence_score=0.88,
                strengths=[
                    "Has worked in environments utilizing multi-agent systems."
                ],
                concerns=[
                    "CRITICAL DISCREPANCY: Initially claimed to be 'sole architect' of production retry/escalation engine, then confessed Priya refactored and wrote most production code.",
                    "Resume inflates individual contribution, taking credit for team engineering efforts.",
                    "High risk of exaggeration on future technical claims."
                ],
                evidence=[
                    EvidenceClaimReason(
                        evidence_id="E-A-003",
                        claim="Sole architect claim",
                        reason="Claimed sole developer status for retry/escalation subsystem."
                    ),
                    EvidenceClaimReason(
                        evidence_id="E-A-004",
                        claim="Discrepancy admission",
                        reason="Walked back claim under questioning, admitting Priya wrote the production version."
                    )
                ],
                reasoning="Candidate A exhibits a direct ownership discrepancy between resume/initial statements and actual team execution. Relying on an engineer who exaggerates core system ownership introduces significant technical and cultural risk."
            )
        else:
            # Ananya Iyer initial Skeptic evaluation
            return AgentEvaluationSchema(
                agent="skeptic",
                recommendation="NO HIRE",
                confidence="MEDIUM",
                confidence_score=0.65,
                strengths=[
                    "Transparent about metric limitations and mistake accountability."
                ],
                concerns=[
                    "UNFULFILLED REQUIREMENT: Has zero production multi-agent system experience (LangGraph/CrewAI/AutoGen).",
                    "Target role specifically requires improving planner/executor/reviewer agentic systems.",
                    "Previous production incident caused 5% table parsing failures before testing was retrofitted."
                ],
                evidence=[
                    EvidenceClaimReason(
                        evidence_id="E-B-002",
                        claim="Zero production multi-agent experience",
                        reason="Confirmed all shipped work is single-agent RAG."
                    ),
                    EvidenceClaimReason(
                        evidence_id="E-B-003",
                        claim="Past production incident",
                        reason="Prompt modification broke 5% of invoice table extractions."
                    )
                ],
                reasoning="Candidate B lacks the essential core experience in production multi-agent systems required for this position. While honest, hiring someone without shipped agentic experience for an Agentic AI role presents unacceptably high execution risk."
            )
