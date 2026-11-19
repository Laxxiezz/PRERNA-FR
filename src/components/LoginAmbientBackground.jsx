import { useEffect, useRef, useState } from "react";
import "../styles/login-ambient.css";

/**
 * LoginAmbientBackground
 * Features:
 * 1. Celestial Aurora / Nebula Orbs (Breathing glowing gradients in Rose, Amber, Violet)
 * 2. 60 FPS Canvas Physics:
 *    - 3D Fluttering Sakura & Rose Petals with natural sway and flip
 *    - Golden and Pink Glowing Fireflies / Magical Embers rising upward
 *    - Delicate floating micro-hearts with gentle rotation
 *    - Cinematic shooting stars streaking across the night sky
 *    - Interactive mouse physics (particles gently react to cursor)
 * 3. Floating animated handwritten love notes & aesthetic symbols
 * 4. Interactive torch/spotlight glow following cursor
 */

const SAKURA_COLORS = [
  "rgba(255, 182, 193, 0.75)",
  "rgba(251, 113, 133, 0.7)",
  "rgba(244, 63, 94, 0.65)",
  "rgba(253, 164, 175, 0.8)",
];

const EMBER_COLORS = [
  "rgba(251, 191, 36, 0.85)", // Warm gold
  "rgba(253, 224, 71, 0.8)",  // Starlight yellow
  "rgba(244, 63, 94, 0.75)",  // Soft rose
  "rgba(255, 255, 255, 0.9)", // White diamond
];

