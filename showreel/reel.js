/* ============================================================
   本村友一 — MOTION SHOWREEL 2026
   15s / 1920x1080 / 60fps / 120BPM
   Every frame is a pure function of time: render(t).
   ============================================================ */
(() => {
'use strict';

const W = 1920, H = 1080, FPS = 60, DUR = 15;
const NAME = '本村友一', NAME_EN = 'TOMOKAZU MOTOMURA';
const C = {
  bg: '#0A0A0C', ink: '#0A0A0C', cream: '#F3EEE3',
  red: '#FF3B1F', blue: '#2B3BFF', yellow: '#FFD23F',
};
const F = {
  disp: 'Unbounded', jp: '"Dela Gothic One"', jps: '"Noto Sans JP"',
  mono: '"JetBrains Mono", "Noto Sans JP"',
};
const TAU = Math.PI * 2;

/* ---------------- math ---------------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  inC: x => x * x * x,
  outC: x => 1 - Math.pow(1 - x, 3),
  ioC: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inExpo: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
  ioExpo: x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  ioBack: x => {
    const c2 = 1.70158 * 1.525;
    return x < .5 ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
                  : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  },
};
// damped spring 0 -> 1 (overshoots)
const spring = (x, w = 22, d = 9) => x <= 0 ? 0 : 1 - Math.exp(-d * x) * Math.cos(w * x);

function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = u => ((ax * u + bx) * u + cx) * u;
  const sy = u => ((ay * u + by) * u + cy) * u;
  const f = x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let lo = 0, hi = 1, u = x;
    for (let i = 0; i < 40; i++) { u = (lo + hi) / 2; if (sx(u) < x) lo = u; else hi = u; }
    return sy(u);
  };
  f.pt = u => [sx(u), sy(u)];
  return f;
}
const BZ = cubicBezier(0.8, 0, 0.2, 1);

function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hash = (a, b = 0) => {
  let h = Math.imul(a ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(b + 0x632BE59B, 0xC2B2AE35);
  h ^= h >>> 13; h = Math.imul(h, 0x27D4EB2F); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const hex2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => {
  const A = hex2rgb(a), B = hex2rgb(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
};
const alpha = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };

/* ---------------- canvas helpers ---------------- */
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function bg(ctx, col) { ctx.fillStyle = col; ctx.fillRect(-200, -200, W + 400, H + 400); }
function font(ctx, w, size, fam) { ctx.font = `${w} ${size}px ${fam}`; }
function layout(ctx, str, sp = 0) {
  let x = 0; const chars = [];
  for (const ch of str) { const w = ctx.measureText(ch).width; chars.push({ ch, x, w }); x += w + sp; }
  return { chars, width: x - sp };
}
function fitSize(ctx, str, weight, fam, maxW, maxSize, spEm = 0) {
  font(ctx, weight, 100, fam);
  const w = layout(ctx, str, 100 * spEm).width;
  return Math.min(maxSize, maxW / w * 100);
}
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
function scramble(str, p, seed = 1) {
  const n = str.length; let out = '';
  const frame = Math.floor(p * 48);
  for (let i = 0; i < n; i++) {
    const ch = str[i];
    const th = i / n * 0.7;
    if (p <= th) out += ' ';
    else if (p >= th + 0.3 || ch === ' ') out += ch;
    else out += GLYPHS[Math.floor(hash(i + seed * 97, frame) * GLYPHS.length)];
  }
  return out;
}

/* ---------------- global camera shake ---------------- */
const IMPACTS = [[1.5, 7], [6.75, 12], [12.0, 26], [13.5, 14]];
function shake(t) {
  let x = 0, y = 0;
  for (const [b, a] of IMPACTS) {
    if (t < b) continue;
    const k = a * Math.exp(-(t - b) * 11);
    x += k * Math.sin((t - b) * 97 + b); y += k * Math.cos((t - b) * 83 + b * 2);
  }
  return { x, y };
}

/* ============================================================
   SCENE 1 — IGNITION (0.0 – 1.5)
   ============================================================ */
function s1(ctx, t) {
  bg(ctx, C.bg);
  const cx = W / 2, cy = H / 2;
  ctx.fillStyle = C.red;
  if (t < 0.5) {
    const pop = E.outBack(prog(t, 0.12, 0.40), 3);
    const a = E.ioC(prog(t, 0.36, 0.5));
    const r = 18 * pop;
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.4 * a, r * (1 + 0.55 * a), r * (1 - 0.4 * a), 0, 0, TAU); ctx.fill();
    // pop ring
    const rp = prog(t, 0.14, 0.45);
    if (rp > 0 && rp < 1) {
      ctx.strokeStyle = alpha(C.red, 1 - rp); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 18 + E.outExpo(rp) * 90, 0, TAU); ctx.stroke();
    }
    return;
  }
  const half = lerp(18, W / 2 + 60, E.outExpo(prog(t, 0.5, 0.95)));
  let th = lerp(26, 6, E.outExpo(prog(t, 0.5, 0.72)));
  const grow = E.inExpo(prog(t, 1.12, 1.5));
  th = lerp(th, H + 60, grow);
  // anti stretch overshoot on vertical
  ctx.fillRect(cx - half, cy - th / 2, half * 2, th);

  const fade = 1 - prog(t, 1.08, 1.22);
  if (fade <= 0) return;
  // ruler ticks
  ctx.fillStyle = alpha(C.cream, 0.7 * fade);
  for (let i = -16; i <= 16; i++) {
    const d = Math.abs(i);
    const p = E.outBack(prog(t, 0.72 + d * 0.012, 0.72 + d * 0.012 + 0.2), 2.5);
    if (p <= 0) continue;
    const big = i % 4 === 0;
    const h = (big ? 26 : 12) * p;
    ctx.fillRect(cx + i * 56 - 1, cy + 18, 2, h);
  }
  font(ctx, 500, 18, F.mono); ctx.textAlign = 'center';
  for (let i = -16; i <= 16; i += 4) {
    const d = Math.abs(i);
    if (t < 0.78 + d * 0.012) continue;
    ctx.fillText(String((i + 16) * 30 / 4 | 0).padStart(3, '0'), cx + i * 56, cy + 70);
  }
  ctx.fillStyle = alpha(C.cream, fade);
  font(ctx, 500, 30, F.mono);
  ctx.letterSpacing = '14px';
  ctx.fillText(scramble('MOTION  SHOWREEL  2026', prog(t, 0.78, 1.18), 3), cx + 7, cy - 48);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}

