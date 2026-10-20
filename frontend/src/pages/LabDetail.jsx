import { Link, useParams } from "react-router-dom";
import { getLab } from "../labs/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ArrowIcon } from "../components/Icons.jsx";
import NotFound from "./NotFound.jsx";

export default function LabDetail() {
  const { kind } = useParams();
  const lab = getLab(kind);
  const { teacher } = useAuth();
  if (!lab) return <NotFound />;

  return (
    <div className="lab-detail" style={{ "--accent": lab.accent, "--tint": lab.tint }}>
      <section className="lab-hero">
        <div className="container lab-hero-inner">
          <div>
            <nav className="breadcrumb" aria-label="Жол"><Link to="/labs">Зертханалар</Link> › {lab.topic}</nav>
            <h1>{lab.title}</h1>
            <p className="lead">{lab.short}</p>
            <div className="facts">
              <span><b>{lab.grade}</b> сынып</span>
              <span><b>{lab.duration}</b></span>
              <span><b>{lab.points}</b> балл</span>
              <span><b>{lab.stages.length}</b> анимация кезеңі</span>
            </div>
            <div className="hero-actions">
              <Link to={`/labs/${lab.kind}/demo`} className="btn primary large">Демо режимінде ашу <ArrowIcon /></Link>
              <Link to={teacher ? `/teacher/labs/new?kind=${lab.kind}` : "/register"} className="btn large">Сыныпқа тапсыру</Link>
            </div>
          </div>
          <img className="lab-hero-cover" src={lab.cover} alt="" />
        </div>
      </section>

      <div className="container detail-grid">
        <div>
          <section className="card pad">
            <h2>Жұмыстың мақсаты</h2>
            <p>{lab.goal}</p>
            <div className="research-question">
              <span>Зерттеу сұрағы</span>
              <p>{lab.question}</p>
            </div>
          </section>
          <section className="card pad">
            <h2>Қысқаша теория</h2>
            {lab.theory.map((t, i) => <p key={i}>{t}</p>)}
            {lab.theoryImage && (
              <figure className="theory-figure">
                <img src={lab.theoryImage.src} alt={lab.theoryImage.alt} />
                <figcaption>{lab.theoryImage.alt}</figcaption>
              </figure>
            )}
          </section>
        </div>
        <aside>
          <section className="card pad">
            <h2>Жұмыс барысы</h2>
            <ol className="step-list">
              {lab.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>
          <section className="card pad">
            <h2>Құрал-жабдықтар</h2>
            <ul className="plain-list">
              {lab.equipment.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </section>
          <section className="card pad muted-card">
            <h2>Шабыт көздері</h2>
            <p className="small">Мазмұн, суреттер мен анимациялар қазақ тілінде жаңадан жасалды. Құрылымы мына ашық оқу зертханаларынан алынды:</p>
            <ul className="plain-list">
              {lab.inspiredBy.map((s) => (
                <li key={s.name}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
