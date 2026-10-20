import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { getLab } from "../../labs/index.js";
import { CopyButton, studentUrl } from "../../components/ShareLink.jsx";
import { formatDate } from "../../format.js";

export const statusText = { open: "Ашық", closed: "Жабық", expired: "Мерзімі өтті" };

export default function Dashboard() {
  const { teacher } = useAuth();
  const [labs, setLabs] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.teacherLabs().then((d) => setLabs(d.labs)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="container section"><p className="notice error">{error}</p></div>;
  if (!labs) return <div className="page-loading">Жүктелуде…</div>;

  const totalResults = labs.reduce((n, l) => n + l.resultCount, 0);
  const scored = labs.filter((l) => l.avgPercent !== null && l.avgPercent !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((n, l) => n + l.avgPercent * l.resultCount, 0) / Math.max(1, scored.reduce((n, l) => n + l.resultCount, 0))) : null;
  const shown = filter === "all" ? labs : labs.filter((l) => (filter === "open" ? l.accepting : !l.accepting));

  return (
    <div className="container section">
      <div className="page-head row">
        <div>
          <div className="eyebrow">Мұғалім кабинеті</div>
          <h1>Сәлеметсіз бе, {teacher.name}</h1>
          <p className="lead">Сыныпқа зертхана ашыңыз, сілтемені беріңіз және нәтижелерді осы жерден қараңыз.</p>
        </div>
        <Link to="/teacher/labs/new" className="btn primary large">+ Жаңа зертхана</Link>
      </div>

      <div className="stat-grid">
        <div className="stat"><span>Зертханалар</span><b>{labs.length}</b></div>
        <div className="stat"><span>Қазір ашық</span><b>{labs.filter((l) => l.accepting).length}</b></div>
        <div className="stat"><span>Тапсырылған жұмыс</span><b>{totalResults}</b></div>
        <div className="stat"><span>Орташа нәтиже</span><b>{avg === null ? "—" : `${avg}%`}</b></div>
      </div>

      <div className="filters">
        {[["all", "Барлығы"], ["open", "Ашық"], ["closed", "Жабық / мерзімі өткен"]].map(([id, label]) => (
          <button key={id} className={`chip ${filter === id ? "on" : ""}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card pad empty-page">
          <p>Бұл сүзгі бойынша зертхана жоқ.</p>
          <Link to="/teacher/labs/new" className="btn primary">Зертхана ашу</Link>
        </div>
      ) : (
        <div className="teacher-labs">
          {shown.map((l) => {
            const def = getLab(l.kind);
            return (
              <article className="teacher-lab card" key={l.id} style={{ "--accent": def?.accent, "--tint": def?.tint }}>
                <img src={def?.cover} alt="" />
                <div className="teacher-lab-body">
                  <div className="lab-card-meta">
                    <span className={`badge ${l.status}`}>{statusText[l.status]}</span>
                    <span>{l.className} сынып</span>
                    <span>{l.deadline ? `Мерзім: ${formatDate(l.deadline)}` : "Мерзімсіз"}</span>
                  </div>
                  <h3><Link to={`/teacher/labs/${l.id}`}>{l.title}</Link></h3>
                  <p className="muted-text">{def?.title}</p>
                </div>
                <div className="teacher-lab-count">
                  <b>{l.resultCount}</b>
                  <span>жұмыс</span>
                  {l.avgPercent !== null && l.avgPercent !== undefined && <small>орташа {Math.round(l.avgPercent)}%</small>}
                </div>
                <div className="teacher-lab-actions">
                  <Link to={`/teacher/labs/${l.id}`} className="btn small primary">Нәтижелер</Link>
                  <CopyButton text={studentUrl(l.id)} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
