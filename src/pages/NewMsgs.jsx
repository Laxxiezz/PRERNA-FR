import React, { useState, useEffect, useRef, useMemo } from "react";
import SideNav from "../components/SideNav.jsx";
import { Link } from "react-router-dom";
import "../styles/full-letter.css";
import "../styles/constellation.css";

// -------------------------------------------------------------
// Sound Synthesis for celestial interactions
// -------------------------------------------------------------
const playStarChime = (freq = 520, decay = 1.2) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + decay);
  } catch {}
};

// -------------------------------------------------------------
// Milestone Stars Data (Positions normalized 0..100)
// -------------------------------------------------------------
const CONSTELLATION_STARS = [
  {
    id: "star-genesis",
    name: "Alpha Cordis · The Spark",
    date: "January 29, 2026",
    tagline: "11:48 AM — When our story began",
    x: 22,
    y: 32,
    size: 20,
    color: "#ff70a6",
    quote: "The exact minute two souls quietly found their rhythm. Everything before this was just waiting.",
    memoryImage: "/memories/pyaaari/img-20261001-122939-913.jpg",
    details: "The counter still counts every single second since 11:48 AM on that morning. You are the only constant in my universe.",
    category: "Genesis"
  },
  {
    id: "star-whisper",
    name: "Nebula Perru · Her Sweet Laugh",
    date: "Late Night Talks",
    tagline: "The voice that melts distance",
    x: 44,
    y: 18,
    size: 24,
    color: "#ffd166",
    quote: "Even through phone speakers and tired evenings, hearing you giggle turns off all the noise in the world.",
    memoryImage: "/memories/pyaaari/img-20261001-123006-333.jpg",
    details: "I could listen to you tell me the most mundane story about your day and treat it like poetry.",
    category: "Intimate"
  },
  {
    id: "star-eyes",
    name: "Sirius Aankhhe · In Your Gaze",
    date: "An Irreplaceable Look",
    tagline: "Those eyes speak louder than words",
    x: 75,
    y: 28,
    size: 22,
    color: "#c084fc",
    quote: "You look at things with so much innocence and fierce care. That glance alone was enough to keep me forever.",
    memoryImage: "/memories/aankhhe/img-20261001-112513-897.jpg",
    details: "The little moments when you're thinking and look up softly — nobody else gets to see that side of you.",
    category: "Beauty"
  },
  {
    id: "star-flowers",
    name: "Lyra Phool · Flowers for Perru",
    date: "Every Blooming Day",
    tagline: "Small things that stay forever",
    x: 82,
    y: 58,
    size: 18,
    color: "#6ee7b7",
    quote: "Phool with flower — a real lotus blooming quietly in human form.",
    memoryImage: "/memories/phool-with-flower/img-20260924-131854-174-jpg.jpeg",
    details: "Every flower you ever held looked prettier just being near your hands.",
    category: "Tenderness"
  },
  {
    id: "star-tattoos",
    name: "Bicchu Vega · The Secret Mark",
    date: "Tiny details & chaos",
    tagline: "Permanent proof of who you are",
    x: 58,
    y: 72,
    size: 17,
    color: "#f472b6",
    quote: "A little mischievous, a little fierce, entirely cute. Just like your scorpion mark.",
    memoryImage: "/memories/taaatoos/biccchu.jpg",
    details: "Random quirks, stubborn habits, and sweet secrets — I love every single grain of your personality.",
    category: "Quirk"
  },
  {
    id: "star-future",
    name: "Ursa Domus · Blueprint of Tomorrow",
    date: "The House We Dreamt Of",
    tagline: "Our future cozy living room",
    x: 32,
    y: 78,
    size: 26,
    color: "#38bdf8",
    quote: "Drawings on paper, blue outlines, fairy lights, books on the shelves, and no more goodbyes at the door.",
    memoryImage: "/memories/house-blueprint/rn-image-picker-lib-temp-18fc8943-90e8-4452-a352-afe5d584493b.jpg",
    details: "One day we'll sit in that exact room, look back at these starry maps, and smile because we made it.",
    category: "Future"
  },
  {
    id: "star-bachpan",
    name: "Polaris Parvula · Tiny Perru",
    date: "Bachpan Archives",
    tagline: "Always meant to be cherished",
    x: 18,
    y: 54,
    size: 19,
    color: "#fbcfe8",
    quote: "Tiny cheeks, curious eyes, and a heart destined to be loved endlessly.",
    memoryImage: "/memories/peeru-s-bachpan/img-20260924-131810-847-jpg.jpeg",
    details: "If I could tell that little kid anything, I'd say: don't worry, somebody in the future loves you more than the stars.",
    category: "Origins"
  }
];

// Constellation Lines linking the stars in a celestial loop
const CONSTELLATION_LINES = [
  ["star-genesis", "star-whisper"],
  ["star-whisper", "star-eyes"],
  ["star-eyes", "star-flowers"],
  ["star-flowers", "star-tattoos"],
  ["star-tattoos", "star-future"],
  ["star-future", "star-bachpan"],
  ["star-bachpan", "star-genesis"],
  ["star-genesis", "star-tattoos"] // diagonal stabilizing ray
];

