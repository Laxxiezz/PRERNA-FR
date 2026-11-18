"use client";

/**
 * BinaryOrbits — a tilted spiral galaxy of stars streaming through its arms.
 *
 * Standalone WebGL1 component (no dependencies besides React). Drop it into
 * `components/ui/binary-orbits.tsx`.
 *
 * How it works (short version):
 *  - Every star has a fixed radius + a starting angle. Inner stars orbit faster
 *    than outer ones (differential rotation).
 *  - The spiral arms are a fixed pattern in the galaxy's frame. A star is bright
 *    while it is inside an arm and dim when it leaves, so you see stars
 *    "streaming through" arms that themselves stay put.
 *  - Everything (orbit, arms, dust, tilt, wake, ripple) is computed in the
 *    vertex shader, so 70k+ stars stay cheap.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export interface BinaryOrbitsHandle {
  /** Sends a ring outward. x/y are galaxy-plane coords (-1..1), default = centre. */
  ripple: (x?: number, y?: number) => void;
}

export interface BinaryOrbitsProps {
  colors?: [string, string];
  backgroundColor?: string;
  mode?: "auto" | "glow" | "ink";
  stars?: number;
  starSize?: number;
  sparkle?: number;
  arms?: number;
  twist?: number;
  armStrength?: number;
  dust?: number;
  core?: number;
  coreSize?: number;
  innerVoid?: number;
  thickness?: number;
  tilt?: number;
  roll?: number;
  scale?: number;
  centerX?: number;
  centerY?: number;
  speed?: number;
  twinkle?: number;
  depth?: number;
  glow?: number;
  intensity?: number;
  interactive?: boolean;
  hoverWake?: boolean;
  clickRipple?: boolean;
  wakeStrength?: number;
  rippleStrength?: number;
  hoverBoost?: number;
  paused?: boolean;
  quality?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

type Settings = Required<Omit<BinaryOrbitsProps, "className" | "style" | "children">>;

export const BINARY_ORBITS_DEFAULTS: Settings = {
  colors: ["#7B4DFF", "#FFC2EE"],
  backgroundColor: "#0A0A0A",
  mode: "auto",
  stars: 70000,
  starSize: 1.7,
  sparkle: 0.5,
  arms: 3,
  twist: 3.5,
  armStrength: 0.5,
  dust: 0.5,
  core: 1,
  coreSize: 0.07,
  innerVoid: 0,
  thickness: 0.02,
  tilt: 62,
  roll: -8,
  scale: 1,
  centerX: 0.5,
  centerY: 0.52,
  speed: 1,
  twinkle: 0.35,
  depth: 0.4,
  glow: 0.45,
  intensity: 1,
  interactive: true,
  hoverWake: true,
  clickRipple: true,
  wakeStrength: 1,
  rippleStrength: 1,
  hoverBoost: 0.5,
  paused: false,
  quality: 1,
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const TWO_PI = Math.PI * 2;
const MAX_WAKES = 32;
const MAX_RIPPLES = 4;
const PERSP = 0.22; // perspective strength (must match the shader)

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (deg: number) => (deg * Math.PI) / 180;
const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

type RGB = [number, number, number];

const srgbToLinear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

/** Linear sRGB -> OKLab */
function linearToOklab([r, g, b]: RGB): RGB {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

let probeCtx: CanvasRenderingContext2D | null = null;

/** Any CSS colour (hex, rgb, hsl, oklch, var(--token) ...) -> sRGB 0..1 */
function parseColor(input: string, host: HTMLElement | null): RGB {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim());
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }
  if (typeof document === "undefined" || !host) return [0, 0, 0];
  const probe = document.createElement("span");
  probe.style.color = input;
  if (!probe.style.color) return [0, 0, 0];
  probe.style.display = "none";
  host.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  host.removeChild(probe);
  if (!probeCtx) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    probeCtx = c.getContext("2d", { willReadFrequently: true });
  }
  if (!probeCtx) return [0, 0, 0];
  probeCtx.clearRect(0, 0, 1, 1);
  probeCtx.fillStyle = "#000";
  probeCtx.fillStyle = computed;
  probeCtx.fillRect(0, 0, 1, 1);
  const d = probeCtx.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
}

