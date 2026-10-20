// Mitosis in onion root tip cells. Scored by the generic validator (LAB_SPECS) in server.py.
import { genericPayload } from "./generic.js";

const phaseOptions = [
  { value: "prophase", label: "Профаза" },
  { value: "metaphase", label: "Метафаза" },
  { value: "anaphase", label: "Анафаза" },
  { value: "telophase", label: "Телофаза" },
];

// Sample images are named by letter so the file name does not reveal the answer.
const samples = ["a", "b", "c", "d"];

export default {
  kind: "mitosis",
  title: "Пияз тамыры ұшындағы митоз",
  short: "Митоз кезеңдерін анимациядан бақылап, микропрепарат суреттерінен ажырату.",
  topic: "Жасуша",
  grade: "9",
  duration: "25 мин",
  points: 6,
  accent: "#6a4bb3",
  tint: "#f1ecfb",
  cover: "/images/mitosis/cover.svg",
  goal: "Митоздың кезеңдерін және әр кезеңде хромосомалардың қалай өзгеретінін анықтау.",
  question: "Бір жасушадан хромосома саны бірдей екі жасуша қалай пайда болады?",
  equipment: ["Пияз тамырының ұшынан дайындалған препарат", "Микроскоп", "Ацетокармин бояуы", "Заттық және жабын шыны"],
  theory: [
    "Митоз — дене жасушаларының бөлінуі. Нәтижесінде хромосома саны аналық жасушамен бірдей екі жас жасуша түзіледі.",
    "Бөлінуге дейін интерфаза өтеді: ДНҚ екі еселенеді. Содан кейін профаза, метафаза, анафаза және телофаза кезеңдері жүреді.",
    "Тамырдың ұшында белсенді бөлінетін ұлпа — меристема орналасқан, сондықтан митоздың барлық кезеңін сол жерден көруге болады. Пияз жасушасында 2n = 16 хромосома бар.",
  ],
  theoryImage: { src: "/images/mitosis/root-tip.svg", alt: "Пияз тамырының ұшы және меристема аймағы" },
  steps: ["Анимациядан митоз кезеңдерін бақыла", "Әр кезеңнің түсіндірмесін тыңда", "Препарат суреттеріндегі кезеңдерді анықта", "Кезеңдерді ретімен орналастыр", "Қорытынды жаз"],
  inspiredBy: [
    { name: "Amrita OLabs — пияз тамырындағы митоз", url: "https://amrita.olabs.edu.in/" },
    { name: "LabXchange — Mitosis", url: "https://www.labxchange.org/" },
  ],

  animation: "/animations/mitosis.html",
  sequential: true,
  controls: [{ id: "labels", type: "toggle", label: "Құрылым атауларын көрсету", default: true }],
  stages: [
    { id: "interphase", label: "Интерфаза", action: "Интерфаза" },
    { id: "prophase", label: "Профаза", action: "Профаза" },
    { id: "metaphase", label: "Метафаза", action: "Метафаза" },
    { id: "anaphase", label: "Анафаза", action: "Анафаза" },
    { id: "telophase", label: "Телофаза", action: "Телофаза" },
  ],

  tasks: [
    {
      id: "identify",
      type: "choiceTable",
      title: "Препарат суреттеріндегі жасуша қай кезеңде тұр?",
      text: "Микроскоптағы әр жасушаны қарап, оның кезеңін таңда.",
      points: 2,
      rows: samples.map((s) => ({ id: s, label: `${s.toUpperCase()} жасуша`, image: `/images/mitosis/sample-${s}.svg`, options: phaseOptions })),
    },
    {
      id: "order",
      type: "choiceTable",
      title: "Митоз кезеңдерін дұрыс ретпен орналастыр",
      points: 1,
      rows: ["1", "2", "3", "4"].map((n) => ({ id: `pos${n}`, label: `${n}-кезең`, options: phaseOptions })),
    },
    {
      id: "m1",
      type: "choice",
      title: "Митозды неге пияз тамырының ұшынан зерттейміз?",
      points: 1,
      options: [
        { value: "meristem", label: "Онда белсенді бөлінетін ұлпа — меристема бар" },
        { value: "big", label: "Онда жасушалар ең ірі" },
        { value: "green", label: "Онда хлоропластар көп" },
      ],
    },
    {
      id: "m2",
      type: "choice",
      title: "Пияз жасушасында 16 хромосома бар. Митоздан кейін әр жас жасушада неше хромосома болады?",
      points: 1,
      options: [
        { value: "8", label: "8" },
        { value: "16", label: "16" },
        { value: "32", label: "32" },
      ],
    },
    {
      id: "m3",
      type: "choice",
      title: "Анафаза кезінде не болады?",
      points: 1,
      options: [
        { value: "separate", label: "Хроматидтер ажырап, жасушаның қарама-қарсы полюстеріне тартылады" },
        { value: "line", label: "Хромосомалар жасушаның ортасында бір қатарға тізіледі" },
        { value: "membrane", label: "Ядро қабықшасы қайта түзіледі" },
      ],
    },
    {
      id: "conclusion",
      type: "text",
      title: "Қорытынды: митоздың маңызы неде?",
      placeholder: "Митоз нәтижесінде ... жасуша түзіледі. Олардағы хромосома саны ... . Бұл ... үшін маңызды.",
      minLength: 20,
      maxLength: 3000,
    },
  ],

  ...genericPayload(["identify", "order", "m1", "m2", "m3"], {
    identify: samples,
    order: ["pos1", "pos2", "pos3", "pos4"],
  }),
};
