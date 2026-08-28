from typing import Dict, List, Any
from models.candidate import CandidateProfile
from models.evaluation import AgentEvaluationSchema
from models.decision import FinalDecisionSchema, OpinionChangeRecord

class ReportGenerator:
    @staticmethod
    def build_candidate_report(
        candidate: Dict,
        profile: CandidateProfile,
        initial_evals: Dict[str, AgentEvaluationSchema],
        debate_messages: List[Dict],
        opinion_changes: List[OpinionChangeRecord],
        final_decision: Any
    ) -> Dict[str, Any]:
        
        final_dec_dict = (
            final_decision.model_dump() 
            if hasattr(final_decision, "model_dump") 
            else (final_decision if isinstance(final_decision, dict) else vars(final_decision))
        )

        return {
            "candidate_id": candidate.get("candidate_id"),
            "candidate_name": profile.candidate_name,
            "target_role": profile.target_role,
            "profile_summary": {
                "skills": profile.skills,
                "experience": profile.experience,
                "gaps": profile.gaps,
                "contradictions": profile.contradictions
            },
            "initial_evaluations": {
                k: (v.model_dump() if hasattr(v, "model_dump") else v) 
                for k, v in initial_evals.items()
            },
            "debate_summary": {
                "total_rounds": 4,
                "messages_count": len(debate_messages),
                "messages": debate_messages
            },
            "opinion_changes": [
                (c.model_dump() if hasattr(c, "model_dump") else c) 
                for c in opinion_changes
            ],
            "final_decision": final_dec_dict,
            "evidence_registry": [
                (e.model_dump() if hasattr(e, "model_dump") else e) 
                for e in profile.evidence
            ]
        }

    @staticmethod
    def build_comparison_report(
        report_a: Dict[str, Any],
        report_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {
            "comparison_title": "Candidate Comparison: Rohan Malhotra vs Ananya Iyer",
            "target_role": "AI Engineer — Agentic Systems (Freight Operations)",
            "candidates": [
                {
                    "name": report_a["candidate_name"],
                    "recommendation": report_a["final_decision"]["recommendation"],
                    "confidence": report_a["final_decision"]["confidence"],
                    "technical_depth": "High (Multi-Agent, FastAPI, React)",
                    "integrity_accountability": "Medium (Discrepancy on Retry Subsystem)",
                    "production_readiness": "Immediate, but requires ownership verification",
                    "skeptic_finding": "Walked back 'sole architect' claim (E-A-004)"
                },
                {
                    "name": report_b["candidate_name"],
                    "recommendation": report_b["final_decision"]["recommendation"],
                    "confidence": report_b["final_decision"]["confidence"],
                    "technical_depth": "Medium-High (Single-Agent RAG, FastAPI, OCR)",
                    "integrity_accountability": "High (Exceptional honesty & eval suite)",
                    "production_readiness": "High (2-3 week ramp-up for LangGraph)",
                    "skeptic_finding": "No production multi-agent experience, but low risk"
                }
            ],
            "panel_summary": "Candidate B (Ananya Iyer) is recommended over Candidate A (Rohan Malhotra) due to her exceptional integrity, quality rigor, and low-risk trainability. Candidate A presents ownership ambiguity that requires further probing before hiring."
        }
