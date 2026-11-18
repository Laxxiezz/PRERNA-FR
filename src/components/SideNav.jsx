import { Link, useLocation } from "react-router-dom";
import { Heart, Home, Mail, Bell, MessageCircle, Sparkles, Images, ShieldCheck, LogOut, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import { useSound } from "../lib/sound-manager.js";

const baseItems = [
  { to: "/", label: "Heart — landing ⚡", Icon: Heart },
  { to: "/home", label: "Home — Hogwarts", Icon: Home },
  { to: "/full-letter", label: "Letter — Hedwig", Icon: Mail },
  { to: "/new-msgs", label: "New messages", Icon: Bell },
  { to: "/chat", label: "Owl Post — Hogwarts ⚡", Icon: MessageCircle },
  { to: "/icons", label: "Magic Vault ✨", Icon: Sparkles },
  { to: "/memories", label: "Memories — photo archive", Icon: Images },
];

export default function SideNav() {
  const { pathname } = useLocation();
  const { isAdmin, logout, user } = useAuth();
  const { isMuted, toggleMute, play } = useSound();

  const handleSoundToggle = () => {
    const nextMuted = toggleMute();
    if (!nextMuted) {
      play("pop");
    }
  };

  const items = isAdmin
    ? [...baseItems, { to: "/admin", label: "Admin — Approvals 🛡️", Icon: ShieldCheck }]
    : baseItems;

  return (
    <nav className="side-nav" aria-label="Quick navigation">
      {items.map(({ to, label, Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`side-nav-link ${active ? "is-active" : ""}`}
            title={label}
          >
            <Icon size={19} strokeWidth={1.8} className="side-nav-icon" aria-hidden />
            <span className="side-nav-tooltip">{label}</span>
          </Link>
        );
      })}

      {/* Global Sound FX Toggle */}
      <button
        type="button"
        onClick={handleSoundToggle}
        aria-label={isMuted ? "Unmute Sound FX" : "Mute Sound FX"}
        title={isMuted ? "Sound: Muted (Click to Unmute)" : "Sound: On (Click to Mute)"}
        className="side-nav-link side-nav-sound"
        style={{
          cursor: "pointer",
          marginTop: "2px",
          color: isMuted ? "rgba(255, 255, 255, 0.35)" : "#67e8f9",
          background: "transparent",
          border: "1px solid transparent",
        }}
      >
        {isMuted ? (
          <VolumeX size={18} strokeWidth={1.8} className="side-nav-icon" aria-hidden />
        ) : (
          <Volume2 size={18} strokeWidth={1.8} className="side-nav-icon" aria-hidden />
        )}
        <span className="side-nav-tooltip">{isMuted ? "Sound: Muted 🔇" : "Sound: On 🔊"}</span>
      </button>

      {user && (
        <button
          type="button"
          onClick={logout}
          aria-label={`Log Out (${user.displayName || user.username || "Account"})`}
          title={`Log Out (${user.displayName || user.username || "Account"})`}
          className="side-nav-link side-nav-logout"
          style={{
            cursor: "pointer",
            marginTop: "4px",
            color: "rgba(248, 113, 113, 0.8)",
            background: "transparent",
            border: "1px solid transparent",
          }}
        >
          <LogOut size={18} strokeWidth={1.8} className="side-nav-icon" aria-hidden />
          <span className="side-nav-tooltip">Log Out 🚪</span>
        </button>
      )}
    </nav>
  );
}
