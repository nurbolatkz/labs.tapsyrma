import http.cookiejar
import json
import sqlite3
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
        server.init_db()
        self.http = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        self.thread = threading.Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.http.server_address[1]}"
        self.client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.student = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def tearDown(self):
        self.http.shutdown()
        self.http.server_close()
        self.thread.join(timeout=5)
        server.DATA, server.DB, server.PASSWORD_FILE = self.original
        self.temp.cleanup()

    def request(self, path, method="GET", body=None, client=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method,
                                     headers={"Content-Type": "application/json"} if data is not None else {})
        try:
            with (client or self.client).open(req) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    def login(self):
        status, account = self.request("/api/teacher/register", "POST", {"name": "Teacher One", "email": "teacher@example.com", "password": "test-teacher-password"})
        self.assertEqual(status, 201)
        self.assertEqual(account["teacher"]["email"], "teacher@example.com")
        self.assertEqual(self.request("/api/teacher/labs")[0], 200)

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
        status, saved = self.request(f"/api/labs/{lab_id}/submissions", "POST", {"name": "Student One", "className": "9 B", "answers": answers}, self.student)
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
        self.assertEqual(self.request(f"/api/labs/{lab_id}/submissions", "POST", {"name": "Student Two", "className": "9 B", "answers": answers}, self.student)[0], 409)
        status, expired = self.request(f"/api/teacher/labs/{lab_id}", "PATCH", {"title": "Amylase test", "className": "9 B", "deadline": "2000-01-01T00:00:00Z", "isOpen": True})
        self.assertEqual(status, 200)
        self.assertEqual(expired["lab"]["status"], "expired")
        self.assertEqual(self.request(f"/api/labs/{lab_id}/submissions", "POST", {"name": "Student Two", "className": "9 B", "answers": answers}, self.student)[0], 409)

    def test_osmosis_submission_and_static_access(self):
        self.login()
        lab_id = next(lab["id"] for lab in self.request("/api/teacher/labs")[1]["labs"] if lab["kind"] == "osmosis")
        captures = [{"kind": kind, "note": "Visible cell change", "concentration": 4} for kind in ("water", "salt", "rinse")]
        payload = {"clientId": "report-12345", "name": "Aiman", "className": "9 A", "hypothesis": "Cells shrink",
                   "captures": captures, "answers": {"q1": "out", "q2": "vacuole", "q3": "deplasmolysis"},
                   "conclusion": "Water leaves the cell in salt solution."}
        status, saved = self.request(f"/api/labs/{lab_id}/submissions", "POST", payload, self.student)
        self.assertEqual(status, 201)
        self.assertEqual(saved["score"], 3)
        self.assertEqual(saved["checks"], {"q1": True, "q2": True, "q3": True})
        self.assertEqual(self.request(f"/api/labs/{lab_id}/submissions", "POST", payload, self.student)[0], 200)
        self.assertEqual(len(self.request(f"/api/teacher/labs/{lab_id}/results")[1]["results"]), 1)
        self.assertEqual(self.request("/data/classroom.sqlite3")[0], 404)

    def test_generic_labs_score_and_report_checks(self):
        self.login()
        labs = {lab["kind"]: lab["id"] for lab in self.request("/api/teacher/labs")[1]["labs"]}
        photo = {"name": "Dana", "className": "9 A", "conclusion": "Light makes the plant release more oxygen.",
                 "answers": {"hypothesis": "up", "bubbles": {"d10": "45", "d20": 28, "d30": "16", "d40": 9},
                             "p1": "oxygen", "p2": "down", "p3": "water", "p4": "co2"}}
        status, saved = self.request(f"/api/labs/{labs['photosynthesis']}/submissions", "POST", photo, self.student)
        self.assertEqual(status, 201)
        self.assertEqual((saved["score"], saved["maxScore"]), (4, 5))
        self.assertTrue(saved["checks"]["bubbles"])
        self.assertFalse(saved["checks"]["p3"])
        mitosis = {"name": "Arman", "className": "9 A", "conclusion": "Mitosis makes two identical daughter cells.",
                   "answers": {"identify": {"a": "metaphase", "b": "prophase", "c": "anaphase", "d": "telophase"},
                               "order": {"pos1": "prophase", "pos2": "metaphase", "pos3": "anaphase", "pos4": "telophase"},
                               "m1": "meristem", "m2": "16", "m3": "separate"}}
        status, saved = self.request(f"/api/labs/{labs['mitosis']}/submissions", "POST", mitosis, self.student)
        self.assertEqual(status, 201)
        self.assertEqual((saved["score"], saved["maxScore"]), (5, 6))
        status, detail = self.request(f"/api/teacher/submissions/{saved['id']}")
        self.assertEqual(detail["lab"]["kind"], "mitosis")
        self.assertFalse(detail["result"]["payload"]["checks"]["identify"])
        incomplete = {**mitosis, "answers": {**mitosis["answers"], "m2": "100"}}
        self.assertEqual(self.request(f"/api/labs/{labs['mitosis']}/submissions", "POST", incomplete, self.student)[0], 400)

    def test_demo_check_does_not_store(self):
        self.login()
        body = {"name": "Demo", "className": "Demo", "conclusion": "Light makes the plant release more oxygen.",
                "answers": {"hypothesis": "up", "bubbles": {"d10": 46, "d20": 28, "d30": 15, "d40": 9},
                            "p1": "oxygen", "p2": "down", "p3": "light", "p4": "co2"}}
        status, checked = self.request("/api/demo/photosynthesis/check", "POST", body, self.student)
        self.assertEqual(status, 200)
        self.assertEqual(checked["score"], 5)
        self.assertEqual(self.request("/api/demo/unknown/check", "POST", body, self.student)[0], 404)
        self.assertTrue(all(lab["resultCount"] == 0 for lab in self.request("/api/teacher/labs")[1]["labs"]))

    def test_static_files_and_client_routes(self):
        dist = Path(self.temp.name) / "dist"
        (dist / "assets").mkdir(parents=True)
        (dist / "index.html").write_text("<div id=root></div>", encoding="utf-8")
        (dist / "assets" / "app.js").write_text("console.log(1)", encoding="utf-8")
        original, server.FRONTEND = server.FRONTEND, dist
        try:
            for path, kind in (("/", "text/html"), ("/teacher/labs/abc", "text/html"), ("/assets/app.js", "text/javascript")):
                with urllib.request.urlopen(self.base + path) as response:
                    self.assertEqual(response.status, 200)
                    self.assertTrue(response.headers["Content-Type"].startswith(kind))
            for path in ("/assets/missing.js", "/..%2f..%2fserver.py", "/%2e%2e/test.sqlite3"):
                with self.assertRaises(urllib.error.HTTPError) as error:
                    urllib.request.urlopen(self.base + path)
                self.assertEqual(error.exception.code, 404)
        finally:
            server.FRONTEND = original

    def test_teacher_accounts_are_isolated(self):
        self.login()
        first_lab = self.request("/api/teacher/labs")[1]["labs"][0]
        second = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        status, _ = self.request("/api/teacher/register", "POST", {"name": "Teacher Two", "email": "second@example.com", "password": "another-password-123"}, second)
        self.assertEqual(status, 201)
        second_labs = self.request("/api/teacher/labs", client=second)[1]["labs"]
        self.assertEqual(len(second_labs), 4)
        self.assertEqual({lab["kind"] for lab in second_labs}, set(server.LAB_KINDS))
        self.assertNotIn(first_lab["id"], {lab["id"] for lab in second_labs})
        self.assertEqual(self.request(f"/api/teacher/labs/{first_lab['id']}/results", client=second)[0], 404)
        self.assertEqual(self.request(f"/api/teacher/labs/{first_lab['id']}", "PATCH", {"title": "Changed", "className": "9 B", "deadline": None, "isOpen": False}, second)[0], 404)
        self.assertEqual(self.request("/api/teacher/register", "POST", {"name": "Copy", "email": "teacher@example.com", "password": "another-password-123"}, second)[0], 409)
        self.assertEqual(self.request("/api/teacher/logout", "POST", {})[0], 200)
        self.assertEqual(self.request("/api/teacher/labs")[0], 401)
        self.assertEqual(self.request("/api/teacher/login", "POST", {"email": "teacher@example.com", "password": "test-teacher-password"})[0], 200)


