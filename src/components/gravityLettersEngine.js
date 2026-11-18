const DEF = {
  text: "Your Tejjjuuu", fontSize: 200, fontWeight: 800, fontFamily: "", lineHeight: 1,
  colors: ["#FFFFFF", "#B19EEF"], grain: "glyph",
  charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=?<>/",
  grainSize: 7, grainScale: 1, gravity: 1, anchor: "top", cut: true, cutWidth: 10, throwForce: 1,
  clickToCollapse: true, collapseSpeed: 1400, erosion: 0.1, healDelay: 1.8, holdTime: 0.8,
  rebuild: "sweep", rebuildDuration: 0.7, paused: false, quality: 1,
};
const LAYOUT = ["text", "fontSize", "fontWeight", "fontFamily", "lineHeight", "colors", "grain", "charset", "grainSize", "grainScale", "quality", "anchor"];
const N8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const N4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const rnd = (a, b) => a + Math.random() * (b - a);

function wrap(c, words, max) {
  const L = []; let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (cur && c.measureText(t).width > max) { L.push(cur); cur = w; } else cur = t;
  }
  if (cur) L.push(cur);
  return L;
}

export class GravityLettersEngine {
  constructor(el, opts = {}) {
    this.el = el; this.o = { ...DEF, ...opts };
    const cv = (this.cv = document.createElement("canvas"));
    cv.setAttribute("aria-hidden", "true");
    Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });
    el.appendChild(cv); this.ctx = cv.getContext("2d");
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.setAttribute("role", "img"); el.setAttribute("aria-label", this.o.text); el.tabIndex = 0;
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.last = null; this.chunks = [];
    this._m = (e) => this.onMove(e); this._l = () => { this.last = null; };
    this._c = (e) => this.onClick(e); this._k = (e) => { if (e.key === "Enter") this.onClick(null); };
    el.addEventListener("pointermove", this._m); el.addEventListener("pointerleave", this._l);
    el.addEventListener("click", this._c); el.addEventListener("keydown", this._k);
    this.ro = new ResizeObserver(() => this.layout()); this.ro.observe(el);
    this.layout();
    document.fonts?.load(`${this.o.fontWeight} 100px ${this.fam()}`).then(() => this.layout()).catch(() => {});
    this.prev = performance.now();
    this.tick = this.tick.bind(this); this.raf = requestAnimationFrame(this.tick);
  }
  fam() { return this.o.fontFamily || getComputedStyle(this.el).fontFamily || "sans-serif"; }
  setOptions(p) {
    const old = this.o; this.o = { ...old, ...p };
    this.el.setAttribute("aria-label", this.o.text);
    if (LAYOUT.some((k) => JSON.stringify(old[k]) !== JSON.stringify(this.o[k]))) this.layout();
  }
  destroy() {
    cancelAnimationFrame(this.raf); this.ro.disconnect();
    this.el.removeEventListener("pointermove", this._m); this.el.removeEventListener("pointerleave", this._l);
    this.el.removeEventListener("click", this._c); this.el.removeEventListener("keydown", this._k);
    this.cv.remove();
  }
  layout() {
    const o = this.o, r = this.el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const W = Math.floor(r.width), H = Math.floor(r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * Math.min(1, Math.max(0.25, o.quality));
    Object.assign(this, { W, H, dpr });
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    const cs = o.grainSize, fam = this.fam();
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const c = off.getContext("2d", { willReadFrequently: true });
    const words = o.text.split(/\s+/).filter(Boolean);
    let fs = o.fontSize, lines = [];
    for (; fs > 10; fs -= 2) {
      c.font = `${o.fontWeight} ${fs}px ${fam}`; lines = wrap(c, words, W * 0.94);
      if (lines.length * fs * o.lineHeight <= H * 0.92 && lines.every((l) => c.measureText(l).width <= W * 0.94)) break;
    }
    c.font = `${o.fontWeight} ${fs}px ${fam}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#000";
    lines.forEach((l, i) => c.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * fs * o.lineHeight));
    const px = c.getImageData(0, 0, W, H).data;
    const cols = Math.ceil(W / cs), rows = Math.ceil(H / cs), idx = new Int32Array(cols * rows).fill(-1), G = [];
    const nch = [...o.charset].length || 1;
    for (let rr = 0; rr < rows; rr++) for (let q = 0; q < cols; q++) {
      const x = Math.min(W - 1, Math.floor(q * cs + cs / 2)), y = Math.min(H - 1, Math.floor(rr * cs + cs / 2));
      if (px[(y * W + x) * 4 + 3] > 110) {
        idx[rr * cols + q] = G.length;
        G.push({ r: rr, c: q, hx: q * cs + cs / 2, hy: rr * cs + cs / 2, x: q * cs + cs / 2, y: rr * cs + cs / 2,
          vx: 0, vy: 0, s: 0, k: (Math.random() * nch) | 0, comp: -1, anch: false, rest: 0, col: 0, sett: false,
          rt: 0, rd: 0, sx: 0, sy: 0, ox: 0, oy: 0 });
      }
    }
    let n = 0;
    for (const g of G) {
      if (g.comp >= 0) continue;
      const st = [g], mem = [g]; g.comp = n; let lo = g.r, hi = g.r;
      while (st.length) {
        const a = st.pop();
        for (const [dr, dc] of N8) {
          const r2 = a.r + dr, c2 = a.c + dc;
          if (r2 < 0 || c2 < 0 || r2 >= rows || c2 >= cols) continue;
          const j = idx[r2 * cols + c2];
          if (j >= 0 && G[j].comp < 0) { G[j].comp = n; st.push(G[j]); mem.push(G[j]); lo = Math.min(lo, r2); hi = Math.max(hi, r2); }
        }
      }
      for (const m of mem) m.anch = o.anchor === "bottom" ? m.r >= hi - 1 : m.r <= lo + 1;
      n++;
    }
    Object.assign(this, { G, idx, cols, rows, chunks: [], collapsed: false, holdT: 0, dirty: false, cp: null });
    this.stack = Array.from({ length: cols }, () => []); this.hgt = new Int16Array(cols);
    this.buildAtlas();
  }
  buildAtlas() {
    const o = this.o, d = this.dpr, cs = o.grainSize, sp = Math.ceil(cs * d * 1.6) + 2;
    this.sp = sp; this.at = [];
    for (const col of o.colors) {
      const set = [];
      if (o.grain === "glyph") for (const ch of [...o.charset]) {
        const a = document.createElement("canvas"); a.width = a.height = sp;
        const x = a.getContext("2d"); x.fillStyle = col;
        x.font = `700 ${cs * d * 1.15 * o.grainScale}px ui-monospace,Menlo,monospace`;
        x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(ch, sp / 2, sp / 2); set.push(a);
      }
      this.at.push(set);
    }
  }
  floor(x) { const q = Math.min(this.cols - 1, Math.max(0, (x / this.o.grainSize) | 0)); return this.H - this.hgt[q] * this.o.grainSize; }
  settle(g) {
    const cs = this.o.grainSize, h = this.hgt;
    let q = Math.min(this.cols - 1, Math.max(0, (g.x / cs) | 0));
    for (let i = 0; i < 8; i++) {
      if (q > 0 && h[q - 1] + 2 <= h[q]) q--; else if (q < this.cols - 1 && h[q + 1] + 2 <= h[q]) q++; else break;
    }
    g.col = q; g.x = q * cs + cs / 2; g.y = this.H - (h[q] + 0.5) * cs;
    this.stack[q].push(g); h[q] = this.stack[q].length;
    g.s = 1; g.sett = true; g.vx = g.vy = 0; g.rest = 0;
  }
  leave(g) {
    const st = this.stack[g.col], i = st.indexOf(g);
    if (i >= 0) { const above = st.splice(i); above.shift(); for (const a of above) { a.sett = false; a.vy = 0; a.rest = 0; } }
    this.hgt[g.col] = st.length; g.sett = false;
  }
  startReturn(g, delay) {
    if (g.sett) this.leave(g);
    g.s = 3; g.sx = g.x; g.sy = g.y; g.rt = 0; g.rd = delay;
  }
  free(g, vx, vy) { g.s = 1; g.sett = false; g.rest = 0; g.vx = vx; g.vy = vy; }
  split(ivx = 0, ivy = 0, all = false) {
    const { idx, cols, rows, G } = this, o = this.o, seen = new Uint8Array(idx.length), st = [];
    const home = (j) => j >= 0 && G[j].s === 0;
    if (!all) for (const g of G) if (g.s === 0 && g.anch) { const k = g.r * cols + g.c; seen[k] = 1; st.push(k); }
    const walk = (stack, out) => {
      while (stack.length) {
        const k = stack.pop(), r = (k / cols) | 0, q = k % cols;
        for (const [dr, dc] of N8) {
          const r2 = r + dr, c2 = q + dc;
          if (r2 < 0 || c2 < 0 || r2 >= rows || c2 >= cols) continue;
          const nk = r2 * cols + c2;
          if (!seen[nk] && home(idx[nk])) { seen[nk] = 1; stack.push(nk); if (out) out.push(G[idx[nk]]); }
        }
      }
    };
    walk(st);
    for (const g of G) {
      if (g.s !== 0) continue;
      const k = g.r * cols + g.c; if (seen[k]) continue;
      seen[k] = 1; const gs = [g]; walk([k], gs);
      if (gs.length < 4) { for (const m of gs) this.free(m, ivx * 0.2 + rnd(-40, 40), ivy * 0.2); continue; }
      let cx = 0, cy = 0; for (const m of gs) { cx += m.x; cy += m.y; }
      cx /= gs.length; cy /= gs.length;
      let delay = 0;
      if (all && this.cp) { delay = 1e9; for (const m of gs) delay = Math.min(delay, Math.hypot(m.x - this.cp.x, m.y - this.cp.y) / o.collapseSpeed); }
      for (const m of gs) { m.s = 2; m.ox = m.x - cx; m.oy = m.y - cy; }
      this.chunks.push({ gs, cx, cy, vx: ivx * 0.12 * o.throwForce + rnd(-20, 20), vy: ivy * 0.05 * o.throwForce, a: 0, w: rnd(-2.5, 2.5), delay, t: 0 });
    }
  }
  cut(x0, y0, x1, y1, dt) {
    const o = this.o, cs = o.grainSize, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    if (len < 1) return;
    const sp = Math.min(2500, len / Math.max(dt, 0.008)), ux = dx / len, uy = dy / len, rad = o.cutWidth / 2 + cs / 2;
    const c0 = Math.max(0, Math.floor((Math.min(x0, x1) - rad) / cs)), c1 = Math.min(this.cols - 1, Math.floor((Math.max(x0, x1) + rad) / cs));
    const r0 = Math.max(0, Math.floor((Math.min(y0, y1) - rad) / cs)), r1 = Math.min(this.rows - 1, Math.floor((Math.max(y0, y1) + rad) / cs));
    let hit = 0;
    for (let r = r0; r <= r1; r++) for (let q = c0; q <= c1; q++) {
      const j = this.idx[r * this.cols + q]; if (j < 0) continue;
      const g = this.G[j]; if (g.s !== 0) continue;
      const t = Math.max(0, Math.min(1, ((g.x - x0) * ux + (g.y - y0) * uy) / len));
      if (Math.hypot(g.x - (x0 + dx * t), g.y - (y0 + dy * t)) <= rad) {
        this.free(g, ux * sp * 0.25 * o.throwForce + rnd(-80, 80), uy * sp * 0.25 * o.throwForce + rnd(-80, 40)); hit++;
      }
    }
    if (hit) this.split(ux * sp, uy * sp);
  }
  collapse(fx = 0.5, fy = 0.5) {
    if (this.reduce || this.collapsed || !this.G) return;
    this.collapsed = true; this.holdT = 0; this.cp = { x: fx * this.W, y: fy * this.H };
    for (const g of this.G) if (g.s === 3) this.free(g, 0, 0);
    this.split(0, 0, true);
  }
  rebuild() {
    if (this.reduce || !this.G) return;
    const o = this.o;
    for (const k of this.chunks) for (const g of k.gs) this.free(g, 0, 0);
    this.chunks = [];
    let mn = 1e9; for (const g of this.G) if (g.s !== 0) mn = Math.min(mn, g.y);
    for (const g of this.G) {
      if (g.s === 0) continue;
      const d = o.rebuild === "rise" ? (g.y - mn) / Math.max(1, this.H - mn) : o.rebuild === "random" ? Math.random() : g.hx / this.W;
      this.startReturn(g, d * 0.9);
    }
    this.collapsed = false; this.holdT = 0;
  }
  onMove(e) {
    if (this.reduce) return;
    const r = this.el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (this.last && this.o.cut && !this.o.paused && this.G) this.cut(this.last.x, this.last.y, x, y, (now - this.last.t) / 1000);
    this.last = { x, y, t: now };
  }
  onClick(e) {
    if (this.reduce || this.o.paused || !this.G) return;
    if (this.collapsed) { if (!this.chunks.length) this.rebuild(); return; }
    if (!this.o.clickToCollapse) return;
    if (e) { const r = this.el.getBoundingClientRect(); this.collapse((e.clientX - r.left) / this.W, (e.clientY - r.top) / this.H); }
    else this.collapse(0.5, 0.5);
  }
  exposed(g) {
    for (const [dr, dc] of N4) {
      const r = g.r + dr, q = g.c + dc;
      if (r < 0 || q < 0 || r >= this.rows || q >= this.cols) return true;
      const j = this.idx[r * this.cols + q]; if (j < 0 || this.G[j].s !== 0) return true;
    }
    return false;
  }
  update(dt) {
    const o = this.o, cs = o.grainSize, gr = 1800 * o.gravity, th = o.throwForce; let moving = 0;
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const k = this.chunks[i];
      if (k.delay > 0) { k.delay -= dt; continue; }
      k.t += dt; k.vy += gr * dt; k.cx += k.vx * dt; k.cy += k.vy * dt; k.a += k.w * dt;
      const cos = Math.cos(k.a), sin = Math.sin(k.a); let hit = k.t > 3;
      for (const g of k.gs) {
        g.x = k.cx + g.ox * cos - g.oy * sin; g.y = k.cy + g.ox * sin + g.oy * cos;
        if (g.y + cs / 2 >= this.floor(g.x)) hit = true;
      }
      if (hit) {
        for (const g of k.gs) this.free(g, k.vx * 0.35 + (g.x - k.cx) * rnd(1, 3) * th + rnd(-60, 60) * th, -Math.abs(k.vy) * rnd(0.1, 0.35) - rnd(0, 260) * th);
        this.chunks.splice(i, 1);
      }
    }
    for (const g of this.G) {
      if (g.s === 1) {
        if (g.sett) { g.rest += dt; if (!this.collapsed && g.rest > o.healDelay) this.startReturn(g, 0); continue; }
        g.vy += gr * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= 1 - 0.4 * dt;
        if (g.x < cs / 2) { g.x = cs / 2; g.vx = Math.abs(g.vx) * 0.5; }
        else if (g.x > this.W - cs / 2) { g.x = this.W - cs / 2; g.vx = -Math.abs(g.vx) * 0.5; }
        moving++;
        const fl = this.floor(g.x);
        if (g.y + cs / 2 >= fl) {
          if (Math.abs(g.vy) > 260) { g.y = fl - cs / 2; g.vy *= -0.25; g.vx *= 0.7; } else { this.settle(g); moving--; }
        }
      } else if (g.s === 3) {
        moving++;
        if (g.rd > 0) { g.rd -= dt; continue; }
        g.rt += dt / Math.max(0.05, o.rebuildDuration);
        const e = 1 - Math.pow(1 - Math.min(1, g.rt), 3);
        g.x = g.sx + (g.hx - g.sx) * e; g.y = g.sy + (g.hy - g.sy) * e;
        if (g.rt >= 1) { g.s = 0; g.x = g.hx; g.y = g.hy; }
      }
    }
    if (o.erosion > 0 && !this.collapsed) {
      this.eA = (this.eA || 0) + o.erosion * dt * 60;
      while (this.eA >= 1) {
        this.eA--; const g = this.G[(Math.random() * this.G.length) | 0];
        if (g && g.s === 0 && this.exposed(g)) { this.free(g, rnd(-30, 30), rnd(0, 40)); this.dirty = true; }
      }
    }
    if (this.dirty && (this.dT = (this.dT || 0) + dt) > 0.5) { this.dirty = false; this.dT = 0; this.split(0, 0); }
    if (this.collapsed) {
      if (!this.chunks.length && moving === 0) { this.holdT += dt; if (this.holdT >= o.holdTime) this.rebuild(); } else this.holdT = 0;
    }
  }
  draw() {
    const x = this.ctx, d = this.dpr, o = this.o, cs = o.grainSize;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.cv.width, this.cv.height);
    const colOf = (g) => (g.s === 1 ? 1 : g.s === 3 ? (g.rt < 0.6 ? 1 : 0) : 0);
    if (o.grain === "glyph") {
      const h = this.sp / 2;
      for (const g of this.G) x.drawImage(this.at[colOf(g)][g.k], Math.round(g.x * d - h), Math.round(g.y * d - h));
    } else {
      const w = cs * d * o.grainScale * 0.9;
      for (let p = 0; p < 2; p++) {
        x.fillStyle = o.colors[p];
        for (const g of this.G) {
          if (colOf(g) !== p) continue;
          if (o.grain === "dot") { x.beginPath(); x.arc(g.x * d, g.y * d, w / 2, 0, 6.283); x.fill(); }
          else x.fillRect(g.x * d - w / 2, g.y * d - w / 2, w, w);
        }
      }
    }
  }
  tick(now) {
    const dt = Math.min(0.033, (now - this.prev) / 1000); this.prev = now;
    if (this.G) { if (!this.o.paused && !this.reduce) this.update(dt); this.draw(); }
    this.raf = requestAnimationFrame(this.tick);
  }
}
