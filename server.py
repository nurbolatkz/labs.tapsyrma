"""Shared classroom server for the two standalone biology labs.

Run: python server.py
Open http://127.0.0.1:8000/ and use the generated teacher password.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import hmac
import io
import json
import os
import secrets
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
DB = DATA / "classroom.sqlite3"
PASSWORD_FILE = DATA / "teacher-password.txt"
STATIC = {
    "/": "index.html",
    "/index.html": "index.html",
    "/teacher.html": "teacher.html",
    "/preview.html": "preview.html",
    "/fermentter_zhumys_paragy.html": "fermentter_zhumys_paragy.html",
}
MIME = {".html": "text/html; charset=utf-8"}
LOCK = threading.RLock()
OSMOSIS_ANSWERS = {"q1": "out", "q2": "vacuole", "q3": "deplasmolysis"}
ENZYME_COLORS = {"ph1": "blue", "ph2": "purple", "ph3": "gold", "tempA": "blue", "tempAe": "blue", "tempB": "gold"}


def now():
    return datetime.now(timezone.utc)


def iso(value):
    return value.isoformat().replace("+00:00", "Z") if value else None


def parse_date(value):
    if value in (None, ""):
        return None
    if not isinstance(value, str):
        raise ValueError("Мерзім дұрыс көрсетілмеген.")
    try:
        date = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("Мерзім дұрыс көрсетілмеген.") from exc
    if date.tzinfo is None:
        raise ValueError("Мерзімнің уақыт белдеуі көрсетілуі керек.")
    return date.astimezone(timezone.utc)


@contextmanager
def db():
    connection = sqlite3.connect(DB, timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def password_hash(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 250_000).hex()


def init_db():
    DATA.mkdir(exist_ok=True)
    with db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS labs (
            id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL,
            class_name TEXT NOT NULL, deadline TEXT, is_open INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY, lab_id TEXT NOT NULL REFERENCES labs(id),
            student_name TEXT NOT NULL, class_name TEXT NOT NULL,
            score INTEGER NOT NULL, max_score INTEGER NOT NULL,
            payload TEXT NOT NULL, submitted_at TEXT NOT NULL,
            UNIQUE(lab_id, id)
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY, expires_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS submissions_lab_idx ON submissions(lab_id,submitted_at);
        """)
        if not conn.execute("SELECT 1 FROM settings WHERE key='teacher_salt'").fetchone():
            password = os.environ.get("TEACHER_PASSWORD") or secrets.token_urlsafe(12)
            salt = secrets.token_hex(16)
            conn.execute("INSERT INTO settings VALUES ('teacher_salt',?)", (salt,))
            conn.execute("INSERT INTO settings VALUES ('teacher_hash',?)", (password_hash(password, salt),))
            if not os.environ.get("TEACHER_PASSWORD"):
                PASSWORD_FILE.write_text(password + "\n", encoding="utf-8")
                print(f"Teacher password saved in: {PASSWORD_FILE}", flush=True)
        defaults = [
            ("osmos-class-demo", "osmosis", "Өсімдік жасушасындағы осмос", "9 А"),
            ("enzyme-b-worksheet", "enzyme", "Ферменттердің белсенділігі: температура және pH", "9 А"),
        ]
        for lab_id, kind, title, class_name in defaults:
            conn.execute("INSERT OR IGNORE INTO labs VALUES (?,?,?,?,?,1,?)", (lab_id, kind, title, class_name, None, iso(now())))


def lab_json(row):
    deadline = parse_date(row["deadline"])
    active = bool(row["is_open"]) and (deadline is None or now() <= deadline)
    return {"id": row["id"], "kind": row["kind"], "title": row["title"],
            "className": row["class_name"], "deadline": row["deadline"],
            "isOpen": bool(row["is_open"]), "accepting": active,
            "status": "open" if active else "expired" if row["is_open"] and deadline else "closed",
            "createdAt": row["created_at"]}