/* ============================================================
   SCENE 2 — KINETIC TYPE (1.5 – 3.5)
   ============================================================ */
function wordReveal(ctx, str, size, baseline, t0, t, col, sp = 0) {
  font(ctx, 800, size, F.disp);
  const L = layout(ctx, str, sp);
  const x0 = (W - L.width) / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, baseline - size * 0.95, W, size * 1.1); ctx.clip();
  ctx.fillStyle = col;
  L.chars.forEach((c, i) => {
    const p = E.outExpo(prog(t, t0 + i * 0.035, t0 + i * 0.035 + 0.55));
    const y = baseline + (1 - p) * size * 1.05;
    const skew = (1 - p) * 0.25;
    ctx.save(); ctx.translate(x0 + c.x, y); ctx.transform(1, 0, -skew, 1, 0, 0);
    ctx.fillText(c.ch, 0, 0); ctx.restore();
  });
  ctx.restore();
  return { x0, width: L.width };
}
function marquee(ctx, str, size, y, speed, t, col, a) {
  font(ctx, 800, size, F.disp);
  const w = ctx.measureText(str).width;
  let x = ((t * speed) % w + w) % w - w;
  ctx.strokeStyle = alpha(col, a); ctx.lineWidth = 2;
  for (; x < W; x += w) ctx.strokeText(str, x, y);
}
function s2(ctx, t) {
  if (t < 2.5) {
    bg(ctx, C.red);
    const ma = E.outC(prog(t, 1.7, 2.1));
    marquee(ctx, 'MOTION DESIGN — MOTION DESIGN — ', 64, 150, -380, t, C.ink, 0.55 * ma);
    marquee(ctx, 'KINETIC TYPOGRAPHY — KINETIC TYPOGRAPHY — ', 64, 1000, 380, t, C.ink, 0.55 * ma);
    const size = fitSize(ctx, 'MOTION', 800, F.disp, 1640, 300);
    wordReveal(ctx, 'MOTION', size, 520, 1.5, t, C.ink);
    wordReveal(ctx, 'DESIGN', size, 520 + size * 0.95, 2.0, t, C.cream);
    // hairline with frame marker
    const lp = E.outExpo(prog(t, 1.62, 2.1));
    ctx.fillStyle = C.ink;
    ctx.fillRect(W / 2 - 820 * lp, 555, 1640 * lp, 3);
    return;
  }
  bg(ctx, C.bg);
  // Doctor-Heli footage: ken-burns, helicopter drifts across frame
  {
    const k = prog(t, 2.5, 3.5);
    const s = 1.95 + 0.14 * E.outC(k) + 0.1 * (1 - E.outExpo(prog(t, 2.5, 2.8)));
    const iw = IMG.heli.width * s, ih = IMG.heli.height * s;
    const hx = lerp(1180, 1300, k), hy = lerp(470, 420, k);
    const ox = clamp(hx - 655 * s, W - iw, 0), oy = clamp(hy - 290 * s, H - ih, 0);
    ctx.drawImage(IMG.heli, ox, oy, iw, ih);
    const gr = ctx.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(243,238,227,0.35)'); gr.addColorStop(0.6, 'rgba(243,238,227,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  const out = E.inExpo(prog(t, 3.25, 3.5));
  ctx.save(); ctx.translate(0, -out * 260);
  const size = 205;
  font(ctx, 400, size, F.jp);
  const lines = [['動きで、', 140, 440, 2.5], ['伝える。', 240, 720, 3.0]];
  for (const [str, x0, base, t0] of lines) {
    const L = layout(ctx, str, 6);
    L.chars.forEach((c, i) => {
      const p = prog(t, t0 + i * 0.055, t0 + i * 0.055 + 0.4);
      if (p <= 0) return;
      const e = E.outExpo(p);
      const s = lerp(1.9, 1, e);
      ctx.save();
      ctx.translate(x0 + c.x + c.w / 2, base - size * 0.36);
      ctx.scale(s, s); ctx.rotate((1 - e) * -0.35);
      const b = (1 - e) * 22;
      if (b > 0.5) ctx.filter = `blur(${b.toFixed(1)}px)`;
      ctx.globalAlpha = clamp(p * 4);
      ctx.fillStyle = c.ch === '。' || c.ch === '、' ? C.red : C.ink;
      ctx.textAlign = 'center';
      ctx.fillText(c.ch, 0, size * 0.36);
      ctx.restore();
    });
  }
  // red underline
  const up = E.outExpo(prog(t, 3.05, 3.4));
  ctx.fillStyle = C.red; ctx.fillRect(240, 762, 880 * up, 8);
  font(ctx, 500, 20, F.mono); ctx.fillStyle = alpha(C.ink, 0.75 * E.outC(prog(t, 2.6, 2.9)));
  ctx.fillText('— COMMUNICATE THROUGH MOTION', 144, 505);
  ctx.fillText('— DOCTOR-HELI', 1280, 700);
  ctx.restore();
  // cream bars wipe into scene 3
  ctx.fillStyle = C.cream;
  const n = 7, bw = W / n;
  for (let i = 0; i < n; i++) {
    const p = E.ioExpo(prog(t, 3.27 + i * 0.012, 3.27 + i * 0.012 + 0.16));
    if (p <= 0) continue;
    ctx.fillRect(i * bw - 1, H - (H + 20) * p, bw + 2, (H + 20) * p + 200);
  }
}

/* ============================================================
   SCENE 3 — EASING / MORPH (3.5 – 5.5)
   ============================================================ */
const NA = 360;
function polyRadii(verts) {
  const out = new Float32Array(NA);
  for (let k = 0; k < NA; k++) {
    const a = k / NA * TAU - Math.PI / 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = 1e9;
    for (let i = 0; i < verts.length; i++) {
      const [px, py] = verts[i], [qx, qy] = verts[(i + 1) % verts.length];
      const ex = qx - px, ey = qy - py;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const s = (px * ey - py * ex) / den;
      const u = (px * dy - py * dx) / den;
      if (s > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.min(best, s);
    }
    out[k] = best;
  }
  return out;
}
const regular = (n, R, a0) => Array.from({ length: n }, (_, i) => [R * Math.cos(a0 + i * TAU / n), R * Math.sin(a0 + i * TAU / n)]);
const SHAPES = [
  new Float32Array(NA).fill(230),
  polyRadii(regular(4, 290, -Math.PI / 4)),
  polyRadii(regular(3, 310, -Math.PI / 2)),
  polyRadii(Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 132 : 330, a = -Math.PI / 2 + i * Math.PI / 5;
    return [r * Math.cos(a), r * Math.sin(a)];
  })),
];
const SHAPE_COL = [C.ink, C.blue, C.red, C.ink];
const SEGS = [3.75, 4.25, 4.75];
function morphState(t) {
  let k = 0, e = 0;
  for (let i = 0; i < SEGS.length; i++) if (t >= SEGS[i]) { k = i; e = BZ(prog(t, SEGS[i], SEGS[i] + 0.42)); }
  if (t < SEGS[0]) return { a: 0, b: 0, e: 0, rot: 0 };
  return { a: k, b: k + 1, e, rot: (k + e) * TAU };
}
function shapePath(ctx, st, cx, cy, s) {
  const A = SHAPES[st.a], B = SHAPES[st.b];
  ctx.beginPath();
  for (let k = 0; k < NA; k++) {
    const a = k / NA * TAU - Math.PI / 2 + st.rot;
    const r = lerp(A[k], B[k], st.e) * s;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}
function s3(ctx, t) {
  bg(ctx, C.cream);
  const gFade = 1 - prog(t, 5.08, 5.25);
  // ---- graph panel
  const x0 = 200, y0 = 830, S = 520;
  if (gFade > 0) {
    ctx.globalAlpha = gFade;
    const ax = E.outExpo(prog(t, 3.5, 3.85));
    ctx.fillStyle = alpha(C.ink, 0.08);
    for (let i = 1; i <= 4; i++) {
      ctx.fillRect(x0, y0 - S * i / 4, S * ax, 1);
      ctx.fillRect(x0 + S * i / 4, y0 - S * ax, 1, S * ax);
    }
    ctx.fillStyle = C.ink;
    ctx.fillRect(x0, y0 - 1.5, S * ax, 3);
    ctx.fillRect(x0 - 1.5, y0 - S * ax, 3, S * ax);
    // handles
    const hp = E.outBack(prog(t, 3.62, 3.9), 2);
    const P = (u, v) => [x0 + u * S, y0 - v * S];
    const [h1x, h1y] = P(0.8, 0), [h2x, h2y] = P(0.2, 1);
    ctx.strokeStyle = C.red; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, h1x, hp), lerp(y0, h1y, hp));
    ctx.moveTo(x0 + S, y0 - S); ctx.lineTo(lerp(x0 + S, h2x, hp), lerp(y0 - S, h2y, hp)); ctx.stroke();
    for (const [hx, hy, ox, oy] of [[h1x, h1y, x0, y0], [h2x, h2y, x0 + S, y0 - S]]) {
      ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(lerp(ox, hx, hp), lerp(oy, hy, hp), 10 * clamp(hp * 2), 0, TAU); ctx.fill();
      ctx.lineWidth = 3; ctx.stroke();
    }
    // curve
    const cp = E.ioC(prog(t, 3.6, 4.0));
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 120 * cp; i++) {
      const [u, v] = BZ.pt(i / 120);
      const [px, py] = P(u, v); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke(); ctx.lineCap = 'butt';
    // playhead
    if (t >= SEGS[0]) {
      let lp = 0;
      for (const s of SEGS) if (t >= s) lp = prog(t, s, s + 0.42);
      const v = BZ(lp); const [px, py] = P(lp, v);
      ctx.setLineDash([6, 8]); ctx.strokeStyle = alpha(C.ink, 0.5); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, py); ctx.lineTo(x0, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(px, py, 13, 0, TAU); ctx.fill();
      // value meter
      ctx.fillStyle = alpha(C.ink, 0.12); ctx.fillRect(x0 + S + 40, y0 - S, 14, S);
      ctx.fillStyle = C.red; ctx.fillRect(x0 + S + 40, y0 - S * v, 14, S * v);
    }
    // labels
    font(ctx, 500, 24, F.mono); ctx.fillStyle = C.ink;
    ctx.fillText(scramble('cubic-bezier(0.80, 0.00, 0.20, 1.00)', prog(t, 3.7, 4.15), 7), x0, y0 + 60);
    font(ctx, 500, 16, F.mono); ctx.fillStyle = alpha(C.ink, 0.55);
    ctx.fillText(scramble('TIME →', prog(t, 3.8, 4.1), 2), x0 + S - 70, y0 + 28);
    ctx.save(); ctx.translate(x0 - 22, y0 - S + 80); ctx.rotate(-Math.PI / 2);
    ctx.fillText(scramble('← VALUE', prog(t, 3.8, 4.1), 4), 0, 0); ctx.restore();
    font(ctx, 800, 64, F.disp); ctx.fillStyle = C.ink;
    ctx.fillText(scramble('EASING', prog(t, 3.55, 3.95), 5), x0, 230);
    ctx.globalAlpha = 1;
  }
  // ---- morphing shape
  const zoom = E.inExpo(prog(t, 5.2, 5.5));
  const cx = lerp(1300, W / 2, zoom), cy = lerp(540, H / 2, zoom);
  const intro = E.outBack(prog(t, 3.5, 3.85), 1.8);
  const sc = intro * (1 + zoom * 16);
  const st = morphState(t);
  // echo trails
  for (let j = 5; j >= 1; j--) {
    const sj = morphState(t - j * 0.03);
    shapePath(ctx, sj, cx, cy, sc);
    ctx.strokeStyle = alpha(C.ink, 0.28 - j * 0.045); ctx.lineWidth = 2; ctx.stroke();
  }
  shapePath(ctx, st, cx, cy, sc);
  ctx.fillStyle = zoom > 0 ? C.ink : mix(SHAPE_COL[st.a], SHAPE_COL[st.b], st.e);
  ctx.fill();
  // index dots for shapes
  if (gFade > 0) {
    const cur = st.e > 0.5 ? st.b : st.a;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i === cur ? C.red : alpha(C.ink, 0.2);
      ctx.fillRect(1300 - 66 + i * 36, 930, 24, 6);
    }
  }
}

