"""Биология мысал зертханасы: «Өсімдік жасушасының құрылымы» (жетілдірілген).

- Интерактив SVG анимация, hover + click
- Қазақша дыбыстық түсіндірме (Web Speech API, kk-KZ fallback-пен)
- 5 сұрақтан тұратын жұмыс парағы

Қолдану:
    env $(sudo cat /etc/tapsyrma-labs.env | xargs) \
        python3 scripts/seed_cell_lab.py [--teacher EMAIL]
"""
import argparse
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from django.contrib.auth import get_user_model

from labs.models import Lab, LabSession, Question

User = get_user_model()


ANIMATION_HTML = r"""<!doctype html><html lang="kk"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
     background:#f8fafc;color:#0f172a;padding:14px;}
.wrap{max-width:760px;margin:0 auto;}
.topline{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px;}
h3{margin:0;font-size:16px;}
.btn{padding:7px 12px;border:1px solid #15803d;background:#15803d;color:#fff;border-radius:6px;
     font-size:13px;cursor:pointer;font-family:inherit;}
.btn.sec{background:#fff;color:#15803d;}
.btn:hover{opacity:.9}
.hint{margin:0 0 12px;color:#64748b;font-size:12.5px;}
.stage{display:grid;grid-template-columns:1fr;gap:14px;}
@media(min-width:640px){.stage{grid-template-columns:1.15fr 1fr;}}
svg{width:100%;max-height:360px;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%);
    border:1px solid #e2e8f0;border-radius:10px;}
.panel{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;min-height:220px;
       display:flex;flex-direction:column;gap:8px;}
.panel h4{margin:0;font-size:15px;color:#15803d;}
.panel p{margin:0;font-size:14px;line-height:1.55;color:#334155;}
.panel .pbtns{display:flex;gap:8px;margin-top:auto;flex-wrap:wrap;}
.panel .pbtns button{border:1px solid #e2e8f0;background:#fff;padding:6px 10px;border-radius:6px;
                     font-size:12.5px;cursor:pointer;color:#334155;font-family:inherit;}
.panel .pbtns button:hover{border-color:#15803d;color:#15803d;}
.panel .pbtns button[disabled]{opacity:.5;cursor:not-allowed;}
.part{cursor:pointer;transition:transform .15s;transform-origin:center;}
.part:hover{filter:brightness(0.95);}
.part.active{filter:drop-shadow(0 0 6px #15803d);}
.part.pulse{animation:pulse 1.2s ease-in-out infinite;}
@keyframes pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.07);}}
.label{font-size:11px;fill:#334155;pointer-events:none;font-family:inherit;}
.chips{display:flex;flex-wrap:wrap;gap:6px;}
.chip{padding:4px 10px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;
      font-size:12px;cursor:pointer;color:#334155;font-family:inherit;}
.chip:hover{border-color:#15803d;color:#15803d;}
.chip.active{background:#dcfce7;border-color:#15803d;color:#0f5c2e;}
.photosyn-ani{pointer-events:none;}
.sun{transition:opacity .3s;opacity:0;}
.sun.on{opacity:1;}
.sunray{stroke:#eab308;stroke-width:2;stroke-linecap:round;opacity:0;}
.sunray.on{animation:rayin 1.2s ease-out infinite;}
@keyframes rayin{0%{opacity:0;stroke-dasharray:0 60;}50%{opacity:.9;stroke-dasharray:60 0;}100%{opacity:0;}}
.audio-badge{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#15803d;}
.audio-badge svg{width:12px;height:12px;}
</style></head><body><div class="wrap">
<div class="topline">
  <h3>Өсімдік жасушасының құрылымы</h3>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <button class="btn sec" id="speakBtn" type="button" title="Қазақ тілінде оқу">🔊 Дыбыспен тыңдау</button>
    <button class="btn" id="photoBtn" type="button">☀ Фотосинтезді көрсету</button>
  </div>
</div>
<p class="hint">Жасушаның кез келген бөлігіне басыңыз немесе төмендегі белгілерді таңдаңыз.</p>

<div class="stage">
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" aria-label="Өсімдік жасушасы">
    <!-- sun & rays (photosynthesis demo) -->
    <g class="photosyn-ani">
      <circle class="sun" id="sun" cx="55" cy="40" r="18" fill="#fde047" stroke="#eab308" stroke-width="2"/>
      <line class="sunray" x1="80" y1="55" x2="200" y2="180"/>
      <line class="sunray" x1="90" y1="60" x2="220" y2="170"/>
      <line class="sunray" x1="100" y1="65" x2="240" y2="175"/>
    </g>
    <!-- cell wall -->
    <rect id="cell-wall" class="part" data-id="cell_wall" x="20" y="20" width="360" height="260" rx="30" fill="#86efac" stroke="#166534" stroke-width="3"/>
    <!-- cytoplasm -->
    <rect x="34" y="34" width="332" height="232" rx="22" fill="#f0fdf4" stroke="none" pointer-events="none"/>
    <!-- nucleus -->
    <ellipse class="part" data-id="nucleus" cx="150" cy="150" rx="55" ry="42" fill="#a78bfa" stroke="#5b21b6" stroke-width="2"/>
    <circle cx="155" cy="145" r="12" fill="#5b21b6" opacity="0.5" pointer-events="none"/>
    <text x="150" y="154" class="label" text-anchor="middle">Ядро</text>
    <!-- mitochondria -->
    <ellipse class="part" data-id="mitochondria" cx="285" cy="90" rx="40" ry="22" fill="#fb923c" stroke="#9a3412" stroke-width="2"/>
    <path d="M258 90 Q266 80 275 90 Q283 100 292 90 Q301 80 311 90" stroke="#9a3412" fill="none" stroke-width="1.5" pointer-events="none"/>
    <text x="285" y="94" class="label" text-anchor="middle">Митохондрия</text>
    <!-- chloroplast -->
    <ellipse class="part" data-id="chloroplast" cx="300" cy="200" rx="46" ry="26" fill="#4ade80" stroke="#166534" stroke-width="2"/>
    <circle cx="285" cy="200" r="5" fill="#166534" pointer-events="none"/>
    <circle cx="300" cy="196" r="5" fill="#166534" pointer-events="none"/>
    <circle cx="315" cy="202" r="5" fill="#166534" pointer-events="none"/>
    <text x="300" y="232" class="label" text-anchor="middle">Хлоропласт</text>
    <!-- ribosomes -->
    <g class="part" data-id="ribosome">
      <circle cx="85" cy="235" r="5" fill="#1d4ed8"/>
      <circle cx="100" cy="245" r="5" fill="#1d4ed8"/>
      <circle cx="75" cy="250" r="5" fill="#1d4ed8"/>
      <circle cx="110" cy="230" r="5" fill="#1d4ed8"/>
    </g>
    <text x="92" y="268" class="label" text-anchor="middle">Рибосомалар</text>
    <!-- vacuole -->
    <ellipse class="part" data-id="vacuole" cx="90" cy="80" rx="32" ry="26" fill="#67e8f9" stroke="#0e7490" stroke-width="2" opacity="0.75"/>
    <text x="90" y="84" class="label" text-anchor="middle">Вакуоль</text>
  </svg>

  <aside>
    <div class="panel" id="info">
      <h4 id="info-title">Органелланы таңдаңыз</h4>
      <p id="info-text">Суреттегі бөліктің біреуіне басыңыз немесе төмендегі белгілерді пайдаланыңыз. «🔊 Дыбыспен тыңдау» батырмасы қазақ тілінде оқып береді.</p>
      <div class="chips" id="chips"></div>
      <div class="pbtns">
        <button id="speakOne" type="button" disabled>🔊 Осы бөлікті оқу</button>
      </div>
    </div>
  </aside>
</div>
</div>
<script>
const DATA = {
  cell_wall: {title:"Жасуша қабырғасы",
    text:"Өсімдік жасушасының сыртын қоршап, қатты пішінін сақтайды. Негізінен целлюлозадан құралған. Жасушаны механикалық зақымнан және сусыздану мен артық судан қорғайды."},
  nucleus: {title:"Ядро",
    text:"Жасушаның басқару орталығы. Тұқым қуалаушылық ақпаратты, яғни ДНҚ-ны сақтайды. Белок синтезі мен жасуша бөлінуін реттейді."},
  mitochondria: {title:"Митохондрия",
    text:"Жасушаның қуат бекеті. Жасушалық тыныс алу процесінде органикалық заттарды ыдыратып, АТФ түрінде қуат бөледі."},
  chloroplast: {title:"Хлоропласт",
    text:"Фотосинтез органелласы. Құрамындағы хлорофилл күн сәулесін сіңіреді. Су мен көмірқышқыл газынан глюкоза мен оттегі түзіледі."},
  ribosome: {title:"Рибосомалар",
    text:"Белок синтездейтін ұсақ түйіршіктер. Иранс-РНҚ-дан алынған ақпарат бойынша амин қышқылдарын тізбектеп, белок молекулаларын жинақтайды."},
  vacuole: {title:"Вакуоль",
    text:"Жасуша сөлі толтырған ірі қуыс. Қоректік заттарды, тұздарды, пигменттерді сақтайды. Тургор қысымын реттеп, жасушаның тығыздығын сақтайды."}
};

const chipsEl = document.getElementById("chips");
Object.entries(DATA).forEach(([id, v]) => {
  const b = document.createElement("button");
  b.textContent = v.title;
  b.className = "chip";
  b.dataset.id = id;
  b.type = "button";
  b.addEventListener("click", () => show(id));
  chipsEl.appendChild(b);
});

let current = null;
function show(id) {
  const v = DATA[id]; if (!v) return;
  current = id;
  document.getElementById("info-title").textContent = v.title;
  document.getElementById("info-text").textContent = v.text;
  document.querySelectorAll(".part.active, .chip.active")
    .forEach(el => el.classList.remove("active"));
  document.querySelectorAll(`[data-id="${id}"]`)
    .forEach(el => el.classList.add("active"));
  document.getElementById("speakOne").disabled = false;
}
document.querySelectorAll(".part").forEach(el => {
  el.addEventListener("click", () => show(el.dataset.id));
});

// Қазақша дыбыс (Web Speech API). Егер kk-KZ дауысы жоқ болса — ru/tr дауысына түседі.
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find(v => v.lang && v.lang.toLowerCase().startsWith("kk"))
      || voices.find(v => v.lang && v.lang.toLowerCase().startsWith("ru"))
      || voices.find(v => v.lang && v.lang.toLowerCase().startsWith("tr"))
      || voices[0];
}
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "kk-KZ";
  u.rate = 0.95;
  const v = pickVoice();
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
if ("speechSynthesis" in window) {
  // voices load async in some browsers
  window.speechSynthesis.onvoiceschanged = () => {};
}
document.getElementById("speakBtn").addEventListener("click", () => {
  const intro = "Өсімдік жасушасының негізгі бөліктерімен танысайық. Әрбір органелланы шертіп, атауы мен қызметін оқыңыз.";
  speak(intro);
});
document.getElementById("speakOne").addEventListener("click", () => {
  if (!current) return;
  const v = DATA[current];
  speak(v.title + ". " + v.text);
});

// Фотосинтез демо
const photoBtn = document.getElementById("photoBtn");
let photoOn = false;
photoBtn.addEventListener("click", () => {
  photoOn = !photoOn;
  document.getElementById("sun").classList.toggle("on", photoOn);
  document.querySelectorAll(".sunray").forEach(el => el.classList.toggle("on", photoOn));
  document.querySelectorAll('[data-id="chloroplast"]').forEach(el => el.classList.toggle("pulse", photoOn));
  photoBtn.textContent = photoOn ? "☀ Жарықты өшіру" : "☀ Фотосинтезді көрсету";
  if (photoOn) {
    show("chloroplast");
    speak("Жарық түскенде хлоропласт белсенеді. Фотосинтез процесі басталады.");
  }
});
</script></body></html>"""


