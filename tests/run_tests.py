import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from database import init_db

class TestMultiAgentInterviewPanel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_01_load_demo_candidates(self):
        response = self.client.post("/api/demo/load")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("candidate_a_id", data)
        self.assertIn("candidate_b_id", data)
        print("[PASS] Demo candidate loader test passed")

    def test_02_list_candidates(self):
        self.client.post("/api/demo/load")
        response = self.client.get("/api/candidates")
        self.assertEqual(response.status_code, 200)
        candidates = response.json()
        self.assertGreaterEqual(len(candidates), 2)
        print("[PASS] Candidate listing test passed")

    def test_03_independent_evaluations(self):
        demo_res = self.client.post("/api/demo/load").json()
        cand_id = demo_res["candidate_a_id"]

        eval_res = self.client.post(f"/api/candidates/{cand_id}/evaluate")
        self.assertEqual(eval_res.status_code, 200)
        evals = eval_res.json()
        self.assertEqual(len(evals), 4)

        agents = [e["agent"] for e in evals]
        self.assertIn("technical", agents)
        self.assertIn("hr_culture", agents)
        self.assertIn("hiring_manager", agents)
        self.assertIn("skeptic", agents)
        print("[PASS] Independent isolated agent evaluation test passed")

    def test_04_debate_and_opinion_revisions(self):
        demo_res = self.client.post("/api/demo/load").json()
        cand_id = demo_res["candidate_a_id"]

        self.client.post(f"/api/candidates/{cand_id}/evaluate")
        debate_res = self.client.post(f"/api/candidates/{cand_id}/debate")
        self.assertEqual(debate_res.status_code, 200)
        data = debate_res.json()
        
        self.assertIn("debate_messages", data)
        self.assertGreaterEqual(len(data["debate_messages"]), 4)

        self.assertIn("opinion_changes", data)
        changes = data["opinion_changes"]
        has_change = any(c["changed"] for c in changes)
        self.assertTrue(has_change)
        print("[PASS] 4-Round debate protocol & opinion revision tracking test passed")

    def test_05_final_decision_engine(self):
        demo_res = self.client.post("/api/demo/load").json()
        cand_id = demo_res["candidate_b_id"]

        self.client.post(f"/api/candidates/{cand_id}/evaluate")
        self.client.post(f"/api/candidates/{cand_id}/debate")
        decision_res = self.client.post(f"/api/candidates/{cand_id}/decision")
        
        self.assertEqual(decision_res.status_code, 200)
        dec = decision_res.json()
        self.assertEqual(dec["candidate"], "Ananya Iyer")
        self.assertEqual(dec["recommendation"], "HIRE")
        self.assertEqual(len(dec["reasoning_steps"]), 10)
        print("[PASS] 10-Step Final Decision engine test passed")

    def test_06_candidate_comparison(self):
        self.client.post("/api/demo/load")
        comp_res = self.client.get("/api/reports/comparison")
        self.assertEqual(comp_res.status_code, 200)
        comp = comp_res.json()
        self.assertIn("candidates", comp)
        self.assertEqual(len(comp["candidates"]), 2)
        print("[PASS] Candidate comparison report test passed")

if __name__ == "__main__":
    unittest.main()
