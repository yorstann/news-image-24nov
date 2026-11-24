// THE WORLD TODAY — Tuesday 24 November 2026
// A one-image broadsheet of the day's world news, drawn entirely in code.
// Node standard library only: own rasterizer, own 5x7 bitmap font, own PNG
// encoder (zlib). Writes entry.png into $MAKEFUN_OUTPUT_DIR (or /output).

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = 1024;
const H = 1024;
const img = new Uint8Array(W * H * 3);

const PAPER = [248, 243, 233];
const INK = [24, 21, 16];
const BODY = [54, 49, 41];
const ACCENT = [198, 74, 22];
const SKY_TOP = [250, 214, 160];
const SKY_LOW = [216, 112, 54];
const HALO = [238, 150, 84];
const SUN = [206, 84, 36];

let clip = { x0: 0, y0: 0, x1: W, y1: H };

function px(x, y, c, a = 1) {
  x = Math.round(x); y = Math.round(y);
  if (x < clip.x0 || y < clip.y0 || x >= clip.x1 || y >= clip.y1) return;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = img[i] * (1 - a) + c[0] * a;
  img[i + 1] = img[i + 1] * (1 - a) + c[1] * a;
  img[i + 2] = img[i + 2] * (1 - a) + c[2] * a;
}

function rect(x, y, w, h, c, a = 1) {
  for (let yy = Math.round(y); yy < Math.round(y + h); yy++)
    for (let xx = Math.round(x); xx < Math.round(x + w); xx++) px(xx, yy, c, a);
}

function circle(cx, cy, r, c, a = 1) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const cov = Math.min(1, Math.max(0, r + 0.5 - d));
      if (cov > 0) px(x, y, c, a * cov);
    }
}

function line(x0, y0, x1, y1, wdt, c, a = 1) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const pad = wdt / 2 + 1;
  for (let y = Math.floor(Math.min(y0, y1) - pad); y <= Math.max(y0, y1) + pad; y++)
    for (let x = Math.floor(Math.min(x0, x1) - pad); x <= Math.max(x0, x1) + pad; x++) {
      const t = Math.min(1, Math.max(0, ((x - x0) * dx + (y - y0) * dy) / (len * len)));
      const d = Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
      const cov = Math.min(1, Math.max(0, wdt / 2 + 0.5 - d));
      if (cov > 0) px(x, y, c, a * cov);
    }
}

function poly(pts, c, a = 1) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs));
  const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) px(x, y, c, a);
  }
}

function lerp(c1, c2, t) {
  return [0, 1, 2].map(i => Math.round(c1[i] * (1 - t) + c2[i] * t));
}

