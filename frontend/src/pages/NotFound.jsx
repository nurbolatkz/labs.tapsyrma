import { Link } from "react-router-dom";

export default function NotFound({ message = "Мұндай бет табылмады." }) {
  return (
    <div className="container section empty-page">
      <div className="empty-icon" aria-hidden="true">⌖</div>
      <h1>Бет табылмады</h1>
      <p className="lead">{message}</p>
      <Link to="/" className="btn primary">Басты бетке</Link>
    </div>
  );
}
