import { useEffect, useState } from "react";
import SideNav from "../components/SideNav.jsx";
import ParticleBackground from "../components/ParticleBackground.jsx";
import DoodleRainBackground from "../components/DoodleRainBackground.jsx";
import "../styles/full-letter.css";

const petals = [
  {
    id: "chapter",
    no: "01",
    title: "My biggest chapter",
    label: "You.",
    message:
      "You are not a small part of my story. Somehow, you became one of the chapters I keep coming back to — the one I never want to finish.",
  },
  {
    id: "sorry",
    no: "02",
    title: "I am sorry",
    label: "Sorry...",
    message:
      "I know saying sorry cannot rewind anything. But I mean it. I never wanted my silence to make you feel unwanted, ignored, or alone.",
  },
  {
    id: "feelings",
    no: "03",
    title: "What I feel",
    label: "My feelings.",
    message:
      "Even when I do not say much, my feelings do not disappear. Some things stay quietly in the heart even when life gets loud.",
  },
  {
    id: "memories",
    no: "04",
    title: "The little memories",
    label: "Memories...",
    message:
      "I keep the tiny things too — random conversations, stupid jokes, little moments that probably looked ordinary at the time. They are not ordinary to me anymore.",
  },
  {
    id: "you",
    no: "05",
    title: "Always you",
    label: "You. Always.",
    message:
      "There are people you meet, people you remember, and people who somehow become part of the way you think. You are one of those people for me.",
  },
  {
    id: "us",
    no: "06",
    title: "Us against the noise",
    label: "Us.",
    message:
      "Things around us can get messy. Plans change, days disappear, and sometimes we cannot be there when we want to be. I still value what is ours.",
  },
  {
    id: "keep",
    no: "07",
    title: "I will keep trying",
    label: "I'll always keep.",
    message:
      "I cannot promise perfect days. I can promise effort. Whenever I get the chance, I will keep trying to show you that you matter.",
  },
  {
    id: "forever",
    no: "08",
    title: "More adventures",
    label: "More adventures.",
    message:
      "I want there to be more silly moments, more stories, more places, more conversations, and more memories that we can look back at later.",
  },
  {
    id: "more",
    no: "09",
    title: "And a little more",
    label: "More.",
    message:
      "This is only one little piece of everything I wanted to say. There is still more I want to tell you — when the right moment comes.",
  },
];

// Percent coordinates carefully calibrated to match the visual centers of each petal:
// 0: Top-Center, 1: Top-Right, 2: Upper-Right, 3: Lower-Right, 4: Bottom-Right,
// 5: Bottom-Left, 6: Lower-Left, 7: Upper-Left, 8: Top-Left
const hotspotPositions = [
  { left: 39.0, top: 4.0, width: 22, height: 28, rotate: 0 },
  { left: 51.5, top: 12.0, width: 21, height: 27, rotate: 22 },
  { left: 57.5, top: 29.5, width: 22, height: 27, rotate: 48 },
  { left: 53.5, top: 48.0, width: 22, height: 26, rotate: 68 },
  { left: 45.0, top: 57.5, width: 20, height: 24, rotate: 25 },
  { left: 34.5, top: 57.5, width: 20, height: 24, rotate: -25 },
  { left: 24.5, top: 48.0, width: 22, height: 26, rotate: -68 },
  { left: 20.5, top: 29.5, width: 22, height: 27, rotate: -48 },
  { left: 26.5, top: 12.0, width: 21, height: 27, rotate: -22 },
];

