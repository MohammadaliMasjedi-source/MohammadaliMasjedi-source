"""Dependency-free API checks. Known product defects are expected failures, not hidden."""
import json
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "demo"))
from server import QAHandler, STORE  # noqa: E402


class APIContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), QAHandler)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=2)

    def setUp(self):
        STORE.reset()

    def request(self, method, path, data=None):
        body = None if data is None else json.dumps(data).encode("utf-8")
        req = Request(self.base + path, data=body, method=method,
                      headers={"Content-Type": "application/json"})
        try:
            with urlopen(req, timeout=3) as resp:
                text = resp.read().decode("utf-8")
                return resp.status, json.loads(text) if text else None
        except HTTPError as exc:
            text = exc.read().decode("utf-8")
            return exc.code, json.loads(text) if text else None

    def test_01_health_endpoint(self):
        self.assertEqual(self.request("GET", "/api/health")[0], 200)

    def test_02_initial_tasks(self):
        status, data = self.request("GET", "/api/tasks")
        self.assertEqual((status, data["count"]), (200, 3))

    def test_03_create_valid_task(self):
        status, data = self.request("POST", "/api/tasks", {"title": "Check receipts"})
        self.assertEqual((status, data["task"]["status"]), (201, "pending"))

    def test_04_missing_title_rejected(self):
        self.assertEqual(self.request("POST", "/api/tasks", {})[0], 400)

    def test_05_title_over_80_rejected(self):
        self.assertEqual(self.request("POST", "/api/tasks", {"title": "a" * 81})[0], 400)

    def test_06_pending_filter(self):
        self.assertEqual(self.request("GET", "/api/tasks?status=pending")[1]["count"], 2)

    def test_07_search_case_insensitive(self):
        result = self.request("GET", "/api/tasks?q=SPRINT")[1]
        self.assertEqual(result["tasks"][0]["id"], 1)

    def test_08_update_status(self):
        self.assertEqual(self.request("PATCH", "/api/tasks/1", {"status": "completed"})[1]["task"]["status"], "completed")

    def test_09_reject_invalid_status(self):
        self.assertEqual(self.request("PATCH", "/api/tasks/1", {"status": "archived"})[0], 400)

    def test_10_delete_existing(self):
        self.assertEqual(self.request("DELETE", "/api/tasks/1")[0], 204)
        self.assertEqual(self.request("GET", "/api/tasks")[1]["count"], 2)

    def test_11_unknown_patch_is_404(self):
        self.assertEqual(self.request("PATCH", "/api/tasks/9999", {"status": "completed"})[0], 404)

    def test_12_title_exactly_80_accepted(self):
        self.assertEqual(self.request("POST", "/api/tasks", {"title": "b" * 80})[0], 201)

    def test_13_reject_invalid_priority(self):
        self.assertEqual(self.request("POST", "/api/tasks", {"title": "Valid", "priority": "urgent"})[0], 400)

    def test_14_static_home_is_served(self):
        status, _ = self.request_raw("GET", "/")
        self.assertEqual(status, 200)

    def request_raw(self, method, path):
        with urlopen(Request(self.base + path, method=method), timeout=3) as r:
            return r.status, r.read()

    @unittest.expectedFailure
    def test_15_bug_001_reject_whitespace_only_title(self):
        self.assertEqual(self.request("POST", "/api/tasks", {"title": "   "})[0], 400)

    @unittest.expectedFailure
    def test_16_bug_002_filter_completed_only(self):
        result = self.request("GET", "/api/tasks?status=completed")[1]
        self.assertEqual([t["id"] for t in result["tasks"]], [2])

    @unittest.expectedFailure
    def test_17_bug_003_delete_unknown_is_404(self):
        self.assertEqual(self.request("DELETE", "/api/tasks/9999")[0], 404)


if __name__ == "__main__":
    unittest.main(verbosity=2)
