// 24 NOVEMBER IN ONE IMAGE — a poster, not a newspaper.
// The whole day on one dark page: one giant headline, three hard
// numbers, one symbolic picture, four one-line stories and a ticker.
// Drawn entirely in code (own rasterizer, own bitmap typeface, own
// PNG writer on Node's zlib). No assets, no network. The picture is
// written to $MAKEFUN_OUTPUT_DIR/entry.png (fallback /output).

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ----- stage -----
const W = 1024;
const H = 1024;
const px3 = new Uint8Array(W * H * 3);

const NIGHT = [16, 18, 26];
const CARD = [26, 29, 40];
const PAPER = [245, 244, 238];
const SOFT = [208, 211, 219];
const MUTED = [148, 153, 168];
const EMBER = [255, 122, 26];
const SEASKY = [13, 44, 56];
const SEADEEP = [10, 62, 76];
const ICE = [228, 241, 246];
const ICE_SHADE = [178, 205, 216];
const SUN = [255, 140, 40];

let win = { x0: 0, y0: 0, x1: W, y1: H };

function put(x, y, col, a = 1) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < win.x0 || yi < win.y0 || xi >= win.x1 || yi >= win.y1) return;
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
  const o = (yi * W + xi) * 3;
  px3[o] = px3[o] + (col[0] - px3[o]) * a;
  px3[o + 1] = px3[o + 1] + (col[1] - px3[o + 1]) * a;
  px3[o + 2] = px3[o + 2] + (col[2] - px3[o + 2]) * a;
}

function fill(x, y, w, h, col, a = 1) {
  for (let yy = Math.round(y); yy < Math.round(y + h); yy++)
    for (let xx = Math.round(x); xx < Math.round(x + w); xx++) put(xx, yy, col, a);
}

function ball(cx, cy, r, col, a = 1) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
    for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const cov = Math.min(1, Math.max(0, r + 0.5 - d));
      if (cov > 0) put(x, y, col, a * cov);
    }
}

function stroke(xa, ya, xb, yb, wdt, col, a = 1) {
  const n = Math.max(Math.abs(xb - xa), Math.abs(yb - ya)) * 2 + 1;
  for (let s = 0; s <= n; s++) {
    const t = s / n;
    ball(xa + (xb - xa) * t, ya + (yb - ya) * t, wdt / 2, col, a);
  }
}

function polygon(pts, col, a = 1) {
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++)
    for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
      let inside = false;
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length];
        if ((p[1] > y) !== (q[1] > y) && x < ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]) + p[0]) inside = !inside;
      });
      if (inside) put(x, y, col, a);
    }
}

function mix(c1, c2, t) {
  return c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
}

// ----- typeface: 5x7 glyphs as picture rows -----
const GLYPH = {
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '.#.#.', '..#..', '..#..', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '..#..', '..#..', '..#..'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
  "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '$': ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '%': ['##...', '##..#', '...#.', '..#..', '.#...', '#..##', '...##'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
};

function stamp(x, y, ch, size, col, bold) {
  if (ch === '—' || ch === '–') { fill(x, y + 3 * size, 5 * size, size, col); return; }
  const g = GLYPH[ch] || GLYPH['?'];
  const extra = bold ? Math.max(1, Math.round(size / 3)) : 0;
  g.forEach((row, r) => {
    [...row].forEach((cell, c) => {
      if (cell === '#') {
        fill(x + c * size, y + r * size, size, size, col);
        if (extra) fill(x + c * size + extra, y + r * size, size, size, col);
      }
    });
  });
}

function widthOf(text, size, tracking = 0) {
  return text.length * (6 * size + tracking) - size - tracking;
}

function type(x, y, text, size, col, opts = {}) {
  const s = text.toUpperCase();
  const tracking = opts.tracking || 0;
  let pen = x;
  if (opts.align === 'center') pen = Math.round((W - widthOf(s, size, tracking)) / 2);
  if (opts.align === 'right') pen = x - widthOf(s, size, tracking);
  for (const ch of s) { stamp(pen, y, ch, size, col, opts.bold); pen += 6 * size + tracking; }
  return 7 * size;
}

function foldText(text, maxChars) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    const trial = cur ? cur + ' ' + word : word;
    if (trial.length > maxChars && cur) { lines.push(cur); cur = word; }
    else cur = trial;
  }
  if (cur) lines.push(cur);
  return lines;
}

function para(x, y, text, size, col, maxChars, leading, opts = {}) {
  const lines = foldText(text, maxChars);
  lines.forEach((ln, i) => type(x, y + i * leading, ln, size, col, opts));
  return lines.length * leading;
}

