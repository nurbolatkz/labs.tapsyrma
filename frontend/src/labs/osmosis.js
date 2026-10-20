// Osmosis in red onion epidermis. Payload format matches validate_submission("osmosis") in server.py.
const hypotheses = [
  "Жасуша ішіндегі протопласт жиырылады",
  "Жасуша қабырғасы үлкейеді",
  "Еш өзгеріс болмайды",
];

const captureStages = ["water", "salt", "rinse"];

export default {
  kind: "osmosis",
  title: "Өсімдік жасушасындағы осмос",
  short: "Қызыл пияз эпидермисінде плазмолиз бен деплазмолизді микроскоппен бақылау.",
  topic: "Жасуша",
  grade: "9",
  duration: "25 мин",
  points: 3,
  accent: "#8a3d73",
  tint: "#f8ebf3",
  cover: "/images/osmosis/cover.svg",
  goal: "Сыртқы ерітіндінің концентрациясы өзгергенде өсімдік жасушасына су қалай кіріп-шығатынын бақылау.",
  question: "Сыртқы ерітінді өзгерсе, өсімдік жасушасының ішіндегі су қай бағытта қозғалады?",
  equipment: ["Қызыл пияз эпидермисі", "Микроскоп, заттық және жабын шыны", "Таза су", "NaCl ерітіндісі (2–8%)", "Сүзгі қағаз"],
  theory: [
    "Осмос — судың жартылай өткізгіш мембрана арқылы концентрациясы төмен ерітіндіден концентрациясы жоғары ерітіндіге қарай өтуі.",
    "Тұз ерітіндісінде су жасушадан шығады: вакуоль кішірейіп, протопласт жасуша қабырғасынан ажырайды. Бұл — плазмолиз.",
    "Жасушаны қайта таза суға салғанда су ішке енеді, протопласт қалпына келеді. Бұл — деплазмолиз. Жасуша қабырғасы берік болғандықтан, пішінін сақтайды.",
  ],
  theoryImage: { src: "/images/osmosis/cell-parts.svg", alt: "Өсімдік жасушасының бөліктері: қабырға, протопласт, вакуоль, ядро" },
  steps: ["Болжам жаса", "Таза судағы жасушаны бақыла", "NaCl ерітіндісін тамыз", "Таза сумен шай", "Сұрақтарға жауап беріп, қорытынды жаз"],
  inspiredBy: [
    { name: "Amrita OLabs — биология зертханалары (плазмолиз)", url: "https://amrita.olabs.edu.in/" },
    { name: "LabXchange — жасуша биологиясы", url: "https://www.labxchange.org/" },
  ],

  animation: "/animations/osmosis.html",
  sequential: true,
  controls: [
    { id: "concentration", type: "range", label: "NaCl концентрациясы", min: 2, max: 8, step: 1, unit: "%", default: 4, lockAfter: "salt" },
    { id: "labels", type: "toggle", label: "Жасуша бөліктерінің атауы", default: true },
  ],
  stages: [
    { id: "water", label: "Таза су", action: "Таза су тамызу", capture: true, hint: "Таза судағы жасушаның вакуолі…" },
    { id: "salt", label: "NaCl ерітіндісі", action: "Тұз ерітіндісін тамызу", capture: true, hint: "Жасуша қабырғасы мен протопласт арасында…" },
    { id: "rinse", label: "Таза сумен шаю", action: "Таза сумен шаю", capture: true, hint: "Таза сумен шайғаннан кейін…" },
  ],

  tasks: [
    {
      id: "hypothesis",
      type: "choice",
      title: "Болжам: тұз ерітіндісін қосқанда жасушада не болады?",
      options: hypotheses.map((label) => ({ value: label, label })),
    },
    {
      id: "observations",
      type: "observations",
      title: "Бақылау журналы",
      text: "Әр кезеңнен кейін микроскоптағы көріністі сақтап, не байқағаныңды жаз.",
      stages: captureStages,
    },
    {
      id: "q1",
      type: "choice",
      title: "Тұз ерітіндісін қосқанда су қай бағытта қозғалды?",
      points: 1,
      options: [
        { value: "out", label: "Жасушадан сыртқы ортаға" },
        { value: "in", label: "Сыртқы ортадан жасушаға" },
        { value: "none", label: "Су қозғалған жоқ" },
      ],
    },
    {
      id: "q2",
      type: "choice",
      title: "Плазмолиз кезінде жасушаның қай бөлігі кішірейеді?",
      points: 1,
      layout: "grid",
      options: [
        { value: "wall", label: "Жасуша қабырғасы", image: "/images/osmosis/option-wall.svg" },
        { value: "vacuole", label: "Вакуоль және протопласт", image: "/images/osmosis/option-vacuole.svg" },
        { value: "all", label: "Барлық құрылым бірдей", image: "/images/osmosis/option-all.svg" },
      ],
    },
    {
      id: "q3",
      type: "choice",
      title: "Таза суда протопласттың қалпына келуі қалай аталады?",
      points: 1,
      options: [
        { value: "diffusion", label: "Фотосинтез" },
        { value: "plasmolysis", label: "Плазмолиз" },
        { value: "deplasmolysis", label: "Деплазмолиз" },
      ],
    },
    {
      id: "conclusion",
      type: "text",
      title: "Қорытынды: байқағаныңды өз сөзіңмен түсіндір",
      placeholder: "Тұз қосқанда ... байқадым. Себебі ... . Таза сумен шайғаннан кейін ...",
      minLength: 20,
      maxLength: 3000,
    },
  ],

  isComplete(answers, captures) {
    return captureStages.every((s) => captures[s]?.note?.trim().length >= 8) &&
      !!answers.hypothesis && ["q1", "q2", "q3"].every((q) => answers[q]) &&
      (answers.conclusion || "").trim().length >= 20;
  },

  toPayload(answers, captures) {
    return {
      hypothesis: answers.hypothesis,
      captures: captureStages.map((kind) => ({
        kind,
        note: captures[kind]?.note || "",
        concentration: kind === "salt" ? Number(captures[kind]?.params?.concentration || 0) : 0,
        image: captures[kind]?.image,
      })),
      answers: { q1: answers.q1, q2: answers.q2, q3: answers.q3 },
      conclusion: answers.conclusion,
    };
  },

  fromPayload(p) {
    const captures = {};
    for (const c of p.captures || []) captures[c.kind] = { note: c.note, image: c.image, params: { concentration: c.concentration } };
    return { answers: { hypothesis: p.hypothesis, ...(p.answers || {}), conclusion: p.conclusion }, captures };
  },
};
