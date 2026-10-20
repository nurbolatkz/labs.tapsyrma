# Jasusha Lab classroom

Two Kazakh biology activities with a shared teacher cabinet:

- Osmosis virtual lab (`preview.html`)
- Amylase, pH and temperature worksheet (`fermentter_zhumys_paragy.html`)

The Python server stores teacher accounts, assignments and student submissions in SQLite. Teachers register with an email and password, then create labs, edit deadlines, close or reopen submissions, review results and export CSV. Each teacher sees only their own labs and results. Students need no account: they enter a name and grade to start. Deadlines and closed status are enforced on the server.

## Start

Python 3.10 or newer is required. No third party packages are needed.

```powershell
python server.py
```

Open <http://127.0.0.1:8000/>. The teacher cabinet is at <http://127.0.0.1:8000/teacher.html>. Choose **Тіркелу** to create a teacher account. Every new teacher starts with the two biology labs. The `data/` directory is ignored by Git.

Existing databases from the earlier single-password version are migrated automatically. Its labs and results remain under the account `teacher@local`; the old password is in `data/teacher-password.txt` if it was generated on first start. You can also register a new teacher account, which receives its own labs.

For students on the same network, run `python server.py --host 0.0.0.0 --port 8000`, then open the teacher cabinet using the computer's reachable IP address, such as `http://192.168.1.10:8000/teacher.html`. Links copied there will use that address. For access across the internet, deploy the Python server behind HTTPS with persistent storage. GitHub Pages can host static files but cannot run this backend or collect submissions.

## Verify

```powershell
python -m unittest -v test_server.py
```

The tests cover teacher registration and login, account isolation, creating a lab, anonymous student submissions for both activities, viewing results, and rejecting work after a lab closes or its deadline passes.
