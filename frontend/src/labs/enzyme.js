// Amylase activity at different pH and temperature. Payload matches validate_submission("enzyme") in server.py.
const colorOptions = [
  { value: "blue", label: "көк-қара", swatch: "#17264e" },
  { value: "purple", label: "күлгін", swatch: "#8942ad" },
  { value: "gold", label: "сары-қоңыр", swatch: "#d8a21d" },
];

const tubes = [
  { id: "ph1", label: "1 · Лимон қышқылы", group: "pH тұғыры" },
  { id: "ph2", label: "2 · Ас содасы", group: "pH тұғыры" },
  { id: "ph3", label: "3 · Су (бақылау)", group: "pH тұғыры" },
  { id: "tempA", label: "А · Мұзды су", group: "Температура тұғыры" },
  { id: "tempAe", label: "Ә · 55–60°C", group: "Температура тұғыры" },
  { id: "tempB", label: "Б · 36–38°C", group: "Температура тұғыры" },
];

export default {
  kind: "enzyme",
  title: "Ферменттердің белсенділігі: температура және pH",
  short: "Сілекей амилазасының крахмалды ыдыратуын йод сынамасы арқылы зерттеу.",
  topic: "Зат алмасу",
  grade: "9",
  duration: "30 мин",
  points: 6,
  accent: "#176c99",
  tint: "#e7f5fd",
  cover: "/images/enzyme/cover.svg",
  goal: "Амилаза ферментінің белсенділігіне орта қышқылдығы (pH) мен температураның әсерін анықтау.",
  question: "Амилаза қандай температурада және қандай ортада крахмалды жақсы ыдыратады?",
  equipment: ["Крахмал ерітіндісі", "Сілекей (амилаза)", "Лимон қышқылы, ас содасы, су", "Мұзды, жылы (36–38°C) және ыстық (55–60°C) су", "Йод ерітіндісі, 6 сынауық"],
  theory: [
    "Амилаза — сілекейдегі фермент. Ол крахмалды қантқа (мальтозаға) дейін ыдыратады.",
    "Йод крахмалмен әрекеттесіп, көк-қара түс береді. Крахмал толық ыдыраса, ерітінді йодтың сары-қоңыр түсінде қалады. Күлгін түс крахмалдың ішінара ыдырағанын көрсетеді.",
    "Ферменттер — нәруыздар. Олар белгілі бір температура мен pH аралығында ғана жақсы жұмыс істейді. Қатты қыздырғанда нәруыздың құрылымы бұзылады.",
  ],
  theoryImage: { src: "/images/enzyme/setup.svg", alt: "Екі тұғырдағы алты сынауық және йод тамызғыш" },
  steps: ["Болжам жаса", "Әр сынауыққа йод тамыз", "Түсті кестеге белгіле", "Нәтижелерді салыстыр", "Қорытынды жаз"],
  inspiredBy: [
    { name: "Amrita OLabs — ферменттер белсенділігі", url: "https://amrita.olabs.edu.in/" },
    { name: "PhET Interactive Simulations (CC BY 4.0)", url: "https://phet.colorado.edu/" },
  ],

  animation: "/animations/enzyme.html",
  sequential: false,
  controls: [],
  stages: tubes.map((t) => ({ id: t.id, label: t.label, group: t.group, action: "Йод тамызу" })),

  tasks: [
    {
      id: "prediction",
      type: "choiceTable",
      title: "Болжам: амилаза қай жерде жақсы жұмыс істейді?",
      points: 1,
      rows: [
        { id: "ph", label: "pH", options: [{ value: "acid", label: "Лимон қышқылында" }, { value: "water", label: "Су қосылған бақылау сынауығында" }] },
        { id: "temp", label: "Температура", options: [{ value: "ice", label: "Мұзды суда" }, { value: "warm", label: "36–38°C жылы суда" }, { value: "hot", label: "55–60°C ыстық суда" }] },
      ],
    },
    {
      id: "colorsPh",
      type: "choiceTable",
      title: "pH тұғыры: йодтан кейінгі түсті белгіле",
      points: 1,
      rows: tubes.slice(0, 3).map((t) => ({ id: t.id, label: t.label, options: colorOptions })),
    },
    {
      id: "colorsTemp",
      type: "choiceTable",
      title: "Температура тұғыры: йодтан кейінгі түсті белгіле",
      points: 1,
      rows: tubes.slice(3).map((t) => ({ id: t.id, label: t.label, options: colorOptions })),
    },
    {
      id: "comparison",
      type: "gapfill",
      title: "Салыстыру",
      points: 1,
      keywords: ["36–38", "бейтарап", "сары-қоңыр"],
      parts: ["Амилаза ", { id: "temperature", size: "short" }, " °C-та және ", { id: "medium" }, " ортада белсенді болды, себебі ол сынауықта түс ", { id: "color" }, " болды."],
    },
    {
      id: "conclusion",
      type: "gapfill",
      title: "Қорытынды",
      points: 2,
      keywords: ["нәруыз", "бұзылады", "расталды", "расталмады"],
      parts: [
        "Ыстық суда крахмал ыдырамады, себебі амилаза – ", { id: "protein" }, ", ыстықта оның құрылымы ", { id: "change" }, ". ",
        "Менің болжамым ", { id: "prediction" }, ", себебі ", { id: "reason", size: "long", placeholder: "Болжамыңды тәжірибе нәтижесімен салыстыр…" },
      ],
    },
  ],

  isComplete(a) {
    const filled = (obj, keys) => keys.every((k) => String(obj?.[k] || "").trim());
    return filled(a.prediction, ["ph", "temp"]) && filled(a.colorsPh, ["ph1", "ph2", "ph3"]) &&
      filled(a.colorsTemp, ["tempA", "tempAe", "tempB"]) && filled(a.comparison, ["temperature", "medium", "color"]) &&
      filled(a.conclusion, ["protein", "change", "prediction"]) && String(a.conclusion?.reason || "").trim().length >= 10;
  },

  toPayload(a) {
    return {
      answers: {
        predictionPh: a.prediction?.ph,
        predictionTemp: a.prediction?.temp,
        colors: { ...a.colorsPh, ...a.colorsTemp },
        comparison: a.comparison,
        conclusion: a.conclusion,
      },
    };
  },

  fromPayload(p) {
    const a = p.answers || {};
    const colors = a.colors || {};
    return {
      answers: {
        prediction: { ph: a.predictionPh, temp: a.predictionTemp },
        colorsPh: { ph1: colors.ph1, ph2: colors.ph2, ph3: colors.ph3 },
        colorsTemp: { tempA: colors.tempA, tempAe: colors.tempAe, tempB: colors.tempB },
        comparison: a.comparison,
        conclusion: a.conclusion,
      },
      captures: {},
    };
  },
};
