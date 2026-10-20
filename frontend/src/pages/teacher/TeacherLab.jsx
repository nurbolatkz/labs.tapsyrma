import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../../api.js";
import { getLab } from "../../labs/index.js";
import ShareLink from "../../components/ShareLink.jsx";
import { formatDate, fromLocalInput, toLocalInput } from "../../format.js";
import { statusText } from "./Dashboard.jsx";
import NotFound from "../NotFound.jsx";

export default function TeacherLab() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(location.state?.created ? "Зертхана ашылды. Сілтемені оқушыларға беріңіз." : "");

  function load() {
    return api.results(id).then((d) => {
      setData(d);
      setForm({ title: d.lab.title, className: d.lab.className, deadline: toLocalInput(d.lab.deadline), isOpen: d.lab.isOpen });
    });
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <NotFound message={error} />;
  if (!data || !form) return <div className="page-loading">Жүктелуде…</div>;
  const { lab, results } = data;
  const def = getLab(lab.kind);

  async function save(patch = {}) {
    setSaving(true);
    setMessage("");
    try {
      const next = { ...form, ...patch };
      await api.updateLab(id, { ...next, deadline: fromLocalInput(next.deadline) });
      await load();
      setMessage("Өзгерістер сақталды.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }

  const avg = results.length ? Math.round(results.reduce((n, r) => n + (r.score / r.maxScore) * 100, 0) / results.length) : null;
  const max = def?.points ?? results[0]?.maxScore ?? 0;
  const distribution = Array.from({ length: max + 1 }, (_, s) => results.filter((r) => r.score === s).length);
  const peak = Math.max(1, ...distribution);

  return (
    <div className="container section" style={{ "--accent": def?.accent, "--tint": def?.tint }}>
      <nav className="breadcrumb" aria-label="Жол"><Link to="/teacher">Кабинет</Link> › {lab.title}</nav>
      <div className="page-head row">
        <div>
          <div className="lab-card-meta">
            <span className={`badge ${lab.status}`}>{statusText[lab.status]}</span>
            <span>{lab.className} сынып</span>
            <span>{def?.title}</span>
          </div>
          <h1>{lab.title}</h1>
        </div>
        <div className="toolbar">
          <Link className="btn" to={`/labs/${lab.kind}/demo`}>Демо көру</Link>
          <button className="btn" disabled={saving} onClick={() => save({ isOpen: !lab.isOpen })}>
            {lab.isOpen ? "Тапсыруды жабу" : "Қайта ашу"}
          </button>
        </div>
      </div>
      {message && <p className="notice info">{message}</p>}

      <div className="teacher-grid">
        <div>
          <section className="card">
            <div className="card-head">
              <h2>Оқушылардың жұмыстары</h2>
              <a className="btn small" href={api.csvUrl(id)} download>CSV жүктеу ↓</a>
            </div>
            <div className="stat-row">
              <div><span>Жұмыс саны</span><b>{results.length}</b></div>
              <div><span>Орташа нәтиже</span><b>{avg === null ? "—" : `${avg}%`}</b></div>
              <div className="distribution" aria-label="Балл бойынша бөліну">
                {distribution.map((n, s) => (
                  <div key={s} title={`${s} балл: ${n} оқушы`}>
                    <i style={{ height: `${(n / peak) * 100}%` }} />
                    <small>{s}</small>
                  </div>
                ))}
              </div>
            </div>
            {results.length === 0 ? (
              <div className="empty-page small">
                <p>Әзірге жұмыс тапсырылған жоқ. Оқушыларға сілтемені немесе QR-кодты беріңіз.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table results">
                  <thead>
                    <tr><th>Оқушы</th><th>Сынып</th><th>Балл</th><th>Тапсырған уақыты</th><th /></tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id}>
                        <td><b>{r.name}</b></td>
                        <td>{r.className}</td>
                        <td><span className="score-pill">{r.score} / {r.maxScore}</span></td>
                        <td>{formatDate(r.submittedAt)}</td>
                        <td><Link className="btn small" to={`/teacher/submissions/${r.id}`}>Ашу</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        <aside>
          <section className="card pad">
            <h2>Оқушыларға беру</h2>
            <ShareLink labId={lab.id} />
          </section>
          <form className="card pad" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <h2>Параметрлер</h2>
            <label className="field">Атауы
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={2} maxLength={120} />
            </label>
            <label className="field">Сынып
              <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required maxLength={30} />
            </label>
            <label className="field">Соңғы мерзім
              <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </label>
            <label className="control toggle">
              <input type="checkbox" checked={form.isOpen} onChange={(e) => setForm({ ...form, isOpen: e.target.checked })} />
              <span>Тапсыру ашық</span>
            </label>
            <button className="btn primary" disabled={saving}>{saving ? "Сақталуда…" : "Сақтау"}</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
