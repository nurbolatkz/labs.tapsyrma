import { useCallback, useEffect, useRef, useState } from "react";

// Kazakh narration for animation stages.
// Text lives in /narration/<lab>.json as { stages: { <stageId>: { title, cues: [sentence, ...] } } }.
// Voice priority per sentence: generated mp3 (listed in /audio/manifest.json with the exact same text),
// then a kk-KZ browser voice, otherwise captions only (timed so highlighting still advances).

let manifestPromise = null;
function loadManifest() {
  manifestPromise ||= fetch("/audio/manifest.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifestPromise;
}

function findKazakhVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => /^kk([-_]|$)/i.test(v.lang)) || null;
}

const PREF_KEY = "jasusha.narrator";
function readPrefs() {
  try {
    return { muted: false, rate: 1, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") };
  } catch {
    return { muted: false, rate: 1 };
  }
}

export function useNarrator(labKind) {
  const [script, setScript] = useState(null);
  const [manifest, setManifest] = useState({});
  const [stageId, setStageId] = useState(null);
  const [cueIndex, setCueIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const [voice, setVoice] = useState(findKazakhVoice);
  const runRef = useRef(0);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    let alive = true;
    fetch(`/narration/${labKind}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => alive && setScript(data))
      .catch(() => alive && setScript(null));
    loadManifest().then((m) => alive && setManifest(m || {}));
    return () => {
      alive = false;
    };
  }, [labKind]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return undefined;
    const update = () => setVoice(findKazakhVoice());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  const halt = useCallback(() => {
    runRef.current += 1;
    clearTimeout(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    halt();
    setPlaying(false);
  }, [halt]);

  useEffect(() => halt, [halt]);

  // Speaks one sentence and resolves when it ends (or when it is interrupted).
  const speakCue = useCallback(
    (text, file, run) =>
      new Promise((resolve) => {
        const done = () => resolve(runRef.current === run);
        const { muted, rate } = prefsRef.current;
        const captionOnly = () => {
          timerRef.current = setTimeout(done, Math.max(1800, text.length * 65) / rate);
        };
        if (muted) return captionOnly();
        if (file) {
          const audio = new Audio(`/audio/${file}`);
          audio.playbackRate = rate;
          audioRef.current = audio;
          audio.onended = done;
          audio.onerror = captionOnly;
          audio.play().catch(captionOnly);
          return;
        }
        const kk = findKazakhVoice();
        if (kk) {
          const u = new SpeechSynthesisUtterance(text);
          u.voice = kk;
          u.lang = kk.lang;
          u.rate = 0.95 * rate;
          u.onend = done;
          u.onerror = done;
          window.speechSynthesis.speak(u);
          return;
        }
        captionOnly();
      }),
    [],
  );

  const play = useCallback(
    async (id) => {
      const stage = script?.stages?.[id];
      halt();
      setStageId(id);
      setCueIndex(-1);
      if (!stage?.cues?.length) {
        setPlaying(false);
        return;
      }
      const run = runRef.current;
      setPlaying(true);
      for (let i = 0; i < stage.cues.length; i++) {
        setCueIndex(i);
        const key = `${labKind}/${id}-${i}.mp3`;
        const file = manifest[key] === stage.cues[i] ? key : null;
        const still = await speakCue(stage.cues[i], file, run);
        if (!still) return;
        await new Promise((r) => {
          timerRef.current = setTimeout(r, 250);
        });
        if (runRef.current !== run) return;
      }
      setPlaying(false);
    },
    [script, manifest, labKind, halt, speakCue],
  );

  const setPref = useCallback((patch) => {
    setPrefs((old) => {
      const next = { ...old, ...patch };
      try {
        localStorage.setItem(PREF_KEY, JSON.stringify(next));
      } catch {
        /* preferences are a convenience only */
      }
      return next;
    });
  }, []);

  const hasMp3 = Object.keys(manifest).some((k) => k.startsWith(`${labKind}/`));
  const source = prefs.muted ? "muted" : hasMp3 ? "mp3" : voice ? "browser" : "captions";
  const stage = stageId ? script?.stages?.[stageId] : null;

  return { ready: !!script, stageId, stage, cueIndex, playing, play, stop, prefs, setPref, source };
}
