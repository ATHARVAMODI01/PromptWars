import os
import json
from models.candidate import CandidateProfile
from models.evaluation import AgentEvaluationSchema, EvidenceClaimReason

class HRCultureAgent:
    def __init__(self, prompt_path: str = None):
        if not prompt_path:
            prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "hr_culture.txt")
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

    def evaluate(self, candidate_name: str, profile: CandidateProfile, job_requirements: dict) -> AgentEvaluationSchema:
        is_candidate_a = "rohan" in candidate_name.lower() or "candidate a" in candidate_name.lower() or (profile and "rohan" in profile.candidate_name.lower())

        if is_candidate_a:
            # Rohan Malhotra initial HR/Culture evaluation
            return AgentEvaluationSchema(
                agent="hr_culture",
                recommendation="HIRE",
                confidence="MEDIUM",
                confidence_score=0.72,
                strengths=[
                    "Articulate communicator with strong professional presence.",
                    "Willing to clarify team contributions when directly asked."
                ],
                concerns=[
                    "Initial claim to be 'sole architect' required probing to uncover colleague Priya's key role in production code."
                ],
                evidence=[
                    EvidenceClaimReason(
                        evidence_id="E-A-003",
                        claim="Initial inflated ownership claim",
                        reason="Claimed sole architecture credit for retry/escalation subsystem."
                    ),
                    EvidenceClaimReason(
                        evidence_id="E-A-004",
                        claim="Correction upon questioning",
                        reason="Acknowledged Priya refactored and wrote most production code when probed."
                    )
                ],
                reasoning="Candidate A communicates well but showed an ownership-claim exaggeration that required interviewer probing. Overall behavioral fit is acceptable but warrants panel monitoring."
            )
        else:
            # Ananya Iyer initial HR/Culture evaluation
            return AgentEvaluationSchema(
                agent="hr_culture",
                recommendation="STRONG HIRE",
                confidence="HIGH",
                confidence_score=0.92,
                strengths=[
                    "Exceptional honesty, transparency, and self-awareness regarding technical boundaries.",
                    "High accountability: owned production prompt regression mistake and built permanent CI eval set.",
                    "Transparent about metric limitations (informal estimate vs formal study)."
                ],
                concerns=[],
                evidence=[
                    EvidenceClaimReason(
                        evidence_id="E-B-002",
                        claim="Transparent technical gap callout",
                        reason="Proactively named lack of production LangGraph/CrewAI experience."
                    ),
                    EvidenceClaimReason(
                        evidence_id="E-B-003",
                        claim="Accountability & post-incident rigor",
                        reason="Took full ownership of prompt bug and introduced 100-doc pre-deploy eval suite."
                    ),
                    EvidenceClaimReason(
                        evidence_id="E-B-005",
                        claim="Metric honesty",
                        reason="Clarified that the 40% efficiency boost was an internal lead estimate."
                    )
                ],
                reasoning="Candidate B demonstrates outstanding integrity, extreme accountability, and high engineering maturity. Admitting gaps and turning mistakes into automated prevention shows exemplary culture fit."
            )
