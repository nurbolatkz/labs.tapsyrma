# Jasusha Lab: React frontend plan

## 1. Problems in the current version
- **The labs are fixed HTML templates.** Each page mixes the page layout, questions, animation and scoring in one file, so a new lab means copying about 400 lines.
- **The Kazakh voice reads the wrong text.** `speak()` in `preview.html` reads the step instructions from the top, not what the animation is showing.
- **The pages aren't connected.** The home page, the teacher page and the lab pages are separate files with no shared login, menu or design.

## 2. Architecture
```
server.py               keep the existing API, plus: new lab kinds, serving the React build, SPA fallback
frontend/  (Vite + React + React Router)
  public/
    animations/<lab>.html    animation only (canvas/SVG), no text or questions
    narration/<lab>.json     Kazakh explanation for each animation stage
    audio/<lab>/<stage>.mp3  optional pre-recorded or generated Kazakh audio
    images/<lab>/*.svg       pictures used in the tasks
  src/
    labs/<lab>.js       one file per lab: info, goals, theory, stages, tasks, answer key
    components/         Layout, LabCard, AnimationFrame, Narrator, TaskRenderer, ...
    pages/              public, student and teacher pages
    auth/               AuthContext, ProtectedRoute
tools/generate_audio.py  builds mp3 files from narration/*.json
```

## 3. Pages
| Route | Who | Content |
|---|---|---|
| `/` | everyone | Landing page: how a lab works, features for teachers, sample lab cards |
| `/labs` | everyone | Lab catalogue: cards with picture, grade, topic, duration, filter by topic |
| `/labs/:kind` | everyone | Lab detail: goal, equipment, theory, steps, demo mode (not submitted) |
| `/lab/:assignmentId` | student | Name + class → animation + narration → tasks → submit (no account) |
| `/login`, `/register` | teacher | Uses the existing `/api/teacher/*` endpoints |
| `/teacher` | teacher | Dashboard: stat cards (labs, submissions, average score) and the teacher's labs |
| `/teacher/labs/new` | teacher | Choose a lab, set class and deadline, get the student link + QR code |
| `/teacher/labs/:id` | teacher | Edit, close or reopen, results table, CSV export |
| `/teacher/submissions/:id` | teacher | One student's work: captured images, answers, conclusion |

## 4. Lab runner
1. **Animation (iframe).** It only draws, and it reports its stage to the parent page:
   `parent.postMessage({ type: "stage", lab: "osmosis", stage: "salt" }, origin)`.
   The page controls it with `{type:"run", stage}` and `{type:"capture"}`; capture returns a PNG of the frame.
2. **Narrator.** When a stage message arrives, it reads only that stage's explanation from `narration/<lab>.json`, one sentence at a time, and highlights each sentence as it is read.
   Voice options, in order:
   - **mp3 file**, if one exists (works in every browser).
   - **Browser voice** (`speechSynthesis`) with a `kk-KZ` voice. Microsoft Edge is expected to have one; Chrome usually has none. To be checked in a browser.
   - **Captions only.** The text is always shown on screen.

   It also stops when the stage changes, has a mute switch and a speed setting, and never reads the instructions or questions.
3. **Tasks** are defined as data and drawn by one shared `TaskRenderer`. Types: multiple choice, choice by picture, fill-in tables, gap-fill sentences, captured observations, and a written conclusion.

## 5. Labs
| Lab | Status | Animation | Tasks |
|---|---|---|---|
| Osmosis in an onion cell | existing, move canvas into iframe | water → salt → rinse | 3 captures + 3 questions + conclusion |
| Amylase activity: pH and temperature | existing, animate the test tubes | iodine drop and colour change per tube | colour table, gap-fill sentences, conclusion |
| Photosynthesis in elodea | new | lamp distance → oxygen bubble rate | data table, read the graph, conclusion |
| Mitosis in an onion root tip | new | cycle of the phases | identify phases from pictures, put them in order |

The new labs are modelled on open teaching labs: PhET (CC BY 4.0), Amrita OLabs and LabXchange. All text, drawings and animations are written from scratch in Kazakh. Nothing is copied, because Amrita and LabXchange content has its own licence. Each lab page credits its source of inspiration.

## 6. Server changes
- Lab kinds become `osmosis | enzyme | photosynthesis | mitosis`.
- New labs are checked by one shared validator against an answer key kept on the server. The osmosis and enzyme formats stay as they are.
- The server serves `frontend/dist` with the right file types (js, css, svg, json, mp3) and sends any non-API path to `index.html`.
- New teachers get all 4 labs.
- Tests are added for the new kinds and the static file serving.
- The old HTML pages are removed once the React version replaces them.

## 7. Kazakh audio tool (optional)
`tools/generate_audio.py` reads `narration/*.json` and uses the open-source `edge-tts` package to create mp3 files with Microsoft's Kazakh voices. It sends the narration text to Microsoft's service.

## 8. Build order
1. Vite setup, layout, routing, login and registration.
2. Lab catalogue, cards, lab detail pages.
3. Animation iframe protocol + Narrator, done first on osmosis.
4. TaskRenderer, then the enzyme lab.
5. Teacher dashboard: create a lab, results, submission detail, CSV.
6. Photosynthesis and mitosis labs, with server validation and tests.
7. Server serves the build, old HTML removed, README updated, test in a real browser including the narration.

## Open decisions
1. Are these 4 labs right, or should topics come from the 9th-grade curriculum PDF?
2. Audio: generate mp3 files with `edge-tts`, or use the browser voice only?
3. Old HTML pages: delete them, or keep them alongside the React version for now?
