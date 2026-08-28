const API_BASE = window.location.origin.includes("127.0.0.1") || window.location.origin.includes("localhost") ? `${window.location.origin}/api` : "/api";

let currentCandidateId = "cand-demo-001";
let loadedReport = null;

// Built-in fallback candidate datasets for static web hosting (Netlify/GitHub Pages)
const MOCK_REPORTS = {
  "cand-demo-001": {
    "candidate_id": "cand-demo-001",
    "candidate_name": "Rohan Malhotra",
    "target_role": "AI Engineer — Agentic Systems (Freight Operations)",
    "profile_summary": {
      "skills": ["Python", "FastAPI", "MongoDB", "Docker", "Kubernetes", "React", "Prompt Routing", "Multi-Agent Systems", "Vector Search"],
      "experience": ["Senior AI/Backend Engineer @ FreightFlow Logistics (2023 - Present)", "Software Engineer @ CloudScale Backend Services (2021 - 2023)"],
      "gaps": ["Overstated individual contribution on production retry module before clarification.", "Limited experience in automated test coverage for multi-agent non-deterministic outputs."],
      "contradictions": ["Discrepancy between initial claim of 'sole architect' for retry/escalation logic and later admission that colleague Priya wrote the bulk of the production code."]
    },
    "initial_evaluations": {
      "technical": {
        "agent": "technical", "recommendation": "HIRE", "confidence": "HIGH", "confidence_score": 0.85,
        "reasoning": "Candidate A meets all mandatory technical requirements for the AI Engineer role. Has shipped multi-agent systems with planner/executor patterns, FastAPI, and RAG in production.",
        "strengths": ["3.5+ years experience in Python/FastAPI microservices and production multi-agent systems.", "Direct experience with planner/executor/reviewer multi-agent freight platform.", "Frontend React capabilities for building agent state monitoring dashboards."],
        "concerns": ["Over-claimed initial ownership of production retry/escalation engine before clarifying team implementation."],
        "evidence": [{"evidence_id": "E-A-001", "claim": "Multi-agent architecture", "reason": "Resume confirms planner/executor deployment."}, {"evidence_id": "E-A-002", "claim": "FastAPI & Vector Search depth", "reason": "FastAPI microservices with MongoDB vector search."}, {"evidence_id": "E-A-005", "claim": "React UI development", "reason": "Built React monitoring interface."}]
      },
      "hr_culture": {
        "agent": "hr_culture", "recommendation": "HIRE", "confidence": "MEDIUM", "confidence_score": 0.72,
        "reasoning": "Candidate A communicates well but showed an ownership-claim exaggeration that required interviewer probing. Overall behavioral fit is acceptable but warrants panel monitoring.",
        "strengths": ["Articulate communicator with strong professional presence.", "Willing to clarify team contributions when directly asked."],
        "concerns": ["Initial claim to be 'sole architect' required probing to uncover colleague Priya's key role in production code."],
        "evidence": [{"evidence_id": "E-A-003", "claim": "Sole architect claim", "reason": "Claimed sole credit initially."}, {"evidence_id": "E-A-004", "claim": "Correction upon questioning", "reason": "Acknowledged Priya wrote production code."}]
      },
      "hiring_manager": {
        "agent": "hiring_manager", "recommendation": "BORDERLINE", "confidence": "MEDIUM", "confidence_score": 0.68,
        "reasoning": "Candidate A brings immediate domain and technical alignment, but the ownership discrepancy raises questions about how independently he can architect complex production systems.",
        "strengths": ["Immediate day-one readiness for shipping multi-agent freight features.", "Strong alignment with Python/FastAPI/React tech stack."],
        "concerns": ["Questions around actual production ownership level vs team contribution (Priya)."],
        "evidence": [{"evidence_id": "E-A-001", "claim": "Freight domain & multi-agent", "reason": "Worked on freight operations."}, {"evidence_id": "E-A-004", "claim": "Team dependency risk", "reason": "Admitted Priya wrote production code."}]
      },
      "skeptic": {
        "agent": "skeptic", "recommendation": "NO HIRE", "confidence": "HIGH", "confidence_score": 0.88,
        "reasoning": "Candidate A exhibits a direct ownership discrepancy between resume/initial statements and actual team execution. Relying on an engineer who exaggerates core system ownership introduces significant technical and cultural risk.",
        "strengths": ["Has worked in environments utilizing multi-agent systems."],
        "concerns": ["CRITICAL DISCREPANCY: Initially claimed to be 'sole architect' of production retry engine, then confessed Priya refactored and wrote most production code.", "Resume inflates individual contribution, taking credit for team engineering efforts."],
        "evidence": [{"evidence_id": "E-A-003", "claim": "Sole architect claim", "reason": "Claimed sole developer status."}, {"evidence_id": "E-A-004", "claim": "Discrepancy admission", "reason": "Walked back claim under questioning."}]
      }
    },
    "debate_summary": {
      "total_rounds": 4, "messages_count": 6,
      "messages": [
        {"message_id": "D-A-001", "round_number": 1, "agent_type": "skeptic", "target_agent": "technical", "stance": "DISAGREE", "message": "Technical Agent recommends HIRE based on production multi-agent experience, but ignores evidence E-A-004 where Rohan admits colleague Priya wrote most of the production code for the retry/escalation engine.", "evidence_ids": ["E-A-003", "E-A-004"], "changes_position": false},
        {"message_id": "D-A-002", "round_number": 1, "agent_type": "hiring_manager", "target_agent": "hr_culture", "stance": "CLARIFY", "message": "HR Agent rated behavioral fit as HIRE, but did HR assess whether this ownership walk-back reflects a deeper pattern of resume inflation?", "evidence_ids": ["E-A-003", "E-A-004"], "changes_position": false},
        {"message_id": "D-A-003", "round_number": 2, "agent_type": "technical", "target_agent": "skeptic", "stance": "PARTIAL", "message": "Skeptic raises a valid point regarding E-A-004. While Rohan built the v1 prototype, relying on Priya for the production refactor means his independent production architecture capability was over-estimated.", "evidence_ids": ["E-A-004"], "changes_position": true, "new_recommendation": "BORDERLINE"},
        {"message_id": "D-A-004", "round_number": 2, "agent_type": "hr_culture", "target_agent": "hiring_manager", "stance": "AGREE", "message": "We agree with Hiring Manager that exaggeration is a concern. However, Rohan did clarify honestly when directly asked, so we maintain HIRE but recommend an explicit reference check on team collaboration.", "evidence_ids": ["E-A-004"], "changes_position": false},
        {"message_id": "D-A-005", "round_number": 3, "agent_type": "hiring_manager", "target_agent": "technical", "stance": "AGREE", "message": "Now that Technical Agent has downgraded to BORDERLINE, panel consensus shifts: immediate technical readiness is weakened by the ownership discrepancy.", "evidence_ids": ["E-A-004"], "changes_position": true, "new_recommendation": "BORDERLINE"},
        {"message_id": "D-A-006", "round_number": 4, "agent_type": "skeptic", "target_agent": "panel", "stance": "CLARIFY", "message": "Final Panel Debate Summary: Skeptic and Technical agree Rohan's independent architectural ownership is unproven due to E-A-004. High risk of resume claim inflation remains unresolved.", "evidence_ids": ["E-A-003", "E-A-004"], "changes_position": false}
      ]
    },
    "opinion_changes": [
      {"change_id": "c1", "agent_type": "technical", "initial_recommendation": "HIRE", "final_recommendation": "BORDERLINE", "initial_confidence": "HIGH", "final_confidence": "MEDIUM", "changed": true, "reason": "Skeptic Agent highlighted evidence E-A-004 showing Rohan walked back sole ownership of the production retry engine to acknowledge colleague Priya's implementation.", "trigger_message_id": "D-A-001"},
      {"change_id": "c2", "agent_type": "hr_culture", "initial_recommendation": "HIRE", "final_recommendation": "HIRE", "initial_confidence": "MEDIUM", "final_confidence": "MEDIUM", "changed": false, "reason": "Debate confirmed ownership exaggeration risk, but HR maintained HIRE stance due to candidate's transparency when directly probed.", "trigger_message_id": null},
      {"change_id": "c3", "agent_type": "hiring_manager", "initial_recommendation": "BORDERLINE", "final_recommendation": "BORDERLINE", "initial_confidence": "MEDIUM", "final_confidence": "MEDIUM", "changed": false, "reason": "Maintained BORDERLINE rating as panel debate reinforced concerns around independent production readiness.", "trigger_message_id": null},
      {"change_id": "c4", "agent_type": "skeptic", "initial_recommendation": "NO HIRE", "final_recommendation": "NO HIRE", "initial_confidence": "HIGH", "final_confidence": "HIGH", "changed": false, "reason": "Debate validated initial concern regarding resume claim inflation; maintained firm NO HIRE position.", "trigger_message_id": null}
    ],
    "final_decision": {
      "candidate": "Rohan Malhotra",
      "recommendation": "BORDERLINE / FURTHER INTERVIEW",
      "confidence": "MEDIUM",
      "strengths": ["Strong technical knowledge of FastAPI, Python microservices, and React frontend dashboards.", "Direct experience building planner/executor/reviewer multi-agent freight workflows.", "Familiarity with vector search, prompt routing, and containerized deployments."],
      "concerns": ["Discrepancy between resume/initial claims ('sole architect' of retry engine) and actual execution (Priya wrote production code).", "Skeptic and revised Technical evaluation highlight unproven independent production ownership.", "Requires additional verification regarding solo architectural capabilities."],
      "critical_evidence": ["E-A-001", "E-A-003", "E-A-004", "E-A-005"],
      "agent_consensus": ["Panel agrees Rohan possesses solid backend and multi-agent conceptual fluency."],
      "unresolved_disagreements": ["Skeptic maintains NO HIRE due to ownership claim exaggeration (E-A-004), whereas Hiring Manager and HR suggest a targeted follow-up interview on team contributions."],
      "final_reasoning": "Candidate A possesses strong technical alignment for the AI Engineer role. However, the panel debate revealed a significant ownership discrepancy regarding his production retry system (E-A-004), prompting Technical Agent to revise recommendation from HIRE to BORDERLINE. We recommend a targeted follow-up technical interview focusing specifically on independent system design and reference checks with prior teammates before extending an offer.",
      "reasoning_steps": [
        {"step": 1, "title": "Identify Mandatory Role Requirements", "content": "Core required skills: Python backend, FastAPI microservices, LLM systems, prompt engineering, multi-agent systems, RAG, production reliability, React UI."},
        {"step": 2, "title": "Identify Supporting Evidence", "content": "Evaluated candidate resume claims and interview statements against evidence store registry."},
        {"step": 3, "title": "Identify Evidence Against Requirements", "content": "Checked for unverified claims, ownership discrepancies, and technical gaps."},
        {"step": 4, "title": "Identify Critical Gaps", "content": "Categorized gaps into core mandatory requirements vs nice-to-have domain extensions."},
        {"step": 5, "title": "Examine Agent Disagreements", "content": "Analyzed points of contention between Technical, HR/Culture, Hiring Manager, and Skeptic agents."},
        {"step": 6, "title": "Examine Opinion Changes", "content": "Reviewed Round 1-4 debate messages to identify where evidence altered initial panel recommendations."},
        {"step": 7, "title": "Assess Trainability of Gaps", "content": "Evaluated candidate learning trajectory, engineering maturity, and foundational backend knowledge."},
        {"step": 8, "title": "Assess Production Risk", "content": "Weighted candidate credibility, risk of exaggeration, and potential operational blast radius."},
        {"step": 9, "title": "Determine Confidence Score", "content": "Derived confidence from evidence completeness, quote verification, and cross-agent agreement consistency."},
        {"step": 10, "title": "Produce Final Recommendation", "content": "Synthesized multi-agent debate outcome into final actionable hiring recommendation."}
      ]
    },
    "evidence_registry": [
      {"evidence_id": "E-A-001", "source": "resume", "section": "Experience", "quote": "Architected and deployed a production multi-agent freight platform (planner/executor/reviewer pattern) serving 500+ daily active logisticians.", "supports": ["multi_agent_architecture", "production_ownership"], "candidate": "A"},
      {"evidence_id": "E-A-002", "source": "resume", "section": "Skills & Stack", "quote": "Built model routing and retry/escalation logic with Python/FastAPI, MongoDB Vector Search, Docker, and Kubernetes.", "supports": ["fastapi", "rag", "retry_logic"], "candidate": "A"},
      {"evidence_id": "E-A-003", "source": "transcript", "section": "Technical Deep Dive", "quote": "Interviewer: 'Who designed and wrote the production retry/escalation engine?' Rohan: 'I was the sole architect and lead developer of that entire subsystem from scratch.'", "supports": ["ownership_claim"], "candidate": "A"},
      {"evidence_id": "E-A-004", "source": "transcript", "section": "Technical Deep Dive Walk-back", "quote": "Interviewer: 'Did anyone else collaborate on the production implementation?' Rohan: 'To be fair, I built the initial v1 prototype, but my colleague Priya actually refactored and wrote most of the production v2 logic that currently runs in cluster.'", "supports": ["ownership_discrepancy", "walkback"], "candidate": "A"},
      {"evidence_id": "E-A-005", "source": "transcript", "section": "Frontend & Architecture", "quote": "Rohan: 'I built the React monitoring interface for tracking agent execution states and manual intervention triggers.'", "supports": ["react", "monitoring"], "candidate": "A"}
    ]
  },
  "cand-demo-002": {
    "candidate_id": "cand-demo-002",
    "candidate_name": "Ananya Iyer",
    "target_role": "AI Engineer — Agentic Systems (Freight Operations)",
    "profile_summary": {
      "skills": ["Python", "FastAPI", "OCR (pdfplumber/PyMuPDF)", "Single-Agent RAG", "LangChain", "Chroma DB", "Docker", "PostgreSQL"],
      "experience": ["Backend & AI Engineer @ DataPulse Systems (2022 - Present)", "Software Engineering Intern @ APIScale Tech (2021 - 2022)"],
      "gaps": ["No hands-on production experience with multi-agent orchestration frameworks (LangGraph, CrewAI, AutoGen).", "Has not shipped complex prompt routing or multi-agent reviewer loops in production."],
      "contradictions": []
    },
    "initial_evaluations": {
      "technical": {
        "agent": "technical", "recommendation": "BORDERLINE", "confidence": "MEDIUM", "confidence_score": 0.62,
        "reasoning": "Candidate B has strong backend, FastAPI, and single-agent RAG foundations, but lacks production multi-agent system experience—a core requirement for this specific role.",
        "strengths": ["Solid Python backend depth with high-throughput FastAPI microservices and OCR parsing.", "Shipped single-agent RAG pipelines using LangChain, Chroma DB, and vector search.", "Implemented prompt evaluation benchmarks (100 annotated docs) after a production bug."],
        "concerns": ["NO production experience with multi-agent orchestration frameworks (LangGraph, CrewAI, AutoGen).", "Has not shipped planner/executor/reviewer multi-agent loops in a live environment."],
        "evidence": [{"evidence_id": "E-B-001", "claim": "Single-Agent RAG & FastAPI", "reason": "Shipped FastAPI single-agent RAG."}, {"evidence_id": "E-B-002", "claim": "Multi-Agent Production Gap", "reason": "No production experience with LangGraph."}, {"evidence_id": "E-B-004", "claim": "Document OCR depth", "reason": "Designed PDF invoice parsing pipelines."}]
      },
      "hr_culture": {
        "agent": "hr_culture", "recommendation": "STRONG HIRE", "confidence": "HIGH", "confidence_score": 0.92,
        "reasoning": "Candidate B demonstrates outstanding integrity, extreme accountability, and high engineering maturity. Admitting gaps and turning mistakes into automated prevention shows exemplary culture fit.",
        "strengths": ["Exceptional honesty, transparency, and self-awareness regarding technical boundaries.", "High accountability: owned production prompt regression mistake and built permanent CI eval set.", "Transparent about metric limitations (informal estimate vs formal study)."],
        "concerns": [],
        "evidence": [{"evidence_id": "E-B-002", "claim": "Transparent gap callout", "reason": "Named lack of production LangGraph."}, {"evidence_id": "E-B-003", "claim": "Accountability & post-incident rigor", "reason": "Took full ownership of prompt bug and built eval suite."}, {"evidence_id": "E-B-005", "claim": "Metric honesty", "reason": "Clarified informal estimate."}]
      },
      "hiring_manager": {
        "agent": "hiring_manager", "recommendation": "HIRE", "confidence": "HIGH", "confidence_score": 0.82,
        "reasoning": "Candidate B's technical gap in multi-agent frameworks is highly trainable given her strong Python backend foundation, while her honesty and quality rigor make her a low-risk, high-upside hire.",
        "strengths": ["Strong backend core and Python/FastAPI fluency makes multi-agent gap highly trainable (2-3 week ramp-up).", "High reliability and systematic engineering approach (built eval suites).", "Proven shipping track record in freight OCR document processing."],
        "concerns": ["Requires short ramp-up period to master LangGraph multi-agent orchestrations."],
        "evidence": [{"evidence_id": "E-B-001", "claim": "Solid Python/RAG foundation", "reason": "Demonstrated RAG pipeline experience."}, {"evidence_id": "E-B-003", "claim": "Trainability & quality focus", "reason": "Implemented eval sets and CI checks."}]
      },
      "skeptic": {
        "agent": "skeptic", "recommendation": "NO HIRE", "confidence": "MEDIUM", "confidence_score": 0.65,
        "reasoning": "Candidate B lacks the essential core experience in production multi-agent systems required for this position. While honest, hiring someone without shipped agentic experience for an Agentic AI role presents unacceptably high execution risk.",
        "strengths": ["Transparent about metric limitations and mistake accountability."],
        "concerns": ["UNFULFILLED REQUIREMENT: Has zero production multi-agent system experience (LangGraph/CrewAI/AutoGen).", "Target role specifically requires improving planner/executor/reviewer agentic systems.", "Previous production incident caused 5% table parsing failures before testing was retrofitted."],
        "evidence": [{"evidence_id": "E-B-002", "claim": "Zero production multi-agent experience", "reason": "Confirmed all shipped work is single-agent RAG."}, {"evidence_id": "E-B-003", "claim": "Past production incident", "reason": "Prompt modification broke 5% of invoice table extractions."}]
      }
    },
    "debate_summary": {
      "total_rounds": 4, "messages_count": 6,
      "messages": [
        {"message_id": "D-B-001", "round_number": 1, "agent_type": "hiring_manager", "target_agent": "skeptic", "stance": "DISAGREE", "message": "Skeptic recommends NO HIRE over multi-agent framework gap (E-B-002), but ignores that Ananya has shipped complex single-agent RAG (E-B-001) and has a proven track record of creating eval suites (E-B-003). The gap is highly trainable in 2-3 weeks.", "evidence_ids": ["E-B-001", "E-B-002", "E-B-003"], "changes_position": false},
        {"message_id": "D-B-002", "round_number": 1, "agent_type": "hr_culture", "target_agent": "technical", "stance": "CLARIFY", "message": "Technical Agent rated Ananya BORDERLINE. Did Technical account for her exceptional post-incident engineering rigor (100-doc test suite)? That shows rapid learning capability.", "evidence_ids": ["E-B-003"], "changes_position": false},
        {"message_id": "D-B-003", "round_number": 2, "agent_type": "technical", "target_agent": "hiring_manager", "stance": "AGREE", "message": "Hiring Manager and HR make compelling arguments. Ananya's mastery of FastAPI, Python, single-agent RAG, and automated testing (E-B-003) means transitioning to LangGraph is low-risk. Upgrading recommendation to HIRE.", "evidence_ids": ["E-B-001", "E-B-003"], "changes_position": true, "new_recommendation": "HIRE"},
        {"message_id": "D-B-004", "round_number": 2, "agent_type": "skeptic", "target_agent": "hiring_manager", "stance": "PARTIAL", "message": "While Ananya's honesty (E-B-002, E-B-005) and eval suite (E-B-003) are commendable, hiring a candidate without shipped multi-agent systems requires strong senior onboarding support.", "evidence_ids": ["E-B-002", "E-B-003"], "changes_position": true, "new_recommendation": "BORDERLINE"},
        {"message_id": "D-B-005", "round_number": 3, "agent_type": "hiring_manager", "target_agent": "technical", "stance": "AGREE", "message": "With Technical Agent moving to HIRE and Skeptic easing to BORDERLINE, panel consensus coalesces around HIRE with a targeted 30-day onboarding module on LangGraph.", "evidence_ids": ["E-B-002"], "changes_position": false},
        {"message_id": "D-B-006", "round_number": 4, "agent_type": "hr_culture", "target_agent": "panel", "stance": "AGREE", "message": "Final Panel Debate Summary: High integrity (E-B-002, E-B-003, E-B-005) and solid Python/RAG foundations outweigh the trainable multi-agent framework gap. Panel recommendation shifts strongly positive.", "evidence_ids": ["E-B-001", "E-B-002", "E-B-003"], "changes_position": false}
      ]
    },
    "opinion_changes": [
      {"change_id": "c1", "agent_type": "technical", "initial_recommendation": "BORDERLINE", "final_recommendation": "HIRE", "initial_confidence": "MEDIUM", "final_confidence": "HIGH", "changed": true, "reason": "Hiring Manager and HR highlighted evidence E-B-003 demonstrating exceptional eval suite rigor, proving her single-agent RAG skills will easily transfer to multi-agent frameworks.", "trigger_message_id": "D-B-001"},
      {"change_id": "c2", "agent_type": "skeptic", "initial_recommendation": "NO HIRE", "final_recommendation": "BORDERLINE", "initial_confidence": "MEDIUM", "final_confidence": "MEDIUM", "changed": true, "reason": "Re-evaluated candidate's outstanding honesty (E-B-002, E-B-005) and post-incident engineering fixes; conceded risk is manageable with structured onboarding.", "trigger_message_id": "D-B-001"},
      {"change_id": "c3", "agent_type": "hr_culture", "initial_recommendation": "STRONG HIRE", "final_recommendation": "STRONG HIRE", "initial_confidence": "HIGH", "final_confidence": "HIGH", "changed": false, "reason": "Maintained STRONG HIRE stance throughout debate due to unmatched candidate integrity and accountability.", "trigger_message_id": null},
      {"change_id": "c4", "agent_type": "hiring_manager", "initial_recommendation": "HIRE", "final_recommendation": "HIRE", "initial_confidence": "HIGH", "final_confidence": "HIGH", "changed": false, "reason": "Confirmed HIRE recommendation as debate established technical gap is minor and trainable.", "trigger_message_id": null}
    ],
    "final_decision": {
      "candidate": "Ananya Iyer",
      "recommendation": "HIRE",
      "confidence": "HIGH",
      "strengths": ["Exemplary honesty, transparency, and personal accountability.", "Solid Python backend, FastAPI, and single-agent RAG foundations.", "High engineering maturity: created 100-doc pre-deploy eval suite following a production prompt bug.", "Demonstrated OCR extraction pipeline experience with PyMuPDF and pdfplumber."],
      "concerns": ["No production experience with multi-agent orchestration frameworks (LangGraph/CrewAI/AutoGen).", "Requires a 2-3 week structured onboarding focus to master multi-agent planner/reviewer patterns."],
      "critical_evidence": ["E-B-001", "E-B-002", "E-B-003", "E-B-005"],
      "agent_consensus": ["HR/Culture (STRONG HIRE), Hiring Manager (HIRE), and Technical (revised from BORDERLINE to HIRE) agree Candidate B is an outstanding culture fit with high trainability.", "Debate successfully resolved Skeptic concerns, lowering risk via candidate's proven testing rigor."],
      "unresolved_disagreements": ["Skeptic upgraded from NO HIRE to BORDERLINE, recommending assigned senior mentorship during the initial 30 days."],
      "final_reasoning": "Candidate B is recommended for HIRE. While she lacks production multi-agent framework experience (E-B-002), her exceptional integrity (E-B-005), strong FastAPI backend foundation (E-B-001), and proactive commitment to testing and eval suites (E-B-003) demonstrate that this gap is highly trainable. During panel debate, Technical Agent upgraded her rating to HIRE and Skeptic conceded risk is low with standard onboarding.",
      "reasoning_steps": [
        {"step": 1, "title": "Identify Mandatory Role Requirements", "content": "Core required skills: Python backend, FastAPI microservices, LLM systems, prompt engineering, multi-agent systems, RAG, production reliability, React UI."},
        {"step": 2, "title": "Identify Supporting Evidence", "content": "Evaluated candidate resume claims and interview statements against evidence store registry."},
        {"step": 3, "title": "Identify Evidence Against Requirements", "content": "Checked for unverified claims, ownership discrepancies, and technical gaps."},
        {"step": 4, "title": "Identify Critical Gaps", "content": "Categorized gaps into core mandatory requirements vs nice-to-have domain extensions."},
        {"step": 5, "title": "Examine Agent Disagreements", "content": "Analyzed points of contention between Technical, HR/Culture, Hiring Manager, and Skeptic agents."},
        {"step": 6, "title": "Examine Opinion Changes", "content": "Reviewed Round 1-4 debate messages to identify where evidence altered initial panel recommendations."},
        {"step": 7, "title": "Assess Trainability of Gaps", "content": "Evaluated candidate learning trajectory, engineering maturity, and foundational backend knowledge."},
        {"step": 8, "title": "Assess Production Risk", "content": "Weighted candidate credibility, risk of exaggeration, and potential operational blast radius."},
        {"step": 9, "title": "Determine Confidence Score", "content": "Derived confidence from evidence completeness, quote verification, and cross-agent agreement consistency."},
        {"step": 10, "title": "Produce Final Recommendation", "content": "Synthesized multi-agent debate outcome into final actionable hiring recommendation."}
      ]
    },
    "evidence_registry": [
      {"evidence_id": "E-B-001", "source": "resume", "section": "Experience & AI", "quote": "Shipped single-agent RAG pipeline using LangChain, Chroma DB, and FastAPI for automated document question-answering.", "supports": ["single_agent_rag", "fastapi"], "candidate": "B"},
      {"evidence_id": "E-B-002", "source": "transcript", "section": "Multi-Agent Experience Gap", "quote": "Interviewer: 'Have you worked with multi-agent frameworks like LangGraph or CrewAI?' Ananya: 'No, to be completely transparent, all my production experience so far is with single-agent RAG. I have experimented with LangGraph locally, but I haven't deployed multi-agent systems to production yet.'", "supports": ["honesty", "multi_agent_gap"], "candidate": "B"},
      {"evidence_id": "E-B-003", "source": "transcript", "section": "Production Incident & Integrity", "quote": "Ananya: 'Last year, a prompt modification broke table parsing for 5% of invoices. I owned that mistake completely. After fixing it, I built a pre-deploy eval suite of 100 annotated documents and a CI check so no prompt goes to production without passing tests.'", "supports": ["accountability", "eval_rigor", "honesty"], "candidate": "B"},
      {"evidence_id": "E-B-004", "source": "transcript", "section": "OCR & Document Processing", "quote": "Ananya: 'I designed the OCR extraction pipeline using PyMuPDF and pdfplumber, handling messy bill-of-lading scans.'", "supports": ["ocr", "document_processing"], "candidate": "B"},
      {"evidence_id": "E-B-005", "source": "transcript", "section": "Metrics & Skeptic Check", "quote": "Interviewer: 'You mentioned a 40% efficiency boost.' Ananya: 'That was an informal internal estimate by the operations team lead based on time saved, not a formal double-blind study.'", "supports": ["metric_transparency"], "candidate": "B"}
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadCandidateData(currentCandidateId);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEvidenceModal();
    }
  });
});

