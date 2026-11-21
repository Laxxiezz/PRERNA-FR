import ParticleBackground from "../components/ParticleBackground.jsx";
import GridDistortion from "../components/GridDistortion.jsx";
import SideNav from "../components/SideNav.jsx";
import LoveCounter from "../components/LoveCounter.jsx";
import { getNewMsgs } from "../data/new-msgs.js";
import { Link } from "react-router-dom";
import { memories } from "../data/memories.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { LogOut } from "lucide-react";
import "../styles/full-letter.css";
import "../styles/newmsgs.css";

export default function Home() {
  const { user: authUser, logout } = useAuth();
  const latest = getNewMsgs().slice(0, 2);
  return (
    <div className="full-letter-shell">
      {/* Interactive WebGL Grid Distortion background */}
      <div
        className="home-grid-distortion-bg"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.6,
          filter: "brightness(0.92) contrast(1.1)",
        }}
      >
        <GridDistortion
          videoSrc="/assets/colorful.mp4"
          grid={32}
          radius={0.28}
          strength={0.24}
          relaxation={0.94}
          mode="push"
          softness={0.5}
          chroma={0.2}
          idle={0.16}
          clickRipple={true}
          intro={true}
        />
      </div>

      <ParticleBackground subtle />
      <SideNav />
      <div className="home-doodles-layer" aria-hidden="true">
        <span className="home-doodle hd-1">✧</span>
        <span className="home-doodle hd-2">♡</span>
        <span className="home-doodle hd-3">˚ ༘ ೀ</span>
        <span className="home-doodle hd-4">୨୧</span>
        <span className="home-doodle hd-5">✦</span>
        <span className="home-doodle hd-6">❀</span>
        <span className="home-doodle hd-7">⋆｡°✩</span>
      </div>

      <article className="full-letter-inner home-inner-container">
        <header className="home-header-section">
          <div className="home-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div className="home-kicker-badge">
              <span className="home-badge-dot" aria-hidden="true"></span>
              <span>💗 Home · Justtt youuuuuu Perrruuu </span>
              <span className="home-kicker-sparkle" aria-hidden="true">💗</span>
              <span className="home-badge-dot" aria-hidden="true"></span>
            </div>

            <div className="home-auth-actions" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span className="home-user-pill" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e2e8f0",
                fontSize: "0.80rem",
                letterSpacing: "0.02em"
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} aria-hidden />
                {authUser?.displayName || authUser?.username || "You"}
              </span>

              <button
                type="button"
                onClick={logout}
                className="home-logout-btn"
                title="Log out of your space"
                aria-label="Log Out"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.28)",
                  color: "#fca5a5",
                  fontSize: "0.80rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <LogOut size={13} strokeWidth={2} aria-hidden />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          <h1 className="home-hero-title">Hamarii jaghh</h1>

          <p className="home-quote-line">
            <span className="home-quote-marks">&ldquo;</span>Bheeryyy longg timee.<span className="home-quote-marks">&rdquo;</span>
            <span className="home-quote-author">— Prernaaa</span>
          </p>

          <div className="hp-houses-strip" aria-label="Hogwarts Houses" title="Hogwarts Houses">
            <span className="hp-house gryffindor" title="Gryffindor" />
            <span className="hp-house hufflepuff" title="Hufflepuff" />
            <span className="hp-house ravenclaw" title="Ravenclaw" />
            <span className="hp-house slytherin" title="Slytherin" />
          </div>
        </header>

        <LoveCounter />

        <div className="newmsgs-feed" style={{ marginTop: 18 }}>
          {latest.map((p) => (
            <article key={p.id} className="newmsg-post">
              <p className="newmsg-text">{p.text}</p>
              <p className="letter-muted" style={{ marginTop: 8 }}>{new Date(p.createdAt).toLocaleDateString()} · {p.author}</p>
            </article>
          ))}
        </div>

        <section className="home-memory-preview">
          <div>
            <p className="letter-kicker" style={{ marginBottom: 8 }}>The archive</p>
            <h2>And then there are the things worth keeping.</h2>
            <p className="letter-muted home-memory-copy">
              Photos, childhood pieces, random screenshots, food, books, tiny details — all the stuff that makes a person more than a message.
            </p>
            <Link to="/memories" className="home-memory-link">
              Open the photo archive <span>→</span>
            </Link>
          </div>
          <div className="home-memory-stack" aria-hidden="true">
            {memories.slice(0, 3).map((m, i) => (
              <img key={m.id} src={m.src} alt="" className={`home-memory-img home-memory-img-${i}`} loading="lazy" />
            ))}
          </div>
        </section>

        {/* Private Account Session Status & Logout */}
        <section className="home-account-footer" style={{
          marginTop: "44px",
          padding: "16px 20px",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(168, 85, 247, 0.2))",
              border: "1px solid rgba(244, 114, 182, 0.3)",
              display: "grid",
              placeItems: "center",
              fontSize: "1.1rem"
            }}>
              🌸
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#f1f5f9", fontWeight: 600 }}>
                Logged in as <span style={{ color: "#f472b6" }}>{authUser?.displayName || authUser?.username || "You"}</span>
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.76rem", color: "rgba(255, 255, 255, 0.5)" }}>
                Active private session · Click to securely sign out
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="home-logout-btn"
            title="Log out"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 18px",
              borderRadius: "999px",
              background: "rgba(239, 68, 68, 0.14)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <LogOut size={14} strokeWidth={2} />
            <span>Log Out</span>
          </button>
        </section>
      </article>
    </div>
  );
}
