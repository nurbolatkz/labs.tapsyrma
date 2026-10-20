import { useState } from "react";
import { labs, topics } from "../labs/index.js";
import LabCard from "../components/LabCard.jsx";

export default function Catalog() {
  const [topic, setTopic] = useState("");
  const shown = topic ? labs.filter((lab) => lab.topic === topic) : labs;
  return (
    <div className="container section">
      <div className="page-head">
        <div className="eyebrow">Каталог</div>
        <h1>Зертханалық жұмыстар</h1>
        <p className="lead">Әр жұмыста анимация, кезеңдік қазақша түсіндірме және тапсырмалар бар. Демо режимінде тіркелусіз көріп шығуға болады.</p>
      </div>
      <div className="filters" role="group" aria-label="Тақырып бойынша сүзу">
        <button className={`chip ${topic === "" ? "on" : ""}`} onClick={() => setTopic("")}>Барлығы · {labs.length}</button>
        {topics.map((t) => (
          <button key={t} className={`chip ${topic === t ? "on" : ""}`} onClick={() => setTopic(t)}>
            {t} · {labs.filter((lab) => lab.topic === t).length}
          </button>
        ))}
      </div>
      <div className="lab-grid">
        {shown.map((lab) => <LabCard key={lab.kind} lab={lab} />)}
      </div>
    </div>
  );
}