/* ============================================================
   SCENE 4 — 3D / PARTICLES (5.5 – 7.5)
   ============================================================ */
// every particle owns one cell of a 128x72 mosaic of the portrait
const CELL = 15, GX = W / CELL, GY = H / CELL, NP = GX * GY, GA = Math.PI * (3 - Math.sqrt(5));
const FACE = [933, 428];
const PTS = [], TGT = [];
{
  const r = rng(42);
  for (let i = 0; i < NP; i++) {
    const y = 1 - 2 * (i + 0.5) / NP, rr = Math.sqrt(1 - y * y), th = i * GA;
    PTS.push({ x: Math.cos(th) * rr, y, z: Math.sin(th) * rr, sp: 0.5 + r() * 1.8, red: r() < 0.06, d: 0 });
  }
}
// subdivided icosahedron for the wireframe
const ICO = (() => {
  const p = (1 + Math.sqrt(5)) / 2;
  let v = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]];
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
  v = v.map(norm);
  const cache = {};
  const mid = (a, b) => {
    const k = a < b ? a + '_' + b : b + '_' + a;
    if (cache[k] !== undefined) return cache[k];
    v.push(norm(v[a].map((x, i) => (x + v[b][i]) / 2))); return cache[k] = v.length - 1;
  };
  const nf = [];
  for (const [a, b, c] of f) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
  const es = new Set(), edges = [];
  for (const [a, b, c] of nf) for (const [i, j] of [[a, b], [b, c], [c, a]]) {
    const k = Math.min(i, j) + '_' + Math.max(i, j); if (!es.has(k)) { es.add(k); edges.push([i, j]); }
  }
  return { v, edges };
})();
const rotY = t => (t - 5.5) * 1.15 + 0.4;
const rotX = t => 0.38 + 0.14 * Math.sin(t * 1.7);
function rot3(x, y, z, ay, ax) {
  const cy = Math.cos(ay), sy = Math.sin(ay);
  let x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
  const cx = Math.cos(ax), sx = Math.sin(ax);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}
