// Minimal dependency-free PNG decode/encode (8-bit RGB/RGBA, non-interlaced) for brand asset generation.
import { deflateSync, inflateSync } from "node:zlib";

export function decodePng(buf) {
  let p = 8, w = 0, h = 0, ct = 0, bd = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; if (data[12]) throw new Error("interlaced PNG not supported"); }
    if (type === "IDAT") idat.push(data);
    if (type === "IEND") break;
    p += 12 + len;
  }
  if (bd !== 8 || (ct !== 2 && ct !== 6)) throw new Error(`unsupported PNG (bitDepth ${bd}, colorType ${ct})`);
  const bpp = ct === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = new Uint8ClampedArray(w * h * 4);
  const prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let r = v;
      if (f === 1) r = v + a; else if (f === 2) r = v + b; else if (f === 3) r = v + ((a + b) >> 1);
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      cur[x] = r & 255;
    }
    for (let x = 0; x < w; x++) {
      out[(y * w + x) * 4] = cur[x * bpp]; out[(y * w + x) * 4 + 1] = cur[x * bpp + 1]; out[(y * w + x) * 4 + 2] = cur[x * bpp + 2];
      out[(y * w + x) * 4 + 3] = bpp === 4 ? cur[x * bpp + 3] : 255;
    }
    prev.set(cur);
  }
  return { w, h, data: out };
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); }
export function encodePng({ w, h, data }) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(data.buffer, data.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/** Resize with area averaging (down) / bilinear (up), premultiplied alpha. Keeps aspect ratio as given. */
export function resize(src, nw, nh) {
  const out = new Uint8ClampedArray(nw * nh * 4);
  const sx = src.w / nw, sy = src.h / nh;
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    if (sx >= 1 && sy >= 1) {
      for (let yy = Math.floor(y * sy); yy < Math.min(src.h, Math.ceil((y + 1) * sy)); yy++)
        for (let xx = Math.floor(x * sx); xx < Math.min(src.w, Math.ceil((x + 1) * sx)); xx++) {
          const i = (yy * src.w + xx) * 4, al = src.data[i + 3] / 255;
          r += src.data[i] * al; g += src.data[i + 1] * al; b += src.data[i + 2] * al; a += al; n++;
        }
    } else {
      const fx = Math.min(src.w - 1, Math.max(0, (x + 0.5) * sx - 0.5)), fy = Math.min(src.h - 1, Math.max(0, (y + 0.5) * sy - 0.5));
      const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(src.w - 1, x0 + 1), y1 = Math.min(src.h - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
      for (const [xx, yy, wgt] of [[x0, y0, (1 - tx) * (1 - ty)], [x1, y0, tx * (1 - ty)], [x0, y1, (1 - tx) * ty], [x1, y1, tx * ty]]) {
        const i = (yy * src.w + xx) * 4, al = (src.data[i + 3] / 255) * wgt;
        r += src.data[i] * al; g += src.data[i + 1] * al; b += src.data[i + 2] * al; a += al; n += wgt;
      }
    }
    const o = (y * nw + x) * 4;
    if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; }
    out[o + 3] = (a / n) * 255;
  }
  return { w: nw, h: nh, data: out };
}
