// THE WORLD TODAY — Tuesday 24 November 2026
// One picture that carries the whole day's world news, rendered end to
// end by this program: a small software rasterizer, a hand-packed
// bitmap typeface and a PNG writer built on Node's zlib. No image
// assets, no network. Output lands in $MAKEFUN_OUTPUT_DIR/entry.png
// (falling back to /output/entry.png).

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------- canvas ----------
const PAGE_W = 1024;
const PAGE_H = 1024;
const raster = new Uint8Array(PAGE_W * PAGE_H * 3);

const CREAM = [248, 243, 233];
const SOOT = [24, 21, 16];
const BODY_INK = [54, 49, 41];
const EMBER = [198, 74, 22];
const DAWN_HIGH = [250, 214, 160];
const DAWN_LOW = [216, 112, 54];
const GLOW = [238, 150, 84];
const SUNSET = [206, 84, 36];

const view = { left: 0, top: 0, right: PAGE_W, bottom: PAGE_H };

function dot(x, y, ink, alpha = 1) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < view.left || yi < view.top || xi >= view.right || yi >= view.bottom) return;
  if (xi < 0 || yi < 0 || xi >= PAGE_W || yi >= PAGE_H) return;
  const at = (yi * PAGE_W + xi) * 3;
  for (let ch = 0; ch < 3; ch++) raster[at + ch] = raster[at + ch] * (1 - alpha) + ink[ch] * alpha;
}

function bar(x, y, w, h, ink, alpha = 1) {
  const yEnd = Math.round(y + h);
  const xEnd = Math.round(x + w);
  for (let yy = Math.round(y); yy < yEnd; yy++)
    for (let xx = Math.round(x); xx < xEnd; xx++) dot(xx, yy, ink, alpha);
}

function disc(cx, cy, radius, ink, alpha = 1) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius - 1); y <= cy + radius + 1; y++)
    for (let x = Math.floor(cx - radius - 1); x <= cx + radius + 1; x++) {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      const cover = Math.min(1, Math.max(0, radius + 0.5 - Math.sqrt(d2)));
      if (cover > 0 && d2 <= r2 + radius) dot(x, y, ink, alpha * cover);
    }
}

function seg(xa, ya, xb, yb, thick, ink, alpha = 1) {
  const steps = Math.max(Math.abs(xb - xa), Math.abs(yb - ya)) * 2 + 1;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    disc(xa + (xb - xa) * t, ya + (yb - ya) * t, thick / 2, ink, alpha);
  }
}

function shape(points, ink, alpha = 1) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++)
    for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
      let inside = false;
      points.forEach((p, i) => {
        const q = points[(i + 1) % points.length];
        if ((p[1] > y) !== (q[1] > y) && x < ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]) + p[0]) inside = !inside;
      });
      if (inside) dot(x, y, ink, alpha);
    }
}

function blend(from, to, t) {
  return from.map((v, i) => Math.round(v + (to[i] - v) * t));
}

