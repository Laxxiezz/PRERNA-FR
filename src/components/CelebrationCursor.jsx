import { useEffect, useRef } from "react";

const HEAD_IMAGES = [
  "/assets/head 1.jpeg",
  "/assets/head 2.jpeg",
  "/assets/head 3.jpeg",
  "/assets/head 4.jpeg",
  "/assets/head 5.jpeg",
  "/assets/head 6.jpeg",
  "/assets/head 7.jpeg",
];

export default function CelebrationCursor({
  imageSrcs = HEAD_IMAGES,
  burstCount = 18,
  spillInterval = 50,
  maxParticles = 120,
  particleSize = 28,
  gravity = 0.08,
  drag = 0.985,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Preload all user head images
    const loadedImages = [];
    imageSrcs.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => loadedImages.push(img);
    });

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let particles = [];
    let lastSpillTime = 0;
    let lastX = -9999;
    let lastY = -9999;

    const spawnParticle = (x, y, isBurst = false) => {
      if (particles.length >= maxParticles) {
        particles.shift();
      }

      if (loadedImages.length === 0) return;
      const img = loadedImages[Math.floor(Math.random() * loadedImages.length)];
      const angle = isBurst ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * Math.PI + Math.PI / 2;
      const speed = isBurst ? 1.8 + Math.random() * 3.8 : 0.4 + Math.random() * 1.2;

      const base = particleSize * (0.85 + Math.random() * 0.4);
      const aspect = (img.naturalWidth || 1) / Math.max(1, img.naturalHeight || 1);
      const w = aspect >= 1 ? base : base * aspect;
      const h = aspect >= 1 ? base / aspect : base;

      particles.push({
        img,
        x,
        y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.6,
        vy: isBurst ? Math.sin(angle) * speed - 0.8 : Math.sin(angle) * speed * 0.3 - 0.4,
        w,
        h,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.03 + Math.random() * 0.04,
        alpha: 1,
        life: 0,
        maxLife: isBurst ? 110 + Math.random() * 50 : 95 + Math.random() * 45,
        decay: 0.008 + Math.random() * 0.009,
      });
    };

    const onPointerMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      const now = performance.now();
      const dist = Math.hypot(x - lastX, y - lastY);

      if (now - lastSpillTime > spillInterval && dist > 6) {
        lastSpillTime = now;
        lastX = x;
        lastY = y;
        spawnParticle(x, y, false);
      }
    };

    const onClick = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      for (let i = 0; i < burstCount; i++) {
        spawnParticle(x, y, true);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onClick);

    let rafId = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.swayPhase += p.swaySpeed;
        const swayForce = Math.sin(p.swayPhase) * 0.15;

        p.x += p.vx + swayForce;
        p.y += p.vy;
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;

        p.rotation += p.rotationSpeed;
        p.life++;

        if (p.life > p.maxLife * 0.6) {
          p.alpha = Math.max(0, p.alpha - p.decay);
        }

        if (p.alpha <= 0 || p.y > height + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;

        // Soft drop shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        const w = p.w;
        const h = p.h;
        const radius = Math.min(w, h) * 0.22;

        // Rounded sticker card shape
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-w / 2, -h / 2, w, h, radius);
        } else {
          ctx.rect(-w / 2, -h / 2, w, h);
        }
        ctx.closePath();
        ctx.clip();

        // Draw user's exact cropped image
        ctx.drawImage(p.img, -w / 2, -h / 2, w, h);

        // Soft white outline border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [imageSrcs, burstCount, spillInterval, maxParticles, particleSize, gravity, drag]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
