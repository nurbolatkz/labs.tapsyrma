# Jasusha Lab classroom

Two Kazakh biology activities with a shared teacher cabinet:

- Osmosis virtual lab (`preview.html`)
- Amylase, pH and temperature worksheet (`fermentter_zhumys_paragy.html`)

The Python server stores assignments and student submissions in SQLite. Teachers can create labs, edit deadlines, close or reopen submissions, review results and export CSV. Deadlines and closed status are enforced on the server.

## Start

Python 3.10 or newer is required. No third party packages are needed.

```powershell
python server.py
```

Open <http://127.0.0.1:8000/>. The teacher cabinet is at <http://127.0.0.1:8000/teacher.html>. On first start, the server writes the generated teacher password to `data/teacher-password.txt` and prints that path. The `data/` directory is ignored by Git.

To choose the first teacher password yourself, set `TEACHER_PASSWORD` before the first launch. After the database exists, changing that environment variable does not change its password.

For students on the same network, run `python server.py --host 0.0.0.0 --port 8000`, then open the teacher cabinet using the computer's reachable IP address, such as `http://192.168.1.10:8000/teacher.html`. Links copied there will use that address. For access across the internet, deploy the Python server behind HTTPS with persistent storage. GitHub Pages can host static files but cannot run this backend or collect submissions.

## Verify

```powershell
python -m unittest -v test_server.py
```

The tests cover teacher authentication, creating a lab, receiving both activity types, viewing results, and rejecting work after a lab closes or its deadline passes.
