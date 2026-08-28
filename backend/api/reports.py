from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, CandidateModel, FinalDecisionModel, OpinionChangeModel, DebateMessageModel, AgentEvaluationModel, JobModel
from services.decision_engine import FinalDecisionEngine
from services.report_generator import ReportGenerator
from services.profile_builder import ProfileBuilder
from models.candidate import CandidateProfile
from models.evaluation import AgentEvaluationSchema
from models.decision import OpinionChangeRecord
from typing import Dict, Any
import uuid

router = APIRouter(prefix="/api", tags=["Reports"])

@router.post("/candidates/{candidate_id}/decision")
def generate_decision(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.candidate_id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = db.query(JobModel).first()
    job_reqs = job.requirements if job else {}

    if not candidate.profile:
        prof = ProfileBuilder.build_profile(candidate.name, candidate.resume_text, candidate.transcript_text)
        candidate.profile = prof.model_dump()
        db.commit()

    profile_obj = CandidateProfile(**candidate.profile)

    # Fetch initial evals
    eval_recs = db.query(AgentEvaluationModel).filter(
        AgentEvaluationModel.candidate_id == candidate_id,
        AgentEvaluationModel.stage == "initial"
    ).all()
    initial_evals = {r.agent_type: AgentEvaluationSchema(agent=r.agent_type, recommendation=r.recommendation, confidence=r.confidence, reasoning=r.reasoning) for r in eval_recs}

    # Fetch debate messages & opinion changes
    debate_msgs_recs = db.query(DebateMessageModel).filter(DebateMessageModel.candidate_id == candidate_id).all()
    debate_messages = [{"agent_type": m.agent_type, "target_agent": m.target_agent, "stance": m.stance, "message": m.message, "evidence_ids": m.evidence_ids} for m in debate_msgs_recs]

    oc_recs = db.query(OpinionChangeModel).filter(OpinionChangeModel.candidate_id == candidate_id).all()
    opinion_changes = [OpinionChangeRecord(
        change_id=c.change_id, candidate_id=c.candidate_id, agent_type=c.agent_type,
        initial_recommendation=c.initial_recommendation, final_recommendation=c.final_recommendation,
        initial_confidence=c.initial_confidence, final_confidence=c.final_confidence,
        changed=c.changed, reason=c.reason, trigger_message_id=c.trigger_message_id
    ) for c in oc_recs]

    final_dec = FinalDecisionEngine.generate_decision(
        candidate.name, profile_obj, initial_evals, debate_messages, opinion_changes, job_reqs
    )

    # Save to DB
    db.query(FinalDecisionModel).filter(FinalDecisionModel.candidate_id == candidate_id).delete()
    fd_rec = FinalDecisionModel(
        decision_id=str(uuid.uuid4()),
        candidate_id=candidate_id,
        recommendation=final_dec.recommendation,
        confidence=final_dec.confidence,
        reasoning=final_dec.final_reasoning,
        strengths=final_dec.strengths,
        concerns=final_dec.concerns,
        unresolved_disagreements=final_dec.unresolved_disagreements,
        evidence_ids=final_dec.critical_evidence,
        reasoning_steps=final_dec.reasoning_steps
    )
    db.add(fd_rec)
    db.commit()

    return final_dec.model_dump()

@router.get("/candidates/{candidate_id}/report")
def get_candidate_report(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.candidate_id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    profile_obj = CandidateProfile(**candidate.profile) if candidate.profile else ProfileBuilder.build_profile(candidate.name, candidate.resume_text, candidate.transcript_text)
    
    # Generate decision if missing
    fd = db.query(FinalDecisionModel).filter(FinalDecisionModel.candidate_id == candidate_id).first()
    if not fd:
        generate_decision(candidate_id, db)
        fd = db.query(FinalDecisionModel).filter(FinalDecisionModel.candidate_id == candidate_id).first()

    eval_recs = db.query(AgentEvaluationModel).filter(AgentEvaluationModel.candidate_id == candidate_id, AgentEvaluationModel.stage == "initial").all()
    initial_evals = {r.agent_type: AgentEvaluationSchema(agent=r.agent_type, recommendation=r.recommendation, confidence=r.confidence, reasoning=r.reasoning) for r in eval_recs}

    debate_recs = db.query(DebateMessageModel).filter(DebateMessageModel.candidate_id == candidate_id).all()
    debate_messages = [{"message_id": m.message_id, "round_number": int(m.round_number) if m.round_number and str(m.round_number).isdigit() else 1, "agent_type": m.agent_type, "target_agent": m.target_agent, "stance": m.stance, "message": m.message, "evidence_ids": m.evidence_ids, "response_to": m.response_to} for m in debate_recs]

    oc_recs = db.query(OpinionChangeModel).filter(OpinionChangeModel.candidate_id == candidate_id).all()
    opinion_changes = [OpinionChangeRecord(change_id=c.change_id, candidate_id=c.candidate_id, agent_type=c.agent_type, initial_recommendation=c.initial_recommendation, final_recommendation=c.final_recommendation, initial_confidence=c.initial_confidence, final_confidence=c.final_confidence, changed=c.changed, reason=c.reason, trigger_message_id=c.trigger_message_id) for c in oc_recs]

    final_decision_schema = {
        "candidate": candidate.name,
        "recommendation": fd.recommendation,
        "confidence": fd.confidence,
        "strengths": fd.strengths,
        "concerns": fd.concerns,
        "critical_evidence": fd.evidence_ids,
        "agent_consensus": ["Evaluated across independent agents and panel debate."],
        "unresolved_disagreements": fd.unresolved_disagreements,
        "final_reasoning": fd.reasoning,
        "reasoning_steps": fd.reasoning_steps
    }

    report = ReportGenerator.build_candidate_report(
        {"candidate_id": candidate.candidate_id},
        profile_obj,
        initial_evals,
        debate_messages,
        opinion_changes,
        final_decision_schema
    )
    return report

@router.get("/reports/comparison")
def get_comparison_report(db: Session = Depends(get_db)):
    candidates = db.query(CandidateModel).all()
    if len(candidates) < 2:
        # Load demo data first if not already present
        from api.upload import load_demo_candidates
        import asyncio
        # Seed
        pass

    c_a = db.query(CandidateModel).filter(CandidateModel.name.contains("Rohan")).first()
    c_b = db.query(CandidateModel).filter(CandidateModel.name.contains("Ananya")).first()

    if not c_a or not c_b:
        raise HTTPException(status_code=400, detail="Please load both Candidate A and Candidate B first.")

    report_a = get_candidate_report(c_a.candidate_id, db)
    report_b = get_candidate_report(c_b.candidate_id, db)

    return ReportGenerator.build_comparison_report(report_a, report_b)
