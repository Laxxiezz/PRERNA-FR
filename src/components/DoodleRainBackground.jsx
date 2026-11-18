import { useEffect, useRef, useState } from "react";
import "../styles/doodle-rain.css";

/**
 * Romantic Media Rain + Cute Hand-drawn Doodles Layer
 * Features:
 * - Falling gentle rain of tiny mini-GIFs (ninisjgufi-flowers.gif), cute sticker heads, and romantic doodles
 * - Floating handwritten sweet notes and spark doodles on the sides
 * - Ultra-slow, serene speed with soft opacity so it doesn't distract from the Lotus or text
 */

const DOODLE_ICONS = ["♡", "✧", "🌸", "✨", "⋆｡°✩", "˚ ༘ ೀ", "୨୧", "❀", "✦", "🕊️", "🫧", "☁️"];

const RAIN_ITEMS = [
  { type: "gif", src: "/assets/ninisjgufi-flowers.gif", width: 36, height: 36 },
  { type: "head", src: "/assets/heads/head-1.webp", width: 30, height: 30 },
  { type: "head", src: "/assets/heads/head-2.webp", width: 30, height: 30 },
  { type: "head", src: "/assets/heads/head-3.webp", width: 28, height: 28 },
  { type: "head", src: "/assets/heads/head-4.webp", width: 28, height: 28 },
  { type: "head", src: "/assets/heads/head-5.webp", width: 30, height: 30 },
  { type: "text", char: "🌸", size: 20 },
  { type: "text", char: "♡", size: 22 },
  { type: "text", char: "✨", size: 18 },
  { type: "text", char: "˚ ༘ ೀ", size: 20 },
  { type: "text", char: "✧", size: 22 },
  { type: "text", char: "୨୧", size: 20 },
];

export default function DoodleRainBackground({ count = 24 }) {
  const containerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Delay rendering of falling media drops until initial DOM and page paint complete
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Generate deterministic-looking random falling elements
  const drops = useRef(
    Array.from({ length: count }, (_, i) => {
      const item = RAIN_ITEMS[i % RAIN_ITEMS.length];
      const left = Math.random() * 96; // 0 to 96%
      const duration = 14 + Math.random() * 16; // 14s to 30s slow fall
      const delay = -(Math.random() * 25); // staggered start
      const drift = -30 + Math.random() * 60; // horizontal gentle sway
      const spin = (Math.random() - 0.5) * 180;
      const opacity = 0.35 + Math.random() * 0.45; // soft and subtle

      return {
        id: i,
        item,
        left,
        duration,
        delay,
        drift,
        spin,
        opacity,
      };
    })
  ).current;

  return (
    <div className="doodle-rain-container" aria-hidden="true" ref={containerRef}>
      {/* 1. Subtle static/floating hand-drawn doodles on left & right sides (Instant zero-lag render) */}
      <div className="ambient-side-doodles">
        <span className="side-doodle sd-left-1">˚ ༘ ೀ perru ♡</span>
        <span className="side-doodle sd-left-2">✧</span>
        <span className="side-doodle sd-left-3">🌸 my favourite petal</span>
        <span className="side-doodle sd-left-4">♡</span>
        <span className="side-doodle sd-left-5">⋆｡°✩ forever ⋆</span>

        <span className="side-doodle sd-right-1">୨୧ lotus whispers</span>
        <span className="side-doodle sd-right-2">✨</span>
        <span className="side-doodle sd-right-3">always you ♡</span>
        <span className="side-doodle sd-right-4">❀</span>
        <span className="side-doodle sd-right-5">✧ ˚. ᵎᵎ</span>
      </div>

      {/* 2. Slow Falling Rain of Media (GIFs, heads, flowers, hearts) */}
      {isMounted && (
        <div className="rain-drops-layer">
          {drops.map((d) => (
            <div
              key={d.id}
              className="rain-drop"
              style={{
                left: `${d.left}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
                opacity: d.opacity,
                "--drift": `${d.drift}px`,
                "--spin": `${d.spin}deg`,
              }}
            >
              {d.item.type === "gif" || d.item.type === "head" ? (
                <img
                  src={d.item.src}
                  alt=""
                  className={`drop-img ${d.item.type === "gif" ? "drop-gif" : "drop-head"}`}
                  style={{ width: `${d.item.width}px`, height: `${d.item.height}px` }}
                  draggable="false"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="drop-char" style={{ fontSize: `${d.item.size}px` }}>
                  {d.item.char}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