function announceToScreenReader(message) {
  const announcer = document.getElementById("live-announcer");
  if (announcer) {
    announcer.innerText = message;
  }
}

function switchTab(tabId) {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  const targetScreen = document.getElementById(tabId);
  if (targetScreen) {
    targetScreen.classList.add("active");
    targetScreen.focus();
  }

  const activeBtn = document.querySelector(`.nav-btn[aria-controls="${tabId}"]`) || document.querySelector(`.nav-btn[onclick*="${tabId}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-selected", "true");
  }

  announceToScreenReader(`Switched to ${tabId.replace('screen-', '')} view`);

  if (tabId === 'screen-compare') {
    renderComparisonScreen();
  }
}

function onCandidateSelectChange() {
  const sel = document.getElementById("candidate-selector");
  currentCandidateId = sel.value;
  announceToScreenReader(`Selected ${sel.options[sel.selectedIndex].text}`);
  loadCandidateData(currentCandidateId);
}

async function loadDemoDataAndEvaluate() {
  try {
    switchTab('screen-pipeline');
    announceToScreenReader("Starting multi-agent candidate pipeline evaluation");
    
    try {
      const res = await fetch(`${API_BASE}/demo/load`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        await fetch(`${API_BASE}/candidates/${data.candidate_a_id}/evaluate`, { method: "POST" });
        await fetch(`${API_BASE}/candidates/${data.candidate_a_id}/debate`, { method: "POST" });
        await fetch(`${API_BASE}/candidates/${data.candidate_a_id}/decision`, { method: "POST" });

        await fetch(`${API_BASE}/candidates/${data.candidate_b_id}/evaluate`, { method: "POST" });
        await fetch(`${API_BASE}/candidates/${data.candidate_b_id}/debate`, { method: "POST" });
        await fetch(`${API_BASE}/candidates/${data.candidate_b_id}/decision`, { method: "POST" });

        currentCandidateId = data.candidate_a_id;
        document.getElementById("candidate-selector").value = currentCandidateId;
      } else {
        useFallbackData();
      }
    } catch (e) {
      useFallbackData();
    }

    await loadCandidateData(currentCandidateId);
    announceToScreenReader("Multi-agent candidate evaluation complete");
    switchTab('screen-overview');
  } catch (err) {
    console.error("Pipeline load error:", err);
    useFallbackData();
    switchTab('screen-overview');
  }
}

function useFallbackData() {
  loadedReport = MOCK_REPORTS[currentCandidateId] || MOCK_REPORTS["cand-demo-001"];
  renderCandidateOverview(loadedReport);
  renderIndependentAgents(loadedReport.initial_evaluations);
  renderDebateRoom(loadedReport.debate_summary.messages, loadedReport.opinion_changes);
  renderOpinionRevisions(loadedReport.opinion_changes);
  renderFinalDecision(loadedReport.final_decision);
}

async function loadCandidateData(candidateId) {
  try {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/report`);
    if (!res.ok) {
      useFallbackData();
      return;
    }
    loadedReport = await res.json();

    renderCandidateOverview(loadedReport);
    renderIndependentAgents(loadedReport.initial_evaluations);
    renderDebateRoom(loadedReport.debate_summary.messages, loadedReport.opinion_changes);
    renderOpinionRevisions(loadedReport.opinion_changes);
    renderFinalDecision(loadedReport.final_decision);
  } catch (err) {
    useFallbackData();
  }
}

