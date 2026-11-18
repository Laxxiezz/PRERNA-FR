import { useEffect, useRef, useState, useCallback } from "react";
import { Wand2, Sparkles, Moon, Sun } from "lucide-react";
import soundManager from "../lib/sound-manager.js";

const HIDDEN_SECRETS = [
  { id: 1, text: "Always. ⚡", sub: "Some promises never fade", top: "18%", left: "14%", size: "1.9rem" },
  { id: 2, text: "You are magic 🌸", sub: "Don't ever forget that", top: "28%", left: "68%", size: "2.1rem" },
  { id: 3, text: "Lumos Maxima ✨", sub: "Light in every dark corner", top: "68%", left: "20%", size: "1.8rem" },
  { id: 4, text: "Mischief Managed 🪄", sub: "Our private secret space", top: "75%", left: "65%", size: "2rem" },
  { id: 5, text: "Perru & Tej 💫", sub: "Written in the constellations", top: "45%", left: "44%", size: "2.3rem" },
  { id: 6, text: "A rare kind of warmth ❤️", sub: "That makes the world softer", top: "84%", left: "38%", size: "1.7rem" },
];

export default function LumosChamber() {
  const [isLumos, setIsLumos] = useState(false);
  const [pos, setPos] = useState({ x: 250, y: 250 });
  const [sparkles, setSparkles] = useState([]);
  const containerRef = useRef(null);
  const lastSparkleTime = useRef(0);

  const addSparkle = useCallback((x, y) => {
    const now = Date.now();
    if (now - lastSparkleTime.current < 45) return;
    lastSparkleTime.current = now;

    const newSparkle = {
      id: now + Math.random(),
      x: x + (Math.random() * 20 - 10),
      y: y + (Math.random() * 20 - 10),
      size: Math.random() * 8 + 4,
      color: Math.random() > 0.5 ? "#fef08a" : "#f43f5e",
    };

    setSparkles((prev) => [...prev.slice(-16), newSparkle]);
  }, []);

  const handlePointerMove = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setPos({ x, y });
    if (isLumos) {
      addSparkle(x, y);
    }
  };

  useEffect(() => {
    if (sparkles.length === 0) return;
    const timer = setTimeout(() => {
      setSparkles((prev) => prev.slice(1));
    }, 450);
    return () => clearTimeout(timer);
  }, [sparkles]);

  return (
    <div className="lumos-chamber-wrap">
      {/* Lumos Control Bar */}
      <div className="lumos-controls">
        <div className="lumos-info">
          <span className="lumos-badge">
            <Sparkles size={13} /> Hogwarts Spellbook
          </span>
          <h4>The Lumos Wand Chamber</h4>
          <p>
            {isLumos
              ? "Move your wand (finger or mouse) across the dark room to reveal hidden magical secrets."
              : "Cast the Lumos spell to ignite your wand and search the darkness."}
          </p>
        </div>

        <button
          type="button"
          className={`lumos-toggle-btn ${isLumos ? "is-active" : ""}`}
          onClick={() => {
            setIsLumos((v) => {
              const next = !v;
              if (next) soundManager.play("lumos");
              return next;
            });
          }}
          aria-label={isLumos ? "Cast Nox" : "Cast Lumos"}
        >
          {isLumos ? (
            <>
              <Moon size={16} /> Cast "Nox" 🌙
            </>
          ) : (
            <>
              <Wand2 size={16} /> Cast "Lumos" ✨
            </>
          )}
        </button>
      </div>

      {/* The Interactive Dark Chamber Area */}
      <div
        ref={containerRef}
        className={`lumos-stage ${isLumos ? "lumos-active" : "lumos-idle"}`}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
      >
        {/* Wand Spotlight radial mask */}
        {isLumos && (
          <div
            className="lumos-light-beam"
            style={{
              background: `radial-gradient(circle 180px at ${pos.x}px ${pos.y}px, rgba(254, 240, 138, 0.28) 0%, rgba(244, 63, 94, 0.16) 45%, rgba(6, 2, 4, 0.98) 100%)`,
            }}
          />
        )}

        {/* Wand Tip Glow Cursor */}
        {isLumos && (
          <div
            className="lumos-wand-tip"
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
            }}
          >
            <div className="wand-sparkle-core" />
          </div>
        )}

        {/* Trailing Stardust Sparkles */}
        {isLumos &&
          sparkles.map((s) => (
            <div
              key={s.id}
              className="lumos-dust-particle"
              style={{
                left: s.x,
                top: s.y,
                width: s.size,
                height: s.size,
                backgroundColor: s.color,
                boxShadow: `0 0 10px ${s.color}`,
              }}
            />
          ))}

        {/* Hidden Secrets in the Dark */}
        <div className="lumos-secrets-layer">
          {HIDDEN_SECRETS.map((item) => {
            // Calculate distance to wand spotlight
            const dx = pos.x;
            const dy = pos.y;
            return (
              <div
                key={item.id}
                className="lumos-secret-item"
                style={{
                  top: item.top,
                  left: item.left,
                }}
              >
                <span className="secret-text" style={{ fontSize: item.size }}>
                  {item.text}
                </span>
                <span className="secret-sub">{item.sub}</span>
              </div>
            );
          })}
        </div>

        {/* Idle prompt if spell is off */}
        {!isLumos && (
          <div className="lumos-idle-placeholder">
            <span className="idle-wand-icon">🪄</span>
            <h3>The chamber is dark...</h3>
            <p>Click <strong>Cast "Lumos"</strong> above to illuminate the hidden universe.</p>
          </div>
        )}
      </div>
    </div>
  );
}

