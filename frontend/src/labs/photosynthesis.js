// Light intensity and photosynthesis in Elodea. Scored by the generic validator (LAB_SPECS) in server.py.
import { genericPayload } from "./generic.js";

const distances = [10, 20, 30, 40];

export default {
  kind: "photosynthesis",
  title: "Жарық қарқындылығы және фотосинтез",
  short: "Элодея өсімдігінен бөлінетін оттегі көпіршіктерін шамның әр қашықтығында санау.",
  topic: "Өсімдік физиологиясы",
  grade: "9",
  duration: "30 мин",
  points: 5,
  accent: "#2f7d3b",
  tint: "#eaf6e8",
  cover: "/images/photosynthesis/cover.svg",
  goal: "Жарық көзінің қашықтығы (жарық қарқындылығы) фотосинтез жылдамдығына қалай әсер ететінін анықтау.",
  question: "Шам өсімдікке жақындаған сайын фотосинтез жылдамдығы қалай өзгереді?",
  equipment: ["Элодея бұтағы", "Су құйылған сынауық немесе стақан", "Ас содасы ерітіндісі (NaHCO₃)", "Үстел шамы, сызғыш", "Секундомер"],
  theory: [
    "Фотосинтез кезінде өсімдік жарық энергиясын пайдаланып, көмірқышқыл газы мен судан глюкоза түзеді және оттегі бөледі: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.",
    "Суға батырылған элодея бөлген оттегі сабақтың кесілген жерінен көпіршік болып шығады. Бір минуттағы көпіршік саны фотосинтез жылдамдығын көрсетеді.",
    "Шам алыстаған сайын өсімдікке түсетін жарық азаяды. Суға қосылған ас содасы өсімдікті көмірқышқыл газымен қамтамасыз етеді.",
  ],
  theoryImage: { src: "/images/photosynthesis/setup.svg", alt: "Элодея салынған сынауық, оның жанында сызғыш пен шам" },
  steps: ["Болжам жаса", "Шамды 10, 20, 30, 40 см қашықтыққа қой", "Әр жолы 1 минуттағы көпіршікті сана", "Кесте мен графикті толтыр", "Қорытынды жаз"],
  inspiredBy: [
    { name: "Amrita OLabs — фотосинтезге жарықтың әсері", url: "https://amrita.olabs.edu.in/" },
    { name: "LabXchange — Photosynthesis", url: "https://www.labxchange.org/" },
  ],

  animation: "/animations/photosynthesis.html",
  sequential: false,
  controls: [],
  stages: distances.map((d) => ({ id: `d${d}`, label: `${d} см`, action: `Шамды ${d} см-ге қою` })),

  tasks: [
    {
      id: "hypothesis",
      type: "choice",
      title: "Болжам: шам өсімдікке жақындаса, көпіршік саны қалай өзгереді?",
      options: [
        { value: "up", label: "Артады" },
        { value: "down", label: "Азаяды" },
        { value: "same", label: "Өзгермейді" },
      ],
    },
    {
      id: "bubbles",
      type: "numberTable",
      title: "Нәтижелер кестесі: 1 минуттағы көпіршік саны",
      text: "Анимациядағы санауышты қарап, әр қашықтықтағы нәтижені жаз. Төмендегі график өздігінен салынады.",
      points: 1,
      columnLabel: "Шамға дейінгі қашықтық",
      valueLabel: "Көпіршік / мин",
      chart: true,
      rows: distances.map((d) => ({ id: `d${d}`, label: `${d} см` })),
    },
    {
      id: "p1",
      type: "choice",
      title: "Көпіршіктерде қандай газ бар?",
      points: 1,
      options: [
        { value: "oxygen", label: "Оттегі (O₂)" },
        { value: "co2", label: "Көмірқышқыл газы (CO₂)" },
        { value: "nitrogen", label: "Азот (N₂)" },
      ],
    },
    {
      id: "p2",
      type: "choice",
      title: "Графикке қара: шам алыстаған сайын фотосинтез жылдамдығы қалай өзгереді?",
      points: 1,
      options: [
        { value: "down", label: "Азаяды" },
        { value: "up", label: "Артады" },
        { value: "same", label: "Өзгермейді" },
      ],
    },
    {
      id: "p3",
      type: "choice",
      title: "Бұл тәжірибедегі тәуелсіз айнымалы (біз өзгерткен шама) қайсы?",
      points: 1,
      options: [
        { value: "bubbles", label: "Көпіршік саны" },
        { value: "light", label: "Шамның қашықтығы (жарық қарқындылығы)" },
        { value: "water", label: "Судың көлемі" },
      ],
    },
    {
      id: "p4",
      type: "choice",
      title: "Суға ас содасын (NaHCO₃) не үшін қосамыз?",
      points: 1,
      options: [
        { value: "co2", label: "Өсімдікті көмірқышқыл газымен қамтамасыз ету үшін" },
        { value: "light", label: "Жарықты күшейту үшін" },
        { value: "warm", label: "Суды жылыту үшін" },
      ],
    },
    {
      id: "conclusion",
      type: "text",
      title: "Қорытынды: жарық қарқындылығы фотосинтезге қалай әсер етеді?",
      placeholder: "Шам жақын тұрғанда ... көпіршік бөлінді, ал алыс тұрғанда ... . Себебі ...",
      minLength: 20,
      maxLength: 3000,
    },
  ],

  ...genericPayload(["hypothesis", "bubbles", "p1", "p2", "p3", "p4"], {
    bubbles: distances.map((d) => `d${d}`),
  }),
};