function renderCandidateOverview(report) {
  const header = document.getElementById("candidate-header");
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2 style="font-size: 1.75rem; font-weight: 700; color: #ffffff;">${report.candidate_name}</h2>
        <p style="color: #cbd5e1; font-weight: 500;">${report.target_role}</p>
      </div>
      <span class="badge ${getBadgeClass(report.final_decision.recommendation)}">
        ${report.final_decision.recommendation} (${report.final_decision.confidence} CONFIDENCE)
      </span>
    </div>
  `;

  const capContainer = document.getElementById("cand-capabilities");
  capContainer.innerHTML = (report.profile_summary.skills || []).map(s => 
    `<span style="display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid var(--border-color); color: #ffffff; padding: 0.3rem 0.75rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; margin: 0.2rem;">${s}</span>`
  ).join("");

  const gapsContainer = document.getElementById("cand-gaps");
  gapsContainer.innerHTML = (report.profile_summary.gaps || []).map(g => 
    `<div style="color: #fca5a5; font-size: 0.95rem; margin-bottom: 0.5rem; font-weight: 500;">• ${g}</div>`
  ).join("");

  const evContainer = document.getElementById("cand-evidence-list");
  evContainer.innerHTML = (report.evidence_registry || []).map(e => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--border-color);">
      <button class="evidence-chip" tabindex="0" aria-label="View evidence ${e.evidence_id} quote" onclick="openEvidenceModal('${e.evidence_id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openEvidenceModal('${e.evidence_id}')">${e.evidence_id}</button>
      <span style="font-size: 0.85rem; color: #cbd5e1;">${e.source} - ${e.section}</span>
    </div>
  `).join("");
}

