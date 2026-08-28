from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, CandidateModel, EvidenceModel
from services.profile_builder import ProfileBuilder
from models.candidate import CandidateProfile
from typing import List

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("", response_model=List[dict])
def list_candidates(db: Session = Depends(get_db)):
    candidates = db.query(CandidateModel).all()
    res = []
    for c in candidates:
        res.append({
            "candidate_id": c.candidate_id,
            "name": c.name,
            "profile": c.profile,
            "created_at": c.created_at
        })
    return res

@router.get("/{candidate_id}")
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.candidate_id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {
        "candidate_id": candidate.candidate_id,
        "name": candidate.name,
        "resume_text": candidate.resume_text,
        "transcript_text": candidate.transcript_text,
        "profile": candidate.profile,
        "created_at": candidate.created_at
    }

@router.post("/{candidate_id}/profile")
def build_candidate_profile(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.candidate_id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    profile = ProfileBuilder.build_profile(candidate.name, candidate.resume_text, candidate.transcript_text)
    candidate.profile = profile.model_dump()

    # Save evidence items
    for item in profile.evidence:
        ev = EvidenceModel(
            evidence_id=item.evidence_id,
            candidate_id=candidate.candidate_id,
            source_type=item.source,
            section=item.section,
            quote=item.quote,
            supports=item.supports,
            metadata_info={"candidate": item.candidate}
        )
        db.merge(ev)

    db.commit()
    db.refresh(candidate)
    return candidate.profile

@router.get("/{candidate_id}/evidence/{evidence_id}")
def get_evidence_item(candidate_id: str, evidence_id: str, db: Session = Depends(get_db)):
    ev = db.query(EvidenceModel).filter(
        EvidenceModel.candidate_id == candidate_id,
        EvidenceModel.evidence_id == evidence_id
    ).first()
    if not ev:
        # Check global evidence search as fallback
        ev = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    return {
        "evidence_id": ev.evidence_id,
        "candidate_id": ev.candidate_id,
        "source": ev.source_type,
        "section": ev.section,
        "quote": ev.quote,
        "supports": ev.supports
    }
