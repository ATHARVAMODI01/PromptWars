# Multi-Agent AI Interview Panel Simulator

An evidence-first, staged multi-agent decision-support system evaluating job candidates through independent initial impressions, a 4-round structured debate, explicit opinion revision tracking, and a 10-step multi-tier reasoning engine.

> **Disclaimer**: This system is strictly an AI decision-support tool designed for human hiring teams. It does not make legally binding employment decisions, auto-reject candidates without human review, run background checks, verify external employment history, conduct live interviews, send offers, or process protected personal characteristics.

---

## 🌟 Key Features

1. **Independent First Opinions**: 4 specialized agent personas (Technical, HR/Culture, Hiring Manager, Skeptic) evaluate candidates in complete isolation during the initial phase with zero cross-agent visibility.
2. **Structured 4-Round Debate Protocol**: Agents engage in cross-examination across Challenge, Response, Revision, and Panel Summary rounds with color-coded stance tags (`AGREE`, `DISAGREE`, `PARTIAL`, `CLARIFY`).
3. **Explicit Opinion Revision Tracking**: Initial and post-debate recommendations are stored as separate immutable records, proving agents re-evaluated position based on debate evidence.
4. **Click-Through Evidence Traceability**: Every claim made by an agent or in the final report cites an Evidence ID (`E-A-001`). Clicking any chip opens the Evidence Explorer Modal showing the source document section and exact quote.
5. **10-Step Final Decision Engine**: Evaluates mandatory core role requirements vs nice-to-have trainability, candidate credibility, and production risk.
6. **Side-by-Side Candidate Comparison**: Comprehensive matrix comparing Candidate A vs Candidate B across technical depth, integrity, trainability, and skeptic findings.

---

## 🎭 The Four Panel Personas

- **Technical Agent**: Evaluates backend architecture, microservices, multi-agent frameworks (LangGraph/CrewAI/AutoGen), RAG vector search, and production reliability.
- **HR / Culture Agent**: Evaluates behavioral suitability, honesty, transparency, accountability, and conflict resolution.
- **Hiring Manager Agent**: Evaluates practical hiring fit, ramp-up time, business value, and trainability of gaps.
- **Skeptic Agent**: Adversarial reviewer searching for ownership claim exaggerations, sole architect walk-backs, unverified metrics, and hidden risks.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, Pydantic, SQLAlchemy, SQLite, PyMuPDF, pdfplumber
- **Frontend**: Glassmorphic HTML5 / CSS3 / JavaScript Web Dashboard
- **Testing**: Python Unittest integration test suite

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/multi-agent-interview-panel.git
cd multi-agent-interview-panel

pip install fastapi uvicorn pymupdf pdfplumber pydantic sqlalchemy httpx
```

### 2. Run the Application
```bash
python backend/main.py
```
Open your browser at [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 3. Run Automated Integration Tests
```bash
python tests/run_tests.py
```

---

## 📁 Repository Structure

```
├── backend/
│   ├── api/          # Upload, Candidates, Evaluations, Debate, Reports endpoints
│   ├── services/     # PDF Processor, Profile Builder, Debate Engine, Decision Engine
│   ├── agents/       # Technical, HR/Culture, Hiring Manager, Skeptic evaluators
│   ├── models/       # Pydantic schemas & SQLAlchemy ORM models
│   ├── prompts/      # Agent system prompt text files
│   ├── database.py   # Database connection & init
│   └── main.py       # FastAPI application entry point
├── frontend/
│   ├── index.html    # 9-Screen dashboard UI
│   ├── styles.css    # Glassmorphism styling & design system
│   └── app.js        # API integration & modal handlers
├── fixtures/         # Reference scenario sample PDFs & transcripts (Rohan vs Ananya)
└── tests/
    └── run_tests.py  # Unittest integration test suite
```

---

## 📜 License
MIT License. Free to modify and use for AI decision-support research.
