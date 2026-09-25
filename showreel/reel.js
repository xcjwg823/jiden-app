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
const IMPACTS = [[1.5, 7], [5.0, 9], [7.75, 12], [12.0, 26], [13.5, 14]];
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
   SCENE 1 — VITALS: ECG trace → flatline spike floods red (0.0 – 1.5)
   ============================================================ */
const gauss = (x, w) => Math.exp(-(x * x) / (2 * w * w));
function ecg(t) {
  let v = 0;
  for (const [b, amp] of [[0.5, 1], [1.0, 1], [1.27, 3.2]]) {
    const u = t - b;
    v += amp * (0.12 * gauss(u + 0.12, 0.022) - 0.16 * gauss(u + 0.022, 0.007) + gauss(u, 0.0095)
      - 0.28 * gauss(u - 0.022, 0.009) + (amp > 1 ? 0 : 0.2 * gauss(u - 0.19, 0.035)));
  }
  return v;
}
const ecgX = t => lerp(150, 1770, (t - 0.18) / 1.12);
function s1(ctx, t) {
  bg(ctx, C.bg);
  const cy = 600, A = 250;
  // monitor grid
  const ga = 0.05 * E.outC(prog(t, 0.05, 0.4)) * (1 - prog(t, 1.2, 1.35));
  ctx.fillStyle = alpha(C.cream, ga);
  for (let x = 150; x <= 1770; x += 45) ctx.fillRect(x, 260, 1, 620);
  for (let y = 260; y <= 880; y += 45) ctx.fillRect(150, y, 1620, 1);
  if (t < 0.18) {
    const pop = E.outBack(prog(t, 0.05, 0.18), 3);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(150, cy, 12 * pop, 0, TAU); ctx.fill();
    return;
  }
  // trace with glow + fading tail
  const tEnd = Math.min(t, 1.3);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [lw, a] of [[16, 0.12], [7, 0.25], [3.5, 1]]) {
    ctx.strokeStyle = alpha(C.red, a); ctx.lineWidth = lw;
    ctx.beginPath();
    for (let s = 0.18; s <= tEnd; s += 1 / 400) {
      const x = ecgX(s), y = cy - ecg(s) * A;
      s === 0.18 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineTo(ecgX(tEnd), cy - ecg(tEnd) * A); ctx.stroke();
  }
  ctx.lineCap = 'butt';
  const cx = ecgX(tEnd), cyy = cy - ecg(tEnd) * A;
  ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(cx, cyy, 7, 0, TAU); ctx.fill();
  // readouts
  const ra = 1 - prog(t, 1.18, 1.3);
  if (ra > 0) {
    ctx.globalAlpha = ra;
    font(ctx, 500, 20, F.mono); ctx.fillStyle = alpha(C.cream, 0.6);
    ctx.fillText('ECG  II', 150, 230);
    ctx.textAlign = 'right';
    ctx.fillText('HR', 1600, 230); ctx.fillText('SpO₂', 1770, 230);
    font(ctx, 800, 64, F.disp);
    ctx.fillStyle = C.red; ctx.fillText(t < 0.5 ? '---' : '120', 1600, 170 + 130);
    ctx.fillStyle = C.cream; ctx.fillText(t < 0.5 ? '--' : '98', 1770, 300);
    ctx.textAlign = 'left';
    font(ctx, 500, 26, F.mono); ctx.fillStyle = C.cream; ctx.letterSpacing = '12px';
    ctx.fillText(scramble('EVERY SECOND COUNTS', prog(t, 0.55, 1.05), 3), 150, 960);
    ctx.letterSpacing = '0px';
    ctx.globalAlpha = 1;
  }
  // the final spike floods the frame
  const g = E.inExpo(prog(t, 1.27, 1.5));
  if (g > 0) { ctx.fillStyle = C.red; const w = lerp(6, 3800, g); ctx.fillRect(cx - w / 2, -100, w, H + 200); }
}

/* ============================================================
   SCENE 2 — EMERGENCY / MEDICINE + road tilt-up (1.5 – 3.5)
   ============================================================ */
