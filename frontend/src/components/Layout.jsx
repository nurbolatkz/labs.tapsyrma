import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { LeafIcon } from "./Icons.jsx";

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Jasusha Lab — басты бет">
      <span className="brand-mark"><LeafIcon /></span>
      <span>
        <span className="brand-name">jasusha<span>lab</span></span>
        <small>БИОЛОГИЯНЫ ЗЕРТТЕП ҮЙРЕН</small>
      </span>
    </Link>
  );
}

export default function Layout() {
  const { teacher, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <Brand />
          <button className="menu-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
            <span aria-hidden="true">☰</span> Мәзір
          </button>
          <nav id="main-nav" className={`main-nav ${open ? "open" : ""}`} aria-label="Негізгі мәзір">
            <NavLink to="/" end>Басты бет</NavLink>
            <NavLink to="/labs">Зертханалар</NavLink>
            <Link to="/#teachers">Мұғалімдерге</Link>
            <span className="nav-spacer" />
            {teacher ? (
              <>
                <NavLink to="/teacher" className="nav-cabinet">Мұғалім кабинеті</NavLink>
                <span className="nav-user" title={teacher.email}>{teacher.name}</span>
                <button className="btn small ghost" onClick={handleLogout}>Шығу</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Кіру</NavLink>
                <Link to="/register" className="btn small primary">Тіркелу</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <Brand />
            <p>Қазақ тіліндегі виртуалды биология зертханалары. Анимациялар — сапалық оқу модельдері, нақты микрофотография емес.</p>
          </div>
          <div>
            <h4>Платформа</h4>
            <Link to="/labs">Зертханалар каталогы</Link>
            <Link to="/register">Мұғалім ретінде тіркелу</Link>
            <Link to="/login">Кабинетке кіру</Link>
          </div>
          <div>
            <h4>Шабыт көздері</h4>
            <a href="https://phet.colorado.edu/kk/" target="_blank" rel="noreferrer">PhET Interactive Simulations</a>
            <a href="https://amrita.olabs.edu.in/" target="_blank" rel="noreferrer">Amrita OLabs</a>
            <a href="https://www.labxchange.org/" target="_blank" rel="noreferrer">LabXchange</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
