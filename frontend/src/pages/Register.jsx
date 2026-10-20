import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { AuthShell } from "./Login.jsx";

export default function Register() {
  const { teacher, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", repeat: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (teacher) return <Navigate to="/teacher" replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 10) return setError("Құпиясөз кемінде 10 таңба болуы керек.");
    if (form.password !== form.repeat) return setError("Құпиясөздер сәйкес емес.");
    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/teacher", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return (
    <AuthShell
      title="Тіркелу"
      subtitle="Тіркелгеннен кейін кабинетіңізде төрт зертхана бірден дайын болады."
      footer={<>Аккаунтыңыз бар ма? <Link to="/login">Кіру</Link></>}
    >
      <form onSubmit={submit} className="auth-form">
        <label className="field">Аты-жөніңіз
          <input value={form.name} onChange={set("name")} required minLength={2} maxLength={80} autoComplete="name" />
        </label>
        <label className="field">Email
          <input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
        </label>
        <label className="field">Құпиясөз
          <input type="password" value={form.password} onChange={set("password")} required minLength={10} autoComplete="new-password" />
          <small>Кемінде 10 таңба</small>
        </label>
        <label className="field">Құпиясөзді қайталаңыз
          <input type="password" value={form.repeat} onChange={set("repeat")} required autoComplete="new-password" />
        </label>
        {error && <p className="notice error">{error}</p>}
        <button className="btn primary large" disabled={busy}>{busy ? "Тіркелуде…" : "Аккаунт ашу"}</button>
      </form>
    </AuthShell>
  );
}
