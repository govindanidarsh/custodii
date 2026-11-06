// Builds every CUSTODI logo asset from the official artwork:
//   apps/web/public/assets/custodi-logo-reference.png  (supplied by the CUSTODI team — never modified)
// The emblem is cut out of its navy background by region-growing from the image borders (background is
// smooth navy texture; the emblem's silver/blue edges are sharp), then cropped with its natural aspect ratio.
// No pixel of the emblem itself is redrawn or recoloured. Usage: node scripts/build-logo-assets.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng, resize } from "./png.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "apps/web/public/assets/custodi-logo-reference.png");
const src = decodePng(readFileSync(SRC));
const { w, h, data } = src;
const luma = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

// 1. Background mask: flood from border pixels that look like navy background.
const bg = new Uint8Array(w * h);
const queue = [];
const isBgLike = (p) => luma(p * 4) < 62 && data[p * 4 + 2] >= data[p * 4]; // dark and blue-leaning
for (let x = 0; x < w; x++) for (const y of [0, h - 1]) if (isBgLike(y * w + x)) queue.push(y * w + x);
for (let y = 0; y < h; y++) for (const x of [0, w - 1]) if (isBgLike(y * w + x)) queue.push(y * w + x);
for (const p of queue) bg[p] = 1;
while (queue.length) {
  const p = queue.pop();
  const x = p % w, y = (p / w) | 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
    const q = ny * w + nx;
    if (bg[q]) continue;
    const d = Math.abs(data[p * 4] - data[q * 4]) + Math.abs(data[p * 4 + 1] - data[q * 4 + 1]) + Math.abs(data[p * 4 + 2] - data[q * 4 + 2]);
    if (d < 20 && isBgLike(q)) { bg[q] = 1; queue.push(q); }
  }
}

// 2. Alpha: background → 0; a 1-px soft edge where emblem meets background (anti-aliasing kept).
const cut = new Uint8ClampedArray(data);
for (let p = 0; p < w * h; p++) {
  if (bg[p]) { cut[p * 4 + 3] = 0; continue; }
  const x = p % w, y = (p / w) | 0;
  let touching = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && bg[ny * w + nx]) touching++; }
  if (touching && luma(p * 4) < 70) cut[p * 4 + 3] = 150;
}

// 3. Crop to the emblem's bounding box (natural aspect ratio).
let x0 = w, y0 = h, x1 = 0, y1 = 0;
for (let p = 0; p < w * h; p++) if (cut[p * 4 + 3] > 0) { const x = p % w, y = (p / w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
const crop = (buf) => { const o = new Uint8ClampedArray(cw * ch * 4); for (let y = 0; y < ch; y++) o.set(buf.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4), y * cw * 4); return { w: cw, h: ch, data: o }; };
const emblem = crop(cut);
console.log(`emblem bbox ${x0},${y0} → ${x1},${y1} (${cw}×${ch}); touches top edge: ${y0 === 0}`);

// 4. Compose onto a square canvas (contain, centred) with optional solid navy background.
const NAVY = [14, 29, 52];
function square(size, { pad = 0.12, fill = null, radius = 0 } = {}) {
  const inner = Math.round(size * (1 - pad * 2));
  const s = Math.min(inner / emblem.w, inner / emblem.h);
  const r = resize(emblem, Math.max(1, Math.round(emblem.w * s)), Math.max(1, Math.round(emblem.h * s)));
  const out = new Uint8ClampedArray(size * size * 4);
  const ox = Math.round((size - r.w) / 2), oy = Math.round((size - r.h) / 2);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const o = (y * size + x) * 4;
    let base = [0, 0, 0, 0];
    if (fill) {
      const qx = Math.max(Math.abs(x + 0.5 - size / 2) - (size / 2 - radius), 0), qy = Math.max(Math.abs(y + 0.5 - size / 2) - (size / 2 - radius), 0);
      const inside = radius ? Math.min(1, Math.max(0, radius - Math.hypot(qx, qy) + 0.5)) : 1;
      base = [...fill, 255 * inside];
    }
    const ex = x - ox, ey = y - oy;
    let e = [0, 0, 0, 0];
    if (ex >= 0 && ey >= 0 && ex < r.w && ey < r.h) { const i = (ey * r.w + ex) * 4; e = [r.data[i], r.data[i + 1], r.data[i + 2], r.data[i + 3]]; }
    const ea = e[3] / 255, ba = base[3] / 255, a = ea + ba * (1 - ea);
    for (let c = 0; c < 3; c++) out[o + c] = a ? (e[c] * ea + base[c] * ba * (1 - ea)) / a : 0;
    out[o + 3] = a * 255;
  }
  return { w: size, h: size, data: out };
}

const write = (rel, img) => { const p = join(root, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, encodePng(img)); console.log("wrote", rel, `${img.w}×${img.h}`); };
const A = "apps/web/public/assets";
write(`${A}/custodi-emblem.png`, emblem); // transparent, natural aspect ratio
// High-quality @2x/@3x upscales are made with Lanczos by: swift scripts/render-intro.swift upscale
write("apps/extension/public/assets/custodi-emblem.png", emblem);
for (const s of [16, 32, 48, 128]) write(`apps/extension/public/icons/icon-${s}.png`, square(s, { pad: s <= 32 ? 0.04 : 0.08, fill: NAVY, radius: s * 0.2 }));
write("apps/web/public/icons/icon-192.png", square(192, { fill: NAVY, radius: 40 }));
write("apps/web/public/icons/icon-512.png", square(512, { fill: NAVY, radius: 104 }));
write("apps/web/public/icons/maskable-512.png", square(512, { pad: 0.2, fill: NAVY }));
write("apps/web/public/apple-touch-icon.png", square(180, { pad: 0.14, fill: NAVY }));
write("apps/web/public/favicon-32.png", square(32, { pad: 0.04, fill: NAVY, radius: 6 }));
write("apps/web/public/favicon-16.png", square(16, { pad: 0.02, fill: NAVY, radius: 3 }));