// ----- the poster -----
fill(0, 0, W, H, NIGHT);
const L = 48;
const R = W - 48;
const CW = R - L; // 928

// header strip
type(L, 38, 'TUESDAY 24 NOVEMBER 2026', 3, PAPER, { bold: true, tracking: 2 });
type(R, 44, 'ONE IMAGE, THE WHOLE DAY', 2, MUTED, { align: 'right' });
fill(L, 88, CW, 4, EMBER);

// kicker + giant headline
type(L, 116, 'CLIMATE SUMMIT — ANTALYA', 3, EMBER, { bold: true, tracking: 2 });
type(L, 152, 'COP31 TALKS', 12, PAPER, { bold: true });
type(L, 248, 'COLLAPSE', 16, EMBER, { bold: true });

// three hard numbers
const stats = [
  ['50H', 'OF OVERTIME TALKS'],
  ['90+', 'NATIONS REJECT THE TEXT'],
  ['0', 'MENTIONS OF FOSSIL FUELS'],
];
stats.forEach(([num, label], i) => {
  const sx = L + i * 312;
  type(sx, 386, num, 6, PAPER, { bold: true });
  type(sx, 436, label, 2, MUTED);
  if (i > 0) fill(sx - 28, 390, 2, 62, [52, 57, 72]);
});

// ----- illustration: one ice shelf, splitting in two -----
const ART = { x: L, y: 486, w: CW, h: 238 };
win = { x0: ART.x, y0: ART.y, x1: ART.x + ART.w, y1: ART.y + ART.h };
for (let row = 0; row < ART.h; row++)
  fill(ART.x, ART.y + row, ART.w, 1, mix(SEASKY, SEADEEP, row / ART.h));
const midX = ART.x + ART.w / 2;
const seaY = ART.y + 148;
ball(midX, seaY - 24, 56, SUN, 0.22);                   // glow behind the gap
ball(midX, seaY - 24, 36, SUN);                         // low sun in the crack
// left berg
polygon([[ART.x + 18, seaY + 66], [ART.x + 30, seaY - 58], [ART.x + 96, seaY - 88], [ART.x + 190, seaY - 66],
  [ART.x + 268, seaY - 92], [ART.x + 356, seaY - 60], [ART.x + 402, seaY - 30], [ART.x + 388, seaY + 66]], ICE);
polygon([[ART.x + 30, seaY - 58], [ART.x + 96, seaY - 88], [ART.x + 190, seaY - 66], [ART.x + 150, seaY - 34],
  [ART.x + 84, seaY - 28], [ART.x + 40, seaY - 36]], ICE_SHADE, 0.55);
// right berg
polygon([[ART.x + ART.w - 18, seaY + 66], [ART.x + ART.w - 34, seaY - 52], [ART.x + ART.w - 110, seaY - 84],
  [ART.x + ART.w - 204, seaY - 62], [ART.x + ART.w - 276, seaY - 90], [ART.x + ART.w - 362, seaY - 56],
  [ART.x + ART.w - 404, seaY - 26], [ART.x + ART.w - 390, seaY + 66]], ICE);
polygon([[ART.x + ART.w - 34, seaY - 52], [ART.x + ART.w - 110, seaY - 84], [ART.x + ART.w - 204, seaY - 62],
  [ART.x + ART.w - 160, seaY - 30], [ART.x + ART.w - 92, seaY - 26], [ART.x + ART.w - 46, seaY - 34]], ICE_SHADE, 0.55);
// fracture lines on both bergs
for (const [xa, ya, xb, yb] of [[70, -70, 104, -30], [104, -30, 88, 8], [240, -78, 262, -38], [262, -38, 244, 2]])
  stroke(ART.x + xa, seaY + ya, ART.x + xb, seaY + yb, 3, ICE_SHADE);
for (const [xa, ya, xb, yb] of [[-80, -66, -112, -28], [-112, -28, -96, 10], [-250, -74, -272, -36], [-272, -36, -254, 4]])
  stroke(ART.x + ART.w + xa, seaY + ya, ART.x + ART.w + xb, seaY + yb, 3, ICE_SHADE);