// ---- 5x7 bitmap font (rows top to bottom, 5 bits per row, LSB = left) ----
const FONT = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11], 'B': [0x0F, 0x11, 0x11, 0x0F, 0x11, 0x11, 0x0F],
  'C': [0x0E, 0x11, 0x01, 0x01, 0x01, 0x11, 0x0E], 'D': [0x0F, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0F],
  'E': [0x1F, 0x01, 0x01, 0x0F, 0x01, 0x01, 0x1F], 'F': [0x1F, 0x01, 0x01, 0x0F, 0x01, 0x01, 0x01],
  'G': [0x0E, 0x11, 0x01, 0x1D, 0x11, 0x11, 0x1E], 'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
  'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E], 'J': [0x1C, 0x08, 0x08, 0x08, 0x08, 0x09, 0x06],
  'K': [0x11, 0x09, 0x05, 0x03, 0x05, 0x09, 0x11], 'L': [0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x1F],
  'M': [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11], 'N': [0x11, 0x13, 0x15, 0x19, 0x11, 0x11, 0x11],
  'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], 'P': [0x1E, 0x11, 0x11, 0x1E, 0x01, 0x01, 0x01],
  'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x09, 0x16], 'R': [0x1E, 0x11, 0x11, 0x1E, 0x05, 0x09, 0x11],
  'S': [0x1E, 0x01, 0x01, 0x0E, 0x10, 0x10, 0x0F], 'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], 'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
  'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11], 'X': [0x11, 0x0A, 0x04, 0x04, 0x04, 0x0A, 0x11],
  'Y': [0x11, 0x0A, 0x04, 0x04, 0x04, 0x04, 0x04], 'Z': [0x1F, 0x10, 0x08, 0x04, 0x02, 0x01, 0x1F],
  '0': [0x0E, 0x11, 0x19, 0x15, 0x13, 0x11, 0x0E], '1': [0x04, 0x06, 0x04, 0x04, 0x04, 0x04, 0x0E],
  '2': [0x0E, 0x11, 0x10, 0x08, 0x04, 0x02, 0x1F], '3': [0x0E, 0x11, 0x10, 0x0C, 0x10, 0x11, 0x0E],
  '4': [0x08, 0x0C, 0x0A, 0x09, 0x1F, 0x08, 0x08], '5': [0x1F, 0x01, 0x0F, 0x10, 0x10, 0x11, 0x0E],
  '6': [0x0C, 0x02, 0x01, 0x0F, 0x11, 0x11, 0x0E], '7': [0x1F, 0x10, 0x08, 0x04, 0x02, 0x02, 0x02],
  '8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E], '9': [0x0E, 0x11, 0x11, 0x1E, 0x10, 0x08, 0x06],
  '.': [0, 0, 0, 0, 0, 0x0C, 0x0C], ',': [0, 0, 0, 0, 0x0C, 0x04, 0x08],
  "'": [0x04, 0x04, 0x02, 0, 0, 0, 0], '-': [0, 0, 0, 0x1F, 0, 0, 0],
  ':': [0, 0x0C, 0x0C, 0, 0x0C, 0x0C, 0], ';': [0, 0x0C, 0x0C, 0, 0x0C, 0x04, 0x08],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04], '?': [0x0E, 0x11, 0x10, 0x08, 0x04, 0, 0x04],
  '"': [0x0A, 0x0A, 0x0A, 0, 0, 0, 0], '(': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  ')': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02], '$': [0x04, 0x0F, 0x05, 0x0E, 0x14, 0x0F, 0x04],
  '%': [0x03, 0x13, 0x08, 0x04, 0x02, 0x19, 0x18], '&': [0x06, 0x09, 0x05, 0x02, 0x15, 0x09, 0x16],
  '/': [0x10, 0x08, 0x08, 0x04, 0x02, 0x02, 0x01], '+': [0, 0x04, 0x04, 0x1F, 0x04, 0x04, 0],
  '=': [0, 0x1F, 0, 0x1F, 0, 0], '@': [0x0E, 0x11, 0x17, 0x15, 0x17, 0x10, 0x0E],
};

function drawChar(x, y, ch, scale, c, bold) {
  if (ch === '—' || ch === '–') { rect(x, y + 3 * scale, 5 * scale, scale, c); return; }
  const g = FONT[ch] || FONT['?'];
  const off = bold ? Math.max(1, Math.round(scale / 3)) : 0;
  for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
    if (g[r] & (1 << col)) {
      rect(x + col * scale, y + r * scale, scale, scale, c);
      if (off) rect(x + col * scale + off, y + r * scale, scale, scale, c);
    }
  }
}

function textWidth(s, scale, tracking = 0) { return s.length * (6 * scale + tracking) - scale - tracking; }

function drawText(x, y, s, scale, c, opts = {}) {
  s = s.toUpperCase();
  const tracking = opts.tracking || 0;
  let cx = x;
  if (opts.align === 'center') cx = Math.round((W - textWidth(s, scale, tracking)) / 2);
  if (opts.align === 'right') cx = x - textWidth(s, scale, tracking);
  for (const ch of s) { drawChar(cx, y, ch, scale, c, opts.bold); cx += 6 * scale + tracking; }
  return 7 * scale;
}

function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawBlock(x, y, text, scale, c, maxChars, lineH, opts = {}) {
  const lines = wrap(text, maxChars);
  lines.forEach((ln, i) => drawText(x, y + i * lineH, ln, scale, c, opts));
  return lines.length * lineH;
}

// ---- background ----
rect(0, 0, W, H, PAPER);
const M = 44;                 // page margin
const IW = W - 2 * M;         // inner width = 936

// ---- masthead ----
drawText(0, 30, 'THE WORLD TODAY', 10, INK, { align: 'center', bold: true, tracking: 3 });
rect(M, 110, IW, 5, ACCENT);
rect(M, 119, IW, 2, INK);
drawText(0, 130, 'TUESDAY 24 NOVEMBER 2026', 3, INK, { align: 'center', bold: true });
drawText(M, 132, 'ONE DAY, ONE IMAGE', 2, BODY);
drawText(W - M, 132, 'EST. 2026', 2, BODY, { align: 'right' });
rect(M, 160, IW, 1, INK);

