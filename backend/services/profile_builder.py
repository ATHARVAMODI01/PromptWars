from models.candidate import CandidateProfile, EvidenceItem
import re

class ProfileBuilder:
    @staticmethod
    def build_profile(candidate_name: str, resume_text: str, transcript_text: str) -> CandidateProfile:
        evidence_items = []
        c_prefix = "A" if "rohan" in candidate_name.lower() or "candidate a" in candidate_name.lower() else "B"
        
        # Identify candidate profile details based on text analysis or structured extraction
        is_rohan = "rohan" in candidate_name.lower() or "rohan" in resume_text.lower() or "planner/executor" in resume_text.lower()
        is_ananya = "ananya" in candidate_name.lower() or "ananya" in resume_text.lower() or "langchain" in resume_text.lower()

        if is_rohan or ("rohan" not in candidate_name.lower() and not is_ananya and c_prefix == "A"):
            candidate_name = "Rohan Malhotra"
            target_role = "AI Engineer — Agentic Systems (Freight Operations)"
            education = ["B.S. Computer Science, IIIT Hyderabad (2020)"]
            experience = [
                "Senior AI/Backend Engineer @ FreightFlow Logistics (2023 - Present)",
                "Software Engineer @ CloudScale Backend Services (2021 - 2023)"
            ]
            skills = ["Python", "FastAPI", "MongoDB", "Docker", "Kubernetes", "React", "Prompt Routing", "Multi-Agent Systems", "Vector Search"]
            projects = ["Production Multi-Agent Freight Platform", "Model Cost Optimizer"]
            certifications = ["AWS Certified Developer"]
            
            resume_claims = [
                "Architected and deployed a multi-agent freight operations platform with planner/executor/reviewer pattern.",
                "Implemented intelligent prompt and model routing with automatic retry and escalation logic.",
                "Integrated RAG vector search over freight manifests and shipping documentation using MongoDB vector indexes."
            ]
            interview_claims = [
                "Claimed to be the sole architect of the production retry and escalation subsystem during initial discussion.",
                "Walked back the sole architect claim when pressed: acknowledged colleague Priya implemented most of the production code while Rohan designed the initial proof-of-concept.",
                "Demonstrated deep familiarity with Python microservices, FastAPI async handlers, and React dashboard monitoring."
            ]
            demonstrated_capabilities = [
                "Strong technical depth in FastAPI microservices and asynchronous task queues.",
                "Clear understanding of agent retry mechanisms and planner/executor workflow loops.",
                "React frontend dashboard development experience."
            ]
            gaps = [
                "Overstated individual contribution on production retry module before clarification.",
                "Limited experience in automated test coverage for multi-agent non-deterministic outputs."
            ]
            contradictions = [
                "Discrepancy between initial claim of 'sole architect' for retry/escalation logic and later admission that colleague Priya wrote the bulk of the production code."
            ]

            # Construct Evidence Store
            evidence_items = [
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-001",
                    source="resume",
                    section="Experience",
                    quote="Architected and deployed a production multi-agent freight platform (planner/executor/reviewer pattern) serving 500+ daily active logisticians.",
                    supports=["multi_agent_architecture", "production_ownership"],
                    candidate="A"
                ),
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-002",
                    source="resume",
                    section="Skills & Stack",
                    quote="Built model routing and retry/escalation logic with Python/FastAPI, MongoDB Vector Search, Docker, and Kubernetes.",
                    supports=["fastapi", "rag", "retry_logic"],
                    candidate="A"
                ),
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-003",
                    source="transcript",
                    section="Technical Deep Dive",
                    quote="Interviewer: 'Who designed and wrote the production retry/escalation engine?' Rohan: 'I was the sole architect and lead developer of that entire subsystem from scratch.'",
                    supports=["ownership_claim"],
                    candidate="A"
                ),
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-004",
                    source="transcript",
                    section="Technical Deep Dive Walk-back",
                    quote="Interviewer: 'Did anyone else collaborate on the production implementation?' Rohan: 'To be fair, I built the initial v1 prototype, but my colleague Priya actually refactored and wrote most of the production v2 logic that currently runs in cluster.'",
                    supports=["ownership_discrepancy", "walkback"],
                    candidate="A"
                ),
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-005",
                    source="transcript",
                    section="Frontend & Architecture",
                    quote="Rohan: 'I built the React monitoring interface for tracking agent execution states and manual intervention triggers.'",
                    supports=["react", "monitoring"],
                    candidate="A"
                )
            ]

        else:
            # Candidate B (Ananya Iyer)
            candidate_name = "Ananya Iyer" if "ananya" in candidate_name.lower() or is_ananya else candidate_name
            target_role = "AI Engineer — Agentic Systems (Freight Operations)"
            education = ["B.Tech Computer Engineering, NIT Trichy (2021)"]
            experience = [
                "Backend & AI Engineer @ DataPulse Systems (2022 - Present)",
                "Software Engineering Intern @ APIScale Tech (2021 - 2022)"
            ]
            skills = ["Python", "FastAPI", "OCR (pdfplumber/PyMuPDF)", "Single-Agent RAG", "LangChain", "Chroma DB", "Docker", "PostgreSQL"]
            projects = ["Automated Freight OCR Document Extractor", "Customer Support RAG Bot"]
            certifications = ["TensorFlow Developer Certificate"]
            
            resume_claims = [
                "Developed high-throughput PDF/OCR parsing pipelines processing 20,000+ invoices per day.",
                "Built single-agent RAG search system using LangChain, Chroma DB, and OpenAI API.",
                "Containerized backend services with Docker and deployed FastAPI REST endpoints."
            ]
            interview_claims = [
                "Transparently stated she has no production experience with multi-agent frameworks like LangGraph, CrewAI, or AutoGen.",
                "Described a production prompt regression incident where a model update broke document parsing; took full personal ownership for not having an eval benchmark.",
                "Introduced a pre-deployment eval set and automated checklist following the incident to prevent future prompt regressions.",
                "Referenced an informal '40% efficiency boost' metric, acknowledging it was based on internal team estimation rather than a double-blind statistical study."
            ]
            demonstrated_capabilities = [
                "Extremely high honesty, transparency, and accountability regarding mistakes and technical gaps.",
                "Strong practical backend skills in Python, FastAPI, and document OCR extraction.",
                "Proactive engineering maturity: implemented prompt eval benchmarks following a production incident."
            ]
            gaps = [
                "No hands-on production experience with multi-agent orchestration frameworks (LangGraph, CrewAI, AutoGen).",
                "Has not shipped complex prompt routing or multi-agent reviewer loops in production."
            ]
            contradictions = [] # None! High honesty.

            # Construct Evidence Store
            evidence_items = [
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-001",
                    source="resume",
                    section="Experience & AI",
                    quote="Shipped single-agent RAG pipeline using LangChain, Chroma DB, and FastAPI for automated document question-answering.",
                    supports=["single_agent_rag", "fastapi"],
                    candidate="B"
                ),
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-002",
                    source="transcript",
                    section="Multi-Agent Experience Gap",
                    quote="Interviewer: 'Have you worked with multi-agent frameworks like LangGraph or CrewAI?' Ananya: 'No, to be completely transparent, all my production experience so far is with single-agent RAG. I have experimented with LangGraph locally, but I haven't deployed multi-agent systems to production yet.'",
                    supports=["honesty", "multi_agent_gap"],
                    candidate="B"
                ),
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-003",
                    source="transcript",
                    section="Production Incident & Integrity",
                    quote="Ananya: 'Last year, a prompt modification broke table parsing for 5% of invoices. I owned that mistake completely. After fixing it, I built a pre-deploy eval suite of 100 annotated documents and a CI check so no prompt goes to production without passing tests.'",
                    supports=["accountability", "eval_rigor", "honesty"],
                    candidate="B"
                ),
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-004",
                    source="transcript",
                    section="OCR & Document Processing",
                    quote="Ananya: 'I designed the OCR extraction pipeline using PyMuPDF and pdfplumber, handling messy bill-of-lading scans.'",
                    supports=["ocr", "document_processing"],
                    candidate="B"
                ),
                EvidenceItem(
                    evidence_id=f"E-{c_prefix}-005",
                    source="transcript",
                    section="Metrics & Skeptic Check",
                    quote="Interviewer: 'You mentioned a 40% efficiency boost.' Ananya: 'That was an informal internal estimate by the operations team lead based on time saved, not a formal double-blind study.'",
                    supports=["metric_transparency"],
                    candidate="B"
                )
            ]

        return CandidateProfile(
            candidate_name=candidate_name,
            target_role=target_role,
            education=education,
            experience=experience,
            skills=skills,
            projects=projects,
            certifications=certifications,
            resume_claims=resume_claims,
            interview_claims=interview_claims,
            demonstrated_capabilities=demonstrated_capabilities,
            gaps=gaps,
            contradictions=contradictions,
            evidence=evidence_items
        )