def run(teacher_email):
    teacher = None
    if teacher_email:
        teacher = User.objects.filter(username=teacher_email).first()
        if teacher is None:
            print(f"NOTE: teacher {teacher_email} not found; lab will be unowned")

    lab, created = Lab.objects.get_or_create(
        slug="zhasusha-qurylymy",
        defaults=dict(
            title="Өсімдік жасушасының құрылымы",
            description="Жасушаның негізгі органеллаларын зерттеңіз. Шертіп, тыңдап, тәжірибе жасаңыз.",
            animation_html=ANIMATION_HTML,
            pass_threshold=60,
            is_published=True,
            created_by=teacher,
        ),
    )
    if not created:
        lab.title = "Өсімдік жасушасының құрылымы"
        lab.description = "Жасушаның негізгі органеллаларын зерттеңіз. Шертіп, тыңдап, тәжірибе жасаңыз."
        lab.animation_html = ANIMATION_HTML
        lab.pass_threshold = 60
        lab.is_published = True
        if teacher is not None:
            lab.created_by = teacher
        lab.save()
        lab.questions.all().delete()

    questions = [
        dict(
            order=1, kind="mcq",
            prompt="Жасушаның «қуат бекеті» деп қай органелланы атайды?",
            options=["Ядро", "Митохондрия", "Рибосома", "Вакуоль"],
            correct_option=1, points=1,
        ),
        dict(
            order=2, kind="mcq",
            prompt="Фотосинтез процесі қайда жүреді?",
            options=["Ядрода", "Митохондрияда", "Хлоропластта", "Рибосомада"],
            correct_option=2, points=1,
        ),
        dict(
            order=3, kind="mcq",
            prompt="Белок синтезі үшін жауапты органелла:",
            options=["Хлоропласт", "Вакуоль", "Рибосома", "Жасуша қабырғасы"],
            correct_option=2, points=1,
        ),
        dict(
            order=4, kind="text", options=[], correct_option=None, points=0,
            prompt="Жасуша қабырғасы мен цитоплазмалық мембрананың айырмашылығын қысқаша түсіндіріңіз.",
        ),
        dict(
            order=5, kind="text", options=[], correct_option=None, points=0,
            prompt="Егер хлоропласттар жұмыс істемей қалса, өсімдік жасушасына не болады? Себебін көрсетіңіз.",
        ),
    ]
    for q in questions:
        Question.objects.create(lab=lab, **q)

    session = None
    if teacher is not None:
        session, _ = LabSession.objects.get_or_create(
            lab=lab, teacher=teacher, is_active=True,
            defaults=dict(title="Демо сабақ"),
        )

    print(
        f"OK: lab {'created' if created else 'updated'} id={lab.id} "
        f"slug={lab.slug} questions={lab.questions.count()} "
        f"teacher={teacher.email if teacher else '—'} "
        f"session_code={session.code if session else '—'}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--teacher", help="Teacher email to own this lab")
    args = parser.parse_args()
    run(args.teacher)
