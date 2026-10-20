import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function studentUrl(labId) {
  return `${window.location.origin}/lab/${encodeURIComponent(labId)}`;
}

export function CopyButton({ text, label = "Сілтемені көшіру", className = "btn small" }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Сілтемені көшіріңіз:", text);
    }
  }
  return <button type="button" className={className} onClick={copy}>{copied ? "Көшірілді ✓" : label}</button>;
}

export default function ShareLink({ labId }) {
  const url = studentUrl(labId);
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#17342e", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [url]);
  const local = /^(localhost|127\.)/.test(window.location.hostname);

  return (
    <div className="share">
      {qr && <img className="qr" src={qr} alt="Оқушыларға арналған сілтеменің QR-коды" />}
      <div>
        <label className="field">Оқушыларға арналған сілтеме
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
        <div className="toolbar">
          <CopyButton text={url} className="btn primary small" />
          <a className="btn small" href={url} target="_blank" rel="noreferrer">Оқушы ретінде ашу ↗</a>
        </div>
        {local && <p className="hint">Бұл сілтеме тек осы компьютерде ашылады. Сыныптағы құрылғылар үшін серверді <code>--host 0.0.0.0</code> арқылы іске қосып, кабинетті компьютердің IP мекенжайымен ашыңыз.</p>}
      </div>
    </div>
  );
}
