import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { getLab } from "../labs/index.js";
import LabRunner from "../components/LabRunner.jsx";
import { ArrowIcon } from "../components/Icons.jsx";
import NotFound from "./NotFound.jsx";
import { formatDate } from "../format.js";

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* the student can still finish; only resuming is lost */
  }
}

export default function StudentLab() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [error, setError] = useState("");
  const studentKey = `jasusha.student.${assignmentId}`;
  const [student, setStudent] = useState(() => readJson(studentKey));
  const [form, setForm] = useState({ name: "", className: "" });

  useEffect(() => {
    api
      .lab(assignmentId)
      .then((data) => {
        setAssignment(data.lab);
        setForm((f) => ({ ...f, className: f.className || data.lab.className }));
      })
      .catch((e) => setError(e.message));
  }, [assignmentId]);

  if (error) return <NotFound message={error} />;
  if (!assignment) return <div className="page-loading">Зертхана жүктелуде…</div>;
  const lab = getLab(assignment.kind);
  if (!lab) return <NotFound message="Бұл зертхана түрі қолдау көрсетілмейді." />;

  const closed = !assignment.accepting
    ? assignment.status === "expired" ? "Тапсыру мерзімі аяқталды. Мұғалім мерзімді ұзарта алады." : "Мұғалім бұл зертхананы жапты."
    : "";

  const header = (
    <div className="runner-header">
      <div>
        <div className="eyebrow">{assignment.className} сынып · {lab.topic}</div>
        <h1>{assignment.title}</h1>
        {student && <p className="muted-text">Оқушы: <b>{student.name}</b> · {student.className}</p>}
      </div>
      <span className={`deadline ${assignment.accepting ? "" : "closed"}`}>
        {assignment.deadline ? `Соңғы мерзім: ${formatDate(assignment.deadline)}` : "Мерзім шектеуі жоқ"}
      </span>
    </div>
  );

  if (!student) {
    function start(e) {
      e.preventDefault();
      const value = { name: form.name.trim(), className: form.className.trim() };
      if (value.name.length < 2 || !value.className) return;
      writeJson(studentKey, value);
      setStudent(value);
    }
    return (
      <div className="container section narrow">
        {header}
        <form className="card pad start-card" onSubmit={start}>
          <h2>Зертхананы бастау</h2>
          <p>Тіркелу мен құпиясөз қажет емес. Атың мен сыныбыңды жаз — жұмысың мұғалімге осы атпен түседі.</p>
          {closed && <div className="notice warn">{closed}</div>}
          <label className="field">Аты-жөнің
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={80} autoComplete="name" placeholder="Мысалы, Айдана Серік" />
          </label>
          <label className="field">Сыныбың
            <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required maxLength={30} />
          </label>
          <button className="btn primary large" type="submit" disabled={!!closed}>Бастау <ArrowIcon /></button>
        </form>
      </div>
    );
  }

  async function submit(payload) {
    const idKey = `jasusha.client.${assignmentId}`;
    let clientId = readJson(idKey);
    if (!clientId) {
      clientId = `${lab.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      writeJson(idKey, clientId);
    }
    return api.submit(assignmentId, { clientId, name: student.name, className: student.className, ...payload });
  }

  return (
    <div className="container section">
      <LabRunner
        lab={lab}
        storageKey={`jasusha.draft.${assignmentId}`}
        submitLabel="Мұғалімге тапсыру"
        closedMessage={closed}
        onSubmit={submit}
        header={header}
      />
    </div>
  );
}
