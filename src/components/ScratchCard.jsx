import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import soundManager from "../lib/sound-manager.js";

export default function ScratchCard({
  id,
  badge = "Surprise",
  title,
  foilTitle = "Scratch to Reveal",
  foilTheme = "gold", // gold | rose | crimson | silver
  children,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);

  // Foil styling configs
  const getFoilStyle = useCallback(() => {
    switch (foilTheme) {
      case "rose":
        return {
          start: "#e11d48",
          mid: "#fda4af",
          end: "#9f1239",
          pattern: "rgba(255, 255, 255, 0.18)",
          text: "#ffffff",
        };
      case "crimson":
        return {
          start: "#881337",
          mid: "#be123c",
          end: "#4c0519",
          pattern: "rgba(255, 255, 255, 0.15)",
          text: "#ffd4e5",
        };
      case "silver":
        return {
          start: "#334155",
          mid: "#94a3b8",
          end: "#1e293b",
          pattern: "rgba(255, 255, 255, 0.25)",
          text: "#f8fafc",
        };
      case "gold":
      default:
        return {
          start: "#b45309",
          mid: "#fde047",
          end: "#78350f",
          pattern: "rgba(255, 255, 255, 0.25)",
          text: "#451a03",
        };
    }
  }, [foilTheme]);

  const initFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const style = getFoilStyle();

    // Metallic Gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, style.start);
    grad.addColorStop(0.35, style.mid);
    grad.addColorStop(0.65, style.start);
    grad.addColorStop(1, style.end);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Diagonal Shimmer Stripes
    ctx.strokeStyle = style.pattern;
    ctx.lineWidth = 14;
    for (let x = -height; x < width + height; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }

    // Sparkle Stars on foil
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 18; i++) {
      const sx = (i * 47) % width;
      const sy = (i * 73) % height;
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3) + 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centered Badge Pill
    const pillW = Math.min(width * 0.72, 190);
    const pillH = 34;
    const pillX = (width - pillW) / 2;
    const pillY = (height - pillH) / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 999);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Foil text inside pill
    ctx.fillStyle = "#ffffff";
    ctx.font = '600 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`✨ ${foilTitle}`, width / 2, height / 2);

    setIsRevealed(false);
    setScratchPercent(0);
  }, [foilTitle, getFoilStyle]);

  useEffect(() => {
    initFoil();
    const handleResize = () => initFoil();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initFoil]);

  const checkScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    // Sample every 8th pixel for fast performance
    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      let clearPixels = 0;
      let totalSamples = 0;

      for (let i = 3; i < data.length; i += 32) {
        totalSamples++;
        if (data[i] === 0) clearPixels++;
      }

      const percent = Math.round((clearPixels / totalSamples) * 100);
      setScratchPercent(percent);

      if (percent >= 45 && !isRevealed) {
        setIsRevealed(true);
        soundManager.play("unlock");
        soundManager.play("sparkle", { volume: 0.6 });
      }
    } catch {
      // ignore
    }
  }, [isRevealed]);

  const scratchAt = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundManager.play("scratch", { throttle: 90 });
    const ctx = canvas.getContext("2d");

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 42;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Extra circular head
    ctx.beginPath();
    ctx.arc(x, y, 21, 0, Math.PI * 2);
    ctx.fill();

    lastPosRef.current = { x, y };
  }, []);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    if (isRevealed) return;
    isDrawingRef.current = true;
    const pos = getCanvasCoords(e);
    lastPosRef.current = pos;
    scratchAt(pos.x, pos.y);
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current || isRevealed) return;
    if (e.touches) e.preventDefault(); // prevent scrolling while scratching
    const pos = getCanvasCoords(e);
    scratchAt(pos.x, pos.y);
    checkScratchPercentage();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    checkScratchPercentage();
  };

  return (
    <div className={`scratch-card-wrapper ${isRevealed ? "is-revealed" : ""}`} ref={containerRef}>
      {/* Top Header Badge */}
      <div className="scratch-card-header">
        <span className="scratch-badge-pill">
          <Sparkles size={13} /> {badge}
        </span>
        {isRevealed && (
          <button
            type="button"
            className="scratch-reset-btn"
            onClick={initFoil}
            title="Scratch again"
            aria-label="Scratch again"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* Secret Card Body (Revealed content) */}
      <div className="scratch-card-content">
        {title && <h3 className="scratch-card-title">{title}</h3>}
        <div className="scratch-card-body">{children}</div>
      </div>

      {/* Interactive Foil Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className={`scratch-foil-canvas ${isRevealed ? "foil-faded" : ""}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {/* Progress pill indicator if user started scratching */}
      {!isRevealed && scratchPercent > 0 && (
        <div className="scratch-progress-indicator">
          <span>{scratchPercent}% scratched</span>
        </div>
      )}
    </div>
  );
}

