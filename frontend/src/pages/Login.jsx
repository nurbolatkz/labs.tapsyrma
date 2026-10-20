import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="eyebrow">Мұғалім кабинеті</div>
        <h1>{title}</h1>
        <p className="muted-text">{subtitle}</p>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
      <aside className="auth-aside">
        <img src="/images/hero.svg" alt="" />
        <ul>
          <li>Төрт дайын зертхана</li>
          <li>Оқушыларға сілтеме мен QR-код</li>
          <li>Автоматты тексеру және CSV</li>
        </ul>
      </aside>
    </div>
  );
}

export default function Login() {
  const { teacher, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (teacher) return <Navigate to="/teacher" replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || "/teacher", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Кіру"
      subtitle="Тіркелген email мен құпиясөзді енгізіңіз."
      footer={<>Аккаунт жоқ па? <Link to="/register">Тіркелу</Link></>}
    >
      <form onSubmit={submit} className="auth-form">
        <label className="field">Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
        </label>
        <label className="field">Құпиясөз
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" />
        </label>
        {error && <p className="notice error">{error}</p>}
        <button className="btn primary large" disabled={busy}>{busy ? "Тексерілуде…" : "Кіру"}</button>
      </form>
    </AuthShell>
  );
}
