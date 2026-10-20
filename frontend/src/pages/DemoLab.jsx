import { Link, useParams } from "react-router-dom";
import { getLab } from "../labs/index.js";
import { api } from "../api.js";
import LabRunner from "../components/LabRunner.jsx";
import NotFound from "./NotFound.jsx";

export default function DemoLab() {
  const { kind } = useParams();
  const lab = getLab(kind);
  if (!lab) return <NotFound />;

  return (
    <div className="container section">
      <LabRunner
        lab={lab}
        storageKey={`jasusha.demo.${lab.kind}`}
        submitLabel="Жауаптарды тексеру"
        onSubmit={(payload) => api.check(lab.kind, { name: "Демо оқушы", className: "Демо", ...payload })}
        header={
          <div className="runner-header">
            <div>
              <nav className="breadcrumb" aria-label="Жол"><Link to="/labs">Зертханалар</Link> › <Link to={`/labs/${lab.kind}`}>{lab.title}</Link> › Демо</nav>
              <h1>{lab.title}</h1>
            </div>
            <div className="notice info">Демо режимі: жауаптар тексеріледі, бірақ ешкімге жіберілмейді.</div>
          </div>
        }
      />
    </div>
  );
}