const SR = 340, CAM = 1500;
const proj = (x, y, z) => { const s = Math.min(3, CAM / Math.max(CAM * 0.3, CAM + z * SR)); return [W / 2 + x * SR * s, H / 2 + y * SR * s, s]; };
function initTargets() {
  const d = IMG.paint.getContext('2d').getImageData(0, 0, W, H).data;
  const cells = [];
  for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
    const x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2, o = ((y | 0) * W + (x | 0)) * 4;
    cells.push({ x, y, c: [d[o], d[o + 1], d[o + 2]] });
  }
  const r = rng(7);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const maxD = Math.hypot(W - FACE[0], H - FACE[1]);
  cells.forEach((c, i) => { TGT.push(c); PTS[i].d = Math.hypot(c.x - FACE[0], c.y - FACE[1]) / maxD * 0.8 + r() * 0.2; });
}
function s4(ctx, t) {
  bg(ctx, C.bg);
  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 800);
  glow.addColorStop(0, alpha(C.blue, 0.28)); glow.addColorStop(1, alpha(C.blue, 0));
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  const intro = E.outBack(prog(t, 5.5, 5.95), 1.3);
  const TE = 6.75;
  const exploding = t >= TE;
  const at = Math.min(t, TE);
  const ay = rotY(at), ax = rotX(at);
  let amp = 0;
  for (const b of [6.0, 6.5]) if (t >= b) amp += Math.exp(-(t - b) * 7) * 0.24;
  const ex = E.outExpo(prog(t, TE, 7.1));

  // wireframe
  const wa = 1 - prog(t, TE, TE + 0.08);
  if (wa > 0) {
    const pv = ICO.v.map(([x, y, z]) => { const [a, b, c] = rot3(x, y, z, ay, ax); return proj(a * intro, b * intro, c * intro); });
    ctx.lineWidth = 1.2;
    for (const [i, j] of ICO.edges) {
      const d = (pv[i][2] + pv[j][2]) / 2;
      ctx.strokeStyle = alpha(C.cream, wa * clamp((d - 0.8) * 1.6, 0.05, 0.35));
      ctx.beginPath(); ctx.moveTo(pv[i][0], pv[i][1]); ctx.lineTo(pv[j][0], pv[j][1]); ctx.stroke();
    }
  }
  // orbit ring
  const ra = 1 - prog(t, TE, TE + 0.25);
  if (ra > 0) {
    const rr = 1.6 + ex * 3;
    for (let i = 0; i < 140; i++) {
      const a = i / 140 * TAU;
      let [x, y, z] = rot3(Math.cos(a) * rr, 0, Math.sin(a) * rr, -(t - 5.5) * 0.9, 1.15);
      [x, y, z] = rot3(x, y, z, 0, 0.25);
      const [px, py, s] = proj(x * intro, y * intro, z * intro);
      ctx.fillStyle = alpha('#7C88FF', ra * clamp(s - 0.55));
      ctx.beginPath(); ctx.arc(px, py, 2.6 * s, 0, TAU); ctx.fill();
    }
  }
  // particles
  for (let i = 0; i < NP; i++) {
    const P = PTS[i];
    const n = 0.5 + 0.5 * Math.sin(6 * P.x + 4 * P.y + 5 * P.z + (t > 6.5 ? 2 : 0));
    const k = intro * (1 + amp * n * 1.6) * (1 + ex * P.sp * 1.5);
    let [x, y, z] = rot3(P.x, P.y, P.z, ay, ax);
    if (exploding) [x, y, z] = rot3(x, y, z, (t - TE) * 0.6, 0);
    let [px, py, s] = proj(x * k, y * k, z * k);
    let size = (P.red ? 3.2 : 2.4) * s, a = clamp((s - 0.7) * 2.6, 0.3, 1);
    let cr = P.red ? 255 : 243, cg = P.red ? 59 : 238, cb = P.red ? 31 : 227;
    if (exploding) {
      const t0 = 6.86 + P.d * 0.18;
      const c = E.ioC(prog(t, t0, t0 + 0.3));
      const T = TGT[i];
      px = lerp(px, T.x, c); py = lerp(py, T.y, c);
      size = lerp(size, CELL + 0.6, c * c); a = lerp(a, 1, c);
      cr = lerp(cr, T.c[0], c); cg = lerp(cg, T.c[1], c); cb = lerp(cb, T.c[2], c);
    }
    ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${a})`;
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
  }
  // mosaic resolves into the painting
  const ip = E.ioC(prog(t, 7.28, 7.5));
  if (ip > 0) { ctx.globalAlpha = ip; ctx.drawImage(IMG.paint, 0, 0); ctx.globalAlpha = 1; }
  // caption
  const cp = prog(t, 7.2, 7.45);
  if (cp > 0) {
    font(ctx, 500, 22, F.mono); ctx.fillStyle = C.cream; ctx.textAlign = 'center';
    ctx.letterSpacing = '10px';
    ctx.fillText(scramble(`${NP.toLocaleString('en')} POINTS  →  PORTRAIT`, cp, 11), W / 2, 1000);
    ctx.letterSpacing = '0px'; ctx.textAlign = 'left';
  }
}

/* ============================================================
   SCENE 5 — PORTRAIT: PAINTING → DE STIJL tile flip (7.5 – 9.0)
   ============================================================ */
function s5(ctx, t) {
  bg(ctx, C.ink);
  let z = 1 + 0.04 * prog(t, 7.3, 9.0);
  for (const b of [8.0, 8.5]) if (t >= b) z += 0.018 * Math.exp(-(t - b) * 10);
  ctx.save(); ctx.translate(FACE[0], FACE[1]); ctx.scale(z, z); ctx.translate(-FACE[0], -FACE[1]);
  ctx.drawImage(IMG.paint, 0, 0);
  const T = 120;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 16; c++) {
    const x = c * T, y = r * T;
    const d = Math.hypot(x + T / 2 - FACE[0], y + T / 2 - FACE[1]) / T;
    const p = prog(t, 8.0 + d * 0.042, 8.0 + d * 0.042 + 0.28);
    if (p <= 0) continue;
    const e = E.ioC(p), sx = Math.abs(Math.cos(Math.PI * e));
    const src = e < 0.5 ? IMG.paint : IMG.mond;
    ctx.fillStyle = C.ink; ctx.fillRect(x, y, T, T);
    const lift = 1 + 0.12 * Math.sin(Math.PI * e);
    const w = T * sx * lift, h = T * lift;
    ctx.drawImage(src, x, y, T, T, x + (T - w) / 2, y + (T - h) / 2, w, h);
    if (e > 0 && e < 1) { ctx.fillStyle = `rgba(0,0,0,${(1 - sx) * 0.45})`; ctx.fillRect(x + (T - w) / 2, y + (T - h) / 2, w, h); }
  }
  ctx.restore();
  // caption pill
  const cp = prog(t, 8.45, 8.75);
  if (cp > 0) {
    const e = E.outExpo(cp);
    ctx.fillStyle = C.ink; ctx.fillRect(56, 900, 560 * e, 64);
    font(ctx, 500, 22, F.mono); ctx.fillStyle = C.cream; ctx.letterSpacing = '6px';
    ctx.fillText(scramble('PAINTING  →  DE STIJL', cp, 51), 84, 941);
    ctx.letterSpacing = '0px';
  }
  // Mondrian-coloured bars sweep into the next scene
  [C.red, C.yellow, C.blue, C.cream].forEach((col, i) => {
    const p = E.ioExpo(prog(t, 8.74 + i * 0.03, 8.74 + i * 0.03 + 0.16));
    if (p > 0) { ctx.fillStyle = col; ctx.fillRect(W - (W + 40) * p, -50, W + 400, H + 100); }
  });
}

/* ============================================================
   SCENE 6 — KEY VISUALS: "Motomura creative" posters (9.0 – 11.5)
   ============================================================ */
const CARD_KEYS = [
  [[0, 960, 1750, -0.35, 1], [9.0, 960, 540, -0.03, 1], [9.5, 560, 570, -0.12, 0.84], [10.0, 430, 590, -0.16, 0.76], [10.5, 500, 560, -0.1, 0.66]],
  [[0, 2700, 480, 0.4, 1], [9.5, 1000, 540, 0.03, 1], [10.0, 1480, 580, 0.12, 0.8], [10.56, 1420, 560, 0.1, 0.66]],
  [[0, -800, 600, -0.4, 1], [10.0, 960, 540, -0.02, 1], [10.62, 960, 540, 0, 0.72]],
];
function cardState(keys, t) {
  let st = keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    const [tk, ...v] = keys[i];
    if (t < tk) break;
    const e = spring(t - tk, 17, 8);
    st = st.map((a, j) => lerp(a, v[j], e));
  }
  return st;
}
function s6(ctx, t) {
  const dark = t >= 10.5;
  bg(ctx, dark ? C.ink : C.cream);
  const fg = dark ? C.cream : C.ink;
  marquee(ctx, 'MOTOMURA CREATIVE — ', 190, 330, -520, t, fg, 0.14);
  marquee(ctx, 'KEY VISUAL — EDITORIAL — ', 190, 950, 520, t, fg, 0.14);
  const zoom = 1 + E.inExpo(prog(t, 11.05, 11.5)) * 2.4;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
  const ch = 880, cw = ch * 1122 / 1402;
  IMG.posters.forEach((img, i) => {
    const [x, y, r, s] = cardState(CARD_KEYS[i], t);
    if (x < -cw || x > W + cw || y > H + ch) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    ctx.fillStyle = '#fff'; ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
    ctx.shadowColor = 'transparent';
    ctx.drawImage(img, -cw / 2, -ch / 2, cw, ch);
    ctx.restore();
  });
  ctx.restore();
  font(ctx, 500, 20, F.mono); ctx.fillStyle = fg; ctx.letterSpacing = '6px';
  ctx.fillText(scramble('KEY VISUAL / EDITORIAL DESIGN', prog(t, 9.0, 9.35), 61), 56, 130);
  ctx.letterSpacing = '0px';
  const cp = prog(t, 10.6, 10.95);
  if (cp > 0) {
    font(ctx, 800, 58, F.disp); ctx.fillStyle = C.cream; ctx.textAlign = 'center';
    ctx.fillText(scramble('MOTOMURA CREATIVE', cp, 71), W / 2, 1000);
    ctx.textAlign = 'left';
  }
}

/* ============================================================
   SCENE 7 — REWIND STROBE (11.5 – 12.0)
   ============================================================ */
let TMP, CH;
const IMG = {};
const RECAP = [10.85, 9.7, 8.45, 7.6, 7.15, 6.3, 4.6, 2.9];
function rgbSplit(dst, src, off) {
  const g = CH.getContext('2d');
  bg(dst, '#000');
  dst.globalCompositeOperation = 'lighter';
  [['#f00', -off], ['#0f0', 0], ['#00f', off]].forEach(([col, o]) => {
    g.globalCompositeOperation = 'source-over'; g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, W, H);
    dst.drawImage(CH, o, o * 0.3);
  });
  dst.globalCompositeOperation = 'source-over';
}
function s7(ctx, t) {
  const lt = t - 11.5;
  const j = Math.min(7, Math.floor(lt / 0.0625));
  const g = TMP.getContext('2d');
  g.save(); drawScene(g, RECAP[j] + (lt - j * 0.0625) * 0.6); g.restore();
  const z = 1 + j * 0.035;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  rgbSplit(ctx, TMP, 6 + j * 4);
  ctx.restore();
  if (j % 2) { ctx.globalCompositeOperation = 'difference'; bg(ctx, '#fff'); ctx.globalCompositeOperation = 'source-over'; }
  // scanlines + slice displacement
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  const r = rng(j * 13 + 5);
  for (let i = 0; i < 6; i++) {
    const y = r() * H, h = 10 + r() * 60, dx = (r() - 0.5) * 160;
    ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
  }
  // white flash into the impact
  const fl = prog(t, 11.9, 12.0);
  if (fl > 0) { ctx.fillStyle = alpha(C.cream, E.inC(fl)); ctx.fillRect(0, 0, W, H); }
}

/* ============================================================
   SCENE 8 — END CARD (12.0 – 15.0)
   ============================================================ */
let SEAL;
function initSeal() {
  SEAL = mk(240, 240); const g = SEAL.getContext('2d');
  g.fillStyle = C.red; g.beginPath(); g.roundRect(20, 20, 200, 200, 14); g.fill();
  g.strokeStyle = C.cream; g.lineWidth = 6; g.beginPath(); g.roundRect(34, 34, 172, 172, 6); g.stroke();
  font(g, 400, 70, F.jp); g.fillStyle = C.cream; g.textAlign = 'center';
  const cells = [['本', 164, 110], ['村', 164, 192], ['友', 76, 110], ['一', 76, 192]];
  for (const [ch, x, y] of cells) g.fillText(ch, x, y);
  // ink texture
  const r = rng(99);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) {
    g.globalAlpha = 0.3 + r() * 0.7;
    g.beginPath(); g.arc(20 + r() * 200, 20 + r() * 200, 0.4 + r() * r() * 3.2, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 60; i++) {
    const side = r() * 4 | 0, u = 20 + r() * 200, e = side < 2 ? 20 : 220;
    const [x, y] = side % 2 ? [e, u] : [u, e];
    g.beginPath(); g.arc(x, y, 1 + r() * 4, 0, TAU); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
}
function s8(ctx, t) {
  bg(ctx, C.cream);
  const push = 1 + 0.03 * E.outC(prog(t, 12.0, 15.0));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);

  // crop marks
  const cm = E.outExpo(prog(t, 12.05, 12.5)), m = 90, L = 46 * cm;
  ctx.fillStyle = C.ink;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    ctx.fillRect(x, y, L * sx, 2 * sy); ctx.fillRect(x, y, 2 * sx, L * sy);
  }
  // name
  const size = 190, sp = 34;
  font(ctx, 700, size, F.jps);
  const NL = layout(ctx, NAME, sp);
  const gap = 70, sealS = 170;
  const gx = (W - (NL.width + gap + sealS)) / 2, base = 560, rule = 624;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, base - size * 1.1, W, size * 1.1 + 40); ctx.clip();
  NL.chars.forEach((c, i) => {
    const p = prog(t, 12.08 + i * 0.07, 12.08 + i * 0.07 + 0.65);
    const e = E.outExpo(p);
    ctx.save(); ctx.translate(gx + c.x, base + (1 - e) * size * 1.2);
    const b = (1 - e) * 14; if (b > 0.5) ctx.filter = `blur(${b.toFixed(1)}px)`;
    ctx.fillStyle = C.ink; ctx.fillText(c.ch, 0, 0); ctx.restore();
  });
  ctx.restore();
  // rule
  const rp = E.ioExpo(prog(t, 12.02, 12.5));
  const RW = NL.width + gap + sealS;
  ctx.fillStyle = C.ink; ctx.fillRect(gx, rule, RW * rp, 3);
  ctx.fillStyle = C.red; ctx.fillRect(gx, rule - 2, 90 * E.outExpo(prog(t, 12.4, 12.8)), 7);
  // subtitle / meta
  font(ctx, 400, 44, F.disp); ctx.fillStyle = C.ink; ctx.letterSpacing = '16px';
  ctx.fillText(scramble('MOTION DESIGNER', prog(t, 12.4, 12.95), 21), gx, rule + 84);
  ctx.letterSpacing = '0px';
  font(ctx, 700, 28, F.jps); ctx.textAlign = 'right';
  const jp = E.outC(prog(t, 12.7, 13.1));
  ctx.fillStyle = alpha(C.ink, 0.6 * jp);
  ctx.fillText('モーションデザイナー', gx + RW, rule + 80 + (1 - jp) * 14);
  ctx.textAlign = 'left';
  font(ctx, 500, 22, F.mono); ctx.fillStyle = C.red; ctx.letterSpacing = '6px';
  ctx.fillText(scramble(`● ${NAME_EN}`, prog(t, 12.55, 13.0), 31), gx, base - size - 26);
  ctx.letterSpacing = '0px';
  font(ctx, 500, 18, F.mono); ctx.fillStyle = alpha(C.ink, 0.55); ctx.textAlign = 'center';
  ctx.letterSpacing = '8px';
  ctx.fillText(scramble('SHOWREEL 2026  ·  KINETIC TYPE  ·  3D  ·  PORTRAIT  ·  KEY VISUAL', prog(t, 12.9, 13.5), 41), W / 2, H - m - 20);
  ctx.letterSpacing = '0px'; ctx.textAlign = 'left';

  // seal stamp
  const SX = gx + NL.width + gap + sealS / 2, SY = base - size * 0.37;
  const sp1 = prog(t, 13.3, 13.5);
  if (sp1 > 0) {
    const landed = t >= 13.5;
    const e = E.inExpo(sp1);
    const s = landed ? 1 + 0.06 * Math.exp(-(t - 13.5) * 20) * Math.cos((t - 13.5) * 60) : lerp(2.6, 1, e);
    const r = landed ? -0.07 : lerp(-0.4, -0.07, e);
    if (!landed) {
      ctx.fillStyle = alpha(C.ink, 0.12 * e);
      ctx.beginPath(); ctx.roundRect(SX - 85 * s + 30 * (s - 1), SY - 85 * s + 40 * (s - 1), 170 * s, 170 * s, 14); ctx.fill();
    }
    ctx.save(); ctx.translate(SX, SY); ctx.rotate(r); ctx.scale(s, s);
    ctx.globalAlpha = landed ? 1 : clamp(e * 3);
    ctx.drawImage(SEAL, -sealS / 2 - 15, -sealS / 2 - 15, sealS + 30, sealS + 30);
    ctx.restore(); ctx.globalAlpha = 1;
    if (landed) {
      const u = prog(t, 13.5, 13.9);
      if (u < 1) {
        ctx.strokeStyle = alpha(C.red, 1 - u); ctx.lineWidth = 3 * (1 - u) + 0.5;
        ctx.beginPath(); ctx.arc(SX, SY, 100 + E.outExpo(u) * 180, 0, TAU); ctx.stroke();
        const rr = rng(5);
        ctx.fillStyle = alpha(C.red, 1 - u);
        for (let i = 0; i < 16; i++) {
          const a = rr() * TAU, d = 110 + E.outExpo(u) * (60 + rr() * 140);
          ctx.beginPath(); ctx.arc(SX + Math.cos(a) * d, SY + Math.sin(a) * d, (1 + rr() * 4) * (1 - u), 0, TAU); ctx.fill();
        }
      }
    }
  }
  ctx.restore();
  // impact flash
  const fl = 1 - prog(t, 12.0, 12.28);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${E.inC(fl)})`; ctx.fillRect(0, 0, W, H); }
}