export default function LoginAmbientBackground() {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000, active: false });
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
      setMousePos({ x: e.clientX, y: e.clientY, active: true });
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      setMousePos((prev) => ({ ...prev, active: false }));
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
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // 1. Sakura Petals (Natural wind sway & 3D flipping)
    const petalCount = window.innerWidth < 600 ? 18 : 34;
    const petals = Array.from({ length: petalCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 7 + Math.random() * 8,
      speedY: 0.7 + Math.random() * 1.1,
      swaySpeed: 0.015 + Math.random() * 0.02,
      swayDist: 20 + Math.random() * 35,
      swayOffset: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      flipAngle: Math.random() * Math.PI * 2,
      flipSpeed: 0.02 + Math.random() * 0.03,
      color: SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)],
      opacity: 0.45 + Math.random() * 0.45,
    }));

    // 2. Glowing Fireflies & Embers
    const emberCount = window.innerWidth < 600 ? 25 : 50;
    const embers = Array.from({ length: emberCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.2 + Math.random() * 2.2,
      speedY: -0.3 - Math.random() * 0.7, // rising gently
      speedX: (Math.random() - 0.5) * 0.4,
      color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.025 + Math.random() * 0.035,
      baseAlpha: 0.35 + Math.random() * 0.5,
    }));

    // 3. Floating Micro-Hearts
    const heartCount = window.innerWidth < 600 ? 6 : 14;
    const hearts = Array.from({ length: heartCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 9 + Math.random() * 9,
      speedY: -0.5 - Math.random() * 0.8, // floats upward
      speedX: (Math.random() - 0.5) * 0.35,
      rot: (Math.random() - 0.5) * 0.4,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      alpha: 0.25 + Math.random() * 0.4,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // 4. Shooting Star
    let shootingStar = {
      active: false,
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 deg
      opacity: 0,
      cooldown: 120 + Math.random() * 180, // frames until next star
    };

    function spawnShootingStar() {
      shootingStar = {
        active: true,
        x: Math.random() * (width * 0.7),
        y: Math.random() * (height * 0.35),
        length: 80 + Math.random() * 100,
        speed: 14 + Math.random() * 10,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.15,
        opacity: 1,
        cooldown: 280 + Math.random() * 300,
      };
    }

    // Draw single 3D fluttering sakura petal
    function drawPetal(p, t) {
      const currentX = p.x + Math.sin(t * p.swaySpeed + p.swayOffset) * p.swayDist;
      ctx.save();
      ctx.translate(currentX, p.y);
      ctx.rotate(p.rot);
      ctx.scale(Math.cos(p.flipAngle), 1); // Realistic 3D flip

      ctx.beginPath();
      const s = p.size;
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.85, -s * 0.35, s * 0.8, s * 0.65, 0, s);
      ctx.bezierCurveTo(-s * 0.8, s * 0.65, -s * 0.85, -s * 0.35, 0, -s);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.shadowColor = "rgba(244, 63, 94, 0.4)";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }

    // Draw glowing firefly / ember
    function drawEmber(e, t) {
      const alpha = e.baseAlpha + Math.sin(t * e.pulseSpeed + e.pulsePhase) * 0.35;
      const currentAlpha = Math.max(0.08, Math.min(1, alpha));

      ctx.save();
      const glowR = e.radius * 3.8;
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glowR);
      g.addColorStop(0, e.color.replace(/[\d.]+\)$/, `${currentAlpha})`));
      g.addColorStop(0.4, e.color.replace(/[\d.]+\)$/, `${currentAlpha * 0.4})`));
      g.addColorStop(1, "transparent");

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Bright center core
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = currentAlpha * 0.9;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw delicate floating heart
    function drawHeart(h, t) {
      const pulse = 1 + Math.sin(t * 0.03 + h.pulsePhase) * 0.12;
      const s = h.size * pulse;

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      ctx.globalAlpha = h.alpha;

      ctx.fillStyle = "rgba(251, 113, 133, 0.68)";
      ctx.shadowColor = "rgba(244, 63, 94, 0.55)";
      ctx.shadowBlur = 10;

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

    let frame = 0;

    function loop() {
      frame++;
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // 1. Update & Render Embers
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y += e.speedY;
        e.x += e.speedX;

        // Subtle mouse repulsion
        if (mouse.active) {
          const dx = e.x - mouse.x;
          const dy = e.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            e.x += (dx / dist) * force * 1.5;
            e.y += (dy / dist) * force * 1.5;
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
        h.y += h.speedY;
        h.x += h.speedX;
        h.rot += h.rotSpeed;

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
        p.y += p.speedY;
        p.rot += p.rotSpeed;
        p.flipAngle += p.flipSpeed;

        // Mouse breeze effect
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110 && dist > 0) {
            const force = (110 - dist) / 110;
            p.x += (dx / dist) * force * 2.2;
            p.y += (dy / dist) * force * 2.2;
            p.flipAngle += 0.08;
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
        grad.addColorStop(0.2, `rgba(251, 191, 36, ${shootingStar.opacity * 0.8})`);
        grad.addColorStop(0.6, `rgba(244, 63, 94, ${shootingStar.opacity * 0.4})`);
        grad.addColorStop(1, "transparent");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Glowing star head point
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(startX, startY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.opacity -= 0.016;

        if (shootingStar.opacity <= 0 || shootingStar.x > width + 100 || shootingStar.y > height + 100) {
          shootingStar.active = false;
        }
      } else {
        shootingStar.cooldown--;
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
      {/* 1. Luminous Ambient Aurora/Nebula Orbs */}
      <div className="ambient-orbs-layer">
        <div className="ambient-orb orb-rose" />
        <div className="ambient-orb orb-amber" />
        <div className="ambient-orb orb-violet" />
        <div className="ambient-orb orb-plum" />
      </div>

      {/* 2. Interactive Torch/Spotlight following mouse */}
      {mousePos.active && (
        <div
          className="ambient-spotlight"
          style={{
            background: `radial-gradient(circle 380px at ${mousePos.x}px ${mousePos.y}px, rgba(244, 63, 94, 0.14) 0%, rgba(225, 29, 72, 0.04) 50%, transparent 100%)`,
          }}
        />
      )}

      {/* 3. HTML5 60 FPS Particle Canvas (Sakura petals, embers, hearts, shooting stars) */}
      <canvas ref={canvasRef} className="ambient-canvas-layer" />

      {/* 4. Floating Animated Hand-Drawn Notes & Aesthetic Symbols */}
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
