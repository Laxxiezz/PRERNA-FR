import { useState, useRef, useCallback, useEffect } from "react";
import BinaryOrbits from "./BinaryOrbits.tsx";
import soundManager from "../lib/sound-manager.js";

// Curated list of cute / emotional emojis for the tap bursts
const TAP_EMOJIS = ["🌸", "🪷", "✨", "💖", "🌷", "💕", "🤍", "🥺", "🌺"];

// 4 Corner configs for the dancing Arri corner rails
const CORNERS = [
  { id: "top-left", className: "corner-tl", dir: "horizontal" },
  { id: "top-right", className: "corner-tr", dir: "vertical" },
  { id: "bottom-left", className: "corner-bl", dir: "vertical" },
  { id: "bottom-right", className: "corner-br", dir: "horizontal" },
];

export default function HeartIntro({ onEnter }) {
  // fillProgress: 0, 20, 40, 60, 80, 100 (%)
  const [clickCount, setClickCount] = useState(0);
  const [stage, setStage] = useState("idle"); // "idle" | "exploding" | "rail-dancing"
  const [tapBursts, setTapBursts] = useState([]);
  const [pinwheelItems, setPinwheelItems] = useState([]);

  const isFinalTriggeredRef = useRef(false);

  const playClickSound = useCallback(() => {
    soundManager.play("click");
    soundManager.play("sparkle", { volume: 0.5 });
  }, []);

  const playFinalSound = useCallback(() => {
    soundManager.play("blast");
    soundManager.play("magic", { volume: 0.6 });
  }, []);

  // Helper to spawn micro emoji bursts around the heart on clicks 1, 2, 3, 4
  const spawnTapEmojis = (count) => {
    const burstId = Date.now() + Math.random();
    const newItems = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const distance = 70 + Math.random() * 85;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = (Math.random() - 0.5) * 60;
      const emoji = TAP_EMOJIS[Math.floor(Math.random() * TAP_EMOJIS.length)];
      newItems.push({
        id: `${burstId}-${i}`,
        tx,
        ty,
        rot,
        emoji,
        scale: 0.9 + Math.random() * 0.4,
      });
    }

    setTapBursts((prev) => [...prev, { id: burstId, items: newItems }]);

    // Clean up tap burst after animation completes
    window.setTimeout(() => {
      setTapBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 1100);
  };

  // Track device screen size for mobile responsiveness
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 640);
  const binaryOrbitsRef = useRef(null);
  const heartBtnRef = useRef(null);

  // Preload celebration blast images on mount so they appear with 0 decode stutter
  useEffect(() => {
    const img1 = new Image();
    img1.src = "/bouquet-perru.png";
    if (img1.decode) img1.decode().catch(() => {});

    const img2 = new Image();
    img2.src = "/assets/Arri.jpeg";
    if (img2.decode) img2.decode().catch(() => {});

    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Helper for 5th click: Original Big Pinwheel Spiral Blast with Bouquet Vortex Throw
  const triggerPinwheelBlast = () => {
    setStage("exploding");
    playFinalSound();

    // Trigger ripple density wave in the spiral galaxy
    if (binaryOrbitsRef.current?.ripple) {
      binaryOrbitsRef.current.ripple(0, 0);
    }

    const items = [];
    const arms = 8;
    const isSmall = typeof window !== "undefined" && window.innerWidth <= 640;
    // 56 items on desktop, 40 on mobile: buttery smooth 60/120fps with full spiral coverage
    const perArm = isSmall ? 5 : 7;
    const totalDist = isSmall ? 520 : 820;

    for (let arm = 0; arm < arms; arm++) {
      const baseArmAngle = (arm / arms) * 2 * Math.PI;
      for (let j = 0; j < perArm; j++) {
        const progress = (j + 1) / perArm;
        const spiralAngle = baseArmAngle + progress * 2.4;
        const distance = (isSmall ? 80 : 120) + progress * totalDist;
        const tx = Math.cos(spiralAngle) * distance;
        const ty = Math.sin(spiralAngle) * distance;
        const rot = (spiralAngle * 180) / Math.PI + 360;
        const scale = 0.9 + Math.random() * 0.45;
        const duration = 2200 + Math.random() * 500;
        const delay = progress * 300;
        const size = Math.floor(isSmall ? 28 + Math.random() * 14 : 36 + Math.random() * 20);

        items.push({
          id: `${arm}-${j}`,
          tx,
          ty,
          rot,
          scale,
          duration,
          delay,
          size,
        });
      }
    }
    setPinwheelItems(items);

    // Give 2.8s for the full Pinwheel blast to throw across the screen
    window.setTimeout(() => {
      setStage("rail-dancing");

      // Give 4.2s for the cute Arri dancing corner rails
      window.setTimeout(() => {
        onEnter();
      }, 4200);
    }, 2800);
  };

  const handleHeartClick = useCallback(() => {
    if (isFinalTriggeredRef.current) return;

    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (nextCount < 5) {
      playClickSound();
      const emojisToSpawn = nextCount === 1 ? 2 : nextCount === 2 ? 4 : nextCount === 3 ? 6 : 8;
      spawnTapEmojis(emojisToSpawn);
    } else {
      isFinalTriggeredRef.current = true;
      triggerPinwheelBlast();
    }
  }, [clickCount, playClickSound, onEnter]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleHeartClick();
      }
    },
    [handleHeartClick]
  );

  const fillPercent = Math.min(clickCount * 20, 100);
  const isExploding = stage === "exploding";
  const isRailDancing = stage === "rail-dancing";

  // Arri dancing emoji trains: 3 avatars per corner on mobile, 5 on desktop to prevent overlap
  const cornerAvatars = isMobile ? [0, 1, 2] : [0, 1, 2, 3, 4];

  return (
    <>
      {/* Binary Orbits - Tilted spiral galaxy matching the reference photo */}
      <BinaryOrbits
        ref={binaryOrbitsRef}
        colors={["#8b5cf6", "#f472b6"]}
        backgroundColor="transparent"
        stars={isMobile ? 45000 : 80000}
        starSize={isMobile ? 1.4 : 1.6}
        arms={3}
        twist={3.6}
        armStrength={0.72}
        dust={0.45}
        tilt={63}
        roll={-9}
        speed={0.35}
        core={1.1}
        coreSize={0.065}
        innerVoid={0.0}
        sparkle={0.6}
        glow={0.5}
        scale={isMobile ? 0.95 : 1.05}
        centerX={0.5}
        centerY={0.5}
        hoverWake={true}
        wakeStrength={0.65}
        hoverBoost={0.20}
        clickRipple={true}
        rippleStrength={0.85}
        className="binary-orbits-bg"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
          opacity: isExploding || isRailDancing ? 0.35 : 0.92,
          transition: "opacity 1.2s ease",
        }}
      />

      {/* 2) 5th Click: Original Pinwheel Blast Throwing Bouquet & Petals */}
      {isExploding && (
        <div className="heart-burst-screen pinwheel-blast" aria-hidden="true">
          <div className="pinwheel-core-spinner">
            {pinwheelItems.map((item) => (
              <span
                key={item.id}
                className="pinwheel-throw-item"
                style={{
                  "--tx": `${item.tx}px`,
                  "--ty": `${item.ty}px`,
                  "--rot": `${item.rot}deg`,
                  "--scale": item.scale,
                  "--dur": `${item.duration}ms`,
                  "--del": `${item.delay}ms`,
                }}
              >
                <img
                  src="/bouquet-perru.png"
                  alt=""
                  className="pinwheel-img"
                  style={{
                    width: `${item.size}px`,
                    height: "auto",
                  }}
                  draggable="false"
                  loading="eager"
                />
              </span>
            ))}
          </div>

          {/* Shockwave pinwheel rotating light rings */}
          <div className="pinwheel-vortex-ring vortex-ring-1" />
          <div className="pinwheel-vortex-ring vortex-ring-2" />
        </div>
      )}

      {/* 3) Post-blast Celebration: Arri mini dancing rail line entering from 4 corners */}
      {isRailDancing && (
        <div className="arri-rail-celebration" aria-hidden="true">
          {CORNERS.map((corner) => (
            <div key={corner.id} className={`arri-rail-track ${corner.className}`}>
              {cornerAvatars.map((idx) => (
                <div
                  key={idx}
                  className="arri-dancing-node"
                  style={{
                    "--item-idx": idx,
                    "--delay": `${idx * 0.14}s`,
                  }}
                >
                  <img
                    src="/assets/Arri.jpeg"
                    alt=""
                    className="arri-rail-img"
                    draggable="false"
                  />
                  <span className="arri-crown-sparkle">✨</span>
                </div>
              ))}
            </div>
          ))}

          {/* Center glowing sweet note */}
          <div className="arri-rail-center-text">
            <span>Perru ❤️</span>
          </div>
        </div>
      )}

      <div
        className={`heart-stage stage-${stage} click-level-${clickCount}`}
        aria-hidden={isExploding || isRailDancing}
      >
        {/* 1) Small emojis flying out on click 1, 2, 3, 4 */}
        <div className="tap-burst-container" aria-hidden="true">
          {tapBursts.map((burst) =>
            burst.items.map((item) => (
              <span
                key={item.id}
                className="tap-burst-emoji"
                style={{
                  "--tx": `${item.tx}px`,
                  "--ty": `${item.ty}px`,
                  "--rot": `${item.rot}deg`,
                  "--scale": item.scale,
                }}
              >
                {item.emoji}
              </span>
            ))
          )}
        </div>

      {/* Heart Interactive Button */}
      <button
        ref={heartBtnRef}
        type="button"
        className={`heart-btn heart-stage-${stage} fill-${fillPercent}`}
        aria-label="Tap to unlock my heart"
        onClick={handleHeartClick}
        onKeyDown={handleKeyDown}
        disabled={isExploding || isRailDancing}
      >
        <span
          className={`heart-glow glow-${stage}`}
          style={{
            transform: `scale(${1 + fillPercent * 0.015})`,
            opacity: 0.6 + fillPercent * 0.004,
          }}
          aria-hidden="true"
        />

        {/* Stacked container with Heart SVG + Masked Fill Image */}
        <div className="heart-fusion-container">
          <svg
            className={`heart-svg ${isExploding ? "heart-svg-bursting" : ""}`}
            viewBox="0 0 100 90"
            width="106"
            height="96"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              {/* Perfect Heart Clip-Path for the fill photo */}
              <clipPath id="heartFillClip">
                <path d="M50 82 C 50 82, 6 58, 6 32 C 6 16, 18 6, 32 6 C 41 6, 47 12, 50 18 C 53 12, 59 6, 68 6 C 82 6, 94 16, 94 32 C 94 58, 50 82, 50 82 Z" />
              </clipPath>

              {/* Linear gradient border for a romantic glow rim */}
              <linearGradient id="heartRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9a9e" />
                <stop offset="50%" stopColor="#fecfef" />
                <stop offset="100%" stopColor="#ff6b81" />
              </linearGradient>
            </defs>

            {/* Dark base background of the heart */}
            <path
              d="M50 82 C 50 82, 6 58, 6 32 C 6 16, 18 6, 32 6 C 41 6, 47 12, 50 18 C 53 12, 59 6, 68 6 C 82 6, 94 16, 94 32 C 94 58, 50 82, 50 82 Z"
              fill="#08080a"
            />

            {/* Heart clipped photo layer: fills bottom-to-top (20% per click) */}
            <g clipPath="url(#heartFillClip)">
              {/* Photo filling up via SVG clip or height box */}
              <g
                style={{
                  transform: `translateY(${100 - fillPercent}%)`,
                  transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {/* Photo image */}
                <image
                  href="/assets/heart-fill.jpeg"
                  x="0"
                  y="0"
                  width="100"
                  height="90"
                  preserveAspectRatio="xMidYMid slice"
                />
                {/* Subtle soft pink wash over the photo for aesthetic tone */}
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="90"
                  fill="rgba(255, 105, 180, 0.18)"
                  style={{ mixBlendMode: "overlay" }}
                />
                {/* Glowing fluid fill line */}
                {fillPercent > 0 && fillPercent < 100 && (
                  <line
                    x1="0"
                    y1="0"
                    x2="100"
                    y2="0"
                    stroke="rgba(255, 192, 203, 0.9)"
                    strokeWidth="1.8"
                    filter="drop-shadow(0 0 4px #ff69b4)"
                  />
                )}
              </g>
            </g>

            {/* Heart outer borders & highlight */}
            <path
              d="M50 82 C 50 82, 6 58, 6 32 C 6 16, 18 6, 32 6 C 41 6, 47 12, 50 18 C 53 12, 59 6, 68 6 C 82 6, 94 16, 94 32 C 94 58, 50 82, 50 82 Z"
              fill="none"
              stroke={fillPercent > 0 ? "url(#heartRimGrad)" : "rgba(255,255,255,0.25)"}
              strokeWidth={fillPercent === 100 ? "2.2" : "1.4"}
              strokeLinejoin="round"
            />
          </svg>

          {/* Click percentage helper pill / heart beat pulse indicator */}
          <div
            className={`fill-progress-indicator ${clickCount > 0 ? "active" : ""}`}
            style={{
              opacity: isExploding || isRailDancing ? 0 : clickCount > 0 ? 1 : 0.4,
            }}
          >
            <span>{fillPercent}%</span>
          </div>
        </div>
      </button>

      {/* Helpful whisper hint when waiting for initial or remaining clicks */}
      {clickCount === 0 && (
        <p className="heart-tap-hint">Tap on the heart</p>
      )}
      {clickCount > 0 && clickCount < 5 && (
        <p className="heart-tap-hint hint-filling">{5 - clickCount} more tap{5 - clickCount > 1 ? "s" : ""}...</p>
      )}
    </div>
  </>
  );
}