def clean_text(value, label, minimum=1, maximum=200):
    if not isinstance(value, str):
        raise ValueError(f"{label}: мәтін қажет.")
    value = value.strip()
    if not minimum <= len(value) <= maximum:
        raise ValueError(f"{label}: {minimum}–{maximum} таңба болуы керек.")
    return value


def normalize(value):
    return str(value or "").lower().translate(str.maketrans("", "", "–—−- .,!\t\n"))


def validate_submission(kind, data):
    if not isinstance(data, dict):
        raise ValueError("Есеп форматы дұрыс емес.")
    name = clean_text(data.get("name"), "Аты-жөні", 2, 80)
    class_name = clean_text(data.get("className"), "Сынып", 1, 30)
    if kind == "osmosis":
        captures = data.get("captures")
        answers = data.get("answers")
        if not isinstance(captures, list) or len(captures) != 3 or not isinstance(answers, dict):
            raise ValueError("Үш бақылау мен жауаптар қажет.")
        clean_captures = []
        for capture, expected in zip(captures, ("water", "salt", "rinse")):
            if not isinstance(capture, dict) or capture.get("kind") != expected:
                raise ValueError("Бақылаулар реті дұрыс емес.")
            item = {"kind": expected, "note": clean_text(capture.get("note"), "Бақылау", 8, 1000),
                    "concentration": max(0, min(8, float(capture.get("concentration") or 0)))}
            image = capture.get("image")
            if isinstance(image, str) and image.startswith("data:image/png;base64,") and len(image) < 2_000_000:
                item["image"] = image
            clean_captures.append(item)
        allowed = {"q1": {"out", "in", "none"}, "q2": {"wall", "vacuole", "all"},
                   "q3": {"diffusion", "plasmolysis", "deplasmolysis"}}
        if any(answers.get(q) not in options for q, options in allowed.items()):
            raise ValueError("Теориялық жауаптар толық емес.")
        conclusion = clean_text(data.get("conclusion"), "Қорытынды", 20, 3000)
        payload = {"name": name, "className": class_name, "hypothesis": clean_text(data.get("hypothesis"), "Болжам", 1, 300),
                   "captures": clean_captures, "answers": {q: answers[q] for q in allowed}, "conclusion": conclusion}
        score = sum(answers[q] == answer for q, answer in OSMOSIS_ANSWERS.items())
        return payload, score, 3
    answers = data.get("answers")
    if not isinstance(answers, dict):
        raise ValueError("Жауаптар қажет.")
    prediction_ph = answers.get("predictionPh", "")
    prediction_temp = answers.get("predictionTemp", "")
    if prediction_ph not in ("acid", "water") or prediction_temp not in ("ice", "warm", "hot"):
        raise ValueError("Болжамды толықтырыңыз.")
    colors = answers.get("colors")
    if not isinstance(colors, dict) or any(colors.get(key) not in ("blue", "purple", "gold") for key in ENZYME_COLORS):
        raise ValueError("Барлық сынауықтың түсін белгілеңіз.")
    comparison = answers.get("comparison")
    conclusion = answers.get("conclusion")
    if not isinstance(comparison, dict) or not isinstance(conclusion, dict):
        raise ValueError("Салыстыру мен қорытындыны толықтырыңыз.")
    for key in ("temperature", "medium", "color"):
        comparison[key] = clean_text(comparison.get(key), "Салыстыру", 1, 80)
    for key in ("protein", "change", "prediction"):
        conclusion[key] = clean_text(conclusion.get(key), "Қорытынды", 1, 80)
    conclusion["reason"] = clean_text(conclusion.get("reason"), "Себебі", 10, 2000)
    correct_prediction = prediction_ph == "water" and prediction_temp == "warm"
    score = 1
    score += int(sum(colors[k] == v for k, v in list(ENZYME_COLORS.items())[:3]) >= 2)
    score += int(sum(colors[k] == v for k, v in list(ENZYME_COLORS.items())[3:]) >= 2)
    score += int(normalize(comparison["temperature"]) == "3638" and normalize(comparison["medium"]) == "бейтарап" and normalize(comparison["color"]) == "сарықоңыр")
    score += int(normalize(conclusion["protein"]) == "нәруыз" and normalize(conclusion["change"]) == "бұзылады")
    score += int(normalize(conclusion["prediction"]) == ("расталды" if correct_prediction else "расталмады"))
    payload = {"name": name, "className": class_name, "answers": {"predictionPh": prediction_ph, "predictionTemp": prediction_temp,
               "colors": {key: colors[key] for key in ENZYME_COLORS}, "comparison": comparison, "conclusion": conclusion}}
    return payload, score, 6


