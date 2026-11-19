import { useEffect, useRef } from "react";
import "../styles/login-ambient.css";

/**
 * LoginAmbientBackground — High-Performance, Buttery Smooth Romantic Ambient
 * Optimizations:
 * 1. Zero-React-Rerender Mouse Tracking: All mouse interaction is handled inside RAF loop via ref.
 * 2. GPU-Accelerated Canvas Rendering: Eliminated heavy CPU-based ctx.shadowBlur passes in favor of native radial gradient sprites.
 * 3. Delta-Timing (Frame-rate Independent): Locks 60-144 FPS smooth movement across 60Hz, 120Hz, and 144Hz displays.
 * 4. High-DPI Aware: Auto scales to devicePixelRatio (max 2) for crisp visuals without GPU bottleneck.
 * 5. Hardware-Accelerated CSS Layer: Uses translate3d and layout containment for 0ms layout thrashing.
 */

const SAKURA_COLORS = [
  "rgba(255, 182, 193, 0.72)",
  "rgba(251, 113, 133, 0.68)",
  "rgba(244, 63, 94, 0.62)",
  "rgba(253, 164, 175, 0.75)",
];

const EMBER_COLORS = [
  "rgba(251, 191, 36, 0.85)", // Warm gold
  "rgba(253, 224, 71, 0.8)",  // Starlight yellow
  "rgba(244, 63, 94, 0.75)",  // Soft rose
  "rgba(255, 255, 255, 0.9)", // White diamond
];

