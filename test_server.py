import http.cookiejar
import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

import server


class ClassroomServerTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        base = Path(self.temp.name)
        self.original = (server.DATA, server.DB, server.PASSWORD_FILE)
        server.DATA, server.DB, server.PASSWORD_FILE = base, base / "test.sqlite3", base / "password.txt"
        os.environ["TEACHER_PASSWORD"] = "test-teacher-password"
        server.init_db()
        self.http = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        self.thread = threading.Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.http.server_address[1]}"
        self.client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def tearDown(self):
        self.http.shutdown()
        self.http.server_close()
        self.thread.join(timeout=5)
        server.DATA, server.DB, server.PASSWORD_FILE = self.original
        os.environ.pop("TEACHER_PASSWORD", None)
        self.temp.cleanup()

    def request(self, path, method="GET", body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method,
                                     headers={"Content-Type": "application/json"} if data is not None else {})
        try:
            with self.client.open(req) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    def login(self):
        self.assertEqual(self.request("/api/teacher/login", "POST", {"password": "test-teacher-password"})[0], 200)

    def test_teacher_results_and_deadline(self):
        self.assertEqual(self.request("/api/teacher/labs")[0], 401)
        self.login()
        status, created = self.request("/api/teacher/labs", "POST", {"kind": "enzyme", "title": "Amylase test", "className": "9 B", "deadline": None})
        self.assertEqual(status, 201)
        lab_id = created["lab"]["id"]
        answers = {"predictionPh": "water", "predictionTemp": "warm",
                   "colors": {"ph1": "blue", "ph2": "purple", "ph3": "gold", "tempA": "blue", "tempAe": "blue", "tempB": "gold"},
                   "comparison": {"temperature": "36–38", "medium": "бейтарап", "color": "сары-қоңыр"},
                   "conclusion": {"protein": "нәруыз", "change": "бұзылады", "prediction": "расталды", "reason": "Нәтиже болжамға сәйкес келді."}}
        status, saved = self.request(f"/api/labs/{lab_id}/submissions", "POST", {"name": "Student One", "className": "9 B", "answers": answers})
        self.assertEqual(status, 201)
        self.assertEqual(saved["score"], 6)
        status, rows = self.request(f"/api/teacher/labs/{lab_id}/results")
        self.assertEqual(status, 200)
        self.assertEqual(len(rows["results"]), 1)
        self.assertEqual(rows["results"][0]["name"], "Student One")
        status, detail = self.request(f"/api/teacher/submissions/{saved['id']}")
        self.assertEqual(status, 200)
        self.assertEqual(detail["result"]["payload"]["answers"]["colors"]["ph2"], "purple")
        status, closed = self.request(f"/api/teacher/labs/{lab_id}", "PATCH", {"title": "Amylase test", "className": "9 B", "deadline": None, "isOpen": False})
        self.assertEqual(status, 200)
        self.assertEqual(closed["lab"]["status"], "closed")
        self.assertEqual(self.request(f"/api/labs/{lab_id}/submissions", "POST", {"name": "Student Two", "className": "9 B", "answers": answers})[0], 409)
        status, expired = self.request(f"/api/teacher/labs/{lab_id}", "PATCH", {"title": "Amylase test", "className": "9 B", "deadline": "2000-01-01T00:00:00Z", "isOpen": True})
        self.assertEqual(status, 200)
        self.assertEqual(expired["lab"]["status"], "expired")
        self.assertEqual(self.request(f"/api/labs/{lab_id}/submissions", "POST", {"name": "Student Two", "className": "9 B", "answers": answers})[0], 409)

    def test_osmosis_submission_and_static_access(self):
        self.login()
        captures = [{"kind": kind, "note": "Visible cell change", "concentration": 4} for kind in ("water", "salt", "rinse")]
        payload = {"clientId": "report-12345", "name": "Aiman", "className": "9 A", "hypothesis": "Cells shrink",
                   "captures": captures, "answers": {"q1": "out", "q2": "vacuole", "q3": "deplasmolysis"},
                   "conclusion": "Water leaves the cell in salt solution."}
        status, saved = self.request("/api/labs/osmos-class-demo/submissions", "POST", payload)
        self.assertEqual(status, 201)
        self.assertEqual(saved["score"], 3)
        self.assertEqual(self.request("/api/labs/osmos-class-demo/submissions", "POST", payload)[0], 200)
        self.assertEqual(len(self.request("/api/teacher/labs/osmos-class-demo/results")[1]["results"]), 1)
        self.assertEqual(self.request("/data/classroom.sqlite3")[0], 404)


if __name__ == "__main__":
    unittest.main()
