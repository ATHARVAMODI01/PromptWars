import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from database import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_load_demo_candidates():
    response = client.post("/api/demo/load")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "candidate_a_id" in data
    assert "candidate_b_id" in data

def test_list_candidates():
    client.post("/api/demo/load")
    response = client.get("/api/candidates")
    assert response.status_code == 200
    candidates = response.json()
    assert len(candidates) >= 2

def test_independent_evaluations():
    demo_res = client.post("/api/demo/load").json()
    cand_id = demo_res["candidate_a_id"]

    eval_res = client.post(f"/api/candidates/{cand_id}/evaluate")
    assert eval_res.status_code == 200
    evals = eval_res.json()
    assert len(evals) == 4

    agents = [e["agent"] for e in evals]
    assert "technical" in agents
    assert "hr_culture" in agents
    assert "hiring_manager" in agents
    assert "skeptic" in agents

def test_debate_and_opinion_changes():
    demo_res = client.post("/api/demo/load").json()
    cand_id = demo_res["candidate_a_id"]

    client.post(f"/api/candidates/{cand_id}/evaluate")
    debate_res = client.post(f"/api/candidates/{cand_id}/debate")
    assert debate_res.status_code == 200
    data = debate_res.json()
    
    assert "debate_messages" in data
    assert len(data["debate_messages"]) >= 4

    assert "opinion_changes" in data
    changes = data["opinion_changes"]
    # Check that at least one opinion change is recorded for Candidate A (Technical agent revised position)
    has_change = any(c["changed"] for c in changes)
    assert has_change is True

def test_final_decision_and_report():
    demo_res = client.post("/api/demo/load").json()
    cand_id = demo_res["candidate_b_id"]

    client.post(f"/api/candidates/{cand_id}/evaluate")
    client.post(f"/api/candidates/{cand_id}/debate")
    decision_res = client.post(f"/api/candidates/{cand_id}/decision")
    
    assert decision_res.status_code == 200
    dec = decision_res.json()
    assert dec["candidate"] == "Ananya Iyer"
    assert dec["recommendation"] == "HIRE"

    report_res = client.get(f"/api/candidates/{cand_id}/report")
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["candidate_name"] == "Ananya Iyer"

def test_candidate_comparison():
    client.post("/api/demo/load")
    comp_res = client.get("/api/reports/comparison")
    assert comp_res.status_code == 200
    comp = comp_res.json()
    assert "candidates" in comp
    assert len(comp["candidates"]) == 2
