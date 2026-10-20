import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AnimationFrame from "./AnimationFrame.jsx";
import TaskRenderer from "./TaskRenderer.jsx";
import NarratorPanel from "../narration/NarratorPanel.jsx";
import { useNarrator } from "../narration/useNarrator.js";
import { ArrowIcon, CameraIcon, CheckIcon, PlayIcon } from "./Icons.jsx";

function loadDraft(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function saveDraft(key, draft) {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Images can exceed the quota; keep the draft without them rather than lose the answers.
    try {
      const captures = Object.fromEntries(Object.entries(draft.captures).map(([k, c]) => [k, { ...c, image: "" }]));
      localStorage.setItem(key, JSON.stringify({ ...draft, captures }));
    } catch {
      /* drafts are a convenience only */
    }
  }
}

const emptyDraft = (lab) => ({
  answers: {},
  captures: {},
  completed: [],
  params: Object.fromEntries(lab.controls.map((c) => [c.id, c.default])),
  result: null,
});

// Shared by the demo page and the student assignment page.
// `onSubmit(payload)` must resolve to { score, maxScore, checks }.
export default function LabRunner({ lab, storageKey, onSubmit, submitLabel, closedMessage, header }) {
  const [draft, setDraft] = useState(() => ({ ...emptyDraft(lab), ...loadDraft(storageKey) }));
  const [running, setRunning] = useState(null);
  const [captureReady, setCaptureReady] = useState(null);
  const [frameReady, setFrameReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const frame = useRef(null);
  const narrator = useNarrator(lab.kind);
  const { answers, captures, completed, params, result } = draft;
  const submitted = !!result;

  useEffect(() => {
    saveDraft(storageKey, draft);
  }, [storageKey, draft]);

  const update = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);

  const onMessage = useCallback(
    (msg) => {
      if (msg.type === "ready") setFrameReady(true);
      if (msg.type === "stage-start") {
        setRunning(msg.stage);
        narrator.play(msg.stage);
      }
      if (msg.type === "stage-end") {
        setRunning(null);
        setDraft((d) => (d.completed.includes(msg.stage) ? d : { ...d, completed: [...d.completed, msg.stage] }));
        if (lab.stages.find((s) => s.id === msg.stage)?.capture) setCaptureReady(msg.stage);
      }
    },
    [lab, narrator.play],
  );

  // Bring a freshly loaded animation up to the saved progress.
  useEffect(() => {
    if (!frameReady) return;
    frame.current.send({ type: "options", options: params });
    frame.current.send({ type: "restore", completed, params });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameReady]);

  useEffect(() => () => narrator.stop(), [narrator.stop]);

  function stageEnabled(stage, index) {
    if (!frameReady || running || submitted || closedMessage) return false;
    if (!lab.sequential) return true;
    // The next stage opens only once the previous one is finished and, if required, captured.
    const next = lab.stages.findIndex((s) => !completed.includes(s.id) || (s.capture && !captures[s.id]));
    return index === next || (next === -1 && !stage.capture);
  }

  function runStage(stage) {
    setCaptureReady(null);
    frame.current.send({ type: "run", stage: stage.id, params });
  }

  async function saveCapture() {
    const stage = captureReady;
    const image = await frame.current.capture();
    setDraft((d) => ({ ...d, captures: { ...d.captures, [stage]: { ...d.captures[stage], image, params: { ...d.params } } } }));
    setCaptureReady(null);
  }

  function setControl(control, value) {
    const next = { ...params, [control.id]: value };
    update({ params: next });
    frame.current?.send({ type: "options", options: next });
  }

  const allStagesDone = lab.stages.every((s) => completed.includes(s.id) && (!s.capture || captures[s.id]));
  const complete = allStagesDone && lab.isComplete(answers, captures);

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const response = await onSubmit(lab.toPayload(answers, captures));
      narrator.stop();
      update({ result: { score: response.score, maxScore: response.maxScore, checks: response.checks || {}, at: new Date().toISOString() } });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    narrator.stop();
    setDraft(emptyDraft(lab));
    setCaptureReady(null);
    setRunning(null);
    frame.current?.send({ type: "restore", completed: [], params: emptyDraft(lab).params });
  }

  const groups = useMemo(() => {
    const map = new Map();
    lab.stages.forEach((s, i) => {
      const g = s.group || "";
      if (!map.has(g)) map.set(g, []);
      map.get(g).push([s, i]);
    });
    return [...map.entries()];
  }, [lab]);

  const progress = Math.round((completed.length / lab.stages.length) * 100);

  return (
    <div className="runner" style={{ "--accent": lab.accent, "--tint": lab.tint }}>
      {header}
      {result && (
        <div className="result-card">
          <div className="result-score">
            <span>Нәтиже</span>
            <b>{result.score} / {result.maxScore}</b>
          </div>
          <div>
            <h2>Жұмыс тапсырылды</h2>
            <p>Автоматты тексерілетін тапсырмалар белгіленді. Жазбаша қорытындыны мұғалім өзі бағалайды.</p>
          </div>
          <button className="btn ghost" onClick={restart}>Қайта бастау</button>
        </div>
      )}
      {closedMessage && !result && <div className="notice warn">{closedMessage}</div>}

      <div className="runner-grid">
        <div className="runner-stage">
          <div className="card stage-card">
            <div className="stage-head">
              <b>Анимация</b>
              <span className="stage-status">
                {running ? "Өзгерісті бақыла…" : captureReady ? "Кадрды сақтауға дайын" : `${completed.length} / ${lab.stages.length} кезең`}
              </span>
            </div>
            <AnimationFrame ref={frame} src={lab.animation} title={`${lab.title}: анимация`} onMessage={onMessage} />
            <div className="stage-progress"><i style={{ width: `${progress}%` }} /></div>
            <div className="stage-actions">
              {groups.map(([group, items]) => (
                <div className="stage-group" key={group}>
                  {group && <span className="stage-group-label">{group}</span>}
                  <div className="stage-buttons">
                    {items.map(([stage, i]) => {
                      const done = completed.includes(stage.id);
                      return (
                        <button
                          key={stage.id}
                          className={`stage-btn ${done ? "done" : ""} ${running === stage.id ? "running" : ""}`}
                          disabled={!stageEnabled(stage, i)}
                          onClick={() => runStage(stage)}
                        >
                          <span className="stage-icon">{done ? <CheckIcon size={13} /> : <PlayIcon size={12} />}</span>
                          <span>
                            <b>{stage.label}</b>
                            {stage.action !== stage.label && <small>{stage.action}</small>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {lab.stages.some((s) => s.capture) && (
                <button className="btn primary" disabled={!captureReady || submitted} onClick={saveCapture}>
                  <CameraIcon /> Кадрды сақтау
                </button>
              )}
            </div>
            {lab.controls.length > 0 && (
              <div className="controls">
                {lab.controls.map((c) => {
                  const locked = submitted || (c.lockAfter && (completed.includes(c.lockAfter) || running === c.lockAfter));
                  return c.type === "range" ? (
                    <label className="control" key={c.id}>
                      <span>{c.label} <b>{params[c.id]}{c.unit}</b></span>
                      <input type="range" min={c.min} max={c.max} step={c.step} value={params[c.id]} disabled={locked || !!running} onChange={(e) => setControl(c, Number(e.target.value))} />
                    </label>
                  ) : (
                    <label className="control toggle" key={c.id}>
                      <input type="checkbox" checked={!!params[c.id]} onChange={(e) => setControl(c, e.target.checked)} />
                      <span>{c.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <NarratorPanel narrator={narrator} />
        </div>

        <div className="runner-tasks">
          {lab.tasks.map((task, i) => (
            <TaskRenderer
              key={task.id}
              task={task}
              index={i}
              lab={lab}
              value={answers[task.id]}
              captures={captures}
              readOnly={submitted || !!closedMessage}
              check={result?.checks?.[task.id]}
              onChange={(v) => update({ answers: { ...answers, [task.id]: v } })}
              onCaptureNote={(id, note) => update({ captures: { ...captures, [id]: { ...captures[id], note } } })}
            />
          ))}
          {!submitted && !closedMessage && (
            <div className="submit-box">
              {!allStagesDone && <p className="hint">Алдымен анимацияның барлық кезеңін аяқта{lab.stages.some((s) => s.capture) ? " және кадрларды сақта" : ""}.</p>}
              {allStagesDone && !complete && <p className="hint">Барлық тапсырманы толтыр. Қорытынды кемінде 20 таңба болуы керек.</p>}
              {error && <p className="notice error">{error}</p>}
              <button className="btn primary large" disabled={!complete || submitting} onClick={submit}>
                {submitting ? "Жіберілуде…" : submitLabel} <ArrowIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
