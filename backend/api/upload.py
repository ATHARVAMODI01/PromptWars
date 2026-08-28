from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, JobModel, CandidateModel, EvidenceModel
from services.pdf_processor import PDFProcessor
from services.profile_builder import ProfileBuilder
from models.candidate import JobCreate, RequirementTier
import json
import uuid

router = APIRouter(prefix="/api", tags=["Upload"])

@router.post("/jobs")
async def create_job(
    title: str = Form("AI Engineer — Agentic Systems (Freight Operations)"),
    description: str = Form("Emphasizes production multi-agent systems, Python microservices, React, MongoDB, prompt routing, RAG, reliability, and OCR."),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    text_content = description
    if file:
        file_bytes = await file.read()
        extracted = PDFProcessor.extract_text_from_bytes(file_bytes, file.filename)
        if extracted:
            text_content = extracted

    requirements = {
        "required_core": [
            "Python backend development (FastAPI/Flask)",
            "APIs & microservices architecture",
            "Real AI/LLM experience & prompt engineering",
            "RAG & vector search (MongoDB/Chroma)",
            "Production ownership & reliability debugging",
            "Basic React frontend capabilities",
            "Agentic / multi-agent systems (planner/executor/reviewer)"
        ],
        "nice_to_have": [
            "Freight / logistics domain knowledge",
            "OCR & document processing (PyMuPDF/pdfplumber)",
            "External business-system integrations",
            "Model selection & cost optimization",
            "Monitoring & eval test suites"
        ]
    }

    job = JobModel(
        job_id=str(uuid.uuid4()),
        title=title,
        description=text_content,
        requirements=requirements
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.post("/candidates")
async def create_candidate(
    name: str = Form(...),
    resume_file: UploadFile = File(None),
    transcript_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    resume_text = ""
    transcript_text = ""

    if resume_file:
        r_bytes = await resume_file.read()
        resume_text = PDFProcessor.extract_text_from_bytes(r_bytes, resume_file.filename)
    if transcript_file:
        t_bytes = await transcript_file.read()
        transcript_text = PDFProcessor.extract_text_from_bytes(t_bytes, transcript_file.filename)

    candidate = CandidateModel(
        candidate_id=str(uuid.uuid4()),
        name=name,
        resume_text=resume_text,
        transcript_text=transcript_text
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate

@router.post("/demo/load")
async def load_demo_candidates(db: Session = Depends(get_db)):
    """
    Seeds the database with Candidate A (Rohan Malhotra) and Candidate B (Ananya Iyer)
    for instant testing and demonstration.
    """
    # Seeding Job
    job = db.query(JobModel).first()
    if not job:
        job = JobModel(
            job_id="job-demo-001",
            title="AI Engineer — Agentic Systems (Freight Operations)",
            description="Target role focusing on multi-agent freight platform, Python microservices, React, RAG, and reliability.",
            requirements={
                "required_core": [
                    "Python backend development", "APIs & microservices", "LLM experience & prompt engineering",
                    "RAG & vector search", "Production ownership", "Basic React", "Multi-agent systems"
                ],
                "nice_to_have": ["Freight logistics domain", "OCR document processing", "External integrations", "Monitoring & evals"]
            }
        )
        db.add(job)

    # Seeding Candidate A
    c_a = db.query(CandidateModel).filter(CandidateModel.name.contains("Rohan")).first()
    if not c_a:
        prof_a = ProfileBuilder.build_profile("Rohan Malhotra", "resume text", "transcript text")
        c_a = CandidateModel(
            candidate_id="cand-demo-001",
            name="Rohan Malhotra",
            resume_text="Production multi-agent freight platform, FastAPI, React, MongoDB, K8s.",
            transcript_text="Claimed sole architect of retry engine; clarified Priya built production code.",
            profile=prof_a.model_dump()
        )
        db.add(c_a)
        # Store evidence
        for item in prof_a.evidence:
            ev = EvidenceModel(
                evidence_id=item.evidence_id,
                candidate_id=c_a.candidate_id,
                source_type=item.source,
                section=item.section,
                quote=item.quote,
                supports=item.supports,
                metadata_info={"candidate": "A"}
            )
            db.merge(ev)

    # Seeding Candidate B
    c_b = db.query(CandidateModel).filter(CandidateModel.name.contains("Ananya")).first()
    if not c_b:
        prof_b = ProfileBuilder.build_profile("Ananya Iyer", "resume text", "transcript text")
        c_b = CandidateModel(
            candidate_id="cand-demo-002",
            name="Ananya Iyer",
            resume_text="Backend & AI Engineer, FastAPI, single-agent RAG, OCR document processing, Docker.",
            transcript_text="No multi-agent production experience; owned prompt regression; built 100-doc eval suite.",
            profile=prof_b.model_dump()
        )
        db.add(c_b)
        # Store evidence
        for item in prof_b.evidence:
            ev = EvidenceModel(
                evidence_id=item.evidence_id,
                candidate_id=c_b.candidate_id,
                source_type=item.source,
                section=item.section,
                quote=item.quote,
                supports=item.supports,
                metadata_info={"candidate": "B"}
            )
            db.merge(ev)

    db.commit()
    return {
        "status": "success",
        "job_id": job.job_id,
        "candidate_a_id": c_a.candidate_id,
        "candidate_b_id": c_b.candidate_id
    }