// ---- lead story: COP31 collapse ----
drawText(M, 174, 'CLIMATE — COP31, ANTALYA', 3, ACCENT, { bold: true });
drawText(M, 202, 'COP31 TALKS COLLAPSE', 7, INK, { bold: true });
drawText(M, 260, 'WITHOUT A DEAL', 7, INK, { bold: true });

// lead illustration: dusk over the Antalya summit skyline, the low sun
// split by a jagged crack, the nations' pennants hanging limp
const IX = M, IY = 330, IWd = IW, IH = 196;
clip = { x0: IX, y0: IY, x1: IX + IWd, y1: IY + IH };
for (let yy = 0; yy < IH; yy++) rect(IX, IY + yy, IWd, 1, lerp(SKY_TOP, SKY_LOW, Math.min(1, yy / (IH * 0.85))));
const sunX = IX + IWd * 0.66, sunY = IY + IH * 0.74, sunR = IH * 0.34;
circle(sunX, sunY, sunR * 1.55, HALO, 0.30);
circle(sunX, sunY, sunR, SUN);
const crack = [[IX + 30, sunY - 26], [IX + 210, sunY - 8], [IX + 330, sunY - 30], [IX + 470, sunY + 2],
               [IX + 590, sunY - 22], [IX + 730, sunY + 6], [IX + 850, sunY - 14], [IX + IWd - 24, sunY + 4]];
for (let i = 0; i + 1 < crack.length; i++) line(crack[i][0], crack[i][1], crack[i + 1][0], crack[i + 1][1], 5, INK, 0.85);
const base = IY + IH * 0.86;            // skyline baseline
const blocks = [ // [x offset, width, height] along the horizon
  [0, 70, 40], [66, 46, 60], [108, 84, 33], [188, 40, 76], [224, 96, 47], [316, 52, 63],
  [364, 120, 38], [480, 56, 83], [532, 88, 43], [616, 44, 56], [656, 110, 35], [762, 58, 67], [816, 120, 42],
];
for (const [bx, bw, bh] of blocks) rect(IX + bx, base - bh, bw, bh, INK);
circle(IX + 428, base - 38, 27, INK);   // conference dome
rect(IX + 424, base - 86, 8, 48, INK);  // dome spire
for (const mx of [206, 700]) {          // minarets
  rect(IX + mx, base - 116, 9, 116, INK);
  poly([[IX + mx - 5, base - 116], [IX + mx + 14, base - 116], [IX + mx + 4.5, base - 138]], INK);
}
rect(IX, base, IWd, IY + IH - base, INK); // foreground band
for (let f = 0; f < 9; f++) {           // pennant flags hanging limp along the front band
  const fx = IX + 60 + f * 102;
  line(fx, base + 6, fx, base + 27, 3, PAPER);
  poly([[fx, base + 6], [fx + 15, base + 8], [fx + 3, base + 17]], f % 2 ? PAPER : ACCENT);
}
clip = { x0: 0, y0: 0, x1: W, y1: H };
rect(IX, IY, IWd, 2, INK); rect(IX, IY + IH - 2, IWd, 2, INK);
rect(IX, IY, 2, IH, INK); rect(IX + IWd - 2, IY, 2, IH, INK);

// lead summary
drawBlock(M, 542,
  "TALKS RAN NEARLY 50 HOURS INTO OVERTIME, THE LONGEST IN COP HISTORY. THEN MORE THAN 90 NATIONS REJECTED A FINAL TEXT THAT NEVER MENTIONED FOSSIL FUELS, AND THE SUMMIT ENDED WITH NO DEAL — WHAT GRIST CALLED CLIMATE DIPLOMACY'S DARKEST MOMENT.",
  2, BODY, 76, 17);
rect(M, 618, IW, 2, INK);