function renderIndependentAgents(initialEvals) {
  const container = document.getElementById("initial-agents-container");
  container.innerHTML = "";

  const agentOrder = ["technical", "hr_culture", "hiring_manager", "skeptic"];
  const agentTitles = {
    technical: { title: "Technical Agent", badge: "badge-tech", class: "tech" },
    hr_culture: { title: "HR / Culture Agent", badge: "badge-hr", class: "hr" },
    hiring_manager: { title: "Hiring Manager Agent", badge: "badge-hm", class: "hm" },
    skeptic: { title: "Skeptic Agent", badge: "badge-skeptic", class: "skeptic" }
  };

  agentOrder.forEach(key => {
    const ev = initialEvals[key];
    if (!ev) return;
    const meta = agentTitles[key];

    const card = document.createElement("article");
    card.className = `glass-panel agent-card ${meta.class}`;
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span class="badge ${meta.badge}">${meta.title}</span>
          <span class="badge ${getBadgeClass(ev.recommendation)}">${ev.recommendation}</span>
        </div>
        <p style="font-size: 0.95rem; color: #ffffff; margin-bottom: 1rem; line-height: 1.6;">${ev.reasoning}</p>
        
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: #cbd5e1; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Strengths</h4>
        <ul style="font-size: 0.875rem; color: #ffffff; margin-left: 1.2rem; margin-bottom: 1rem;">
          ${(ev.strengths || []).map(s => `<li>${s}</li>`).join("")}
        </ul>

        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: #cbd5e1; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Concerns</h4>
        <ul style="font-size: 0.875rem; color: #fca5a5; margin-left: 1.2rem; margin-bottom: 1rem;">
          ${(ev.concerns || []).map(c => `<li>${c}</li>`).join("")}
        </ul>
      </div>

      <div>
        <h4 style="font-size: 0.8rem; text-transform: uppercase; color: #cbd5e1; margin-bottom: 0.5rem;">Cites Evidence</h4>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${(ev.evidence || []).map(e => `<button class="evidence-chip" tabindex="0" aria-label="Evidence quote ${e.evidence_id}" onclick="openEvidenceModal('${e.evidence_id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openEvidenceModal('${e.evidence_id}')">${e.evidence_id}</button>`).join("")}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderDebateRoom(messages, opinionChanges) {
  const container = document.getElementById("debate-timeline-container");
  container.innerHTML = "";

  messages.forEach(msg => {
    const changeTrigger = opinionChanges.find(oc => oc.trigger_message_id === msg.message_id || (oc.changed && oc.agent_type === msg.agent_type && msg.changes_position));

    const card = document.createElement("article");
    card.className = "glass-panel debate-turn-card";
    card.setAttribute("tabindex", "0");
    
    let stanceClass = "stance-agree";
    if (msg.stance === "DISAGREE") stanceClass = "stance-disagree";
    if (msg.stance === "PARTIAL") stanceClass = "stance-partial";
    if (msg.stance === "CLARIFY") stanceClass = "stance-clarify";

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.75rem; color: #cbd5e1; font-weight: 600;">ROUND ${msg.round_number}</span>
          <span class="badge ${getAgentBadgeClass(msg.agent_type)}">${msg.agent_type.toUpperCase()}</span>
          ${msg.target_agent ? `<span style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">➔ ${msg.target_agent.toUpperCase()}</span>` : ''}
        </div>
        <span class="badge ${stanceClass}">${msg.stance}</span>
      </div>

      <p style="font-size: 1rem; color: #ffffff; margin-bottom: 0.75rem; line-height: 1.6;">${msg.message}</p>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <span style="font-size: 0.75rem; color: #cbd5e1; font-weight: 600;">Evidence Cited:</span>
        ${(msg.evidence_ids || []).map(id => `<button class="evidence-chip" tabindex="0" aria-label="Evidence quote ${id}" onclick="openEvidenceModal('${id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openEvidenceModal('${id}')">${id}</button>`).join("")}
      </div>
    `;

    container.appendChild(card);

    if (changeTrigger && msg.changes_position) {
      const changeCard = document.createElement("aside");
      changeCard.className = "opinion-changed-card";
      changeCard.setAttribute("tabindex", "0");
      changeCard.innerHTML = `
        <span style="font-size: 1.5rem;" aria-hidden="true">⚡</span>
        <div>
          <strong style="color: #fde047; font-size: 0.95rem;">OPINION REVISED: ${msg.agent_type.toUpperCase()} AGENT</strong>
          <p style="font-size: 0.875rem; color: #fef08a;">Updated position to <strong>${msg.new_recommendation || 'BORDERLINE'}</strong> based on debate evidence.</p>
        </div>
      `;
      container.appendChild(changeCard);
    }
  });
}

function renderOpinionRevisions(opinionChanges) {
  const tbody = document.getElementById("opinion-revisions-tbody");
  tbody.innerHTML = opinionChanges.map(oc => `
    <tr>
      <td><span class="badge ${getAgentBadgeClass(oc.agent_type)}">${oc.agent_type.toUpperCase()}</span></td>
      <td><span class="badge ${getBadgeClass(oc.initial_recommendation)}">${oc.initial_recommendation}</span></td>
      <td><span class="badge ${getBadgeClass(oc.final_recommendation)}">${oc.final_recommendation}</span></td>
      <td>
        ${oc.changed ? 
          `<span style="color: #fde047; font-weight: 800;">YES ⚡</span>` : 
          `<span style="color: #cbd5e1;">NO</span>`}
      </td>
      <td style="font-size: 0.9rem; color: #ffffff;">${oc.reason}</td>
    </tr>
  `).join("");
}

function renderFinalDecision(decision) {
  const header = document.getElementById("final-decision-header");
  header.innerHTML = `
    <div class="glass-panel" style="padding: 2rem; text-align: center; border-color: var(--primary);">
      <span style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: #cbd5e1; font-weight: 700;">FINAL PANEL RECOMMENDATION</span>
      <h2 style="font-size: 2.25rem; font-weight: 800; margin: 0.5rem 0;">
        <span class="badge ${getBadgeClass(decision.recommendation)}" style="font-size: 1.5rem; padding: 0.5rem 1.5rem;">${decision.recommendation}</span>
      </h2>
      <p style="color: #cbd5e1; font-size: 1rem; font-weight: 600;">Confidence Level: <strong style="color: #ffffff;">${decision.confidence}</strong></p>
      <p style="max-width: 800px; margin: 1rem auto 0 auto; font-size: 1.05rem; color: #ffffff; text-align: left; line-height: 1.7;">
        ${decision.final_reasoning}
      </p>
    </div>
  `;

  document.getElementById("final-strengths").innerHTML = (decision.strengths || []).map(s => `<div style="margin-bottom: 0.5rem; color: #ffffff;">✓ ${s}</div>`).join("");
  document.getElementById("final-concerns").innerHTML = (decision.concerns || []).map(c => `<div style="margin-bottom: 0.5rem; color: #fca5a5;">• ${c}</div>`).join("");

  const stepsContainer = document.getElementById("reasoning-steps-container");
  stepsContainer.innerHTML = (decision.reasoning_steps || []).map(step => `
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; padding: 0.85rem; background: #0f172a; border-radius: 8px; border: 1px solid var(--border-color);">
      <span style="font-family: 'JetBrains Mono'; font-weight: 800; color: #818cf8;">STEP ${step.step}</span>
      <div>
        <strong style="font-size: 0.95rem; color: #ffffff;">${step.title}</strong>
        <p style="font-size: 0.875rem; color: #cbd5e1; margin-top: 0.2rem;">${step.content}</p>
      </div>
    </div>
  `).join("");
}

async function renderComparisonScreen() {
  try {
    const res = await fetch(`${API_BASE}/reports/comparison`);
    if (res.ok) {
      const comp = await res.json();
      renderComparisonUI(comp);
      return;
    }
  } catch (err) {
    // Fallback
  }

  // Static Netlify Fallback Comparison
  const compFallback = {
    "panel_summary": "Candidate B (Ananya Iyer) is recommended over Candidate A (Rohan Malhotra) due to her exceptional integrity, quality rigor, and low-risk trainability. Candidate A presents ownership ambiguity that requires further probing before hiring.",
    "candidates": [
      {
        "name": "Rohan Malhotra",
        "recommendation": "BORDERLINE / FURTHER INTERVIEW",
        "confidence": "MEDIUM",
        "technical_depth": "High (Multi-Agent, FastAPI, React)",
        "integrity_accountability": "Medium (Discrepancy on Retry Subsystem)",
        "production_readiness": "Immediate, but requires ownership verification",
        "skeptic_finding": "Walked back 'sole architect' claim (E-A-004)"
      },
      {
        "name": "Ananya Iyer",
        "recommendation": "HIRE",
        "confidence": "HIGH",
        "technical_depth": "Medium-High (Single-Agent RAG, FastAPI, OCR)",
        "integrity_accountability": "High (Exceptional honesty & eval suite)",
        "production_readiness": "High (2-3 week ramp-up for LangGraph)",
        "skeptic_finding": "No production multi-agent experience, but low risk"
      }
    ]
  };
  renderComparisonUI(compFallback);
}

function renderComparisonUI(comp) {
  const container = document.getElementById("comparison-container");
  container.innerHTML = `
    <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 1.5rem;">
      <h3 style="font-size: 1.2rem; font-weight: 700; color: #818cf8; margin-bottom: 0.5rem;">Panel Verdict Summary</h3>
      <p style="color: #ffffff; font-size: 1rem; line-height: 1.6;">${comp.panel_summary}</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
      ${comp.candidates.map(c => `
        <div class="glass-panel" style="padding: 1.5rem;" tabindex="0">
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #ffffff;">${c.name}</h3>
          <span class="badge ${getBadgeClass(c.recommendation)}" style="margin-bottom: 1rem;">${c.recommendation}</span>
          
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
            <div><strong style="color: #ffffff;">Technical Depth:</strong> <span style="color: #cbd5e1;">${c.technical_depth}</span></div>
            <div><strong style="color: #ffffff;">Integrity & Honesty:</strong> <span style="color: #cbd5e1;">${c.integrity_accountability}</span></div>
            <div><strong style="color: #ffffff;">Production Readiness:</strong> <span style="color: #cbd5e1;">${c.production_readiness}</span></div>
            <div><strong style="color: #ffffff;">Skeptic Finding:</strong> <span style="color: #fca5a5;">${c.skeptic_finding}</span></div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function openEvidenceModal(evidenceId) {
  try {
    let ev = null;
    try {
      const res = await fetch(`${API_BASE}/candidates/${currentCandidateId}/evidence/${evidenceId}`);
      if (res.ok) {
        ev = await res.json();
      }
    } catch (e) {}

    if (!ev && loadedReport && loadedReport.evidence_registry) {
      ev = loadedReport.evidence_registry.find(item => item.evidence_id === evidenceId);
    }

    if (!ev) {
      // Direct search in fallback datasets
      const allEv = [...MOCK_REPORTS["cand-demo-001"].evidence_registry, ...MOCK_REPORTS["cand-demo-002"].evidence_registry];
      ev = allEv.find(item => item.evidence_id === evidenceId);
    }

    if (ev) {
      document.getElementById("modal-ev-id").innerText = ev.evidence_id;
      document.getElementById("modal-ev-source").innerText = ev.source.toUpperCase();
      document.getElementById("modal-ev-section").innerText = ev.section;
      document.getElementById("modal-ev-quote").innerText = `"${ev.quote}"`;

      document.getElementById("modal-ev-supports").innerHTML = (ev.supports || []).map(s => `
        <span style="background: rgba(255,255,255,0.12); color: #ffffff; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${s}</span>
      `).join("");

      const modal = document.getElementById("evidence-modal");
      modal.classList.add("active");
      modal.focus();
      announceToScreenReader(`Opened evidence modal for ${ev.evidence_id}`);
    }
  } catch (err) {
    console.error("Failed to fetch evidence quote:", err);
  }
}

function closeEvidenceModal() {
  const modal = document.getElementById("evidence-modal");
  if (modal) {
    modal.classList.remove("active");
    announceToScreenReader("Closed evidence modal");
  }
}

function getBadgeClass(rec) {
  if (!rec) return "badge-hire";
  const r = rec.toUpperCase();
  if (r.includes("STRONG HIRE")) return "badge-strong-hire";
  if (r.includes("STRONG NO")) return "badge-no-hire";
  if (r.includes("HIRE") && !r.includes("NO HIRE")) return "badge-hire";
  if (r.includes("BORDERLINE")) return "badge-borderline";
  if (r.includes("NO HIRE")) return "badge-no-hire";
  return "badge-hire";
}

function getAgentBadgeClass(agentType) {
  if (agentType === "technical") return "badge-tech";
  if (agentType === "hr_culture") return "badge-hr";
  if (agentType === "hiring_manager") return "badge-hm";
  if (agentType === "skeptic") return "badge-skeptic";
  return "badge-tech";
}