function wordReveal(ctx, str, size, baseline, t0, t, col, sp = 0) {
  font(ctx, 800, size, F.disp);
  const L = layout(ctx, str, sp);
  const x0 = (W - L.width) / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, baseline - size * 0.95, W, size * 1.1); ctx.clip();
  ctx.fillStyle = col;
  L.chars.forEach((c, i) => {
    const p = E.outExpo(prog(t, t0 + i * 0.03, t0 + i * 0.03 + 0.5));
    const y = baseline + (1 - p) * size * 1.05;
    ctx.save(); ctx.translate(x0 + c.x, y); ctx.transform(1, 0, -(1 - p) * 0.25, 1, 0, 0);
    ctx.fillText(c.ch, 0, 0); ctx.restore();
  });
  ctx.restore();
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
    marquee(ctx, 'ANYTIME ANYWHERE — ', 64, 150, -380, t, C.ink, 0.55 * ma);
    marquee(ctx, 'SHOCK & TRAUMA — EMERGENCY — ', 64, 1000, 380, t, C.ink, 0.55 * ma);
    const size = fitSize(ctx, 'EMERGENCY', 800, F.disp, 1680, 300);
    wordReveal(ctx, 'EMERGENCY', size, 500, 1.5, t, C.ink);
    wordReveal(ctx, 'MEDICINE', size, 500 + size * 1.02, 2.0, t, C.cream);
    const lp = E.outExpo(prog(t, 1.62, 2.1));
    ctx.fillStyle = C.ink; ctx.fillRect(W / 2 - 840 * lp, 540, 1680 * lp, 3);
    return;
  }
  bg(ctx, C.bg);
  // road photo: tilt up from the EMERGENCY lane to the Doctor-Heli in the sky
  {
    const img = IMG.road, s = W / img.width * (1.06 - 0.06 * E.outC(prog(t, 2.5, 3.5)));
    const e = E.ioC(prog(t, 2.5, 3.3));
    const oy = lerp(540 - 1835 * s, 300 - 837 * s, e);
    ctx.drawImage(img, (W - img.width * s) / 2, oy, img.width * s, img.height * s);
  }
  const out = E.inExpo(prog(t, 3.25, 3.5));
  ctx.save(); ctx.translate(0, -out * 260);
  const size = 150;
  font(ctx, 400, size, F.jp);
  const lines = [['一秒でも早く、', 1800, 520, 2.6], ['医療を届ける。', 1800, 720, 3.0]];
  for (const [str, xr, base, t0] of lines) {
    const L = layout(ctx, str, 4), x0 = xr - L.width;
    L.chars.forEach((c, i) => {
      const p = prog(t, t0 + i * 0.04, t0 + i * 0.04 + 0.35);
      if (p <= 0) return;
      const e = E.outExpo(p), s = lerp(1.9, 1, e);
      ctx.save();
      ctx.translate(x0 + c.x + c.w / 2, base - size * 0.36);
      ctx.scale(s, s); ctx.rotate((1 - e) * -0.35);
      const b = (1 - e) * 20; if (b > 0.5) ctx.filter = `blur(${b.toFixed(1)}px)`;
      ctx.globalAlpha = clamp(p * 4);
      ctx.fillStyle = c.ch === '。' || c.ch === '、' ? C.red : C.ink;
      ctx.textAlign = 'center'; ctx.fillText(c.ch, 0, size * 0.36);
      ctx.restore();
    });
  }
  const up = E.outExpo(prog(t, 3.05, 3.4));
  ctx.fillStyle = C.red; ctx.fillRect(1800 - 1000 * up, 760, 1000 * up, 8);
  font(ctx, 500, 20, F.mono); ctx.fillStyle = alpha(C.ink, 0.8 * E.outC(prog(t, 2.7, 3.0)));
  ctx.textAlign = 'right'; ctx.fillText('EVERY SECOND COUNTS —', 1800, 360); ctx.textAlign = 'left';
  ctx.restore();
  // dark bars wipe into the 3D scene
  ctx.fillStyle = C.ink;
  for (let i = 0; i < 7; i++) {
    const p = E.ioExpo(prog(t, 3.27 + i * 0.012, 3.27 + i * 0.012 + 0.16));
    if (p > 0) ctx.fillRect(i * W / 7 - 1, H - (H + 20) * p, W / 7 + 2, (H + 20) * p + 200);
  }
}

