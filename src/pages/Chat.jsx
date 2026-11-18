import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ParticleBackground from "../components/ParticleBackground.jsx";
import { users, getUser } from "../data/users.js";
import { chatBubbleThemes, chatPageThemes } from "../data/chat-themes.js";
import ChatThemePicker from "../components/ChatThemePicker.jsx";
import EmojiPicker from "../components/EmojiPicker.jsx";
import { subscribeToMessages, sendRealtimeMessage, deleteRealtimeMessage } from "../lib/realtime-chat.js";
import { loadMsgs } from "../lib/chat-store.js";
import { useAuth } from "../lib/AuthContext.jsx";
import soundManager from "../lib/sound-manager.js";
import "../styles/chat.css";

function timeAgo(iso) {
  if (!iso) return "just now";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Chat() {
  const [msgs, setMsgs] = useState(() => loadMsgs());
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeReact, setActiveReact] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const { user: authUser, logout, isAdmin } = useAuth();
  const currentUser = authUser?.id || "sin";

  // Themes
  const [bg, setBg] = useState(() => {
    try { return localStorage.getItem("chat-bg") || "none"; } catch { return "none"; }
  });
  const [font, setFont] = useState(() => {
    try { return localStorage.getItem("chat-font") || `"Google Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`; } catch { return `"Google Sans", sans-serif`; }
  });
  const [bubble, setBubble] = useState(() => {
    try { return localStorage.getItem("chat-bubble") || "default"; } catch { return "default"; }
  });
  const [pageTheme, setPageTheme] = useState(() => {
    try { return localStorage.getItem("chat-page-theme") || "dark"; } catch { return "dark"; }
  });

  useEffect(() => { try { localStorage.setItem("chat-bg", bg); } catch { } }, [bg]);
  useEffect(() => { try { localStorage.setItem("chat-font", font); } catch { } }, [font]);
  useEffect(() => { try { localStorage.setItem("chat-bubble", bubble); } catch { } }, [bubble]);
  useEffect(() => { try { localStorage.setItem("chat-page-theme", pageTheme); } catch { } }, [pageTheme]);
  useEffect(() => { try { localStorage.setItem("chat-user", currentUser); } catch { } }, [currentUser]);

  // Connect to Firebase Realtime Firestore
  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      (realtimeMsgs) => {
        setIsConnected(true);
        if (realtimeMsgs && realtimeMsgs.length > 0) {
          setMsgs(realtimeMsgs);
        }
      },
      (err) => {
        console.warn("Firestore fallback to local:", err);
        setIsConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const bubbleTheme = chatBubbleThemes.find((t) => t.id === bubble) || chatBubbleThemes[0];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // Close popup menu when clicked outside
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".chat-row-actions") && !target.closest(".chat-menu") && !target.closest(".chat-reaction-bar")) {
        setActiveMenu(null);
        setActiveReact(null);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const send = async () => {
    const t = input.trim();
    if (!t) return;
    soundManager.play("chatSend");
    const u = getUser(currentUser);
    const myId = authUser?.id || u.id;
    const myName = authUser?.displayName || u.displayName;
    const myPfp = authUser?.pfp || u.pfp || "/pfp/guest.svg";

    // Optimistic local update
    const tempId = "tmp_" + Date.now();
    const optimisticMsg = {
      id: tempId,
      text: t,
      replyTo: replyTo?.id || null,
      authorId: myId,
      authorName: myName,
      authorPfp: myPfp,
      at: new Date().toISOString(),
    };
    setMsgs((prev) => [...prev, optimisticMsg]);
    setInput("");
    setReplyTo(null);
    setShowEmoji(false);
    setTimeout(() => inputRef.current?.focus(), 50);

    // Send to Firebase Cloud
    try {
      await sendRealtimeMessage({
        text: t,
        replyTo: replyTo?.id || null,
        authorId: myId,
        authorName: myName,
        authorPfp: myPfp,
      });
    } catch (e) {
      console.error("Firebase send failed, keeping local message:", e);
    }
  };

  const addEmoji = (e) => setInput((s) => s + e);

  const handleCopy = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch { }
    setActiveMenu(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this message for everyone?")) return;
    setMsgs((prev) => prev.filter((m) => m.id !== id));
    setActiveMenu(null);
    try {
      await deleteRealtimeMessage(id);
    } catch (e) {
      console.warn("Delete Firestore doc error:", e);
    }
  };

  const pageThemeObj = chatPageThemes.find((t) => t.id === pageTheme) || chatPageThemes[0];
  const pageStyle = { fontFamily: font, background: pageThemeObj.bg, color: pageThemeObj.text };
  const listBgStyle = bg === "none" ? {} : { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" };

  const currentProfile = getUser(currentUser);
  const otherUser = currentUser === "sin" ? getUser("anu") : getUser("sin");

  return (
    <div className="chat-page" style={pageStyle}>
      <ParticleBackground subtle />

      <div className="chat-outer-wrapper">
        <div className="chat-container">
          {/* Header */}
          <header className="chat-header">
            <div className="chat-header-left">
              <div className="chat-header-avatar hogwarts-avatar" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M50 18 L20 82 L80 82 Z" />
                  <circle cx="50" cy="52" r="14" />
                  <path d="M50 18 L50 82" />
                </svg>
              </div>
              <div className="chat-header-info">
                <div className="chat-title-row">
                  <strong>ChattingChuttuing</strong>
                  <span className={`chat-live-badge ${isConnected ? "is-live" : ""}`}>
                    {isConnected ? "● Live Cloud Sync" : "○ Local Room"}
                  </span>
                </div>
                <span>Private space for You & Perru</span>
              </div>
            </div>

            <nav className="chat-header-nav" aria-label="Chat navigation">
              {isAdmin && (
                <Link to="/admin" className="chat-nav-link" title="Admin Approvals 🛡️">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </Link>
              )}
              <Link to="/home" className="chat-nav-link" title="Home">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9L12 2l9 7v11a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
              </Link>
              <Link to="/full-letter" className="chat-nav-link" title="Letter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
              </Link>
              <button type="button" className="chat-theme-btn" onClick={() => setShowThemes((v) => !v)} aria-label="Themes" title="Themes">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" opacity="0.12" />
                  <path d="M12 7a5 5 0 0 0 0 10" />
                </svg>
              </button>
              <button
                type="button"
                className="chat-theme-btn"
                onClick={logout}
                title={`Logged in as ${authUser?.displayName || authUser?.username || "You"}. Click to Logout`}
                aria-label="Logout"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </nav>
          </header>

          {showThemes && (
            <ChatThemePicker
              bg={bg}
              setBg={setBg}
              font={font}
              setFont={setFont}
              bubble={bubble}
              setBubble={setBubble}
              pageTheme={pageTheme}
              setPageTheme={setPageTheme}
              onClose={() => setShowThemes(false)}
            />
          )}

          {/* Intimate centered message list */}
          <div className="chat-list" ref={listRef} role="log" aria-live="polite" style={listBgStyle}>
            {bg !== "none" && <div className="chat-list-bg-overlay" aria-hidden />}

            <div className="chat-welcome-pill">
              <span>⚡ Owl Post is encrypted & live in the cloud. Messages sent from anywhere appear instantly.</span>
            </div>

            {msgs.map((m) => {
              const replied = m.replyTo ? msgs.find((x) => x.id === m.replyTo) : null;
              const u = getUser(m.authorId || (m.from === "you" ? currentUser : m.from?.toLowerCase()) || "sin");
              const author = {
                id: m.authorId || u.id,
                displayName: m.authorName || u.displayName,
                pfp: m.authorPfp || u.pfp || "/pfp/guest.svg",
              };
              const isYou = (m.authorId && m.authorId === (authUser?.id || currentUser)) ||
                            (!m.authorId && m.from === "you") ||
                            (m.authorId === currentUser);
              const style = isYou
                ? { background: bubbleTheme.you, color: bubbleTheme.youText, borderColor: bubbleTheme.you }
                : { background: bubbleTheme.them, color: bubbleTheme.themText };

              return (
                <div key={m.id} className={`chat-row ${isYou ? "from-you" : "from-them"}`}>
                  {!isYou && (
                    <div className="chat-sender-col">
                      <img src={author.pfp} alt={author.displayName} className="chat-pfp" width="30" height="30" />
                    </div>
                  )}

                  <div className="chat-bubble-container">
                    {!isYou && (
                      <span className="chat-sender-name">{author.displayName}</span>
                    )}

                    <div className={`chat-bubble ${isYou ? "from-you" : "from-them"}`} style={style}>
                      {replied && <div className="chat-reply-quote">↳ {replied.text.slice(0, 60)}</div>}
                      <p className="chat-text">{m.text}</p>
                      <div className="chat-meta-foot">
                        <span className="chat-time">{timeAgo(m.at)}</span>
                        {isYou && <span className="chat-extra">✓ Sent</span>}
                      </div>
                    </div>
                  </div>

                  {isYou && (
                    <div className="chat-sender-col">
                      <img src={currentProfile.pfp} alt="you" className="chat-pfp you-pfp" width="30" height="30" />
                    </div>
                  )}

                  <div className="chat-row-actions">
                    <button
                      type="button"
                      className="chat-dots"
                      aria-label="More"
                      onClick={() => setActiveMenu(activeMenu === m.id ? null : m.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="12" r="2" /></svg>
                    </button>
                    {activeMenu === m.id && (
                      <div className="chat-menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => { setReplyTo(m); setActiveMenu(null); }}>↳ Reply</button>
                        <button type="button" role="menuitem" onClick={() => handleCopy(m.text)}>⎙ Copy</button>
                        {isYou && (
                          <button type="button" role="menuitem" className="danger" onClick={() => handleDelete(m.id)}>🗑 Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {replyTo && (
            <div className="chat-reply-bar">
              <span>Replying to: <em>{replyTo.text.slice(0, 45)}</em></span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">×</button>
            </div>
          )}

          {showEmoji && <EmojiPicker onPick={addEmoji} onClose={() => setShowEmoji(false)} />}

          {/* Clean Floating Input Bar */}
          <div className="chat-input-row">
            <button
              type="button"
              className="emoji-toggle"
              aria-label="Toggle emoji picker"
              aria-expanded={showEmoji}
              onClick={() => setShowEmoji((v) => !v)}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <path d="M9 9h.01 M15 9h.01" />
              </svg>
            </button>

            <input
              ref={inputRef}
              className="chat-input"
              placeholder={`Message as ${authUser?.displayName || currentProfile.displayName}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
                if (e.key === "Escape") {
                  setShowEmoji(false);
                  setReplyTo(null);
                }
              }}
              aria-label="Message input"
              autoComplete="off"
            />

            {/* Quick Heart button if empty */}
            {!input.trim() ? (
              <button
                type="button"
                className="chat-quick-heart"
                title="Send Love"
                onClick={() => {
                  setInput("❤️");
                  setTimeout(() => send(), 0);
                }}
              >
                ❤️
              </button>
            ) : (
              <button
                type="button"
                className="chat-send"
                onClick={send}
                aria-label="Send message"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
