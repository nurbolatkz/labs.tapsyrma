import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api.js";
import { getLab } from "../../labs/index.js";
import TaskRenderer from "../../components/TaskRenderer.jsx";
import { formatDate } from "../../format.js";
import NotFound from "../NotFound.jsx";

// Shows a submitted report with the same task components the student used, read-only.
export default function Submission() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [lab, setLab] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .submission(id)
      .then((d) => {
        setResult(d.result);
        setLab(d.lab);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <NotFound message={error} />;
  if (!result || !lab) return <div className="page-loading">Жүктелуде…</div>;
  const def = getLab(lab.kind);
  if (!def) return <NotFound message="Зертхана түрі белгісіз." />;
  const { answers, captures } = def.fromPayload(result.payload);
  const checks = result.payload.checks || {};

  return (
    <div className="container section narrow-wide" style={{ "--accent": def.accent, "--tint": def.tint }}>
      <nav className="breadcrumb" aria-label="Жол"><Link to="/teacher">Кабинет</Link> › <Link to={`/teacher/labs/${lab.id}`}>{lab.title}</Link> › {result.name}</nav>
      <div className="report-head card pad">
        <div className="report-initial" aria-hidden="true">{result.name.slice(0, 1)}</div>
        <div>
          <h1>{result.name}</h1>
          <p className="muted-text">{result.className} сынып · {formatDate(result.submittedAt)}</p>
        </div>
        <div className="result-score"><span>Автоматты балл</span><b>{result.score} / {result.maxScore}</b></div>
      </div>
      <p className="notice info">Жазбаша қорытынды мен бақылау жазбалары автоматты бағаланбайды — оларды өзіңіз оқып бағалаңыз.</p>
      <div className="runner-tasks">
        {def.tasks.map((task, i) => (
          <TaskRenderer key={task.id} task={task} index={i} lab={def} value={answers[task.id]} captures={captures} readOnly check={checks[task.id]} onChange={() => {}} onCaptureNote={() => {}} />
        ))}
      </div>
      <div className="toolbar">
        <button className="btn" onClick={() => window.print()}>Басып шығару / PDF</button>
      </div>
    </div>
  );
}