/* ============================================================
   SCENE 3 — THREE PILLARS: glossy 3D medical cross (3.5 – 5.0)
   ============================================================ */
const CROSS = (() => {
  const a = 0.34, l = 1, d = 0.3;
  const o = [[-a, -l], [a, -l], [a, -a], [l, -a], [l, a], [a, a], [a, l], [-a, l], [-a, a], [-l, a], [-l, -a], [-a, -a]];
  const n = o.length, faces = [];
  faces.push({ v: o.map(([x, y]) => [x, y, -d]), n: [0, 0, -1], front: true });
  faces.push({ v: o.map(([x, y]) => [x, y, d]).reverse(), n: [0, 0, 1], front: true });
  for (let i = 0; i < n; i++) {
    const [x1, y1] = o[i], [x2, y2] = o[(i + 1) % n];
    const ex = x2 - x1, ey = y2 - y1, len = Math.hypot(ex, ey);
    faces.push({ v: [[x1, y1, -d], [x2, y2, -d], [x2, y2, d], [x1, y1, d]], n: [ey / len, -ex / len, 0] });
  }
  return faces;
})();
const PILLARS = [
  { t: 3.5, n: '01', en: 'EMERGENCY MEDICINE', jp: '救急医療', x: 140, y: 300, al: 'left' },
  { t: 4.0, n: '02', en: 'DOCTOR-HELI', jp: 'ドクターヘリ', x: 1780, y: 520, al: 'right' },
  { t: 4.5, n: '03', en: 'DISASTER MEDICINE', jp: '災害医療', x: 140, y: 790, al: 'left' },
];
const norm3 = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const LIGHT = norm3([-0.5, -0.8, -0.9]), HALF = norm3([LIGHT[0], LIGHT[1], LIGHT[2] - 1]);
function s3(ctx, t) {
  bg(ctx, C.bg);
  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 900);
  glow.addColorStop(0, alpha(C.red, 0.22)); glow.addColorStop(1, alpha(C.red, 0));
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  const P3 = (x, y, z, sc = 300) => { const s = 1500 / (1500 + z * sc); return [W / 2 + x * sc * s, H / 2 + y * sc * s, s]; };
  // perspective floor grid, scrolling toward camera
  ctx.strokeStyle = alpha(C.cream, 0.08); ctx.lineWidth = 1;
  const scroll = (t * 2.2) % 1;
  for (let i = -8; i <= 8; i++) { const a = P3(i, 1.9, -2), b = P3(i, 1.9, 14); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  for (let j = 0; j < 16; j++) { const z = j - scroll - 1; const a = P3(-8, 1.9, z), b = P3(8, 1.9, z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }

  const intro = E.outBack(prog(t, 3.5, 3.85), 1.6);
  const fly = E.inExpo(prog(t, 4.72, 5.0));
  let spin = 0;
  for (const p of PILLARS) if (t >= p.t) spin += BZ(prog(t, p.t, p.t + 0.42)) * Math.PI;
  const ay = (t - 3.5) * 0.7 + spin + 0.5, ax = -0.35 + 0.1 * Math.sin(t * 2), az = 0.08;
  const scale = intro * (1 + fly * 14);
  const rot = ([x, y, z]) => { let [a, b, c] = rot3(x, y, z, ay, ax); const cz = Math.cos(az), sz = Math.sin(az); return [a * cz - b * sz, a * sz + b * cz, c]; };
  // orbit rings (one per pillar, lit when its pillar lands)
  const drawRing = (k, front) => {
    const lit = t >= PILLARS[k].t ? 1 : 0;
    for (let i = 0; i < 90; i++) {
      const a = i / 90 * TAU + t * (0.6 + k * 0.25) * (k % 2 ? -1 : 1);
      const R = 1.55 + k * 0.28;
      let [x, y, z] = rot3(Math.cos(a) * R, 0, Math.sin(a) * R, k * 1.1, 1.1 + k * 0.35);
      if ((z < 0) !== front) continue;
      const [px, py, s] = P3(x * intro, y * intro, z * intro);
      ctx.fillStyle = lit ? alpha(C.red, clamp(s - 0.5)) : alpha(C.cream, 0.35 * clamp(s - 0.6));
      ctx.fillRect(px - 2 * s, py - 2 * s, 4 * s, 4 * s);
    }
  };
  if (fly < 0.5) for (let k = 0; k < 3; k++) drawRing(k, false);
  // cross: painter's sort, flat shading + specular + gloss sweep
  const cam = [0, 0, -1500 / 300];
  const fs = CROSS.map(f => {
    const v = f.v.map(rot), n = rot(f.n);
    const c = v.reduce((a, p) => a.map((x, i) => x + p[i] / v.length), [0, 0, 0]);
    const vis = n[0] * (c[0] - cam[0]) + n[1] * (c[1] - cam[1]) + n[2] * (c[2] - cam[2]) < 0;
    return { f, v, n, z: c[2], vis };
  }).filter(o => o.vis).sort((a, b) => (a.f.front ? 1 : 0) - (b.f.front ? 1 : 0) || b.z - a.z); // sides back-to-front, cap last
  for (const o of fs) {
    const pts = o.v.map(([x, y, z]) => P3(x * scale, y * scale, z * scale));
    const dif = Math.max(0, o.n[0] * LIGHT[0] + o.n[1] * LIGHT[1] + o.n[2] * LIGHT[2]);
    const spec = Math.pow(Math.max(0, o.n[0] * HALF[0] + o.n[1] * HALF[1] + o.n[2] * HALF[2]), 30);
    const base = o.f.front ? [255, 59, 31] : [190, 28, 18];
    const col = base.map(c => Math.min(255, c * (0.28 + 0.8 * dif) + 255 * spec * 0.55) | 0);
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = `rgb(${col})`; ctx.fill();
    if (o.f.front) {
      ctx.save(); ctx.clip();
      const sw = ((t * 0.9) % 1.6) - 0.3;
      const gr = ctx.createLinearGradient(W / 2 - 400, H / 2 - 400, W / 2 + 400, H / 2 + 400);
      gr.addColorStop(clamp(sw - 0.12), 'rgba(255,255,255,0)'); gr.addColorStop(clamp(sw), 'rgba(255,255,255,0.28)'); gr.addColorStop(clamp(sw + 0.12), 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,220,210,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
  if (fly < 0.5) for (let k = 0; k < 3; k++) drawRing(k, true);
  // pillar callouts
  const ca = 1 - prog(t, 4.7, 4.85);
  PILLARS.forEach((p, k) => {
    const q = prog(t, p.t + 0.05, p.t + 0.45);
    if (q <= 0 || ca <= 0) return;
    ctx.globalAlpha = ca;
    const e = E.outExpo(q), dir = p.al === 'left' ? 1 : -1;
    ctx.textAlign = p.al;
    font(ctx, 500, 20, F.mono); ctx.fillStyle = C.red;
    ctx.fillText(scramble(`${p.n} / 03`, q, 81 + k), p.x, p.y - 64);
    ctx.save(); ctx.beginPath(); ctx.rect(0, p.y - 56, W, 64); ctx.clip();
    font(ctx, 800, 50, F.disp); ctx.fillStyle = C.cream;
    ctx.fillText(p.en, p.x, p.y + (1 - e) * 60); ctx.restore();
    font(ctx, 700, 30, F.jps); ctx.fillStyle = alpha(C.cream, 0.7 * e);
    ctx.fillText(p.jp, p.x, p.y + 48);
    ctx.fillStyle = alpha(C.cream, 0.5);
    ctx.fillRect(p.x + (dir > 0 ? 0 : -280 * e), p.y + 70, 280 * e, 2);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  });
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
      const t0 = 6.86 + P.d * 0.14;
      const c = E.ioC(prog(t, t0, t0 + 0.26));
      const T = TGT[i];
      px = lerp(px, T.x, c); py = lerp(py, T.y, c);
      size = lerp(size, CELL + 0.6, c * c); a = lerp(a, 1, c);
      cr = lerp(cr, T.c[0], c); cg = lerp(cg, T.c[1], c); cb = lerp(cb, T.c[2], c);
    }
    ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${a})`;
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
  }
  // mosaic resolves into the painting
  const ip = E.ioC(prog(t, 7.2, 7.38));
  if (ip > 0) { ctx.globalAlpha = ip; ctx.drawImage(IMG.paint, 0, 0); ctx.globalAlpha = 1; }
  // caption
  const cp = prog(t, 7.2, 7.4);
  if (cp > 0) {
    font(ctx, 500, 22, F.mono); ctx.fillStyle = C.cream; ctx.textAlign = 'center';
    ctx.letterSpacing = '10px';
    ctx.fillText(scramble('ON THE FRONT LINE', cp, 11), W / 2, 1000);
    ctx.letterSpacing = '0px'; ctx.textAlign = 'left';
  }
}

/* ============================================================
   SCENE 5 — DOCTOR-HELI montage (5.0 – 7.0), a cut per beat
   ============================================================ */
function cover(ctx, img, z = 1, fx = 0.5, fy = 0.5, rot = 0) {
  const s = Math.max(W / img.width, H / img.height) * z;
  const w = img.width * s, h = img.height * s;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rot);
  ctx.drawImage(img, -w * fx, -h * fy, w, h); ctx.restore();
}
const SHOTS = [
  { img: 'ja6790', word: 'DOCTOR-HELI', meta: 'JA6790  /  MD902', z0: 1.18, z1: 1.04, fx: 0.52, fy: 0.5, r0: 0, dir: 1 },
  { img: 'halo', word: 'ANYTIME.', meta: 'READY ON THE PAD', z0: 1.35, z1: 1.12, fx: 0.45, fy: 0.5, r0: -0.12, dir: -1 },
  { img: 'heli', word: 'ANYWHERE.', meta: 'AIRBORNE', z0: 1.25, z1: 1.1, fx: 0.55, fy: 0.48, r0: 0.05, dir: 1 },
  { img: 'hems', word: '', meta: '', z0: 1.12, z1: 1.0, fx: 0.5, fy: 0.5, r0: 0, dir: -1 },
];
function shot(ctx, k, t) {
  const S = SHOTS[k], lt = t - (5.0 + k * 0.5);
  bg(ctx, C.bg);
  cover(ctx, IMG[S.img], lerp(S.z0, S.z1, E.outExpo(prog(lt, 0, 0.5))), S.fx, S.fy, S.r0 * (1 - E.outExpo(prog(lt, 0, 0.4))));
  if (!S.word) return;
  const gr = ctx.createLinearGradient(0, H * 0.45, 0, H);
  gr.addColorStop(0, 'rgba(10,10,12,0)'); gr.addColorStop(1, 'rgba(10,10,12,0.6)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  const size = fitSize(ctx, S.word, 800, F.disp, 1500, 200);
  font(ctx, 800, size, F.disp);
  const L = layout(ctx, S.word, 0), base = H - 140;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - size, W, size * 1.08); ctx.clip();
  ctx.fillStyle = C.cream;
  L.chars.forEach((c, i) => {
    const p = E.outExpo(prog(lt, 0.02 + i * 0.022, 0.02 + i * 0.022 + 0.35));
    ctx.fillText(c.ch, 110 + c.x, base + (1 - p) * size);
  });
  ctx.restore();
  font(ctx, 500, 22, F.mono); ctx.fillStyle = C.red; ctx.letterSpacing = '6px';
  ctx.fillText(scramble(S.meta, prog(lt, 0.05, 0.3), 90 + k), 114, base - size - 20);
  ctx.letterSpacing = '0px';
}
function s5(ctx, t) {
  const k = Math.min(3, Math.floor((t - 5.0) / 0.5)), lt = t - (5.0 + k * 0.5);
  const inP = k === 0 ? 1 : E.outExpo(prog(lt, 0, 0.16));
  if (inP < 1) shot(ctx, k - 1, t);
  ctx.save();
  ctx.translate((1 - inP) * W * SHOTS[k].dir, 0);
  shot(ctx, k, t);
  ctx.restore();
  // shutter-flash on the cut
  const fl = 1 - prog(lt, 0, 0.08);
  if (fl > 0 && k > 0) { ctx.fillStyle = `rgba(255,255,255,${0.35 * fl})`; ctx.fillRect(0, 0, W, H); }
  if (t >= 6.9) { ctx.fillStyle = alpha(C.bg, E.inC(prog(t, 6.9, 7.0))); ctx.fillRect(0, 0, W, H); }
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
  marquee(ctx, 'DISASTER MEDICINE — ', 190, 330, -520, t, fg, 0.14);
  marquee(ctx, 'PEOPLE — MEDICINE — COMMUNITY — ', 190, 950, 520, t, fg, 0.14);
  const zoom = 1 + E.inExpo(prog(t, 10.62, 11.0)) * 2.4;
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
  ctx.fillText(scramble('DISASTER MEDICINE  /  災害医療', prog(t, 9.0, 9.35), 61), 56, 130);
  ctx.letterSpacing = '0px';
  const cp = prog(t, 10.55, 10.8);
  if (cp > 0) {
    font(ctx, 800, 58, F.disp); ctx.fillStyle = C.cream; ctx.textAlign = 'center';
    ctx.fillText(scramble('MEDICINE · DISASTER · SOCIETY', cp, 71), W / 2, 1000);
    ctx.textAlign = 'left';
  }
}

/* ============================================================
   SCENE 6b — TEAM: Hokusoh Shock & Trauma Center (10.5 – 11.5)
   ============================================================ */
function s9(ctx, t) {
  bg(ctx, C.bg);
  const img = IMG.sleeve, sy = 155, sh = 1620, ph = 980, pw = ph * img.width / sh;
  const px = W - 170 - pw, py = (H - ph) / 2;
  const rv = E.ioExpo(prog(t, 10.5, 10.78));
  ctx.save(); ctx.beginPath(); ctx.rect(px, py + ph * (1 - rv), pw, ph * rv); ctx.clip();
  const z = 1.25 - 0.15 * E.outC(prog(t, 10.5, 11.5));
  const zw = pw * z, zh = ph * z;
  ctx.drawImage(img, 0, sy, img.width, sh, px - (zw - pw) * 0.5, py - (zh - ph) * 0.38, zw, zh);
  ctx.restore();
  ctx.fillStyle = C.red; ctx.fillRect(px - 24, py + ph * (1 - rv), 6, ph * rv);
  font(ctx, 500, 22, F.mono); ctx.fillStyle = C.red; ctx.letterSpacing = '6px';
  ctx.fillText(scramble('HOKUSOH SHOCK & TRAUMA CENTER', prog(t, 10.55, 10.85), 101), 150, 330);
  ctx.letterSpacing = '0px';
  const size = 118; font(ctx, 400, size, F.jp);
  [['チームで、', 520, 10.6], ['命をつなぐ。', 690, 10.85]].forEach(([str, base, t0]) => {
    const L = layout(ctx, str, 2);
    ctx.save(); ctx.beginPath(); ctx.rect(0, base - size, W, size * 1.2); ctx.clip();
    L.chars.forEach((c, i) => {
      const p = E.outExpo(prog(t, t0 + i * 0.035, t0 + i * 0.035 + 0.4));
      ctx.fillStyle = c.ch === '。' || c.ch === '、' ? C.red : C.cream;
      ctx.fillText(c.ch, 150 + c.x, base + (1 - p) * size * 1.1);
    });
    ctx.restore();
  });
  font(ctx, 500, 20, F.mono); ctx.fillStyle = alpha(C.cream, 0.6 * E.outC(prog(t, 11.0, 11.3)));
  ctx.letterSpacing = '5px'; ctx.fillText('TEAMWORK  ·  EDUCATION  ·  NEXT GENERATION', 150, 790); ctx.letterSpacing = '0px';
}

/* ============================================================
   SCENE 7 — REWIND STROBE (11.5 – 12.0)
   ============================================================ */
let TMP, CH;
const IMG = {};
const RECAP = [11.0, 9.3, 8.45, 7.5, 6.2, 5.2, 4.2, 2.9];
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
  CHAOS.draw(ctx, t, true);
  const push = 1 + 0.03 * E.outC(prog(t, 12.0, 15.0));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);

  // crop marks
  const cm = E.outExpo(prog(t, 12.05, 12.5)), m = 90, L = 46 * cm;
  ctx.fillStyle = C.ink;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    ctx.fillRect(x, y, L * sx, 2 * sy); ctx.fillRect(x, y, 2 * sx, L * sy);
  }
  // name
  const DISP = 'Tomokazu Motomura';
  const size = fitSize(ctx, DISP, 800, F.disp, 1260, 132), sp = 0;
  font(ctx, 800, size, F.disp);
  const NL = layout(ctx, DISP, sp);
  const gap = 60, sealS = 160;
  const gx = (W - (NL.width + gap + sealS)) / 2, base = 560, rule = 624;
  // PROFILE window: the one calm spot in the chaos
  {
    const pp = E.outBack(prog(t, 12.0, 12.3), 1.4);
    const px = gx - 70, py = base - size - 110, pw = NL.width + gap + sealS + 140, ph = rule + 200 - py;
    ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.scale(pp, pp); ctx.translate(-pw / 2, -ph / 2);
    ctx.fillStyle = C.ink; ctx.fillRect(14, 14, pw, ph);
    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, pw, ph);
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, pw, 40);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(0, 0, pw, ph);
    font(ctx, 500, 18, F.mono); ctx.fillStyle = C.cream; ctx.fillText('■ PROFILE.exe', 16, 27);
    ctx.fillStyle = C.red; for (let b = 0; b < 3; b++) ctx.fillRect(pw - 30 - b * 24, 13, 14, 14);
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath(); ctx.rect(0, base - size * 1.1, W, size * 1.1 + 34); ctx.clip();
  NL.chars.forEach((c, i) => {
    const p = prog(t, 12.08 + i * 0.03, 12.08 + i * 0.03 + 0.6);
    const e = E.outExpo(p);
    ctx.save(); ctx.translate(gx + c.x, base + (1 - e) * size * 1.3);
    const b = (1 - e) * 12; if (b > 0.5) ctx.filter = `blur(${b.toFixed(1)}px)`;
    ctx.fillStyle = C.ink; ctx.fillText(c.ch, 0, 0); ctx.restore();
  });
  ctx.restore();
  // rule
  const rp = E.ioExpo(prog(t, 12.02, 12.5));
  const RW = NL.width + gap + sealS;
  ctx.fillStyle = C.ink; ctx.fillRect(gx, rule, RW * rp, 3);
  ctx.fillStyle = C.red; ctx.fillRect(gx, rule - 2, 90 * E.outExpo(prog(t, 12.4, 12.8)), 7);
  // title / meta
  {
    const jsz = 76; font(ctx, 400, jsz, F.jp);
    const JL = layout(ctx, '救命救急医師', 14);
    ctx.save(); ctx.beginPath(); ctx.rect(0, rule + 10, W, jsz * 1.3); ctx.clip();
    JL.chars.forEach((c, i) => {
      const e = E.outExpo(prog(t, 12.4 + i * 0.06, 12.4 + i * 0.06 + 0.5));
      ctx.fillStyle = i < 4 ? C.red : C.ink;
      ctx.fillText(c.ch, gx + c.x, rule + 22 + jsz * 0.88 + (1 - e) * jsz * 1.2);
    });
    ctx.restore();
  }
  font(ctx, 500, 22, F.mono); ctx.fillStyle = C.red; ctx.letterSpacing = '6px';
  ctx.fillText(scramble(`● ${NAME}`, prog(t, 12.55, 13.0), 31), gx, base - size - 30);
  ctx.letterSpacing = '0px';
  font(ctx, 500, 18, F.mono); ctx.fillStyle = alpha(C.ink, 0.55); ctx.textAlign = 'center';
  ctx.letterSpacing = '8px';
  ctx.fillText(scramble('EMERGENCY MEDICINE  ·  DOCTOR-HELI  ·  DISASTER MEDICINE', prog(t, 12.9, 13.5), 41), W / 2, H - m - 20);
  ctx.letterSpacing = '0px'; ctx.textAlign = 'left';

  // seal stamp
  const SX = gx + NL.width + gap + sealS / 2, SY = base - size * 0.4;
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
  if (t < 1.5) s1(ctx, t); else if (t < 3.5) s2(ctx, t); else if (t < 5.0) s3(ctx, t);
  else if (t < 7.0) s5(ctx, t); else if (t < 8.5) s4(ctx, 5.5 + (t - 7.0) * 5 / 3);
  else if (t < 10.5) s6(ctx, t + 0.5); else if (t < 11.5) s9(ctx, t);
  else if (t < 12) s7(ctx, t); else s8(ctx, t);
}
function drawWorld(ctx, t) {
  const sh = shake(t);
  ctx.save(); ctx.translate(sh.x, sh.y); drawScene(ctx, t); if (t < 12) CHAOS.draw(ctx, t); ctx.restore();
}
const SECTIONS = [[0, '(00) VITALS', C.cream], [1.5, '(01) EMERGENCY', C.ink], [2.5, '(01) EMERGENCY', C.ink],
  [3.5, '(02) THREE PILLARS', C.cream], [5.0, '(03) DOCTOR-HELI', C.cream], [7.0, '(04) ON THE FRONT LINE', C.cream],
  [8.5, '(05) DISASTER MEDICINE', C.ink], [10.0, '(05) DISASTER MEDICINE', C.cream], [10.5, '(06) TEAM', C.cream],
  [11.5, '(07) REWIND', C.cream], [12, '', C.ink]];
function hud(ctx, t) {
  let sec = SECTIONS[0], secStart = 0;
  for (const s of SECTIONS) if (t >= s[0]) sec = s;
  for (const s of SECTIONS) if (s[1] === sec[1]) { secStart = s[0]; break; }
  const a = prog(t, 0.05, 0.35) * (1 - prog(t, 11.95, 12.1));
  if (a <= 0) return;
  const col = sec[2], m = 56;
  ctx.globalAlpha = a; ctx.fillStyle = col;
  font(ctx, 500, 17, F.mono); ctx.letterSpacing = '3px';
  ctx.fillText(`${NAME_EN}  /  ${NAME}  —  救命救急医師`, m, m + 12);
  const f = Math.floor(t * FPS + 1e-6);
  const tc = `00:00:${String(Math.floor(f / FPS)).padStart(2, '0')}:${String(f % FPS).padStart(2, '0')}`;
  ctx.textAlign = 'right'; ctx.fillText(`♥ HR 120   SpO₂ 98%   ● ${tc}`, W - m, m + 12);
  ctx.fillText('ANYTIME  ·  ANYWHERE', W - m, H - m - 22);
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
  const [portrait, heli, road, ja6790, halo, hems, sleeve, ...posters] = await Promise.all(['portrait.png', 'heli.jpg', 'road.jpg', 'ja6790.jpg', 'halo.jpg', 'hems.png', 'sleeve.png', 'poster1.png', 'poster2.png', 'poster3.jpg'].map(f => load('img/' + f)));
  // the source stacks a painting (top) over its De Stijl remake (bottom); crop each to 16:9, faces aligned
  const crop = sy => { const c = mk(), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(portrait, 0, sy, 1122, 631, 0, 0, W, H); return c; };
  Object.assign(IMG, { heli, road, ja6790, halo, hems, sleeve, posters, paint: crop(50) });
  initGrain(); initTargets(); initSeal();
}

window.REEL = { W, H, FPS, DUR, init, renderFrame };
})();