/* ============================================================
   COMPOSITOR — scenes, HUD, grain, motion blur
   ============================================================ */
function drawScene(ctx, t) {
  if (t < 1.5) s1(ctx, t); else if (t < 3.5) s2(ctx, t); else if (t < 5.5) s3(ctx, t);
  else if (t < 7.5) s4(ctx, t); else if (t < 9) s5(ctx, t); else if (t < 11.5) s6(ctx, t);
  else if (t < 12) s7(ctx, t); else s8(ctx, t);
}
function drawWorld(ctx, t) {
  const sh = shake(t);
  ctx.save(); ctx.translate(sh.x, sh.y); drawScene(ctx, t); ctx.restore();
}
const SECTIONS = [[0, '(00) IGNITION', C.cream], [1.5, '(01) KINETIC TYPE', C.ink], [2.5, '(01) KINETIC TYPE', C.ink],
  [3.5, '(02) EASING / MORPH', C.ink], [5.5, '(03) 3D / PARTICLES', C.cream], [7.5, '(04) PORTRAIT / STYLE', C.cream],
  [9.0, '(05) KEY VISUAL', C.ink], [10.5, '(05) KEY VISUAL', C.cream], [11.5, '(06) REWIND', C.cream], [12, '', C.ink]];
function hud(ctx, t) {
  let sec = SECTIONS[0], secStart = 0;
  for (const s of SECTIONS) if (t >= s[0]) sec = s;
  for (const s of SECTIONS) if (s[1] === sec[1]) { secStart = s[0]; break; }
  const a = prog(t, 0.05, 0.35) * (1 - prog(t, 11.95, 12.1));
  if (a <= 0) return;
  const col = sec[2], m = 56;
  ctx.globalAlpha = a; ctx.fillStyle = col;
  font(ctx, 500, 17, F.mono); ctx.letterSpacing = '3px';
  ctx.fillText(`${NAME_EN}  /  ${NAME}  —  MOTION REEL 2026`, m, m + 12);
  const f = Math.floor(t * FPS + 1e-6);
  const tc = `00:00:${String(Math.floor(f / FPS)).padStart(2, '0')}:${String(f % FPS).padStart(2, '0')}`;
  ctx.textAlign = 'right'; ctx.fillText(`● REC  ${tc}`, W - m, m + 12);
  ctx.fillText('1920×1080  60P  120BPM', W - m, H - m - 22);
  ctx.textAlign = 'left';
  ctx.fillText(scramble(sec[1], prog(t, secStart, secStart + 0.3), 17), m, H - m);
  // progress bar
  const bw = 260;
  ctx.fillStyle = alpha(col === C.ink ? C.ink : C.cream, 0.25); ctx.fillRect(W - m - bw, H - m - 4, bw, 3);
  ctx.fillStyle = col; ctx.fillRect(W - m - bw, H - m - 4, bw * t / DUR, 3);
  ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
}

