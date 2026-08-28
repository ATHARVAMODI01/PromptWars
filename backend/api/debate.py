from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, CandidateModel, DebateMessageModel, OpinionChangeModel, AgentEvaluationModel
from services.debate_engine import DebateEngine
from services.profile_builder import ProfileBuilder
from models.candidate import CandidateProfile
from models.evaluation import AgentEvaluationSchema
from typing import List, Dict
import uuid

router = APIRouter(prefix="/api/candidates", tags=["Debate"])

@router.post("/{candidate_id}/debate")
def run_debate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.candidate_id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if not candidate.profile:
        prof = ProfileBuilder.build_profile(candidate.name, candidate.resume_text, candidate.transcript_text)
        candidate.profile = prof.model_dump()
        db.commit()

    profile_obj = CandidateProfile(**candidate.profile)

    # Get initial evals
    initial_eval_recs = db.query(AgentEvaluationModel).filter(
        AgentEvaluationModel.candidate_id == candidate_id,
        AgentEvaluationModel.stage == "initial"
    ).all()

    initial_evals_dict = {}
    for r in initial_eval_recs:
        initial_evals_dict[r.agent_type] = AgentEvaluationSchema(
            agent=r.agent_type,
            recommendation=r.recommendation,
            confidence=r.confidence,
            confidence_score=r.confidence_score,
            reasoning=r.reasoning
        )

    debate_messages, opinion_changes = DebateEngine.run_debate(candidate.name, profile_obj, initial_evals_dict)

    # Clear old debate entries if re-running
    db.query(DebateMessageModel).filter(DebateMessageModel.candidate_id == candidate_id).delete()
    db.query(OpinionChangeModel).filter(OpinionChangeModel.candidate_id == candidate_id).delete()

    # Save debate messages
    saved_messages = []
    for msg in debate_messages:
        dm = DebateMessageModel(
            message_id=msg["message_id"],
            candidate_id=candidate.candidate_id,
            round_number=str(msg["round_number"]),
            agent_type=msg["agent_type"],
            target_agent=msg["target_agent"],
            stance=msg["stance"],
            message=msg["message"],
            evidence_ids=msg["evidence_ids"],
            response_to=msg["response_to"]
        )
        db.add(dm)
        saved_messages.append(msg)

    # Save opinion changes
    saved_changes = []
    for oc in opinion_changes:
        oc.candidate_id = candidate.candidate_id
        db_oc = OpinionChangeModel(
            change_id=oc.change_id,
            candidate_id=candidate.candidate_id,
            agent_type=oc.agent_type,
            initial_recommendation=oc.initial_recommendation,
            final_recommendation=oc.final_recommendation,
            initial_confidence=oc.initial_confidence,
            final_confidence=oc.final_confidence,
            changed=oc.changed,
            reason=oc.reason,
            trigger_message_id=oc.trigger_message_id
        )
        db.add(db_oc)
        saved_changes.append(oc.model_dump())

    db.commit()
    return {
        "status": "completed",
        "candidate_id": candidate_id,
        "debate_messages": saved_messages,
        "opinion_changes": saved_changes
    }

@router.get("/{candidate_id}/debate")
def get_debate(candidate_id: str, db: Session = Depends(get_db)):
    msgs = db.query(DebateMessageModel).filter(DebateMessageModel.candidate_id == candidate_id).all()
    changes = db.query(OpinionChangeModel).filter(OpinionChangeModel.candidate_id == candidate_id).all()

    msg_list = []
    for m in msgs:
        msg_list.append({
            "message_id": m.message_id,
            "round_number": int(m.round_number) if m.round_number and str(m.round_number).isdigit() else 1,
            "agent_type": m.agent_type,
            "target_agent": m.target_agent,
            "stance": m.stance,
            "message": m.message,
            "evidence_ids": m.evidence_ids,
            "response_to": m.response_to
        })

    change_list = []
    for c in changes:
        change_list.append({
            "change_id": c.change_id,
            "candidate_id": c.candidate_id,
            "agent_type": c.agent_type,
            "initial_recommendation": c.initial_recommendation,
            "final_recommendation": c.final_recommendation,
            "initial_confidence": c.initial_confidence,
            "final_confidence": c.final_confidence,
            "changed": c.changed,
            "reason": c.reason,
            "trigger_message_id": c.trigger_message_id
        })

    return {
        "candidate_id": candidate_id,
        "debate_messages": msg_list,
        "opinion_changes": change_list
    }