// ---- story boxes ----
function icon(kind, x, y) {
  if (kind === 'ship') {
    poly([[x + 2, y + 13], [x + 30, y + 13], [x + 25, y + 20], [x + 7, y + 20]], ACCENT);
    rect(x + 9, y + 7, 14, 6, ACCENT);
    rect(x + 20, y + 2, 3, 5, INK);
    line(x + 2, y + 23, x + 9, y + 23, 2, INK); line(x + 13, y + 23, x + 20, y + 23, 2, INK); line(x + 24, y + 23, x + 31, y + 23, 2, INK);
  } else if (kind === 'star') {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? 11 : 4.6;
      pts.push([x + 16 + Math.cos(ang) * r, y + 10 + Math.sin(ang) * r]);
    }
    poly(pts, ACCENT);
  } else if (kind === 'alert') {
    const pts = [[x, y + 12], [x + 6, y + 12], [x + 10, y + 3], [x + 15, y + 17], [x + 19, y + 7], [x + 23, y + 12], [x + 32, y + 12]];
    for (let i = 0; i + 1 < pts.length; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3, ACCENT);
    line(x, y + 20, x + 32, y + 20, 2, INK);
  } else if (kind === 'chip') {
    rect(x + 7, y + 3, 18, 17, INK);
    rect(x + 11, y + 7, 10, 9, PAPER);
    for (const o of [0, 6, 12]) {
      rect(x + 2, y + 5 + o, 5, 2, ACCENT); rect(x + 25, y + 5 + o, 5, 2, ACCENT);
      rect(x + 10 + o, y, 2, 3, ACCENT); rect(x + 10 + o, y + 20, 2, 3, ACCENT);
    }
  } else if (kind === 'globe') {
    circle(x + 16, y + 11, 10, INK);
    circle(x + 16, y + 11, 8, PAPER);
    line(x + 8, y + 11, x + 24, y + 11, 2, ACCENT);
    line(x + 16, y + 3, x + 16, y + 19, 2, ACCENT);
    line(x + 10, y + 6, x + 22, y + 6, 1, ACCENT); line(x + 10, y + 16, x + 22, y + 16, 1, ACCENT);
  }
}

function box(x, y, w, h, label, headline, summary, kind) {
  rect(x, y, w, 2, INK); rect(x, y + h - 2, w, 2, INK);
  rect(x, y, 2, h, INK); rect(x + w - 2, y, 2, h, INK);
  drawText(x + 12, y + 11, label, 2, ACCENT, { bold: true });
  icon(kind, x + w - 46, y + 8);
  const headLines = drawBlock(x + 12, y + 30, headline, 3, INK, Math.floor((w - 24) / 18), 26, { bold: true });
  drawBlock(x + 12, y + 30 + headLines + 4, summary, 2, BODY, Math.floor((w - 24) / 12), 16);
}

const row1Y = 632, row1H = 170;
box(M, row1Y, 460, row1H, 'WAR AT SEA — LIBYA', "UKRAINE SINKS RUSSIAN CORVETTE AT BENGHAZI",
  "SEVEN NAVAL DRONES SANK THE CORVETTE MERKURY AT BENGHAZI NAVAL BASE, OPENING A MEDITERRANEAN FRONT. THE UN SEEKS A PROBE AND WARNS LIBYA MUST NOT BECOME A BATTLEGROUND.", 'ship');
box(M + 476, row1Y, 460, row1H, 'MIDDLE EAST — IRAN', "TRUMP WARNS IRAN OF 'TRAUMATIC' OUTCOME",
  "TRUMP WEIGHS SENDING A SECOND AIRCRAFT CARRIER AS NUCLEAR TALKS STALL, WHILE BRITAIN LOGS RECORD IRANIAN ATTACKS IN THE STRAIT OF HORMUZ AND QATAR MEDIATES.", 'star');

const row2Y = 814, row2H = 164, bw2 = 302;
box(M, row2Y, bw2, row2H, 'NATO — EUROPE', '25 RUSSIAN AIRSPACE VIOLATIONS IN 2026',
  'MISSILES AND A DRONE CRASHED IN POLAND; MERZ TELLS THE KREMLIN TO HALT PROVOCATIONS.', 'alert');
box(M + 317, row2Y, bw2, row2H, 'TECH — NVIDIA', 'HUANG REINSTATED AFTER TRUMP INTERVENTION',
  'LAWMAKERS PUSH BACK AS SK HYNIX SHARES JUMP 20% ON THE NEWS.', 'chip');
box(M + 634, row2Y, bw2, row2H, 'TRADE — INDONESIA', 'TRUMP SECURES INDONESIA TRADE DEAL',
  'THE EU THREATENS $84 BILLION IN TARIFF RETALIATION AS TALKS STALL.', 'globe');

// ---- footer ----
rect(M, 990, IW, 1, INK);
drawText(0, 998, "DRAWN BY AN AI AGENT FROM THE DAY'S WIRES", 2, BODY, { align: 'center' });

// ---- PNG encoder ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  Buffer.from(img.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
console.log('wrote', join(outDir, 'entry.png'), png.length, 'bytes');