let MAIN, WORK, ACC, GRAIN = [], VIG;
function initGrain() {
  const r = rng(1234);
  for (let k = 0; k < 4; k++) {
    const c = mk(960, 540), g = c.getContext('2d'), id = g.createImageData(960, 540);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0); GRAIN.push(c);
  }
  VIG = mk(); const g = VIG.getContext('2d');
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.1);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

function renderFrame(t, sub = 4, shutter = 0.5) {
  const m = MAIN.getContext('2d'), a = ACC.getContext('2d'), w = WORK.getContext('2d');
  for (let i = 0; i < sub; i++) {
    const st = Math.min(DUR - 1e-4, t + (i / sub) * shutter / FPS);
    w.save(); w.setTransform(1, 0, 0, 1, 0, 0); drawWorld(w, st); w.restore();
    a.globalCompositeOperation = 'source-over';
    a.globalAlpha = 1 / (i + 1); a.drawImage(WORK, 0, 0);
  }
  a.globalAlpha = 1;
  m.globalCompositeOperation = 'source-over'; m.drawImage(ACC, 0, 0);
  hud(m, t);
  m.globalCompositeOperation = 'soft-light'; m.globalAlpha = 0.22;
  m.drawImage(GRAIN[Math.floor(t * FPS) % 4], 0, 0, W, H);
  m.globalCompositeOperation = 'multiply'; m.globalAlpha = 1; m.drawImage(VIG, 0, 0);
  m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1;
}

async function init(canvas) {
  const fams = ['800 20px Unbounded', '400 20px Unbounded', '400 20px "Dela Gothic One"', '700 20px "Noto Sans JP"', '500 20px "JetBrains Mono"'];
  await Promise.all(fams.map(f => document.fonts.load(f, 'Aあ本村友一動伝予潰オフスモーシ')));
  await document.fonts.ready;
  MAIN = canvas; MAIN.width = W; MAIN.height = H;
  WORK = mk(); ACC = mk(); TMP = mk(); CH = mk();
  const load = src => new Promise((ok, ng) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ng; i.src = src; });
  const [portrait, heli, ...posters] = await Promise.all(['img/portrait.png', 'img/heli.jpg', 'img/poster1.png', 'img/poster2.png', 'img/poster3.jpg'].map(load));
  // the source stacks a painting (top) over its De Stijl remake (bottom); crop each to 16:9, faces aligned
  const crop = sy => { const c = mk(), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(portrait, 0, sy, 1122, 631, 0, 0, W, H); return c; };
  Object.assign(IMG, { heli, posters, paint: crop(50), mond: crop(705) });
  initGrain(); initTargets(); initSeal();
}

window.REEL = { W, H, FPS, DUR, init, renderFrame };
})();