export default function FullLetter() {
  const [active, setActive] = useState(null);
  const [opened, setOpened] = useState([]);

  // Gatekeeping popup states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const openPetal = (petal) => {
    setActive(petal);
    setOpened((current) => (current.includes(petal.id) ? current : [...current, petal.id]));
  };

  const closePetal = () => setActive(null);

  const handleUnlockClick = () => {
    // Opens password dialog with cute error alert
    setShowPasswordModal(true);
    setErrorMsg("⚠️ Protected Space: Yeh jagah bina secret code ke nahi khul sakti! Please enter the password.");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === "1234") {
      setIsUnlocked(true);
      setShowPasswordModal(false);
      setErrorMsg("");
    } else {
      setErrorMsg("❌ Galat passcode! Please try again 🥺");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") closePetal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("letter-modal-open", Boolean(active || !isUnlocked));
    return () => document.body.classList.remove("letter-modal-open");
  }, [active, isUnlocked]);

  return (
    <div className="full-letter-shell lotus-letter-shell">
      <ParticleBackground subtle />
      <DoodleRainBackground count={22} />
      <SideNav />

      {/* 1. Big Welcome Pop-up overlay when entering the page */}
      {!isUnlocked && (
        <div className="lotus-gate-overlay" aria-modal="true" role="dialog">
          <div className="lotus-gate-card">
            <div className="gate-stamp">💌 Secret Letter</div>
            <span className="gate-icon">🪷</span>
            <h2>Ek Chhota Sa Secret...</h2>
            <p className="gate-body">
              Yaha ek moonlit lotus hai jisme mere saare dil ke lafz chhupa ke rakhe hain. 
              Lekin is page me enter hone se pehle ek chhota sa security check hai!
            </p>
            <p className="gate-quote">
              &ldquo;Kuch baatein aisi hoti hain jo sirf ek khas insaan ke liye banti hain.&rdquo;
            </p>

            <button
              type="button"
              className="gate-unlock-btn"
              onClick={handleUnlockClick}
            >
              <span>Unlock Secret Letter</span>
              <span className="gate-btn-arrow">→</span>
            </button>
          </div>

          {/* 2. Password & Error Pop-up Modal */}
          {showPasswordModal && (
            <div className="gate-password-backdrop" onClick={() => setShowPasswordModal(false)}>
              <div
                className={`gate-password-modal ${isShaking ? "shake-anim" : ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Washi tapes & Stickers */}
                <span className="gate-modal-washi" aria-hidden="true" />
                <div className="gate-modal-flower-sticker" aria-hidden="true">
                  <img src="/assets/ninisjgufi-flowers.gif" alt="Flowers" />
                </div>
                <div className="gate-modal-doodles" aria-hidden="true">
                  <span className="g-doodle gd-1">୨୧</span>
                  <span className="g-doodle gd-2">♡</span>
                  <span className="g-doodle gd-3">✦</span>
                </div>

                <div className="gate-modal-header">
                  <span className="gate-lock-icon">🔒</span>
                  <h3>Security Check</h3>
                </div>

                {errorMsg && (
                  <div className="gate-error-banner" role="alert">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="gate-form">
                  <label htmlFor="gate-pass-input">Enter Secret Code:</label>
                  <input
                    id="gate-pass-input"
                    type="password"
                    placeholder="Enter secret passcode..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  <div className="gate-form-actions">
                    <button
                      type="button"
                      className="gate-cancel-btn"
                      onClick={() => setShowPasswordModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="gate-submit-btn">
                      Confirm & Unlock ♡
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      <main className="lotus-letter-page">
        <header className="lotus-letter-heading">
          <p className="lotus-kicker">a little letter, hidden in petals ♡</p>
          <h1>Whispers on a Moonlit Lotus</h1>
          <p>Every petal has something I wanted you to read. Hover, then click the little heart.</p>
          <div className="lotus-progress" aria-live="polite">
            <span>{String(opened.length).padStart(2, "0")}</span> / {String(petals.length).padStart(2, "0")} little secrets found
          </div>
        </header>

        <section className="lotus-stage" aria-label="Interactive lotus letter">
          <div className="lotus-glow" aria-hidden="true" />
          <picture>
            <source srcSet="/assets/lotus-message-photo.webp" type="image/webp" />
            <img
              className="lotus-art"
              src="/assets/lotus-message-photo.webp"
              alt="A glowing pink lotus floating on moonlit water"
              decoding="async"
              fetchPriority="high"
            />
          </picture>

          {petals.map((petal, index) => {
            const pos = hotspotPositions[index];
            const wasOpened = opened.includes(petal.id);
            return (
              <button
                key={petal.id}
                type="button"
                className={`petal-hotspot ${wasOpened ? "is-opened" : ""}`}
                style={{
                  left: `${pos.left}%`,
                  top: `${pos.top}%`,
                  width: `${pos.width}%`,
                  height: `${pos.height}%`,
                }}
                onClick={() => openPetal(petal)}
                aria-label={`Open ${petal.title}`}
              >
                <span className="petal-leaf-glow" aria-hidden="true" />
                <span className="petal-ring" aria-hidden="true" />
                <span className="petal-click-hint" aria-hidden="true">♡</span>
                <span className="petal-status">{wasOpened ? "read" : "open"}</span>
              </button>
            );
          })}

          <div className="lotus-note lotus-note-left" aria-hidden="true">psst...<br />there's something<br />inside each petal ♡</div>
          <div className="lotus-note lotus-note-right" aria-hidden="true">take your time ✦<br />read them slowly</div>
          <div className="lotus-sparkle sparkle-one" aria-hidden="true">✦</div>
          <div className="lotus-sparkle sparkle-two" aria-hidden="true">✧</div>
          <div className="lotus-sparkle sparkle-three" aria-hidden="true">♡</div>
        </section>

        {opened.length === petals.length && !active && (
          <div className="lotus-complete" role="status">
            <span>✦</span>
            You found every little piece.
            <span>♡</span>
          </div>
        )}
      </main>

      {active && (
        <div className="petal-modal-backdrop" role="presentation" onMouseDown={closePetal}>
          <section
            className="petal-message-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="petal-message-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="message-tape tape-left" aria-hidden="true" />
            <div className="message-tape tape-right" aria-hidden="true" />
            <div className="message-doodle doodle-flower" aria-hidden="true">❀</div>
            <div className="message-doodle doodle-star" aria-hidden="true">✦</div>
            <div className="message-doodle doodle-heart" aria-hidden="true">♡</div>

            <p className="message-number">{active.no} / 09 · a tiny piece of my heart</p>
            <h2 id="petal-message-title">{active.title}</h2>
            <div className="message-divider" aria-hidden="true">──── ♡ ────</div>
            <p className="message-text">{active.message}</p>
            <p className="message-signoff">read it slowly... okay? ♡</p>

            <button type="button" className="message-back" onClick={closePetal}>
              ← fold this petal back
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
