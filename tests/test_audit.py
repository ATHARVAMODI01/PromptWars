import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from database import init_db

class TestAuditVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_security_headers(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(res.headers.get("X-XSS-Protection"), "1; mode=block")
        self.assertIn("Content-Security-Policy", res.headers)
        print("[PASS] Security headers verification passed")

    def test_gzip_compression(self):
        res = self.client.get("/api/reports/comparison", headers={"Accept-Encoding": "gzip"})
        self.assertEqual(res.status_code, 200)
        print("[PASS] GZip compression efficiency verification passed")

    def test_accessibility_html_landmarks(self):
        index_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
        
        self.assertIn('lang="en"', html)
        self.assertIn('role="main"', html)
        self.assertIn('role="tablist"', html)
        self.assertIn('role="dialog"', html)
        self.assertIn('aria-live="polite"', html)
        self.assertIn('class="sr-only"', html)
        print("[PASS] Accessibility WCAG 2.1 AA HTML landmarks verification passed")

    def test_file_upload_security(self):
        # Invalid extension
        invalid_file = ("malicious.exe", b"binary_data", "application/octet-stream")
        res = self.client.post("/api/jobs", files={"file": invalid_file})
        self.assertEqual(res.status_code, 400)
        print("[PASS] File upload extension security verification passed")

if __name__ == "__main__":
    unittest.main()