// ---------- typeface: 5x7 glyphs stored as picture rows ----------
const ROWS = {
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
  ';': ['.....', '.##..', '.##..', '.....', '.##..', '..#..', '.#...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '"': ['.#.#.', '.#.#.', '.#.#.', '.....', '.....', '.....', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '$': ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '%': ['##...', '##..#', '...#.', '..#..', '.#...', '#..##', '...##'],
  '&': ['.##..', '#..#.', '#.#..', '..#..', '#.#.#', '#..#.', '.#..#'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
};

function stampGlyph(x, y, ch, size, ink, bold) {
  if (ch === '—' || ch === '–') { bar(x, y + 3 * size, 5 * size, size, ink); return; }
  const glyph = ROWS[ch] || ROWS['?'];
  const extra = bold ? Math.max(1, Math.round(size / 3)) : 0;
  glyph.forEach((row, r) => {
    [...row].forEach((cell, col) => {
      if (cell === '#') {
        bar(x + col * size, y + r * size, size, size, ink);
        if (extra) bar(x + col * size + extra, y + r * size, size, size, ink);
      }
    });
  });
}

function measure(text, size, tracking = 0) {
  return text.length * (6 * size + tracking) - size - tracking;
}

function printLine(x, y, text, size, ink, opts = {}) {
  const upper = text.toUpperCase();
  const tracking = opts.tracking || 0;
  let pen = x;
  if (opts.align === 'center') pen = Math.round((PAGE_W - measure(upper, size, tracking)) / 2);
  if (opts.align === 'right') pen = x - measure(upper, size, tracking);
  for (const ch of upper) {
    stampGlyph(pen, y, ch, size, ink, opts.bold);
    pen += 6 * size + tracking;
  }
  return 7 * size;
}

function fold(text, maxChars) {
  const out = [];
  let current = '';
  for (const word of text.split(' ')) {
    const trial = current ? current + ' ' + word : word;
    if (trial.length > maxChars && current) { out.push(current); current = word; }
    else current = trial;
  }
  if (current) out.push(current);
  return out;
}

function printPara(x, y, text, size, ink, maxChars, leading, opts = {}) {
  const lines = fold(text, maxChars);
  lines.forEach((ln, i) => printLine(x, y + i * leading, ln, size, ink, opts));
  return lines.length * leading;
}

// ---------- page furniture ----------
bar(0, 0, PAGE_W, PAGE_H, CREAM);
const EDGE = 44;
const SPAN = PAGE_W - 2 * EDGE;

printLine(0, 30, 'THE WORLD TODAY', 10, SOOT, { align: 'center', bold: true, tracking: 3 });
bar(EDGE, 110, SPAN, 5, EMBER);
bar(EDGE, 119, SPAN, 2, SOOT);
printLine(0, 130, 'TUESDAY 24 NOVEMBER 2026', 3, SOOT, { align: 'center', bold: true });
printLine(EDGE, 132, 'ONE DAY, ONE IMAGE', 2, BODY_INK);
printLine(PAGE_W - EDGE, 132, 'EST. 2026', 2, BODY_INK, { align: 'right' });
bar(EDGE, 160, SPAN, 1, SOOT);

// ---------- the lead: COP31 ends without a deal ----------
printLine(EDGE, 174, 'CLIMATE — COP31, ANTALYA', 3, EMBER, { bold: true });
printLine(EDGE, 202, 'COP31 TALKS COLLAPSE', 7, SOOT, { bold: true });
printLine(EDGE, 260, 'WITHOUT A DEAL', 7, SOOT, { bold: true });

// ---------- lead illustration: dusk over the Antalya skyline ----------
// The sun hangs low and split; the summit's pennants hang limp.
const ART = { x: EDGE, y: 330, w: SPAN, h: 196 };
Object.assign(view, { left: ART.x, top: ART.y, right: ART.x + ART.w, bottom: ART.y + ART.h });
for (let row = 0; row < ART.h; row++)
  bar(ART.x, ART.y + row, ART.w, 1, blend(DAWN_HIGH, DAWN_LOW, Math.min(1, row / (ART.h * 0.85))));
const sunCx = ART.x + ART.w * 0.66;
const sunCy = ART.y + ART.h * 0.74;
const sunR = ART.h * 0.34;
disc(sunCx, sunCy, sunR * 1.55, GLOW, 0.30);
disc(sunCx, sunCy, sunR, SUNSET);
const crackPath = [[30, -26], [210, -8], [330, -30], [470, 2], [590, -22], [730, 6], [850, -14], [912, 4]];
for (let i = 0; i + 1 < crackPath.length; i++)
  seg(ART.x + crackPath[i][0], sunCy + crackPath[i][1], ART.x + crackPath[i + 1][0], sunCy + crackPath[i + 1][1], 5, SOOT, 0.85);
const horizon = ART.y + ART.h * 0.86;
const towers = [[0, 70, 40], [66, 46, 60], [108, 84, 33], [188, 40, 76], [224, 96, 47], [316, 52, 63],
  [364, 120, 38], [480, 56, 83], [532, 88, 43], [616, 44, 56], [656, 110, 35], [762, 58, 67], [816, 120, 42]];
for (const [off, wdt, hgt] of towers) bar(ART.x + off, horizon - hgt, wdt, hgt, SOOT);
disc(ART.x + 428, horizon - 38, 27, SOOT);              // the conference dome
bar(ART.x + 424, horizon - 86, 8, 48, SOOT);            // its spire
for (const minaret of [206, 700]) {                     // two minarets
  bar(ART.x + minaret, horizon - 116, 9, 116, SOOT);
  shape([[ART.x + minaret - 5, horizon - 116], [ART.x + minaret + 14, horizon - 116], [ART.x + minaret + 4.5, horizon - 138]], SOOT);
}
bar(ART.x, horizon, ART.w, ART.y + ART.h - horizon, SOOT);   // foreground band
for (let f = 0; f < 9; f++) {                                // limp pennants
  const pole = ART.x + 60 + f * 102;
  seg(pole, horizon + 6, pole, horizon + 27, 3, CREAM);
  shape([[pole, horizon + 6], [pole + 15, horizon + 8], [pole + 3, horizon + 17]], f % 2 ? CREAM : EMBER);
}
Object.assign(view, { left: 0, top: 0, right: PAGE_W, bottom: PAGE_H });
bar(ART.x, ART.y, ART.w, 2, SOOT); bar(ART.x, ART.y + ART.h - 2, ART.w, 2, SOOT);
bar(ART.x, ART.y, 2, ART.h, SOOT); bar(ART.x + ART.w - 2, ART.y, 2, ART.h, SOOT);

// ---------- lead summary ----------
printPara(EDGE, 542,
  "TALKS RAN NEARLY 50 HOURS INTO OVERTIME, THE LONGEST IN COP HISTORY. THEN MORE THAN 90 NATIONS REJECTED A FINAL TEXT THAT NEVER MENTIONED FOSSIL FUELS, AND THE SUMMIT ENDED WITH NO DEAL — WHAT GRIST CALLED CLIMATE DIPLOMACY'S DARKEST MOMENT.",
  2, BODY_INK, 76, 17);
bar(EDGE, 618, SPAN, 2, SOOT);

// ---------- story cards ----------
function emblem(kind, x, y) {
  if (kind === 'ship') {
    shape([[x + 2, y + 13], [x + 30, y + 13], [x + 25, y + 20], [x + 7, y + 20]], EMBER);
    bar(x + 9, y + 7, 14, 6, EMBER);
    bar(x + 20, y + 2, 3, 5, SOOT);
    for (const dash of [2, 13, 24]) seg(x + dash, y + 23, x + dash + 7, y + 23, 2, SOOT);
  } else if (kind === 'star') {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? 11 : 4.6;
      points.push([x + 16 + Math.cos(ang) * rad, y + 10 + Math.sin(ang) * rad]);
    }
    shape(points, EMBER);
  } else if (kind === 'alert') {
    const zig = [[0, 12], [6, 12], [10, 3], [15, 17], [19, 7], [23, 12], [32, 12]];
    for (let i = 0; i + 1 < zig.length; i++) seg(x + zig[i][0], y + zig[i][1], x + zig[i + 1][0], y + zig[i + 1][1], 3, EMBER);
    seg(x, y + 20, x + 32, y + 20, 2, SOOT);
  } else if (kind === 'chip') {
    bar(x + 7, y + 3, 18, 17, SOOT);
    bar(x + 11, y + 7, 10, 9, CREAM);
    for (const o of [0, 6, 12]) {
      bar(x + 2, y + 5 + o, 5, 2, EMBER); bar(x + 25, y + 5 + o, 5, 2, EMBER);
      bar(x + 10 + o, y, 2, 3, EMBER); bar(x + 10 + o, y + 20, 2, 3, EMBER);
    }
  } else if (kind === 'globe') {
    disc(x + 16, y + 11, 10, SOOT);
    disc(x + 16, y + 11, 8, CREAM);
    seg(x + 8, y + 11, x + 24, y + 11, 2, EMBER);
    seg(x + 16, y + 3, x + 16, y + 19, 2, EMBER);
    seg(x + 10, y + 6, x + 22, y + 6, 1, EMBER); seg(x + 10, y + 16, x + 22, y + 16, 1, EMBER);
  }
}

function card(x, y, w, h, label, headline, summary, kind) {
  bar(x, y, w, 2, SOOT); bar(x, y + h - 2, w, 2, SOOT);
  bar(x, y, 2, h, SOOT); bar(x + w - 2, y, 2, h, SOOT);
  printLine(x + 12, y + 11, label, 2, EMBER, { bold: true });
  emblem(kind, x + w - 46, y + 8);
  const headH = printPara(x + 12, y + 30, headline, 3, SOOT, Math.floor((w - 24) / 18), 26, { bold: true });
  printPara(x + 12, y + 30 + headH + 4, summary, 2, BODY_INK, Math.floor((w - 24) / 12), 16);
}

const topRowY = 632;
card(EDGE, topRowY, 460, 170, 'WAR AT SEA — LIBYA', "UKRAINE SINKS RUSSIAN CORVETTE AT BENGHAZI",
  "SEVEN NAVAL DRONES SANK THE CORVETTE MERKURY AT BENGHAZI NAVAL BASE, OPENING A MEDITERRANEAN FRONT. THE UN SEEKS A PROBE AND WARNS LIBYA MUST NOT BECOME A BATTLEGROUND.", 'ship');
card(EDGE + 476, topRowY, 460, 170, 'MIDDLE EAST — IRAN', "TRUMP WARNS IRAN OF 'TRAUMATIC' OUTCOME",
  "TRUMP WEIGHS SENDING A SECOND AIRCRAFT CARRIER AS NUCLEAR TALKS STALL, WHILE BRITAIN LOGS RECORD IRANIAN ATTACKS IN THE STRAIT OF HORMUZ AND QATAR MEDIATES.", 'star');

const lowRowY = 814;
const lowRow = [
  ['NATO — EUROPE', '25 RUSSIAN AIRSPACE VIOLATIONS', 'IN 2026. MISSILES AND A DRONE CRASHED IN POLAND.', 'alert'],
  ['TECH — NVIDIA', 'HUANG BACK AT NVIDIA', 'REINSTATED AFTER TRUMP INTERVENED; SK HYNIX SHARES JUMP 20%.', 'chip'],
  ['TRADE — INDONESIA', 'TRUMP SEALS INDONESIA DEAL', 'EU THREATENS $84 BILLION IN TARIFF RETALIATION AS TALKS STALL.', 'globe'],
];
lowRow.forEach(([label, headline, summary, kind], i) =>
  card(EDGE + i * 317, lowRowY, 302, 164, label, headline, summary, kind));

// ---------- footer ----------
bar(EDGE, 990, SPAN, 1, SOOT);
printLine(0, 998, "DRAWN BY AN AI AGENT FROM THE DAY'S WIRES", 2, BODY_INK, { align: 'center' });

// ---------- PNG writer ----------
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable.push(c);
}
function crcOf(buf) {
  let c = 0xFFFFFFFF;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(name, payload) {
  const size = Buffer.alloc(4);
  size.writeUInt32BE(payload.length);
  const named = Buffer.concat([Buffer.from(name, 'ascii'), payload]);
  const check = Buffer.alloc(4);
  check.writeUInt32BE(crcOf(named));
  return Buffer.concat([size, named, check]);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(PAGE_W, 0);
header.writeUInt32BE(PAGE_H, 4);
header[8] = 8;   // bit depth
header[9] = 2;   // truecolor RGB
const scanlines = Buffer.alloc((PAGE_W * 3 + 1) * PAGE_H);
for (let y = 0; y < PAGE_H; y++) {
  const rowStart = y * (PAGE_W * 3 + 1);
  scanlines[rowStart] = 0; // filter: none
  Buffer.from(raster.buffer, y * PAGE_W * 3, PAGE_W * 3).copy(scanlines, rowStart + 1);
}
const pngBytes = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pngChunk('IHDR', header),
  pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
  pngChunk('IEND', Buffer.alloc(0)),
]);
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(targetDir, { recursive: true });
writeFileSync(join(targetDir, 'entry.png'), pngBytes);
console.log('wrote', join(targetDir, 'entry.png'), pngBytes.length, 'bytes');
