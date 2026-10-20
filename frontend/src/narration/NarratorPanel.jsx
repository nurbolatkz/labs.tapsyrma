import { MuteIcon, ReplayIcon, SoundIcon, StopIcon } from "../components/Icons.jsx";

const sourceNote = {
  mp3: "Қазақша дыбыс жазбасы",
  browser: "Браузердің қазақша дауысы",
  captions: "Қазақша дауыс табылмады — мәтін ғана көрсетіледі. Microsoft Edge браузерінде қазақша дауыс бар.",
  muted: "Дыбыс өшірулі — мәтін ғана көрсетіледі",
};

export default function NarratorPanel({ narrator }) {
  const { stage, cueIndex, playing, play, stop, prefs, setPref, source, stageId } = narrator;
  return (
    <section className="narrator" aria-label="Анимация түсіндірмесі">
      <div className="narrator-head">
        <div className="narrator-title">
          <span className={`voicebars ${playing ? "talking" : ""}`} aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => <i key={i} />)}
          </span>
          <div>
            <b>Анимация түсіндірмесі</b>
            <small>{stage ? stage.title : "Кезеңді іске қосқанда түсіндірме басталады"}</small>
          </div>
        </div>
        <div className="narrator-controls">
          {playing ? (
            <button className="icon-btn" onClick={stop} title="Тоқтату" aria-label="Тоқтату"><StopIcon /></button>
          ) : (
            <button className="icon-btn" onClick={() => stageId && play(stageId)} disabled={!stageId} title="Қайта тыңдау" aria-label="Қайта тыңдау"><ReplayIcon /></button>
          )}
          <button
            className={`icon-btn ${prefs.muted ? "" : "on"}`}
            onClick={() => setPref({ muted: !prefs.muted })}
            aria-pressed={!prefs.muted}
            title={prefs.muted ? "Дыбысты қосу" : "Дыбысты өшіру"}
            aria-label={prefs.muted ? "Дыбысты қосу" : "Дыбысты өшіру"}
          >
            {prefs.muted ? <MuteIcon /> : <SoundIcon />}
          </button>
          <select value={prefs.rate} onChange={(e) => setPref({ rate: Number(e.target.value) })} aria-label="Сөйлеу жылдамдығы">
            <option value={0.8}>0.8×</option>
            <option value={1}>1×</option>
            <option value={1.2}>1.2×</option>
          </select>
        </div>
      </div>
      <div className="captions" aria-live="polite">
        {stage ? (
          stage.cues.map((cue, i) => (
            <p key={i} className={i === cueIndex ? "active" : i < cueIndex ? "past" : ""}>{cue}</p>
          ))
        ) : (
          <p className="muted-text">Төмендегі батырманы басып, тәжірибені баста. Әр кезеңде көмекші тек сол сәтте анимацияда болып жатқан өзгерісті түсіндіреді.</p>
        )}
      </div>
      <p className="narrator-source">{sourceNote[source]}</p>
    </section>
  );
}
