import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import ParticleBackground from "./ParticleBackground.jsx";

const AVATAR_OPTIONS = [
  { id: "lotus", label: "Lotus", icon: "🌸", bg: "#740001" },
  { id: "lightning", label: "Lightning", icon: "⚡", bg: "#1a472a" },
  { id: "owl", label: "Owl", icon: "🦉", bg: "#0e1a40" },
  { id: "star", label: "Star", icon: "✨", bg: "#4a154b" },
  { id: "heart", label: "Heart", icon: "❤️", bg: "#8b1e42" },
  { id: "moon", label: "Moon", icon: "🌙", bg: "#1f2937" },
  { id: "butterfly", label: "Butterfly", icon: "🦋", bg: "#0284c7" },
  { id: "teddy", label: "Teddy", icon: "🧸", bg: "#78350f" },
];

const HOUSES = [
  { id: "Gryffindor", label: "Gryffindor 🦁" },
  { id: "Slytherin", label: "Slytherin 🐍" },
  { id: "Ravenclaw", label: "Ravenclaw 🦅" },
  { id: "Hufflepuff", label: "Hufflepuff 🦡" },
];

function createAvatarDataUri(icon, bg = "#3b1e38") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="${bg}" stroke="rgba(255,255,255,0.25)" stroke-width="2.5"/><text x="50" y="63" font-size="46" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${icon}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function LoginModal() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login"); // "login" | "register"
  
  // Login state
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  
  // Register state
  const [regUser, setRegUser] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regAvatar, setRegAvatar] = useState(AVATAR_OPTIONS[0]);
  const [regHouse, setRegHouse] = useState(HOUSES[0].id);

  // Pending approval screen
  const [pendingNotice, setPendingNotice] = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      setError("Please enter both ID and Password");
      triggerShake();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await login(loginUser, loginPass);
      if (!res.success) {
        setError(res.error || "Invalid ID or Password");
        triggerShake();
      }
    } catch {
      setError("Unable to connect. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUnlock = async (username, password) => {
    setLoginUser(username);
    setLoginPass(password);
    setLoading(true);
    setError("");

    try {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.error || "Invalid ID or Password");
        triggerShake();
      }
    } catch {
      setError("Unable to connect. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUser.trim()) {
      setError("Please choose a User ID");
      triggerShake();
      return;
    }
    if (regUser.trim().length < 2) {
      setError("ID must be at least 2 characters");
      triggerShake();
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@") || !regEmail.includes(".")) {
      setError("Please enter a valid email address so Tej can notify you upon approval");
      triggerShake();
      return;
    }
    if (!regPass.trim() || regPass.trim().length < 3) {
      setError("Password must be at least 3 characters");
      triggerShake();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const avatarUri = createAvatarDataUri(regAvatar.icon, regAvatar.bg);
      const res = await register({
        username: regUser,
        displayName: regName.trim() || regUser.trim(),
        email: regEmail.trim(),
        password: regPass,
        pfp: avatarUri,
        house: regHouse,
      });

      if (res.success && res.pending) {
        setPendingUsername(regUser.trim().toLowerCase().replace(/\s+/g, "_"));
        setPendingEmail(regEmail.trim());
        setPendingNotice(true);
        setRegUser("");
        setRegName("");
        setRegEmail("");
        setRegPass("");
      } else if (!res.success) {
        setError(res.error || "Registration failed");
        triggerShake();
      }
    } catch {
      setError("Cloud connection error. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-gate-overlay" role="dialog" aria-modal="true">
      <ParticleBackground subtle />

      {/* Floating background ambient doodles */}
      <div className="login-doodles-field" aria-hidden="true">
        <span className="login-doodle-item d-text-1">for my perru ♡</span>
        <span className="login-doodle-item d-text-2">our secret haven 🗝️</span>
        <span className="login-doodle-item d-text-3">shhh... knock twice 🌸</span>
        <span className="login-doodle-item d-text-4">always & forever ✦</span>
        <span className="login-doodle-item d-sym-1">୨୧</span>
        <span className="login-doodle-item d-sym-2">♡</span>
        <span className="login-doodle-item d-sym-3">✦</span>
        <span className="login-doodle-item d-sym-4">❀</span>
        <span className="login-doodle-item d-sym-5">✧</span>
        <span className="login-doodle-item d-sym-6">˚</span>
        <span className="login-doodle-item d-sym-7">— ♡ —</span>
      </div>

      <div className={`login-gate-card ${isShaking ? "shake-anim" : ""}`}>
        {/* Washi tapes on card corners */}
        <span className="login-card-washi washi-top-left" aria-hidden="true" />
        <span className="login-card-washi washi-bottom-right" aria-hidden="true" />

        {/* Aarri Polaroid Picture Sticker (Top Left) */}
        <div className="login-card-polaroid" aria-hidden="true">
          <span className="polaroid-tape" />
          <div className="polaroid-frame">
            <img src="/assets/Arri.webp" alt="Aarri" className="polaroid-img" loading="lazy" decoding="async" />
            <span className="polaroid-caption">my perru ♡</span>
          </div>
        </div>

        {/* Flower GIF Sticker (Top Right) */}
        <div className="login-card-sticker-gif" aria-hidden="true">
          <img src="/assets/ninisjgufi-flowers.gif" alt="Flowers" className="sticker-gif-img" loading="lazy" decoding="async" />
          <span className="sticker-sparkle">✦</span>
        </div>

        {/* Bouquet Sticker (Bottom Right) */}
        <div className="login-card-bouquet-sticker" aria-hidden="true">
          <img src="/bouquet-perru.webp" alt="Bouquet" className="bouquet-sticker-img" loading="lazy" decoding="async" />
        </div>

        {pendingNotice ? (
          /* PENDING APPROVAL NOTIFICATION SCREEN */
          <div className="login-pending-view">
            <div className="login-avatar-ring">
              <span className="login-icon">⏳</span>
            </div>

            <h2>Request Submitted</h2>
            <p className="login-desc">
              Your account <strong>@{pendingUsername}</strong> has been created.
            </p>

            <div className="login-pending-box">
              <p>🛡️ <strong>Approval Required:</strong></p>
              <span>Tej must approve your account before you can log in. When Tej approves your account, a notification will be sent to <strong>{pendingEmail}</strong> from <code>tejjinsta003@gmail.com</code> so you know you can log in!</span>
            </div>

            <button
              type="button"
              className="login-submit-btn"
              onClick={() => {
                setPendingNotice(false);
                setTab("login");
                setLoginUser(pendingUsername);
              }}
            >
              Back to Login →
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="login-tabs-wrap" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "login"}
                className={`login-tab-btn ${tab === "login" ? "is-active" : ""}`}
                onClick={() => {
                  setTab("login");
                  setError("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "register"}
                className={`login-tab-btn ${tab === "register" ? "is-active" : ""}`}
                onClick={() => {
                  setTab("register");
                  setError("");
                }}
              >
                Register
              </button>
            </div>

            {tab === "login" ? (
              /* LOGIN FORM */
              <>
                <div className="login-avatar-ring">
                  <span className="login-icon">🔒</span>
                </div>

                <h2>Welcome Back</h2>
                <p className="login-desc">
                  Enter your credentials to unlock our space.
                </p>

                {/* THE RIGHT INFO: Quick Keys to Our Space */}
                <div className="login-keys-arena">
                  <div className="keys-arena-header">
                    <span className="keys-icon">🗝️</span>
                    <span className="keys-title">Keys to Our Space</span>
                    <span className="keys-bow">୨୧</span>
                  </div>
                  <p className="keys-hint-desc">
                    Tap to unlock directly or use the credentials:
                  </p>

                  <div className="quick-keys-buttons">
                    <button
                      type="button"
                      className="quick-key-btn key-perru"
                      onClick={() => handleQuickUnlock("Perru", "12345")}
                      disabled={loading}
                      title="Tap to unlock as Perru (Aarri)"
                    >
                      <span className="key-btn-avatar">🌸</span>
                      <div className="key-btn-info">
                        <strong>Perru (Aarri) ♡</strong>
                        <small>ID: <code>Perru</code> · Pass: <code>12345</code></small>
                      </div>
                      <span className="key-btn-badge">1-Tap Unlock ✨</span>
                    </button>

                    <button
                      type="button"
                      className="quick-key-btn key-tej"
                      onClick={() => handleQuickUnlock("tej", "12345")}
                      disabled={loading}
                      title="Tap to unlock as Tej"
                    >
                      <span className="key-btn-avatar">⚡</span>
                      <div className="key-btn-info">
                        <strong>Tej</strong>
                        <small>ID: <code>tej</code> · Pass: <code>12345</code></small>
                      </div>
                      <span className="key-btn-badge">1-Tap Unlock ✨</span>
                    </button>
                  </div>

                  <div className="keys-arena-divider">
                    <span>or enter manually</span>
                  </div>
                </div>

                {error && <div className="login-error-msg">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                  <div className="login-input-group">
                    <label className="login-label">User ID</label>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="Username"
                      value={loginUser}
                      onChange={(e) => {
                        setLoginUser(e.target.value);
                        if (error) setError("");
                      }}
                      autoComplete="username"
                      autoFocus
                      disabled={loading}
                    />
                  </div>

                  <div className="login-input-group">
                    <label className="login-label">Password</label>
                    <input
                      type="password"
                      className="login-input"
                      placeholder="Password"
                      value={loginPass}
                      onChange={(e) => {
                        setLoginPass(e.target.value);
                        if (error) setError("");
                      }}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={loading}>
                    {loading ? "Checking..." : "Unlock Space →"}
                  </button>
                </form>

                <div className="login-switch-prompt">
                  <span>Don't have an ID? </span>
                  <button
                    type="button"
                    className="login-link-btn"
                    onClick={() => {
                      setTab("register");
                      setError("");
                    }}
                  >
                    Register
                  </button>
                </div>
              </>
            ) : (
              /* REGISTER FORM */
              <>
                <div className="login-avatar-ring">
                  <span className="login-icon">{regAvatar.icon}</span>
                </div>

                <h2>Create Account</h2>
                <p className="login-desc">
                  Choose your ID and password. An approval request will be sent to Tej.
                </p>

                <div className="register-info-banner">
                  <span>🌸 <strong>Already have a key?</strong> Perru (<code>Perru</code>) & Tej (<code>tej</code>) are already set up! Click <strong>Login</strong> above to enter right away.</span>
                </div>

                {error && <div className="login-error-msg">{error}</div>}

                <form onSubmit={handleRegister} className="login-form">
                  <div className="login-input-group">
                    <label className="login-label">User ID</label>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="Choose an ID"
                      value={regUser}
                      onChange={(e) => {
                        setRegUser(e.target.value);
                        if (error) setError("");
                      }}
                      autoComplete="username"
                      autoFocus
                      disabled={loading}
                    />
                  </div>

                  <div className="login-input-group">
                    <label className="login-label">Display Name</label>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="Your Name"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={loading}
                    />
                  </div>

                  <div className="login-input-group">
                    <label className="login-label">Email Address</label>
                    <input
                      type="email"
                      className="login-input"
                      placeholder="Email (for approval notification)"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (error) setError("");
                      }}
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  <div className="login-input-group">
                    <label className="login-label">Password</label>
                    <input
                      type="password"
                      className="login-input"
                      placeholder="Password (min 3 chars)"
                      value={regPass}
                      onChange={(e) => {
                        setRegPass(e.target.value);
                        if (error) setError("");
                      }}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>

                  {/* Avatar Selector */}
                  <div className="login-input-group">
                    <label className="login-label">Choose Avatar</label>
                    <div className="login-avatar-grid">
                      {AVATAR_OPTIONS.map((item) => {
                        const isSelected = regAvatar.id === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`login-avatar-option ${isSelected ? "is-selected" : ""}`}
                            style={{ backgroundColor: item.bg }}
                            onClick={() => setRegAvatar(item)}
                            title={item.label}
                          >
                            <span className="avatar-emoji">{item.icon}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* House Selector */}
                  <div className="login-input-group">
                    <label className="login-label">House</label>
                    <div className="login-house-grid">
                      {HOUSES.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          className={`login-house-btn ${regHouse === h.id ? "is-selected" : ""}`}
                          onClick={() => setRegHouse(h.id)}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={loading}>
                    {loading ? "Sending Request..." : "Request Account →"}
                  </button>
                </form>

                <div className="login-switch-prompt">
                  <span>Already have an ID? </span>
                  <button
                    type="button"
                    className="login-link-btn"
                    onClick={() => {
                      setTab("login");
                      setError("");
                    }}
                  >
                    Login
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