class MigrationTest(unittest.TestCase):
    def test_existing_password_and_labs_are_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            original = (server.DATA, server.DB, server.PASSWORD_FILE)
            server.DATA, server.DB, server.PASSWORD_FILE = base, base / "legacy.sqlite3", base / "teacher-password.txt"
            salt = "0123456789abcdef0123456789abcdef"
            conn = sqlite3.connect(server.DB)
            conn.executescript("""
                CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE labs (id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL,
                    class_name TEXT NOT NULL, deadline TEXT, is_open INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
                CREATE TABLE submissions (id TEXT PRIMARY KEY, lab_id TEXT NOT NULL,
                    student_name TEXT NOT NULL, class_name TEXT NOT NULL, score INTEGER NOT NULL,
                    max_score INTEGER NOT NULL, payload TEXT NOT NULL, submitted_at TEXT NOT NULL);
                CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, expires_at TEXT NOT NULL);
            """)
            conn.execute("INSERT INTO settings VALUES (?,?)", ("teacher_salt", salt))
            conn.execute("INSERT INTO settings VALUES (?,?)", ("teacher_hash", server.password_hash("old-teacher-password", salt)))
            conn.execute("INSERT INTO labs VALUES (?,?,?,?,?,?,?)", ("old-lab", "osmosis", "Old lab", "9 A", None, 1, "2025-01-01T00:00:00Z"))
            conn.commit(); conn.close()
            try:
                server.init_db()
                with server.db() as migrated:
                    teacher = migrated.execute("SELECT * FROM teachers WHERE email='teacher@local'").fetchone()
                    lab = migrated.execute("SELECT * FROM labs WHERE id='old-lab'").fetchone()
                self.assertIsNotNone(teacher)
                self.assertEqual(lab["owner_id"], teacher["id"])
                self.assertEqual(server.password_hash("old-teacher-password", teacher["salt"]), teacher["password_hash"])
            finally:
                server.DATA, server.DB, server.PASSWORD_FILE = original


if __name__ == "__main__":
    unittest.main()
