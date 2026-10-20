import { Link } from "react-router-dom";
import { ArrowIcon } from "./Icons.jsx";

export default function LabCard({ lab }) {
  return (
    <Link to={`/labs/${lab.kind}`} className="lab-card" style={{ "--accent": lab.accent, "--tint": lab.tint }}>
      <div className="lab-card-cover">
        <img src={lab.cover} alt="" loading="lazy" />
      </div>
      <div className="lab-card-body">
        <div className="lab-card-meta">
          <span className="tag">{lab.topic}</span>
          <span>{lab.grade}-сынып</span>
          <span>{lab.duration}</span>
        </div>
        <h3>{lab.title}</h3>
        <p>{lab.short}</p>
        <span className="lab-card-link">Толығырақ <ArrowIcon size={14} /></span>
      </div>
    </Link>
  );
}