// Curated Star Dust / Background Stars
const BACKGROUND_STARS_COUNT = 140;

export default function NewMsgs() {
  const canvasRef = useRef(null);
  const [selectedStar, setSelectedStar] = useState(CONSTELLATION_STARS[0]);
  const [isSkyView, setIsSkyView] = useState(true);
  const [unlockedStars, setUnlockedStars] = useState(() => {
    try {
      const stored = localStorage.getItem("perru_unlocked_stars");
      return stored ? JSON.parse(stored) : ["star-genesis"];
    } catch {
      return ["star-genesis"];
    }
  });

  const [shootingStars, setShootingStars] = useState([]);
  const [telescopeZoom, setTelescopeZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Generate background static twinkle stars once
  const staticStars = useMemo(() => {
    return Array.from({ length: BACKGROUND_STARS_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2
    }));
  }, []);

  // Unlock star helper
  const handleSelectStar = (star) => {
    setSelectedStar(star);
    playStarChime(440 + star.x * 4, 1.4);

    if (!unlockedStars.includes(star.id)) {
      const nextUnlocked = [...unlockedStars, star.id];
      setUnlockedStars(nextUnlocked);
      try {
        localStorage.setItem("perru_unlocked_stars", JSON.stringify(nextUnlocked));
      } catch {}
    }
  };

  // Trigger a shooting star across the sky
  const triggerShootingStar = () => {
    const starId = Date.now();
    const startX = Math.random() * 60 + 10;
    const startY = Math.random() * 30 + 5;
    const length = Math.random() * 120 + 140;
    const angle = Math.random() * 30 + 35; // deg

    playStarChime(880, 0.8);
    setShootingStars((prev) => [
      ...prev,
      { id: starId, startX, startY, length, angle }
    ]);

    setTimeout(() => {
      setShootingStars((prev) => prev.filter((s) => s.id !== starId));
    }, 1200);
  };

  // Mouse drag pan support
  const handleMouseDown = (e) => {
    if (e.target.closest(".star-node") || e.target.closest(".celestial-card")) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: Math.max(-120, Math.min(120, e.clientX - dragStartRef.current.x)),
      y: Math.max(-80, Math.min(80, e.clientY - dragStartRef.current.y))
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Keyboard navigation through stars
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        const idx = CONSTELLATION_STARS.findIndex((s) => s.id === selectedStar.id);
        const next = CONSTELLATION_STARS[(idx + 1) % CONSTELLATION_STARS.length];
        handleSelectStar(next);
      } else if (e.key === "ArrowLeft") {
        const idx = CONSTELLATION_STARS.findIndex((s) => s.id === selectedStar.id);
        const prev = CONSTELLATION_STARS[(idx - 1 + CONSTELLATION_STARS.length) % CONSTELLATION_STARS.length];
        handleSelectStar(prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStar]);

  return (
    <div className="full-letter-shell celestial-observatory-shell">
      <SideNav />

      {/* Main Interactive Stargazer Canvas */}
      <div
        className="astronomy-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          dragStartRef.current = { x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y };
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          setPanOffset({
            x: Math.max(-120, Math.min(120, touch.clientX - dragStartRef.current.x)),
            y: Math.max(-80, Math.min(80, touch.clientY - dragStartRef.current.y))
          });
        }}
      >
        {/* Background Deep Space Gradient & Nebula Clouds */}
        <div className="deep-space-nebula" aria-hidden="true">
          <div className="nebula-cloud cloud-1" />
          <div className="nebula-cloud cloud-2" />
          <div className="nebula-cloud cloud-3" />
        </div>

        {/* Ambient Twinkling Static Stars */}
        <div className="background-starfield" aria-hidden="true">
          {staticStars.map((st) => (
            <span
              key={st.id}
              className="static-twinkle-star"
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: `${st.size}px`,
                height: `${st.size}px`,
                opacity: st.opacity,
                animationDelay: `${st.delay}s`,
                animationDuration: `${st.duration}s`
              }}
            />
          ))}
        </div>

        {/* Dynamic Shooting Stars */}
        {shootingStars.map((s) => (
          <div
            key={s.id}
            className="shooting-star-streak"
            style={{
              left: `${s.startX}%`,
              top: `${s.startY}%`,
              width: `${s.length}px`,
              transform: `rotate(${s.angle}deg)`
            }}
          />
        ))}

        {/* Transformed Constellation Map with Zoom & Pan */}
        <div
          className="constellation-transform-layer"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${telescopeZoom})`,
            transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1)"
          }}
        >
          {/* SVG Connecting Ray Lines */}
          <svg className="constellation-svg-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="starlight-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff70a6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {CONSTELLATION_LINES.map(([fromId, toId], i) => {
              const fromStar = CONSTELLATION_STARS.find((s) => s.id === fromId);
              const toStar = CONSTELLATION_STARS.find((s) => s.id === toId);
              if (!fromStar || !toStar) return null;

              const isHighlighted =
                selectedStar?.id === fromStar.id || selectedStar?.id === toStar.id;

              return (
                <line
                  key={i}
                  x1={fromStar.x}
                  y1={fromStar.y}
                  x2={toStar.x}
                  y2={toStar.y}
                  stroke={isHighlighted ? "url(#starlight-glow)" : "rgba(255, 255, 255, 0.18)"}
                  strokeWidth={isHighlighted ? 0.75 : 0.35}
                  strokeDasharray={isHighlighted ? "none" : "1, 1"}
                  className={`constellation-line ${isHighlighted ? "is-illuminated" : ""}`}
                />
              );
            })}
          </svg>

          {/* Major Interactive Milestone Stars */}
          {CONSTELLATION_STARS.map((star) => {
            const isSelected = selectedStar?.id === star.id;
            const isUnlocked = unlockedStars.includes(star.id);

            return (
              <button
                key={star.id}
                type="button"
                className={`star-node ${isSelected ? "is-selected-star" : ""} ${
                  isUnlocked ? "is-unlocked" : ""
                }`}
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  "--star-color": star.color
                }}
                onClick={() => handleSelectStar(star)}
                aria-label={`Inspect ${star.name}`}
              >
                {/* Outer Glow Halo */}
                <span className="star-halo" />
                {/* Core Star Orb */}
                <span className="star-core" style={{ backgroundColor: star.color }}>
                  <span className="star-flare" />
                </span>
                {/* Floating Starlight Badge */}
                <span className="star-label-pill">
                  <span className="star-dot" style={{ backgroundColor: star.color }} />
                  {star.name.split("·")[0].trim()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stargazer Navigation HUD Overlay */}
        <header className="observatory-hud">
          <div className="hud-title-card">
            <span className="hud-live-indicator">
              <span className="live-orb" />
              CELESTIAL MAP · 29°01′2026″
            </span>
            <h1 className="hud-heading">Constellation of Us</h1>
            <p className="hud-subheading">
              Our memories, dreams, and milestones mapped into the eternal sky. Tap any glowing star to align the telescope.
            </p>
          </div>

          <div className="hud-controls-group">
            <button
              type="button"
              className="hud-action-btn wish-btn"
              onClick={triggerShootingStar}
              title="Make a wish upon a shooting star"
            >
              💫 Make A Wish
            </button>

            {/* Telescope Zoom Controls */}
            <div className="hud-zoom-controls">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setTelescopeZoom((z) => Math.max(0.8, z - 0.2))}
                title="Zoom Out"
              >
                −
              </button>
              <span className="zoom-level">{Math.round(telescopeZoom * 100)}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setTelescopeZoom((z) => Math.min(1.8, z + 0.2))}
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>
        </header>

        {/* Bottom Observatory Memory Orbit Card */}
        {selectedStar && (
          <aside className="celestial-card" role="region" aria-label="Inspected star details">
            <div className="celestial-card-glow" style={{ "--glow-color": selectedStar.color }} />

            <div className="celestial-card-layout">
              {/* Left Photo Viewport */}
              <div className="celestial-photo-frame">
                <img
                  src={selectedStar.memoryImage}
                  alt={selectedStar.name}
                  className="celestial-image"
                />
                <span className="celestial-category-badge">{selectedStar.category}</span>
                <div className="frame-corner c-tl" />
                <div className="frame-corner c-tr" />
                <div className="frame-corner c-bl" />
                <div className="frame-corner c-br" />
              </div>

              {/* Right Memory Reflection Text */}
              <div className="celestial-details">
                <div className="details-header">
                  <div className="star-name-row">
                    <span className="star-color-indicator" style={{ backgroundColor: selectedStar.color }} />
                    <h2 className="celestial-star-name">{selectedStar.name}</h2>
                  </div>
                  <span className="celestial-date-pill">{selectedStar.date}</span>
                </div>

                <p className="celestial-tagline">{selectedStar.tagline}</p>

                <blockquote className="celestial-quote">
                  &ldquo;{selectedStar.quote}&rdquo;
                </blockquote>

                <p className="celestial-elaboration">{selectedStar.details}</p>

                {/* Bottom Interactive Strip */}
                <div className="celestial-footer">
                  <span className="orbit-unlocked-status">
                    ✨ Star Discovered ({unlockedStars.length} of {CONSTELLATION_STARS.length})
                  </span>

                  <div className="nav-orbit-stepper">
                    <button
                      type="button"
                      className="orbit-step-btn"
                      onClick={() => {
                        const idx = CONSTELLATION_STARS.findIndex((s) => s.id === selectedStar.id);
                        handleSelectStar(
                          CONSTELLATION_STARS[(idx - 1 + CONSTELLATION_STARS.length) % CONSTELLATION_STARS.length]
                        );
                      }}
                      aria-label="Previous star"
                    >
                      ← Prev Star
                    </button>
                    <button
                      type="button"
                      className="orbit-step-btn"
                      onClick={() => {
                        const idx = CONSTELLATION_STARS.findIndex((s) => s.id === selectedStar.id);
                        handleSelectStar(
                          CONSTELLATION_STARS[(idx + 1) % CONSTELLATION_STARS.length]
                        );
                      }}
                      aria-label="Next star"
                    >
                      Next Star →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