// waterline shading along both berg bases
fill(ART.x + 18, seaY + 34, 370, 32, ICE_SHADE, 0.30);
fill(ART.x + ART.w - 388, seaY + 34, 370, 32, ICE_SHADE, 0.30);
// chunks calving into the water beside the gap
polygon([[midX - 62, seaY + 44], [midX - 46, seaY + 24], [midX - 30, seaY + 42]], ICE);
polygon([[midX + 34, seaY + 52], [midX + 48, seaY + 34], [midX + 60, seaY + 50]], ICE_SHADE);
// water: surface line + drifting streaks
fill(ART.x, seaY + 66, ART.w, 3, ICE_SHADE, 0.8);
for (let s = 0; s < 26; s++) {
  const sx = ART.x + 24 + ((s * 173) % (ART.w - 90));
  const sy = seaY + 82 + ((s * 37) % 56);
  fill(sx, sy, 18 + (s % 4) * 9, 2, ICE_SHADE, 0.35);
}
win = { x0: 0, y0: 0, x1: W, y1: H };
fill(ART.x, ART.y, ART.w, 2, [52, 57, 72]); fill(ART.x, ART.y + ART.h - 2, ART.w, 2, [52, 57, 72]);
fill(ART.x, ART.y, 2, ART.h, [52, 57, 72]); fill(ART.x + ART.w - 2, ART.y, 2, ART.h, [52, 57, 72]);

// ----- four one-line stories -----
function emblem(kind, x, y) {
  if (kind === 'ship') {
    polygon([[x + 2, y + 13], [x + 30, y + 13], [x + 25, y + 20], [x + 7, y + 20]], EMBER);
    fill(x + 9, y + 7, 14, 6, EMBER);
    fill(x + 20, y + 2, 3, 5, PAPER);
  } else if (kind === 'star') {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? 11 : 4.6;
      pts.push([x + 16 + Math.cos(ang) * rad, y + 10 + Math.sin(ang) * rad]);
    }
    polygon(pts, EMBER);
  } else if (kind === 'alert') {
    const zig = [[0, 12], [6, 12], [10, 3], [15, 17], [19, 7], [23, 12], [32, 12]];
    for (let i = 0; i + 1 < zig.length; i++) stroke(x + zig[i][0], y + zig[i][1], x + zig[i + 1][0], y + zig[i + 1][1], 3, EMBER);
  } else if (kind === 'chip') {
    fill(x + 7, y + 3, 18, 17, PAPER);
    fill(x + 11, y + 7, 10, 9, CARD);
    for (const o of [0, 6, 12]) {
      fill(x + 2, y + 5 + o, 5, 2, EMBER); fill(x + 25, y + 5 + o, 5, 2, EMBER);
      fill(x + 10 + o, y, 2, 3, EMBER); fill(x + 10 + o, y + 20, 2, 3, EMBER);
    }
  }
}

const tiles = [
  ['LIBYA', 'UKRAINE SINKS RUSSIAN CORVETTE AT BENGHAZI', 'ship'],
  ['IRAN', "TRUMP WARNS IRAN OF A 'TRAUMATIC' OUTCOME", 'star'],
  ['NATO', 'RUSSIA BREAKS NATO AIRSPACE 25 TIMES', 'alert'],
  ['TECH', 'NVIDIA CHIEF BACK AFTER TRUMP STEPS IN', 'chip'],
];
const TILE_Y = 752;
const TILE_W = 220;
tiles.forEach(([label, headline, kind], i) => {
  const tx = L + i * (TILE_W + 16);
  fill(tx, TILE_Y, TILE_W, 168, CARD);
  fill(tx, TILE_Y, TILE_W, 4, EMBER);
  type(tx + 14, TILE_Y + 16, label, 2, EMBER, { bold: true });
  emblem(kind, tx + TILE_W - 48, TILE_Y + 12);
  para(tx + 14, TILE_Y + 48, headline, 2, PAPER, 17, 23, { bold: true });
});

// ----- ticker + signature -----
fill(L, 946, 10, 10, EMBER);
type(0, 942, 'ALSO TODAY: TRUMP SEALS INDONESIA TRADE DEAL — EU THREATENS $84B IN TARIFFS', 2, SOFT, { align: 'center' });
fill(R - 10, 946, 10, 10, EMBER);
type(0, 984, 'DRAWN BY AN AI AGENT FROM THE DAY\'S WIRES', 1, MUTED, { align: 'center' });

// ----- PNG writer -----
const table = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  table.push(c);
}
function crc(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunkOf(name, payload) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length);
  const named = Buffer.concat([Buffer.from(name, 'ascii'), payload]);
  const chk = Buffer.alloc(4);
  chk.writeUInt32BE(crc(named));
  return Buffer.concat([len, named, chk]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;
const rows = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  rows[y * (W * 3 + 1)] = 0;
  Buffer.from(px3.buffer, y * W * 3, W * 3).copy(rows, y * (W * 3 + 1) + 1);
}
const out = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunkOf('IHDR', ihdr),
  chunkOf('IDAT', deflateSync(rows, { level: 9 })),
  chunkOf('IEND', Buffer.alloc(0)),
]);
const dir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'entry.png'), out);
console.log('wrote', join(dir, 'entry.png'), out.length, 'bytes');
