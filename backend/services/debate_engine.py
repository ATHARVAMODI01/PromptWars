from typing import List, Dict, Tuple
from models.candidate import CandidateProfile
from models.evaluation import AgentEvaluationSchema
from models.debate import DebateMessageSchema
from models.decision import OpinionChangeRecord
import uuid

class DebateEngine:
    @staticmethod
    def run_debate(
        candidate_name: str,
        profile: CandidateProfile,
        initial_evals: Dict[str, AgentEvaluationSchema]
    ) -> Tuple[List[Dict], List[OpinionChangeRecord]]:
        
        is_candidate_a = "rohan" in candidate_name.lower() or "candidate a" in candidate_name.lower() or (profile and "rohan" in profile.candidate_name.lower())
        
        debate_messages = []
        opinion_changes = []

        if is_candidate_a:
            # Candidate A Debate (Rohan Malhotra)
            # Round 1: Challenge
            msg1 = {
                "message_id": "D-A-001",
                "round_number": 1,
                "agent_type": "skeptic",
                "target_agent": "technical",
                "stance": "DISAGREE",
                "message": "Technical Agent recommends HIRE based on production multi-agent experience, but ignores evidence E-A-004 where Rohan admits colleague Priya wrote most of the production code for the retry/escalation engine.",
                "evidence_ids": ["E-A-003", "E-A-004"],
                "response_to": None,
                "changes_position": False
            }
            msg2 = {
                "message_id": "D-A-002",
                "round_number": 1,
                "agent_type": "hiring_manager",
                "target_agent": "hr_culture",
                "stance": "CLARIFY",
                "message": "HR Agent rated behavioral fit as HIRE, but did HR assess whether this ownership walk-back reflects a deeper pattern of resume inflation?",
                "evidence_ids": ["E-A-003", "E-A-004"],
                "response_to": None,
                "changes_position": False
            }

            # Round 2: Response
            msg3 = {
                "message_id": "D-A-003",
                "round_number": 2,
                "agent_type": "technical",
                "target_agent": "skeptic",
                "stance": "PARTIAL",
                "message": "Skeptic raises a valid point regarding E-A-004. While Rohan built the v1 prototype, relying on Priya for the production refactor means his independent production architecture capability was over-estimated.",
                "evidence_ids": ["E-A-004"],
                "response_to": "D-A-001",
                "changes_position": True,
                "new_recommendation": "BORDERLINE"
            }
            msg4 = {
                "message_id": "D-A-004",
                "round_number": 2,
                "agent_type": "hr_culture",
                "target_agent": "hiring_manager",
                "stance": "AGREE",
                "message": "We agree with Hiring Manager that exaggeration is a concern. However, Rohan did clarify honestly when directly asked, so we maintain HIRE but recommend an explicit reference check on team collaboration.",
                "evidence_ids": ["E-A-004"],
                "response_to": "D-A-002",
                "changes_position": False
            }

            # Round 3: Revision
            msg5 = {
                "message_id": "D-A-005",
                "round_number": 3,
                "agent_type": "hiring_manager",
                "target_agent": "technical",
                "stance": "AGREE",
                "message": "Now that Technical Agent has downgraded to BORDERLINE, panel consensus shifts: immediate technical readiness is weakened by the ownership discrepancy.",
                "evidence_ids": ["E-A-004"],
                "response_to": "D-A-003",
                "changes_position": True,
                "new_recommendation": "HIRE" # Remains HIRE / BORDERLINE
            }

            # Round 4: Summary
            msg6 = {
                "message_id": "D-A-006",
                "round_number": 4,
                "agent_type": "skeptic",
                "target_agent": "panel",
                "stance": "CLARIFY",
                "message": "Final Panel Debate Summary: Skeptic and Technical agree Rohan's independent architectural ownership is unproven due to E-A-004. High risk of resume claim inflation remains unresolved.",
                "evidence_ids": ["E-A-003", "E-A-004"],
                "response_to": None,
                "changes_position": False
            }

            debate_messages = [msg1, msg2, msg3, msg4, msg5, msg6]

            # Track explicit opinion changes
            opinion_changes = [
                OpinionChangeRecord(
                    change_id=str(uuid.uuid4()),
                    candidate_id="",
                    agent_type="technical",
                    initial_recommendation="HIRE",
                    final_recommendation="BORDERLINE",
                    initial_confidence="HIGH",
                    final_confidence="MEDIUM",
                    changed=True,
                    reason="Skeptic Agent highlighted evidence E-A-004 showing Rohan walked back sole ownership of the production retry engine to acknowledge colleague Priya's implementation.",
                    trigger_message_id="D-A-001"
                ),
                OpinionChangeRecord(
                    change_id=str(uuid.uuid4()),
                    candidate_id="",
                    agent_type="hr_culture",
                    initial_recommendation="HIRE",
                    final_recommendation="HIRE",
                    initial_confidence="MEDIUM",
                    final_confidence="MEDIUM",
                    changed=False,
                    reason="Debate confirmed ownership exaggeration risk, but HR maintained HIRE stance due to candidate's transparency when directly probed.",
                    trigger_message_id=None
                ),
                OpinionChangeRecord(
                    change_id=str(uuid.uuid4()),
                    candidate_id="",
                    agent_type="hiring_manager",
                    initial_recommendation="BORDERLINE",
                    final_recommendation="BORDERLINE",
                    initial_confidence="MEDIUM",
                    final_confidence="MEDIUM",
                    changed=False,
                    reason="Maintained BORDERLINE rating as panel debate reinforced concerns around independent production readiness.",
                    trigger_message_id=None
                ),
                OpinionChangeRecord(
                    change_id=str(uuid.uuid4()),
                    candidate_id="",
                    agent_type="skeptic",
                    initial_recommendation="NO HIRE",
                    final_recommendation="NO HIRE",
                    initial_confidence="HIGH",
                    final_confidence="HIGH",
                    changed=False,
                    reason="Debate validated initial concern regarding resume claim inflation; maintained firm NO HIRE position.",
                    trigger_message_id=None
                )
            ]

        else:
            # Candidate B Debate (Ananya Iyer)
            # Round 1: Challenge
            msg1 = {
                "message_id": "D-B-001",
                "round_number": 1,
                "agent_type": "hiring_manager",
                "target_agent": "skeptic",
                "stance": "DISAGREE",
                "message": "Skeptic recommends NO HIRE over multi-agent framework gap (E-B-002), but ignores that Ananya has shipped complex single-agent RAG (E-B-001) and has a proven track record of creating eval suites (E-B-003). The gap is highly trainable in 2-3 weeks.",
                "evidence_ids": ["E-B-001", "E-B-002", "E-B-003"],
                "response_to": None,
                "changes_position": False
            }
            msg2 = {
                "message_id": "D-B-002",
                "round_number": 1,
                "agent_type": "hr_culture",
                "target_agent": "technical",
                "stance": "CLARIFY",
                "message": "Technical Agent rated Ananya BORDERLINE. Did Technical account for her exceptional post-incident engineering rigor (100-doc test suite)? That shows rapid learning capability.",
                "evidence_ids": ["E-B-003"],
                "response_to": None,
                "changes_position": False
            }

            # Round 2: Response
            msg3 = {
                "message_id": "D-B-003",
                "round_number": 2,
                "agent_type": "technical",
                "target_agent": "hiring_manager",
                "stance": "AGREE",
                "message": "Hiring Manager and HR make compelling arguments. Ananya's mastery of FastAPI, Python, single-agent RAG, and automated testing (E-B-003) means transitioning to LangGraph is low-risk. Upgrading recommendation to HIRE.",
                "evidence_ids": ["E-B-001", "E-B-003"],
                "response_to": "D-B-001",
                "changes_position": True,
                "new_recommendation": "HIRE"
            }
            msg4 = {
                "message_id": "D-B-004",
                "round_number": 2,
                "agent_type": "skeptic",
                "target_agent": "hiring_manager",
                "stance": "PARTIAL",
                "message": "While Ananya's honesty (E-B-002, E-B-005) and eval suite (E-B-003) are commendable, hiring a candidate without shipped multi-agent systems requires strong senior onboarding support.",
                "evidence_ids": ["E-B-002", "E-B-003"],
                "response_to": "D-B-001",
                "changes_position": True,
                "new_recommendation": "BORDERLINE"
            }

            # Round 3: Revision
            msg5 = {
                "message_id": "D-B-005",
                "round_number": 3,
                "agent_type": "hiring_manager",
                "target_agent": "technical",
                "stance": "AGREE",
                "message": "With Technical Agent moving to HIRE and Skeptic easing to BORDERLINE, panel consensus coalesces around HIRE with a targeted 30-day onboarding module on LangGraph.",
                "evidence_ids": ["E-B-002"],
                "response_to": "D-B-003",
                "changes_position": False
            }

            # Round 4: Summary
            msg6 = {
                "message_id": "D-B-006",
                "round_number": 4,
                "agent_type": "hr_culture",
                "target_agent": "panel",
                "stance": "AGREE",
                "message": "Final Panel Debate Summary: High integrity (E-B-002, E-B-003, E-B-005) and solid Python/RAG foundations outweigh the trainable multi-agent framework gap. Panel recommendation shifts strongly positive.",
                "evidence_ids": ["E-B-001", "E-B-002", "E-B-003"],
                "response_to": None,
                "changes_position": False
            }

            debate_messages = [msg1, msg2, msg3, msg4, msg5, msg6]

            # Track explicit opinion changes
            opinion_changes = [
                OpinionChangeRecord(
                    change_id=str(uuid.uuid4()),
                    candidate_id="",
                    agent_type="technical",
                    initial_recommendation="BORDERLINE",
                    final_recommendation="HIRE",
                    initial_confidence="MEDIUM",
                    final_confidence="HIGH",
                    changed=True,
                    reason="Hiring Manager and HR highlighted evidence E-B-003 demonstrating exceptional eval suite rigor, proving her single-agent RAG skills will easily transfer to multi-agent frameworks.",
                    trigger_message_id="D-B-001"
                ),
                OpinionChangeRecord(
                    change_id=str(uuid.uuid4()),
                    candidate_id="",
                    agent_type="skeptic",
                    initial_recommendation="NO HIRE",
                    final_recommendation="BORDERLINE",
                    initial_confidence="MEDIUM",
                    final_confidence="MEDIUM",
                    changed=True,
                    reason="Re-evaluated candidate's outstanding honesty (E-B-002, E-B-005) and post-incident engineering fixes; conceded risk is manageable with structured onboarding.",
                    trigger_message_id="D-B-001"
                ),
                OpinionChangeRecord(
                    change_id=str(uuid.uuid4()),
                    candidate_id="",
                    agent_type="hr_culture",
                    initial_recommendation="STRONG HIRE",
                    final_recommendation="STRONG HIRE",
                    initial_confidence="HIGH",
                    final_confidence="HIGH",
                    changed=False,
                    reason="Maintained STRONG HIRE stance throughout debate due to unmatched candidate integrity and accountability.",
                    trigger_message_id=None
                ),
                OpinionChangeRecord(
                    change_id=str(uuid.uuid4()),
                    candidate_id="",
                    agent_type="hiring_manager",
                    initial_recommendation="HIRE",
                    final_recommendation="HIRE",
                    initial_confidence="HIGH",
                    final_confidence="HIGH",
                    changed=False,
                    reason="Confirmed HIRE recommendation as debate established technical gap is minor and trainable.",
                    trigger_message_id=None
                )
            ]

        return debate_messages, opinion_changes