class Handler(BaseHTTPRequestHandler):
    server_version = "JasushaClassroom/1.0"

    def send_json(self, status, obj, cookie=None):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def fail(self, status, message):
        self.send_json(status, {"error": message})

    def json_body(self):
        if "application/json" not in self.headers.get("Content-Type", ""):
            raise ValueError("JSON жіберіңіз.")
        size = int(self.headers.get("Content-Length", "0"))
        if not 0 < size <= 8_000_000:
            raise ValueError("Есеп тым үлкен немесе бос.")
        return json.loads(self.rfile.read(size))

    def teacher(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
            token = cookie["teacher_session"].value
        except (KeyError, ValueError):
            return False
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with db() as conn:
            row = conn.execute("SELECT expires_at FROM sessions WHERE token_hash=?", (token_hash,)).fetchone()
        return bool(row and parse_date(row["expires_at"]) > now())

    def teacher_required(self):
        if self.teacher():
            return True
        self.fail(HTTPStatus.UNAUTHORIZED, "Мұғалім ретінде кіріңіз.")
        return False

    def same_origin(self):
        origin = self.headers.get("Origin")
        if not origin:
            return True
        expected = f"http://{self.headers.get('Host')}"
        return origin == expected or origin == expected.replace("http://", "https://", 1)

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path in STATIC:
            file = ROOT / STATIC[path]
            body = file.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", MIME[file.suffix])
            self.send_header("Content-Length", str(len(body)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)
            return
        if not path.startswith("/api/"):
            return self.fail(404, "Бет табылмады.")
        if path == "/api/labs":
            with db() as conn:
                rows = conn.execute("SELECT * FROM labs ORDER BY created_at").fetchall()
            return self.send_json(200, {"labs": [lab_json(row) for row in rows], "serverTime": iso(now())})
        if path == "/api/teacher/me":
            return self.send_json(200 if self.teacher() else 401, {"authenticated": self.teacher()})
        if path.startswith("/api/labs/") and path.count("/") == 3:
            lab_id = path.split("/")[3]
            with db() as conn:
                row = conn.execute("SELECT * FROM labs WHERE id=?", (lab_id,)).fetchone()
            return self.send_json(200, {"lab": lab_json(row), "serverTime": iso(now())}) if row else self.fail(404, "Зертхана табылмады.")
        if path == "/api/teacher/labs":
            if not self.teacher_required(): return
            with db() as conn:
                rows = conn.execute("SELECT labs.*,COUNT(submissions.id) AS result_count FROM labs LEFT JOIN submissions ON labs.id=submissions.lab_id GROUP BY labs.id ORDER BY labs.created_at").fetchall()
            return self.send_json(200, {"labs": [{**lab_json(row), "resultCount": row["result_count"]} for row in rows]})
        parts = path.split("/")
        if len(parts) == 6 and parts[:4] == ["", "api", "teacher", "labs"] and parts[5] in ("results", "results.csv"):
            if not self.teacher_required(): return
            lab_id = parts[4]
            with db() as conn:
                lab = conn.execute("SELECT * FROM labs WHERE id=?", (lab_id,)).fetchone()
                rows = conn.execute("SELECT * FROM submissions WHERE lab_id=? ORDER BY submitted_at DESC", (lab_id,)).fetchall()
            if not lab: return self.fail(404, "Зертхана табылмады.")
            if parts[5] == "results.csv":
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["Оқушы", "Сынып", "Зертхана", "Балл", "Ең жоғары балл", "Тапсырған уақыты", "Қорытынды"])
                for row in rows:
                    payload = json.loads(row["payload"])
                    conclusion = payload.get("conclusion", "")
                    if isinstance(conclusion, dict): conclusion = conclusion.get("reason", "")
                    values = [row["student_name"], row["class_name"], lab["title"], row["score"], row["max_score"], row["submitted_at"], conclusion]
                    writer.writerow(["'" + str(v) if str(v).lstrip().startswith(("=", "+", "-", "@")) else v for v in values])
                body = ("\ufeff" + output.getvalue()).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/csv; charset=utf-8")
                self.send_header("Content-Disposition", f'attachment; filename="results-{lab_id}.csv"')
                self.send_header("Content-Length", str(len(body)))
                self.end_headers(); self.wfile.write(body)
                return
            return self.send_json(200, {"lab": lab_json(lab), "results": [
                {"id": row["id"], "name": row["student_name"], "className": row["class_name"],
                 "score": row["score"], "maxScore": row["max_score"], "submittedAt": row["submitted_at"]} for row in rows]})
        if len(parts) == 5 and parts[:4] == ["", "api", "teacher", "submissions"]:
            if not self.teacher_required(): return
            with db() as conn:
                row = conn.execute("SELECT * FROM submissions WHERE id=?", (parts[4],)).fetchone()
            return self.send_json(200, {"result": {"id": row["id"], "labId": row["lab_id"], "name": row["student_name"],
                "className": row["class_name"], "score": row["score"], "maxScore": row["max_score"],
                "submittedAt": row["submitted_at"], "payload": json.loads(row["payload"])}}) if row else self.fail(404, "Есеп табылмады.")
        self.fail(404, "Сұрау табылмады.")

    def do_POST(self):
        self.mutate("POST")

    def do_PATCH(self):
        self.mutate("PATCH")

    def mutate(self, method):
        if not self.same_origin(): return self.fail(403, "Басқа сайттан сұрау қабылданбайды.")
        path = unquote(urlparse(self.path).path)
        try:
            data = self.json_body()
            if path == "/api/teacher/login" and method == "POST":
                password = data.get("password") if isinstance(data, dict) else None
                with db() as conn:
                    salt = conn.execute("SELECT value FROM settings WHERE key='teacher_salt'").fetchone()[0]
                    expected = conn.execute("SELECT value FROM settings WHERE key='teacher_hash'").fetchone()[0]
                if not isinstance(password, str) or not hmac.compare_digest(password_hash(password, salt), expected):
                    return self.fail(401, "Құпиясөз қате.")
                token = secrets.token_urlsafe(32)
                with db() as conn:
                    conn.execute("INSERT INTO sessions VALUES (?,?)", (hashlib.sha256(token.encode()).hexdigest(), iso(now() + timedelta(days=7))))
                secure = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
                return self.send_json(200, {"authenticated": True}, f"teacher_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800{secure}")
            if path == "/api/teacher/logout" and method == "POST":
                cookie = SimpleCookie(); cookie.load(self.headers.get("Cookie", ""))
                if "teacher_session" in cookie:
                    with db() as conn:
                        conn.execute("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(cookie["teacher_session"].value.encode()).hexdigest(),))
                return self.send_json(200, {"authenticated": False}, "teacher_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0")
            if path.startswith("/api/teacher/"):
                if not self.teacher_required(): return
                if path == "/api/teacher/labs" and method == "POST":
                    kind = data.get("kind")
                    if kind not in ("osmosis", "enzyme"): raise ValueError("Зертхана түрін таңдаңыз.")
                    title = clean_text(data.get("title"), "Атауы", 2, 120)
                    class_name = clean_text(data.get("className"), "Сынып", 1, 30)
                    deadline = iso(parse_date(data.get("deadline")))
                    lab_id = secrets.token_urlsafe(9).replace("-", "").replace("_", "")
                    with db() as conn:
                        conn.execute("INSERT INTO labs VALUES (?,?,?,?,?,1,?)", (lab_id, kind, title, class_name, deadline, iso(now())))
                        row = conn.execute("SELECT * FROM labs WHERE id=?", (lab_id,)).fetchone()
                    return self.send_json(201, {"lab": lab_json(row)})
                parts = path.split("/")
                if len(parts) == 5 and parts[:4] == ["", "api", "teacher", "labs"] and method == "PATCH":
                    title = clean_text(data.get("title"), "Атауы", 2, 120)
                    class_name = clean_text(data.get("className"), "Сынып", 1, 30)
                    deadline = iso(parse_date(data.get("deadline")))
                    is_open = data.get("isOpen")
                    if not isinstance(is_open, bool): raise ValueError("Ашық/жабық күйі дұрыс емес.")
                    with db() as conn:
                        result = conn.execute("UPDATE labs SET title=?,class_name=?,deadline=?,is_open=? WHERE id=?",
                                              (title, class_name, deadline, int(is_open), parts[4]))
                        row = conn.execute("SELECT * FROM labs WHERE id=?", (parts[4],)).fetchone()
                    return self.send_json(200, {"lab": lab_json(row)}) if result.rowcount else self.fail(404, "Зертхана табылмады.")
            parts = path.split("/")
            if len(parts) == 5 and parts[:3] == ["", "api", "labs"] and parts[4] == "submissions" and method == "POST":
                lab_id = parts[3]
                client_id = data.get("clientId") if isinstance(data, dict) else None
                if client_id is not None and (not isinstance(client_id, str) or not 5 <= len(client_id) <= 120):
                    raise ValueError("Есеп идентификаторы дұрыс емес.")
                with LOCK:
                    with db() as conn:
                        conn.execute("BEGIN IMMEDIATE")
                        lab = conn.execute("SELECT * FROM labs WHERE id=?", (lab_id,)).fetchone()
                        if not lab: return self.fail(404, "Зертхана табылмады.")
                        if client_id:
                            existing = conn.execute("SELECT id,score,max_score FROM submissions WHERE id=? AND lab_id=?", (client_id, lab_id)).fetchone()
                            if existing:
                                return self.send_json(200, {"id": existing["id"], "score": existing["score"], "maxScore": existing["max_score"], "saved": True})
                        if not lab_json(lab)["accepting"]:
                            return self.fail(409, "Тапсыру жабық немесе мерзімі аяқталған.")
                        payload, score, maximum = validate_submission(lab["kind"], data)
                        submission_id = client_id or secrets.token_urlsafe(15)
                        submitted_at = iso(now())
                        conn.execute("INSERT INTO submissions VALUES (?,?,?,?,?,?,?,?)", (submission_id, lab_id, payload["name"],
                                     payload["className"], score, maximum, json.dumps(payload, ensure_ascii=False), submitted_at))
                return self.send_json(201, {"id": submission_id, "score": score, "maxScore": maximum, "submittedAt": submitted_at, "saved": True})
            self.fail(404, "Сұрау табылмады.")
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            self.fail(400, str(exc))
        except sqlite3.IntegrityError:
            self.fail(409, "Бұл есеп бұрын тапсырылған.")


def main():
    parser = argparse.ArgumentParser(description="Biology classroom server")
    parser.add_argument("--host", default="127.0.0.1", help="0.0.0.0 allows other devices on your network")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    init_db()
    print(f"Classroom: http://{args.host}:{args.port}/", flush=True)
    print("Teacher cabinet: /teacher.html", flush=True)
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
