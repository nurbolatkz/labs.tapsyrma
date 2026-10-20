import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api.js";
import { getLab, labs } from "../../labs/index.js";
import { fromLocalInput } from "../../format.js";

export default function NewLab() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initial = getLab(params.get("kind")) ? params.get("kind") : labs[0].kind;
  const [form, setForm] = useState({ kind: initial, title: getLab(initial).title, className: "9 А", deadline: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function choose(kind) {
    const wasDefault = labs.some((l) => l.title === form.title);
    setForm({ ...form, kind, title: wasDefault ? getLab(kind).title : form.title });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { lab } = await api.createLab({ ...form, deadline: fromLocalInput(form.deadline) });
      navigate(`/teacher/labs/${lab.id}`, { state: { created: true } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="container section">
      <nav className="breadcrumb" aria-label="Жол"><Link to="/teacher">Кабинет</Link> › Жаңа зертхана</nav>
      <div className="page-head">
        <h1>Сыныпқа зертхана ашу</h1>
        <p className="lead">Тәжірибені таңдап, сынып пен мерзімді белгілеңіз. Сақтағаннан кейін оқушыларға сілтеме мен QR-код шығады.</p>
      </div>
      <form onSubmit={submit} className="new-lab">
        <fieldset className="kind-picker">
          <legend>1. Зертхананы таңдаңыз</legend>
          {labs.map((l) => (
            <label key={l.kind} className={`kind-option ${form.kind === l.kind ? "on" : ""}`} style={{ "--accent": l.accent, "--tint": l.tint }}>
              <input type="radio" name="kind" value={l.kind} checked={form.kind === l.kind} onChange={() => choose(l.kind)} />
              <img src={l.cover} alt="" />
              <span>
                <b>{l.title}</b>
                <small>{l.topic} · {l.duration} · {l.points} балл</small>
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset className="card pad">
          <legend>2. Тапсырма параметрлері</legend>
          <label className="field">Оқушыларға көрінетін атауы
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={2} maxLength={120} />
          </label>
          <label className="field">Сынып
            <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required maxLength={30} />
          </label>
          <label className="field">Соңғы тапсыру уақыты
            <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <small>Бос қалдырсаңыз, мерзім шектелмейді. Уақыт белдеуі: {Intl.DateTimeFormat().resolvedOptions().timeZone}</small>
          </label>
          {error && <p className="notice error">{error}</p>}
          <button className="btn primary large" disabled={busy}>{busy ? "Сақталуда…" : "Зертхананы ашу"}</button>
        </fieldset>
      </form>
    </div>
  );
}
