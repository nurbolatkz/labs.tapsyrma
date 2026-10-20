import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { labs } from "../labs/index.js";
import LabCard from "../components/LabCard.jsx";
import { ArrowIcon } from "../components/Icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const howItWorks = [
  ["01", "Анимацияны бақыла", "Әр тәжірибе микроскоп немесе зертхана үстелінің анимациясынан басталады. Кезеңдерді өзің іске қосасың."],
  ["02", "Қазақша түсіндірмені тыңда", "Көмекші тек анимацияда сол сәтте не болып жатқанын түсіндіреді — нұсқаулықты басынан оқымайды."],
  ["03", "Тапсырмаларды орында", "Суреттер бойынша таңдау, кесте мен график, бос орынды толтыру және өз қорытындың."],
];

const teacherFeatures = [
  ["Сынып үшін зертхана ашу", "Каталогтан тәжірибені таңдап, сынып пен соңғы мерзімді белгілеңіз. Оқушыларға сілтеме немесе QR-код беріңіз."],
  ["Оқушыға тіркелу қажет емес", "Оқушы тек аты-жөні мен сыныбын жазады. Жұмыс автоматты түрде сіздің кабинетіңізге түседі."],
  ["Автоматты тексеру", "Таңдау, кесте және бос орын тапсырмалары серверде тексеріледі. Жазбаша қорытындыны өзіңіз оқисыз."],
  ["Нәтижелер және CSV", "Әр оқушының сақталған кадрлары мен жауаптарын қараңыз, бүкіл сынып нәтижесін Excel-ге жүктеңіз."],
  ["Мерзім мен жабу", "Тапсыру мерзімін өзгертіңіз, зертхананы жабыңыз немесе қайта ашыңыз — шектеуді сервер сақтайды."],
  ["Жеке кабинет", "Әр мұғалім тек өз зертханалары мен өз оқушыларының нәтижесін көреді."],
];

export default function Home() {
  const { hash } = useLocation();
  const { teacher } = useAuth();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <div className="eyebrow">Биология · 9-сынып · Қазақ тілінде</div>
            <h1>Зертте. Бақыла. Қорытынды жаса.</h1>
            <p className="lead">Виртуалды зертханалық жұмыстар: анимация, қазақша дыбыстық түсіндірме және суретті тапсырмалар. Мұғалім сыныпқа тапсырма береді, оқушы кез келген құрылғыдан орындайды.</p>
            <div className="hero-actions">
              <Link to="/labs" className="btn primary large">Зертханаларды көру <ArrowIcon /></Link>
              <Link to={teacher ? "/teacher" : "/register"} className="btn large">{teacher ? "Мұғалім кабинеті" : "Мұғалім ретінде тіркелу"}</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <img src="/images/hero.svg" alt="" />
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Қалай жұмыс істейді</div>
            <h2>Бір зертхана — үш қадам</h2>
          </div>
        </div>
        <div className="steps-grid">
          {howItWorks.map(([n, title, text]) => (
            <div className="step-card" key={n}>
              <span className="step-num">{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Каталог</div>
            <h2>Зертханалық жұмыстар</h2>
          </div>
          <Link to="/labs" className="link-arrow">Барлығы <ArrowIcon size={14} /></Link>
        </div>
        <div className="lab-grid">
          {labs.map((lab) => <LabCard key={lab.kind} lab={lab} />)}
        </div>
      </section>

      <section className="section teachers" id="teachers">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Мұғалімдерге</div>
              <h2>Сабаққа дайын құралдар</h2>
            </div>
          </div>
          <div className="feature-grid">
            {teacherFeatures.map(([title, text]) => (
              <div className="feature" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="cta">
            <div>
              <h3>Кабинетті бір минутта ашыңыз</h3>
              <p>Тіркелгеннен кейін төрт зертхана сіздің кабинетіңізде бірден дайын болады.</p>
            </div>
            <Link to={teacher ? "/teacher" : "/register"} className="btn primary large">{teacher ? "Кабинетке өту" : "Тегін тіркелу"} <ArrowIcon /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