/* ------------------------------------------------------------------ */
/* Star field (static, built once per star count)                      */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Per star: [r, phi0, z, rndA, rndB, rndC, kind]
 *  r    : 0..1 for disc stars, half-gaussian for bulge stars (scaled in shader)
 *  kind : 1 = bulge star, 0 = disc star
 */
function buildStars(n: number): Float32Array {
  const rand = mulberry32(0x9e3779b1);
  const gauss = () => {
    let u = 0;
    while (u < 1e-7) u = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * rand());
  };
  const out = new Float32Array(n * 7);
  const coreCount = Math.floor(n * 0.09);
  const H = 0.4; // disc scale length
  for (let i = 0; i < n; i++) {
    const o = i * 7;
    const core = i < coreCount;
    let r: number;
    if (core) {
      r = Math.min(Math.abs(gauss()), 3.2);
    } else {
      // surface density ~ exp(-r/H)  =>  radial pdf ~ r * exp(-r/H)
      do {
        r = -H * (Math.log(1 - rand()) + Math.log(1 - rand()));
      } while (r > 1);
    }
    out[o] = r;
    out[o + 1] = rand() * TWO_PI;
    out[o + 2] = clamp(gauss(), -3, 3);
    out[o + 3] = rand();
    out[o + 4] = rand();
    out[o + 5] = rand();
    out[o + 6] = core ? 1 : 0;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

export const VERTEX_SHADER = /* glsl */ `
precision highp float;

attribute vec3 aPos;   // r, phi0, z
attribute vec4 aRnd;   // rndA, rndB, rndC, kind

uniform vec2  uRes;
uniform vec2  uCenter;
uniform float uR;
uniform float uPx;
uniform float uRot;
uniform float uTime;
uniform float uTilt;
uniform float uRoll;
uniform float uStarSize;
uniform float uSparkle;
uniform float uArms;
uniform float uTwist;
uniform float uArmStrength;
uniform float uDust;
uniform float uCore;
uniform float uCoreSize;
uniform float uInnerVoid;
uniform float uThickness;
uniform float uTwinkle;
uniform float uDepth;
uniform float uGlow;
uniform float uIntensity;
uniform float uHover;
uniform float uInk;
uniform float uGlowPass;
uniform vec2  uCursor;
uniform float uCursorActive;
uniform vec3  uOk1;
uniform vec3  uOk2;
uniform vec3  uWarm;
uniform vec4  uWake[${MAX_WAKES}];
uniform float uWakeT[${MAX_WAKES}];
uniform vec4  uRip[${MAX_RIPPLES}];

varying vec3  vColor;
varying float vBright;
varying vec2  vMode;   // x = ink, y = haze pass (passed as a varying so no uniform is shared across stages)

const float PI = 3.14159265;
const float TWO_PI = 6.2831853;
const float PERSP = ${PERSP.toFixed(3)};

float omega(float r) {
  // inner stars orbit faster than outer ones
  return 0.2 / pow(r + 0.12, 0.8);
}

vec3 fromOk(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

void main() {
  vMode = vec2(uInk, uGlowPass);
  bool core = aRnd.w > 0.5;

  // ---- orbit -----------------------------------------------------
  float r0 = aPos.x;
  float r = core ? r0 * uCoreSize : uInnerVoid + (1.0 - uInnerVoid) * r0;
  float om = omega(r);
  float phi = mod(aPos.y + om * uRot, TWO_PI);

  float z = core
    ? aPos.z * uCoreSize * 0.8
    : aPos.z * uThickness * (0.35 + 1.4 * exp(-r * 5.0));

  // ---- fixed spiral arm pattern + dust lane ----------------------
  float rw = core ? 0.0 : smoothstep(0.02, 0.2, r);
  float profile = 0.0;
  float lane = 0.0;
  if (!core) {
    float armAng = -uTwist * 1.1 * log(1.0 + 4.0 * r);
    float u = (phi - armAng) * uArms / TWO_PI;
    float f = fract(u + 0.5) - 0.5;          // signed distance from arm centre
    float q = f / 0.15;
    profile = exp(-q * q);
    float l = (f - 0.16) / 0.065;            // dust sits on the inner edge
    lane = exp(-l * l);
  }
  float armK = min(1.0, uArmStrength * 1.6);
  float dens = 1.0 - armK * rw * (1.0 - profile);
  float vis = 1.0 - smoothstep(dens - 0.07, dens + 0.07, aRnd.x);
  float dustF = 1.0 - uDust * lane * rw * 0.9;

  // ---- hover wake: stars get gathered toward the pointer path ----
  float dr = 0.0;
  float dphi = 0.0;
  float gather = 0.0;
  float asum = 0.0;
  for (int i = 0; i < ${MAX_WAKES}; i++) {
    vec4 w = uWake[i];
    if (w.w > 0.0) {
      float age = uTime - uWakeT[i];
      float dec = (1.0 - exp(-age * 6.0)) * exp(-age / 1.5) * (1.0 - smoothstep(1.5, 2.2, age));
      if (dec > 0.001) {
        float ph0 = aPos.y + om * w.z;               // where this star was at impulse time
        vec2 x0 = r * vec2(cos(ph0), sin(ph0));
        vec2 d = w.xy - x0;
        float f2 = exp(-dot(d, d) / 0.016);
        float a = f2 * dec;
        vec2 x1 = x0 + d * min(0.15, 0.08 * w.w);
        float r1 = length(x1);
        float ph1 = atan(x1.y, x1.x + 1e-5);
        dr += (r1 - r) * a;
        dphi += (mod(ph1 - ph0 + PI, TWO_PI) - PI) * a;
        asum += a;
        gather += a * min(w.w, 0.6);
      }
    }
  }
  float nrm = 1.0 / max(1.0, asum);
  dr *= nrm;
  dphi *= nrm;   // the offset is carried by the star, so rotation winds it into an arc

  float rr = max(r + dr, 0.0);
  float pp = phi + dphi;
  vec2 pxy = rr * vec2(cos(pp), sin(pp));

  // ---- click ripple: density wave ring ----------------------------
  float ripB = 0.0;
  for (int j = 0; j < ${MAX_RIPPLES}; j++) {
    vec4 rp = uRip[j];
    if (rp.w > 0.0) {
      float age = uTime - rp.z;
      vec2 dd = pxy - rp.xy;
      float dl = length(dd) + 1e-4;
      float s = (dl - age * 0.4) / 0.075;
      float env = exp(-s * s);
      float life = exp(-age / 2.6) * (1.0 - exp(-age * 10.0));
      pxy -= (dd / dl) * s * env * 0.035 * rp.w * life;   // compress into the ring
      ripB += env * life * min(rp.w, 3.0);
    }
  }

  // ---- tilt, perspective, roll -----------------------------------
  float ct = cos(uTilt);
  float st = sin(uTilt);
  float yv = pxy.y * ct - z * st;
  float zv = pxy.y * st + z * ct;           // + = far side
  float persp = 1.0 / (1.0 + zv * PERSP * st);
  vec2 s2 = vec2(pxy.x, yv) * persp;
  float cr = cos(uRoll);
  float sr = sin(uRoll);
  s2 = vec2(s2.x * cr + s2.y * sr, -s2.x * sr + s2.y * cr);

  vec2 px = vec2(uCenter.x + s2.x * uR, uCenter.y - s2.y * uR);
  vec2 ndc = vec2(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0);

  // ---- brightness ------------------------------------------------
  float edge = core ? 1.0 : 1.0 - smoothstep(0.84, 1.0, r);
  float tw = 1.0 - uTwinkle * 0.65 * (0.5 + 0.5 * sin(uTime * (1.2 + 4.0 * aRnd.z) + aRnd.z * 60.0));
  float depthN = clamp(zv / max(st, 0.2) * 0.5 + 0.5, 0.0, 1.0);
  float depthF = 1.0 - uDepth * 0.65 * depthN;
  float sp = (!core && aRnd.y < uSparkle * 0.1) ? 1.0 : 0.0;

  // Direct cursor proximity effect: very light, delicate illumination
  vec2 dCur = pxy - uCursor;
  float curDistSq = dot(dCur, dCur);
  float curInfluence = exp(-curDistSq / 0.020) * uCursorActive;

  vis = max(vis, clamp(gather * 0.35 + curInfluence * 0.45, 0.0, 1.0));
  vis = max(vis, clamp(ripB * 0.7, 0.0, 1.0));

  float base = 0.45 + 0.55 * aRnd.z;
  float bright = base * vis * dustF * edge * tw * depthF;
  if (core) {
    float voidFade = 1.0 - smoothstep(0.0, 0.1, uInnerVoid);
    bright *= 0.42 * uCore * voidFade;
  } else {
    bright *= 0.65 + 0.7 * profile * rw * armK;
    bright *= 1.0 + uCore * 0.45 * exp(-r / (uCoreSize * 3.0));
  }
  bright *= uIntensity * (1.0 + 0.15 * uHover);
  bright *= 1.0 + sp * 0.7;
  bright += (gather * 0.18 + ripB * 0.6 + curInfluence * 0.30) * edge;

  // ---- size -------------------------------------------------------
  float size = uStarSize * uPx * (0.75 + 0.35 * aRnd.z) * (0.75 + 0.5 * persp)
             * (1.0 + sp * 0.9) * (1.0 + 0.08 * gather + 0.25 * ripB + 0.14 * curInfluence);
  if (core) size *= 0.85;
  float cov = clamp(size / 1.5, 0.3, 1.0);
  size = max(size, 1.4);
  bright *= cov;

  // ---- soft haze pass (a sparse subset of stars drawn as big sprites)
  if (uGlowPass > 0.5) {
    float keep = core ? 0.08 : 0.18;
    if (aRnd.z > keep || uGlow <= 0.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vColor = vec3(0.0);
      vBright = 0.0;
      return;
    }
    size *= core ? 6.0 : 5.0;
    bright *= uGlow * 0.022;
  }

  // ---- colour ------------------------------------------------------
  float t = 1.0 - smoothstep(0.0, 0.85, r);        // 1 = inner disc colour
  vec3 lin = max(fromOk(mix(uOk1, uOk2, t)), 0.0);
  float burn = core ? 0.35 : exp(-r / (uCoreSize * 3.0)) * 0.22;
  vec3 hot = mix(lin, vec3(1.0), burn);            // gentle glow towards white in very center
  vec3 deep = lin * (1.0 - 0.35 * burn);
  lin = mix(hot, deep, uInk);

  // Very light, elegant starlight twinkle under cursor (never harsh or heavy)
  vec3 hoverColor = mix(lin, vec3(1.0, 0.96, 0.88), 0.35);
  float hoverMix = clamp(curInfluence * 0.22 + gather * 0.12 + ripB * 0.45, 0.0, 1.0);
  lin = mix(lin, hoverColor, hoverMix);

  vec3 srgb = pow(max(lin, 0.0), vec3(1.0 / 2.2));
  srgb = clamp(srgb * (0.92 + 0.16 * aRnd.y), 0.0, 1.0);

  vColor = srgb;
  vBright = min(bright, 1.6);
  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = min(size, 48.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;
varying vec3  vColor;
varying float vBright;
varying vec2  vMode;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = length(p);
  if (d > 1.0 || vBright <= 0.0) discard;
  float a = vMode.y > 0.5 ? pow(1.0 - d, 2.0) : 1.0 - smoothstep(0.35, 1.0, d);
  float al = a * vBright;
  if (vMode.x > 0.5) {
    gl_FragColor = vec4(vColor, clamp(al, 0.0, 1.0));
  } else {
    gl_FragColor = vec4(vColor * al, 1.0);
  }
}
`;

/* ------------------------------------------------------------------ */
/* Engine (everything that isn't React)                                */
/* ------------------------------------------------------------------ */

interface Engine {
  destroy: () => void;
  setStars: (n: number) => void;
  update: () => void;
  ripple: (x?: number, y?: number) => void;
}

function createEngine(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  getProps: () => Settings,
  glOptions: WebGLContextAttributes = {}
): Engine | null {
  const initP = getProps();
  const isTransparent = initP.backgroundColor === "transparent" || initP.backgroundColor === "rgba(0, 0, 0, 0)";
  const gl = canvas.getContext("webgl", {
    alpha: isTransparent,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    ...glOptions,
  }) as WebGLRenderingContext | null;
  if (!gl) return null;

  /* ---- program ---- */
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error("BinaryOrbits shader error: " + log);
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("BinaryOrbits link error: " + gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);

  const uni: Record<string, WebGLUniformLocation | null> = {};
  const U = (name: string) =>
    name in uni ? uni[name] : (uni[name] = gl.getUniformLocation(program, name));
  const aPos = gl.getAttribLocation(program, "aPos");
  const aRnd = gl.getAttribLocation(program, "aRnd");

  const buffer = gl.createBuffer()!;
  let count = 0;
  const setStars = (n: number) => {
    const total = Math.round(clamp(num(n, 70000), 2000, 250000));
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, buildStars(total), gl.STATIC_DRAW);
    count = total;
    schedule();
  };

  /* ---- state ---- */
  let destroyed = false;
  let raf = 0;
  let last = 0;
  let time = 0; // seconds of "live" time (twinkle, wake age, ripple age)
  let rotT = 0; // accumulated rotation time (speed + hover boost baked in)
  let hover = 0;
  let hoverTarget = 0;
  let visible = true;
  let themeVersion = 0;
  let wakeIdx = 0;
  let rippleIdx = 0;
  let lastWakeTs = -Infinity; // event timestamp (seconds), independent of the render clock
  let lastPlane: [number, number] | null = null;
  let cursorPlane: [number, number] = [999.0, 999.0];
  let cursorActive = 0;
  const wakes = new Float32Array(MAX_WAKES * 4);
  const wakeT = new Float32Array(MAX_WAKES);
  const ripples = new Float32Array(MAX_RIPPLES * 4);

  const mq =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const reducedMotion = () => !!mq && mq.matches;

  /* ---- colours (cached; re-resolved when props or theme change) ---- */
  let colorKey = "";
  let cc = {
    bg: [0, 0, 0] as RGB,
    ok1: [0, 0, 0] as RGB,
    ok2: [0, 0, 0] as RGB,
    warm: [1, 0.7, 0.4] as RGB,
    ink: 0,
  };
  const resolveColors = (p: Settings) => {
    const key = `${p.colors[0]}|${p.colors[1]}|${p.backgroundColor}|${p.mode}|${themeVersion}`;
    if (key === colorKey) return;
    colorKey = key;
    const bg = parseColor(p.backgroundColor, root);
    const c1 = parseColor(p.colors[0], root).map(srgbToLinear) as RGB;
    const c2 = parseColor(p.colors[1], root).map(srgbToLinear) as RGB;
    const lum =
      0.2126 * srgbToLinear(bg[0]) + 0.7152 * srgbToLinear(bg[1]) + 0.0722 * srgbToLinear(bg[2]);
    const ink = p.mode === "ink" ? 1 : p.mode === "glow" ? 0 : lum > 0.4 ? 1 : 0;
    const warmTarget: RGB = [1.0, 0.55, 0.22];
    const warm = c2.map((v, i) => v + (warmTarget[i] - v) * 0.45) as RGB;
    cc = {
      bg,
      ok1: linearToOklab(c1),
      ok2: linearToOklab(c2),
      warm: ink ? (warm.map((v) => v * 0.8) as RGB) : warm,
      ink,
    };
  };

  /* ---- geometry helpers ---- */
  const galaxyRadiusCss = (w: number, h: number, scale: number) =>
    0.5 * scale * Math.min(w, h * 1.6) * 0.96;

  /** Screen position (css px inside root) -> galaxy-plane coords (undoes roll, tilt, perspective). */
  const toPlane = (cssX: number, cssY: number, p: Settings): [number, number] => {
    const w = root.clientWidth || 1;
    const h = root.clientHeight || 1;
    const R = galaxyRadiusCss(w, h, p.scale) || 1;
    const sx = (cssX - p.centerX * w) / R;
    const sy = -(cssY - p.centerY * h) / R;
    const roll = rad(p.roll);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    const xr = sx * cr - sy * sr;
    const yr = sx * sr + sy * cr;
    const tilt = rad(clamp(p.tilt, 0, 85));
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const k = PERSP * st * st;
    const y = yr / Math.max(ct - k * yr, 0.05);
    const x = xr * (1 + k * y);
    return [x, y];
  };

  const addRipple = (x: number, y: number, strength: number) => {
    const i = rippleIdx++ % MAX_RIPPLES;
    ripples[i * 4] = x;
    ripples[i * 4 + 1] = y;
    ripples[i * 4 + 2] = time;
    ripples[i * 4 + 3] = strength;
    schedule();
  };

  const effectsActive = () => {
    let active = cursorActive > 0;
    for (let i = 0; i < MAX_WAKES; i++) {
      if (wakes[i * 4 + 3] > 0) {
        if (time - wakeT[i] > 2.4) wakes[i * 4 + 3] = 0;
        else active = true;
      }
    }
    for (let i = 0; i < MAX_RIPPLES; i++) {
      if (ripples[i * 4 + 3] > 0) {
        if (time - ripples[i * 4 + 2] > 5) ripples[i * 4 + 3] = 0;
        else active = true;
      }
    }
    return active;
  };

  /* ---- canvas sizing ---- */
  let W = 0;
  let H = 0;
  let dpr = 1;
  const sizeCanvas = (p: Settings) => {
    const cw = root.clientWidth || 1;
    const ch = root.clientHeight || 1;
    const scale = Math.min(window.devicePixelRatio || 1, 2) * clamp(num(p.quality, 1), 0.25, 1);
    const nw = Math.max(1, Math.round(cw * scale));
    const nh = Math.max(1, Math.round(ch * scale));
    if (nw !== canvas.width || nh !== canvas.height) {
      canvas.width = nw;
      canvas.height = nh;
    }
    W = nw;
    H = nh;
    dpr = scale;
  };

  /* ---- draw ---- */
  const draw = (p: Settings) => {
    resolveColors(p);
    const cw = root.clientWidth || 1;
    const ch = root.clientHeight || 1;
    const Rpx = galaxyRadiusCss(cw, ch, clamp(num(p.scale, 1), 0.1, 4)) * dpr;

    gl.viewport(0, 0, W, H);
    const bgAlpha = p.backgroundColor === "transparent" || p.backgroundColor === "rgba(0, 0, 0, 0)" ? 0 : 1;
    gl.clearColor(cc.bg[0], cc.bg[1], cc.bg[2], bgAlpha);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!count) return;

    gl.enable(gl.BLEND);
    if (cc.ink) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    else gl.blendFunc(gl.ONE, gl.ONE);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(aRnd);
    gl.vertexAttribPointer(aRnd, 4, gl.FLOAT, false, 28, 12);

    gl.uniform2f(U("uRes"), W, H);
    gl.uniform2f(U("uCenter"), clamp(p.centerX, -1, 2) * W, clamp(p.centerY, -1, 2) * H);
    gl.uniform1f(U("uR"), Rpx);
    gl.uniform1f(U("uPx"), dpr);
    gl.uniform1f(U("uRot"), rotT);
    gl.uniform1f(U("uTime"), time);
    gl.uniform1f(U("uTilt"), rad(clamp(p.tilt, 0, 85)));
    gl.uniform1f(U("uRoll"), rad(p.roll));
    gl.uniform1f(U("uStarSize"), clamp(p.starSize, 0.1, 20));
    gl.uniform1f(U("uSparkle"), clamp(p.sparkle, 0, 1));
    gl.uniform1f(U("uArms"), Math.round(clamp(p.arms, 1, 8)));
    gl.uniform1f(U("uTwist"), p.twist);
    gl.uniform1f(U("uArmStrength"), clamp(p.armStrength, 0, 1));
    gl.uniform1f(U("uDust"), clamp(p.dust, 0, 1));
    gl.uniform1f(U("uCore"), clamp(p.core, 0, 3));
    gl.uniform1f(U("uCoreSize"), clamp(p.coreSize, 0.005, 0.6));
    gl.uniform1f(U("uInnerVoid"), clamp(p.innerVoid, 0, 0.6));
    gl.uniform1f(U("uThickness"), clamp(p.thickness, 0, 0.5));
    gl.uniform1f(U("uTwinkle"), clamp(p.twinkle, 0, 1));
    gl.uniform1f(U("uDepth"), clamp(p.depth, 0, 1));
    gl.uniform1f(U("uGlow"), clamp(p.glow, 0, 3));
    gl.uniform1f(U("uIntensity"), Math.max(0, p.intensity));
    gl.uniform1f(U("uHover"), hover * clamp(p.hoverBoost, 0, 2));
    gl.uniform1f(U("uInk"), cc.ink);
    gl.uniform2f(U("uCursor"), cursorPlane[0], cursorPlane[1]);
    gl.uniform1f(U("uCursorActive"), cursorActive);
    gl.uniform3fv(U("uOk1"), cc.ok1);
    gl.uniform3fv(U("uOk2"), cc.ok2);
    gl.uniform3fv(U("uWarm"), cc.warm);
    gl.uniform4fv(U("uWake[0]"), wakes);
    gl.uniform1fv(U("uWakeT[0]"), wakeT);
    gl.uniform4fv(U("uRip[0]"), ripples);

    // haze first (sits under the stars), then the stars themselves
    if (p.glow > 0) {
      gl.uniform1f(U("uGlowPass"), 1);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    gl.uniform1f(U("uGlowPass"), 0);
    gl.drawArrays(gl.POINTS, 0, count);
  };

  /* ---- loop ---- */
  const frame = (now: number) => {
    raf = 0;
    if (destroyed) return;
    const p = getProps();
    const reduced = reducedMotion();
    const dt = last ? clamp((now - last) / 1000, 0, 0.05) : 0;
    last = now;

    const rotating = !p.paused && !reduced;
    if (rotating) rotT += dt * p.speed * (1 + clamp(p.hoverBoost, 0, 2) * hover);
    if (!reduced) time += dt;
    hover += (hoverTarget - hover) * Math.min(1, dt * 4);

    sizeCanvas(p);
    draw(p);

    const keepGoing =
      visible &&
      !reduced &&
      (rotating || effectsActive() || Math.abs(hoverTarget - hover) > 0.003);
    if (keepGoing) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  function schedule() {
    if (!raf && !destroyed) raf = requestAnimationFrame(frame);
  }

  /* ---- pointer ---- */
  const onMove = (e: PointerEvent) => {
    const p = getProps();
    if (!p.interactive || reducedMotion()) return;
    hoverTarget = 1;
    const rect = root.getBoundingClientRect();
    const [x, y] = toPlane(e.clientX - rect.left, e.clientY - rect.top, p);
    cursorPlane = [x, y];
    cursorActive = 1.0;

    if (p.hoverWake) {
      if (Math.hypot(x, y) > 1.25) {
        lastPlane = null;
      } else if (!lastPlane) {
        lastPlane = [x, y];
      } else {
        const d = Math.hypot(x - lastPlane[0], y - lastPlane[1]);
        const ts = e.timeStamp / 1000;
        if (d > 0.005 && ts - lastWakeTs > 0.020) {
          const i = wakeIdx++ % MAX_WAKES;
          wakes[i * 4] = x;
          wakes[i * 4 + 1] = y;
          wakes[i * 4 + 2] = rotT;
          wakes[i * 4 + 3] = Math.min(1.0, 0.25 + d * 3.5) * clamp(p.wakeStrength, 0, 2);
          wakeT[i] = time;
          lastWakeTs = ts;
          lastPlane = [x, y];
        }
      }
    }
    schedule();
  };
  const onEnter = () => {
    if (!getProps().interactive || reducedMotion()) return;
    hoverTarget = 1;
    cursorActive = 1.0;
    schedule();
  };
  const onLeave = () => {
    hoverTarget = 0;
    cursorActive = 0.0;
    lastPlane = null;
    schedule();
  };
  const onDown = (e: PointerEvent) => {
    const p = getProps();
    if (!p.interactive || !p.clickRipple || reducedMotion()) return;
    const target = e.target as Element | null;
    if (target && target.closest && target.closest("a,button,input,textarea,select,[role=button]")) return;
    const rect = root.getBoundingClientRect();
    const [x, y] = toPlane(e.clientX - rect.left, e.clientY - rect.top, p);
    addRipple(x, y, clamp(p.rippleStrength, 0, 3));
  };

  // Listen to window so cursor movements anywhere illuminate stars even when container is background
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerdown", onDown);

  /* ---- observers ---- */
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => schedule()) : null;
  ro?.observe(root);
  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          visible = entries[entries.length - 1].isIntersecting;
          if (visible) schedule();
        })
      : null;
  io?.observe(root);
  const bumpTheme = () => {
    themeVersion++;
    schedule();
  };
  const mo =
    typeof MutationObserver !== "undefined"
      ? new MutationObserver(bumpTheme)
      : null;
  mo?.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  const schemeMq =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  schemeMq?.addEventListener?.("change", bumpTheme);
  mq?.addEventListener?.("change", schedule);

  const onContextLost = (e: Event) => e.preventDefault();
  canvas.addEventListener("webglcontextlost", onContextLost);

  /* ---- go ---- */
  setStars(getProps().stars);

  return {
    setStars,
    update: schedule,
    ripple: (x = 0, y = 0) => {
      if (reducedMotion()) return;
      addRipple(x, y, clamp(getProps().rippleStrength, 0, 3) || 1);
    },
    destroy: () => {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      ro?.disconnect();
      io?.disconnect();
      mo?.disconnect();
      schemeMq?.removeEventListener?.("change", bumpTheme);
      mq?.removeEventListener?.("change", schedule);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

/* test hook (not part of the public API) */
export const __createEngine = createEngine;

/* ------------------------------------------------------------------ */
/* React component                                                     */
/* ------------------------------------------------------------------ */

function withDefaults(props: BinaryOrbitsProps): Settings {
  const out: Record<string, unknown> = { ...BINARY_ORBITS_DEFAULTS };
  for (const key of Object.keys(BINARY_ORBITS_DEFAULTS)) {
    const v = (props as Record<string, unknown>)[key];
    if (v !== undefined) out[key] = v;
  }
  return out as unknown as Settings;
}

export const BinaryOrbits = forwardRef<BinaryOrbitsHandle, BinaryOrbitsProps>(
  function BinaryOrbits(props, ref) {
    const { className, style, children } = props;
    const settings = withDefaults(props);

    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const settingsRef = useRef<Settings>(settings);
    const engineRef = useRef<Engine | null>(null);

    // keep the engine reading the latest props, and redraw when they change
    useEffect(() => {
      settingsRef.current = settings;
      engineRef.current?.update();
    });

    useEffect(() => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      if (!root || !canvas) return;
      let engine: Engine | null = null;
      try {
        engine = createEngine(canvas, root, () => settingsRef.current);
      } catch (err) {
        console.error(err);
      }
      engineRef.current = engine;
      return () => {
        engine?.destroy();
        engineRef.current = null;
      };
    }, []);

    useEffect(() => {
      engineRef.current?.setStars(settings.stars);
    }, [settings.stars]);

    useImperativeHandle(
      ref,
      () => ({ ripple: (x?: number, y?: number) => engineRef.current?.ripple(x, y) }),
      []
    );

    return (
      <div
        ref={rootRef}
        className={className || "relative h-full min-h-[240px] w-full overflow-hidden"}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          backgroundColor: settings.backgroundColor === "transparent" ? "transparent" : settings.backgroundColor,
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "none",
          }}
        />
        {children ? <div className="relative z-10 h-full w-full">{children}</div> : null}
      </div>
    );
  }
);

export default BinaryOrbits;
