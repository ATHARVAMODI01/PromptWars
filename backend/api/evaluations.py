from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, CandidateModel, AgentEvaluationModel, JobModel
from services.agent_runner import AgentRunner
from services.profile_builder import ProfileBuilder
from models.candidate import CandidateProfile
from typing import List, Dict
import uuid

router = APIRouter(prefix="/api/candidates", tags=["Evaluations"])

@router.post("/{candidate_id}/evaluate")
async def evaluate_candidate(candidate_id: str, db: Session = Depends(get_db)):
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

    runner = AgentRunner()
    evaluations = await runner.run_all_independent_agents(candidate.name, profile_obj, job_reqs)

    # Save to DB as stage="initial"
    saved_records = []
    for ev in evaluations:
        rec = AgentEvaluationModel(
            evaluation_id=str(uuid.uuid4()),
            candidate_id=candidate.candidate_id,
            agent_type=ev.agent,
            stage="initial",
            recommendation=ev.recommendation,
            confidence=ev.confidence,
            confidence_score=ev.confidence_score,
            reasoning=ev.reasoning,
            evidence_ids=[e.evidence_id for e in ev.evidence]
        )
        db.add(rec)
        saved_records.append(ev.model_dump())

    db.commit()
    return saved_records

@router.get("/{candidate_id}/evaluations")
def get_evaluations(candidate_id: str, stage: str = "initial", db: Session = Depends(get_db)):
    evals = db.query(AgentEvaluationModel).filter(
        AgentEvaluationModel.candidate_id == candidate_id,
        AgentEvaluationModel.stage == stage
    ).all()
    
    if not evals:
        # Fallback to run evaluation on demand if missing
        pass

    res = []
    for e in evals:
        res.append({
            "evaluation_id": e.evaluation_id,
            "candidate_id": e.candidate_id,
            "agent": e.agent_type,
            "stage": e.stage,
            "recommendation": e.recommendation,
            "confidence": e.confidence,
            "confidence_score": e.confidence_score,
            "reasoning": e.reasoning,
            "evidence_ids": e.evidence_ids
        })
    return res
