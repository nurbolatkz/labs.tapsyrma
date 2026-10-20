# Jasusha Lab classroom

Kazakh-language virtual biology labs for grade 9, with a teacher cabinet.

- **React frontend** (`frontend/`, Vite + React Router): landing page, lab catalogue with cards, lab detail pages, teacher registration and login, teacher dashboard, and the student lab runner.
- **Python server** (`server.py`, standard library only): teacher accounts, lab assignments, student submissions and scoring in SQLite.

## Labs

| Lab | Animation stages | Tasks |
|---|---|---|
| Osmosis in an onion cell | water → salt → rinse | 3 captured observations, 3 questions, conclusion |
| Amylase activity: pH and temperature | iodine in 6 test tubes | prediction, colour tables, gap-fill sentences |
| Light intensity and photosynthesis | lamp at 10/20/30/40 cm, bubble counter | data table with live chart, 4 questions, conclusion |
| Mitosis in an onion root tip | interphase → telophase | identify phases from pictures, put phases in order, 3 questions |

Each lab is one data file in `frontend/src/labs/`. Its animation is a separate page in `frontend/public/animations/`, shown in an iframe.

## How the Kazakh narration works

The animation reports each stage to the page (`postMessage`, see `public/animations/bridge.js`). The narrator then reads **only that stage's explanation** from `frontend/public/narration/<lab>.json`, one sentence at a time, and highlights each sentence as it is read. It never reads instructions or questions.

For each sentence it uses, in order:

1. a generated mp3 from `frontend/public/audio/` (works in every browser),
2. a `kk-KZ` browser voice,
3. captions only.

After changing narration text, regenerate the audio. This needs internet: the sentences are sent to Microsoft's text-to-speech service through the open-source `edge-tts` package.

```powershell
python -m pip install edge-tts
python tools/generate_audio.py            # voice kk-KZ-AigulNeural
python tools/generate_audio.py --voice kk-KZ-DauletNeural --force
```

The narrator only plays an mp3 whose recorded text still matches the sentence. Edited sentences fall back to the browser voice until you regenerate.

## Start

Requires Python 3.10+ and Node.js 18+.

```powershell
cd frontend
npm install
npm run build
cd ..
python server.py
```

Open <http://127.0.0.1:8000/>. Register a teacher account at **Тіркелу**. Every new teacher gets all four labs. Open a lab in the cabinet to copy the student link or show its QR code. Students need no account: they enter a name and class.

For classroom devices on the same network, run `python server.py --host 0.0.0.0 --port 8000` and open the cabinet through the computer's IP address (for example `http://192.168.1.10:8000/teacher`) so the copied links use that address. For internet access, deploy behind HTTPS with persistent storage. The `data/` directory is ignored by Git.

### Frontend development

Run `python server.py` (port 8000) and, in another terminal, `cd frontend && npm run dev`. Vite serves the app at <http://localhost:5173/> and forwards `/api` to the Python server.

## Scoring

Answer keys live only on the server: `validate_submission` for osmosis and amylase, and `LAB_SPECS` for photosynthesis and mitosis. Demo mode (`/labs/<kind>/demo`) checks answers through `POST /api/demo/<kind>/check` without saving anything. Submitted work records a right/wrong flag per task, which the student and teacher both see. Written conclusions are graded by the teacher.

Databases from earlier versions are migrated automatically.

## Verify

```powershell
python -m unittest -v test_server.py
```

The tests cover registration, login and account isolation; creating labs; submissions and scoring for all four labs; the demo check; deadlines and closed labs; static files and client routes; and the legacy database migration.

## Credits

The lab structure is modelled on open teaching labs: [PhET Interactive Simulations](https://phet.colorado.edu/) (CC BY 4.0), [Amrita OLabs](https://amrita.olabs.edu.in/) and [LabXchange](https://www.labxchange.org/). All text, drawings and animations here are original and written in Kazakh. No content was copied from those sites.