export default function LoginAmbientBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // 1. Sakura Petals (Natural wind sway & 3D flipping)
    const petalCount = width < 600 ? 16 : 28;
    const petals = Array.from({ length: petalCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 7 + Math.random() * 7,
      speedY: 0.65 + Math.random() * 0.95,
      swaySpeed: 0.015 + Math.random() * 0.018,
      swayDist: 18 + Math.random() * 30,
      swayOffset: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.024,
      flipAngle: Math.random() * Math.PI * 2,
      flipSpeed: 0.018 + Math.random() * 0.024,
      color: SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)],
      opacity: 0.45 + Math.random() * 0.4,
    }));

    // 2. Glowing Fireflies & Embers
    const emberCount = width < 600 ? 22 : 40;
    const embers = Array.from({ length: emberCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.2 + Math.random() * 2,
      speedY: -0.28 - Math.random() * 0.55,
      speedX: (Math.random() - 0.5) * 0.35,
      color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.024 + Math.random() * 0.03,
      baseAlpha: 0.35 + Math.random() * 0.45,
    }));

    // 3. Floating Micro-Hearts
    const heartCount = width < 600 ? 5 : 10;
    const hearts = Array.from({ length: heartCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 8 + Math.random() * 8,
      speedY: -0.45 - Math.random() * 0.6,
      speedX: (Math.random() - 0.5) * 0.3,
      rot: (Math.random() - 0.5) * 0.35,
      rotSpeed: (Math.random() - 0.5) * 0.012,
      alpha: 0.28 + Math.random() * 0.38,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // 4. Shooting Star with smooth streak
    let shootingStar = {
      active: false,
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      angle: Math.PI / 4,
      opacity: 0,
      cooldown: 180 + Math.random() * 200,
    };

    function spawnShootingStar() {
      shootingStar = {
        active: true,
        x: Math.random() * (width * 0.75),
        y: Math.random() * (height * 0.3),
        length: 70 + Math.random() * 80,
        speed: 13 + Math.random() * 8,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.12,
        opacity: 0.95,
        cooldown: 320 + Math.random() * 280,
      };
    }

    // High performance petal drawing (No shadowBlur overhead)
    function drawPetal(p, t) {
      const currentX = p.x + Math.sin(t * p.swaySpeed + p.swayOffset) * p.swayDist;
      ctx.save();
      ctx.translate(currentX, p.y);
      ctx.rotate(p.rot);
      ctx.scale(Math.cos(p.flipAngle), 1);

      ctx.beginPath();
      const s = p.size;
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.85, -s * 0.35, s * 0.8, s * 0.65, 0, s);
      ctx.bezierCurveTo(-s * 0.8, s * 0.65, -s * 0.85, -s * 0.35, 0, -s);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.restore();
    }

    // High performance ember drawing (Native radial gradients)
    function drawEmber(e, t) {
      const alpha = e.baseAlpha + Math.sin(t * e.pulseSpeed + e.pulsePhase) * 0.3;
      const currentAlpha = Math.max(0.08, Math.min(1, alpha));

      ctx.save();
      const glowR = e.radius * 3.2;
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glowR);
      g.addColorStop(0, e.color.replace(/[\d.]+\)$/, `${currentAlpha})`));
      g.addColorStop(0.5, e.color.replace(/[\d.]+\)$/, `${currentAlpha * 0.35})`));
      g.addColorStop(1, "transparent");

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Sharp glowing white core
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = currentAlpha * 0.85;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // High performance floating heart
    function drawHeart(h, t) {
      const pulse = 1 + Math.sin(t * 0.025 + h.pulsePhase) * 0.1;
      const s = h.size * pulse;

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      ctx.globalAlpha = h.alpha;

      ctx.fillStyle = "rgba(251, 113, 133, 0.72)";
      ctx.beginPath();
      const topH = s * 0.3;
      ctx.moveTo(0, topH);
      ctx.bezierCurveTo(0, -s * 0.1, -s * 0.55, -s * 0.1, -s * 0.55, topH);
      ctx.bezierCurveTo(-s * 0.55, s * 0.55, 0, s * 0.85, 0, s);
      ctx.bezierCurveTo(0, s * 0.85, s * 0.55, s * 0.55, s * 0.55, topH);
      ctx.bezierCurveTo(s * 0.55, -s * 0.1, 0, -s * 0.1, 0, topH);
      ctx.fill();
      ctx.restore();
    }

    let lastTime = performance.now();
    let frame = 0;

    function loop(currentTime) {
      const deltaMs = currentTime - lastTime;
      lastTime = currentTime;
      // Normalizes 60Hz/120Hz/144Hz monitors to smooth frame-time
      const dt = Math.min(deltaMs / 16.667, 2.0);
      frame += dt;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // 0. Soft Interactive Spotlight rendered on Canvas directly (0ms React lag!)
      if (mouse.active) {
        const spot = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 360);
        spot.addColorStop(0, "rgba(244, 63, 94, 0.12)");
        spot.addColorStop(0.5, "rgba(225, 29, 72, 0.03)");
        spot.addColorStop(1, "transparent");
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, width, height);
      }

      // 1. Update & Render Embers
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y += e.speedY * dt;
        e.x += e.speedX * dt;

        if (mouse.active) {
          const dx = e.x - mouse.x;
          const dy = e.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110 && dist > 0) {
            const force = ((110 - dist) / 110) * dt;
            e.x += (dx / dist) * force * 1.4;
            e.y += (dy / dist) * force * 1.4;
          }
        }

        if (e.y < -15) {
          e.y = height + 15;
          e.x = Math.random() * width;
        }
        if (e.x < -15) e.x = width + 15;
        if (e.x > width + 15) e.x = -15;

        drawEmber(e, frame);
      }

      // 2. Update & Render Floating Hearts
      for (let i = 0; i < hearts.length; i++) {
        const h = hearts[i];
        h.y += h.speedY * dt;
        h.x += h.speedX * dt;
        h.rot += h.rotSpeed * dt;

        if (h.y < -25) {
          h.y = height + 25;
          h.x = Math.random() * width;
        }
        if (h.x < -25) h.x = width + 25;
        if (h.x > width + 25) h.x = -25;

        drawHeart(h, frame);
      }

      // 3. Update & Render Sakura Petals
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.y += p.speedY * dt;
        p.rot += p.rotSpeed * dt;
        p.flipAngle += p.flipSpeed * dt;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100 && dist > 0) {
            const force = ((100 - dist) / 100) * dt;
            p.x += (dx / dist) * force * 2.0;
            p.y += (dy / dist) * force * 2.0;
            p.flipAngle += 0.06;
          }
        }

        if (p.y > height + 25) {
          p.y = -25;
          p.x = Math.random() * width;
        }
        if (p.x < -40) p.x = width + 40;
        if (p.x > width + 40) p.x = -40;

        drawPetal(p, frame);
      }

      // 4. Update & Render Shooting Star
      if (shootingStar.active) {
        const startX = shootingStar.x;
        const startY = shootingStar.y;
        const endX = startX - Math.cos(shootingStar.angle) * shootingStar.length;
        const endY = startY - Math.sin(shootingStar.angle) * shootingStar.length;

        ctx.save();
        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
        grad.addColorStop(0.25, `rgba(251, 191, 36, ${shootingStar.opacity * 0.8})`);
        grad.addColorStop(0.7, `rgba(244, 63, 94, ${shootingStar.opacity * 0.35})`);
        grad.addColorStop(1, "transparent");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.0;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(startX, startY, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed * dt;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed * dt;
        shootingStar.opacity -= 0.015 * dt;

        if (shootingStar.opacity <= 0 || shootingStar.x > width + 100 || shootingStar.y > height + 100) {
          shootingStar.active = false;
        }
      } else {
        shootingStar.cooldown -= dt;
        if (shootingStar.cooldown <= 0) {
          spawnShootingStar();
        }
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="login-ambient-container" aria-hidden="true">
      {/* 1. Hardware-Accelerated Ambient Aurora Orbs */}
      <div className="ambient-orbs-layer">
        <div className="ambient-orb orb-rose" />
        <div className="ambient-orb orb-amber" />
        <div className="ambient-orb orb-violet" />
        <div className="ambient-orb orb-plum" />
      </div>

      {/* 2. 60-144 FPS Hardware-Accelerated Canvas (Spotlight, Sakura Petals, Embers, Hearts, Shooting Star) */}
      <canvas ref={canvasRef} className="ambient-canvas-layer" />

      {/* 3. Floating Romantic Hand-Drawn Notes & Aesthetic Symbols */}
      <div className="ambient-doodles-layer">
        <span className="ambient-doodle-item doodle-note-1">for my perru ♡</span>
        <span className="ambient-doodle-item doodle-note-2">our secret haven 🗝️</span>
        <span className="ambient-doodle-item doodle-note-3">shhh... knock twice 🌸</span>
        <span className="ambient-doodle-item doodle-note-4">always & forever ✦</span>
        <span className="ambient-doodle-item doodle-note-5">to the stars & back ✨</span>
        <span className="ambient-doodle-item doodle-note-6">you are my favorite thought 💌</span>

        <span className="ambient-doodle-item doodle-sym-1">୨୧</span>
        <span className="ambient-doodle-item doodle-sym-2">♡</span>
        <span className="ambient-doodle-item doodle-sym-3">✦</span>
        <span className="ambient-doodle-item doodle-sym-4">❀</span>
        <span className="ambient-doodle-item doodle-sym-5">— ♡ —</span>
        <span className="ambient-doodle-item doodle-sym-6">⋆｡°✩</span>
        <span className="ambient-doodle-item doodle-sym-7">˚ ༘ ೀ</span>
      </div>
    </div>
  );
}
