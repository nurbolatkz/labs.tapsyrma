import { CheckIcon } from "./Icons.jsx";

// Renders one task definition from src/labs/*.js. `value` is the answer for this task id;
// `onChange` receives the new value. When `readOnly` is set the task is shown as submitted work.

function Choice({ task, value, onChange, readOnly }) {
  return (
    <div className={`choices ${task.layout === "grid" ? "grid" : ""}`} role="radiogroup" aria-label={task.title}>
      {task.options.map((o) => (
        <label key={o.value} className={`choice ${value === o.value ? "checked" : ""}`}>
          <input type="radio" name={task.id} value={o.value} checked={value === o.value} disabled={readOnly} onChange={() => onChange(o.value)} />
          {o.image && <img src={o.image} alt="" />}
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function ChoiceTable({ task, value = {}, onChange, readOnly }) {
  return (
    <div className="choice-table">
      {task.rows.map((row) => (
        <div className="choice-row" key={row.id}>
          <div className="row-label">
            {row.image && <img src={row.image} alt={`${row.label}: микроскоптағы көрініс`} />}
            <b>{row.label}</b>
          </div>
          <div className="choices inline" role="radiogroup" aria-label={row.label}>
            {row.options.map((o) => (
              <label key={o.value} className={`choice ${value[row.id] === o.value ? "checked" : ""}`}>
                <input
                  type="radio"
                  name={`${task.id}-${row.id}`}
                  value={o.value}
                  checked={value[row.id] === o.value}
                  disabled={readOnly}
                  onChange={() => onChange({ ...value, [row.id]: o.value })}
                />
                {o.swatch && <i className="swatch" style={{ background: o.swatch }} />}
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BarChart({ rows, value, unit }) {
  const numbers = rows.map((r) => Number(value[r.id]));
  const max = Math.max(10, ...numbers.filter(Number.isFinite));
  return (
    <figure className="bar-chart" aria-label="Нәтижелер графигі">
      <div className="bars">
        {rows.map((r, i) => {
          const n = Number.isFinite(numbers[i]) && value[r.id] !== "" && value[r.id] !== undefined ? numbers[i] : null;
          return (
            <div className="bar-col" key={r.id}>
              <span className="bar-value">{n ?? "—"}</span>
              <div className="bar" style={{ height: `${n ? (n / max) * 100 : 0}%` }} />
              <span className="bar-label">{r.label}</span>
            </div>
          );
        })}
      </div>
      <figcaption>{unit}</figcaption>
    </figure>
  );
}

function NumberTable({ task, value = {}, onChange, readOnly }) {
  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>{task.columnLabel}</th><th>{task.valueLabel}</th></tr>
          </thead>
          <tbody>
            {task.rows.map((row) => (
              <tr key={row.id}>
                <td>{row.label}</td>
                <td>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="500"
                    value={value[row.id] ?? ""}
                    disabled={readOnly}
                    aria-label={`${row.label}: ${task.valueLabel}`}
                    onChange={(e) => onChange({ ...value, [row.id]: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {task.chart && <BarChart rows={task.rows} value={value} unit={task.valueLabel} />}
    </>
  );
}

function GapFill({ task, value = {}, onChange, readOnly }) {
  return (
    <>
      {task.keywords && <div className="keywords">Тірек сөздер: {task.keywords.join(", ")}</div>}
      <div className="sentence">
        {task.parts.map((part, i) =>
          typeof part === "string" ? (
            <span key={i}>{part}</span>
          ) : part.size === "long" ? (
            <textarea
              key={i}
              value={value[part.id] ?? ""}
              placeholder={part.placeholder}
              disabled={readOnly}
              aria-label="Түсіндірме"
              onChange={(e) => onChange({ ...value, [part.id]: e.target.value })}
            />
          ) : (
            <input
              key={i}
              className={`gap ${part.size || ""}`}
              value={value[part.id] ?? ""}
              disabled={readOnly}
              aria-label={`Бос орын ${i + 1}`}
              onChange={(e) => onChange({ ...value, [part.id]: e.target.value })}
            />
          ),
        )}
      </div>
    </>
  );
}

function TextAnswer({ task, value = "", onChange, readOnly }) {
  const length = value.trim().length;
  return (
    <>
      <textarea
        className="long-answer"
        value={value}
        placeholder={task.placeholder}
        maxLength={task.maxLength}
        disabled={readOnly}
        aria-label={task.title}
        onChange={(e) => onChange(e.target.value)}
      />
      {!readOnly && <span className={`hint ${length >= task.minLength ? "ok" : ""}`}>Кемінде {task.minLength} таңба · қазір {length}</span>}
    </>
  );
}

function Observations({ task, lab, captures = {}, onCaptureNote, readOnly }) {
  return (
    <div className="observations">
      {task.stages.map((id, i) => {
        const stage = lab.stages.find((s) => s.id === id);
        const capture = captures[id];
        return (
          <div className={`observation ${capture ? "" : "empty"}`} key={id}>
            <div className="snapshot">
              {capture?.image ? <img src={capture.image} alt={`${stage.label}: сақталған кадр`} /> : <span>{i + 1}</span>}
            </div>
            <div className="observation-body">
              <b>{stage.label}{capture?.params?.concentration && id === "salt" ? ` · ${capture.params.concentration}% NaCl` : ""}</b>
              {capture ? (
                <textarea
                  value={capture.note || ""}
                  placeholder={stage.hint}
                  disabled={readOnly}
                  aria-label={`${stage.label}: бақылау`}
                  onChange={(e) => onCaptureNote(id, e.target.value)}
                />
              ) : (
                <p className="muted-text">Анимацияда «{stage.action}» кезеңін аяқтап, кадрды сақта.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const renderers = { choice: Choice, choiceTable: ChoiceTable, numberTable: NumberTable, gapfill: GapFill, text: TextAnswer, observations: Observations };

export default function TaskRenderer({ task, index, check, ...props }) {
  const Body = renderers[task.type];
  return (
    <section className={`task ${check === true ? "correct" : check === false ? "wrong" : ""}`} aria-labelledby={`task-${task.id}`}>
      <header className="task-head">
        <span className="task-num">{index + 1}</span>
        <h3 id={`task-${task.id}`}>{task.title}</h3>
        {task.points ? <span className="task-points">{task.points} балл</span> : null}
        {check === true && <span className="task-check ok"><CheckIcon size={14} /> Дұрыс</span>}
        {check === false && <span className="task-check bad">Қате</span>}
      </header>
      {task.text && <p className="task-text">{task.text}</p>}
      <Body task={task} {...props} />
    </section>
  );
}
