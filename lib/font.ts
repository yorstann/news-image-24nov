// A geometric stroke typeface, designed in code for this poster.
// Glyph space: y-up, baseline 0, cap height 100, x-height 66, descenders -30.
// Each glyph is a set of polylines drawn with round caps/joins, plus filled dots.
import type { Canvas, RGB } from './raster.ts';

type Pt = readonly [number, number];
interface Glyph { adv: number; strokes: Pt[][]; dots?: Pt[] }

const P = (x: number, y: number): Pt => [x, y];

/** Points along an elliptical arc, angles in degrees, y-up (CCW positive). */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt[] {
  const steps = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 12));
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    out.push(P(cx + rx * Math.cos(a), cy + ry * Math.sin(a)));
  }
  return out;
}
const ell = (cx: number, cy: number, rx: number, ry: number): Pt[] => arc(cx, cy, rx, ry, 0, 360);

const GLYPHS: Record<string, Glyph> = {
  // ------------------------------------------------------------- capitals
  A: { adv: 64, strokes: [[P(5, 0), P(30, 100), P(55, 0)], [P(16, 36), P(44, 36)]] },
  B: {
    adv: 60, strokes: [
      [P(11, 0), P(11, 100)],
      [P(11, 100), P(29, 100), ...arc(29, 76, 15, 24, 90, -90), P(11, 52)],
      [P(11, 52), P(31, 52), ...arc(31, 26, 17, 26, 90, -90), P(11, 0)],
    ],
  },
  C: { adv: 62, strokes: [arc(31, 50, 24, 50, 52, 308)] },
  D: {
    adv: 62, strokes: [
      [P(11, 0), P(11, 100)],
      [P(11, 100), P(28, 100), ...arc(28, 50, 20, 50, 90, -90), P(11, 0)],
    ],
  },
  E: { adv: 54, strokes: [[P(47, 100), P(11, 100), P(11, 0), P(47, 0)], [P(11, 52), P(40, 52)]] },
  F: { adv: 52, strokes: [[P(47, 100), P(11, 100), P(11, 0)], [P(11, 52), P(38, 52)]] },
  G: { adv: 64, strokes: [arc(31, 50, 24, 50, 52, 308), [P(33, 42), P(55, 42), P(55, 20)]] },
  H: { adv: 64, strokes: [[P(11, 0), P(11, 100)], [P(53, 0), P(53, 100)], [P(11, 52), P(53, 52)]] },
  I: { adv: 34, strokes: [[P(17, 0), P(17, 100)], [P(5, 100), P(29, 100)], [P(5, 0), P(29, 0)]] },
  J: { adv: 48, strokes: [[P(40, 100), P(40, 26), ...arc(26, 26, 14, 26, 0, -160)]] },
  K: { adv: 60, strokes: [[P(11, 0), P(11, 100)], [P(47, 100), P(13, 42)], [P(19, 50), P(48, 0)]] },
  L: { adv: 52, strokes: [[P(11, 100), P(11, 0), P(47, 0)]] },
  M: { adv: 76, strokes: [[P(8, 0), P(8, 100), P(38, 36), P(68, 100), P(68, 0)]] },
  N: { adv: 64, strokes: [[P(11, 0), P(11, 100), P(53, 0), P(53, 100)]] },
  O: { adv: 66, strokes: [ell(33, 50, 26, 50)] },
  P: { adv: 58, strokes: [[P(11, 0), P(11, 100)], [P(11, 100), P(30, 100), ...arc(30, 73, 16, 27, 90, -90), P(11, 46)]] },
  Q: { adv: 66, strokes: [ell(33, 50, 26, 50), [P(38, 24), P(56, -4)]] },
  R: {
    adv: 60, strokes: [
      [P(11, 0), P(11, 100)],
      [P(11, 100), P(30, 100), ...arc(30, 73, 16, 27, 90, -90), P(11, 46)],
      [P(28, 46), P(49, 0)],
    ],
  },
  S: {
    adv: 58, strokes: [
      [...arc(30, 73, 17, 25, 40, 270), ...arc(30, 24, 19, 24, 90, -130).slice(1)],
    ],
  },
  T: { adv: 60, strokes: [[P(5, 100), P(55, 100)], [P(30, 100), P(30, 0)]] },
  U: { adv: 64, strokes: [[P(11, 100), P(11, 30), ...arc(32, 30, 21, 30, 180, 360), P(53, 100)]] },
  V: { adv: 62, strokes: [[P(5, 100), P(31, 0), P(57, 100)]] },
  W: { adv: 72, strokes: [[P(4, 100), P(15, 0), P(32, 66), P(49, 0), P(60, 100)]] },
  X: { adv: 60, strokes: [[P(8, 100), P(52, 0)], [P(8, 0), P(52, 100)]] },
  Y: { adv: 60, strokes: [[P(6, 100), P(30, 50), P(54, 100)], [P(30, 50), P(30, 0)]] },
  Z: { adv: 58, strokes: [[P(8, 100), P(50, 100), P(8, 0), P(50, 0)]] },
  // ------------------------------------------------------------- lowercase
  a: { adv: 56, strokes: [ell(27, 33, 19, 33), [P(46, 66), P(46, 0)]] },
  b: { adv: 58, strokes: [[P(12, 100), P(12, 0)], ell(30, 33, 18, 33)] },
  c: { adv: 52, strokes: [arc(28, 33, 19, 33, 52, 308)] },
  d: { adv: 58, strokes: [ell(29, 33, 19, 33), [P(48, 100), P(48, 0)]] },
  e: { adv: 54, strokes: [[P(10, 40), P(48, 40)], [...arc(29, 33, 19, 33, 90, 300), ...arc(29, 33, 19, 33, 300, 395).slice(1)]] },
  f: { adv: 36, strokes: [[...arc(28, 88, 10, 12, 180, 60), P(24, 74), P(24, 0)], [P(10, 64), P(38, 64)]] },
  g: { adv: 58, strokes: [ell(29, 33, 19, 33), [P(48, 66), P(48, -6), ...arc(34, -6, 14, 20, 0, -170)]] },
  h: { adv: 58, strokes: [[P(12, 100), P(12, 0)], [P(12, 42), ...arc(29, 42, 17, 24, 180, 0), P(46, 0)]] },
  i: { adv: 26, strokes: [[P(13, 66), P(13, 0)]], dots: [P(13, 90)] },
  j: { adv: 30, strokes: [[P(22, 66), P(22, -8), ...arc(12, -8, 10, 18, 0, -160)]], dots: [P(22, 90)] },
  k: { adv: 54, strokes: [[P(12, 100), P(12, 0)], [P(44, 66), P(14, 26)], [P(20, 34), P(46, 0)]] },
  l: { adv: 26, strokes: [[P(13, 100), P(13, 0)]] },
  m: { adv: 84, strokes: [[P(8, 66), P(8, 0)], [P(8, 44), ...arc(24, 44, 16, 22, 180, 0), P(40, 0)], [P(40, 44), ...arc(56, 44, 16, 22, 180, 0), P(72, 0)]] },
  n: { adv: 58, strokes: [[P(12, 66), P(12, 0)], [P(12, 42), ...arc(29, 42, 17, 24, 180, 0), P(46, 0)]] },
  o: { adv: 58, strokes: [ell(29, 33, 20, 33)] },
  p: { adv: 58, strokes: [[P(12, 66), P(12, -30)], ell(30, 33, 18, 33)] },
  q: { adv: 58, strokes: [ell(29, 33, 19, 33), [P(48, 66), P(48, -30)]] },
  r: { adv: 40, strokes: [[P(12, 66), P(12, 0)], [P(12, 40), ...arc(26, 42, 14, 24, 180, 40)]] },
  s: { adv: 50, strokes: [[...arc(26, 49, 12, 17, 40, 270), ...arc(26, 16, 13, 16, 90, -130).slice(1)]] },
  t: { adv: 38, strokes: [[P(24, 92), P(24, 14), ...arc(32, 8, 8, 10, 200, 330)], [P(10, 64), P(40, 64)]] },
  u: { adv: 58, strokes: [[P(12, 66), P(12, 26), ...arc(29, 26, 17, 26, 180, 360), P(46, 66)], [P(46, 26), P(46, 0)]] },
  v: { adv: 54, strokes: [[P(8, 66), P(27, 0), P(46, 66)]] },
  w: { adv: 62, strokes: [[P(5, 66), P(14, 0), P(28, 44), P(42, 0), P(51, 66)]] },
  x: { adv: 52, strokes: [[P(10, 66), P(42, 0)], [P(10, 0), P(42, 66)]] },
  y: { adv: 54, strokes: [[P(8, 66), P(27, 6)], [P(46, 66), P(27, 6), ...arc(16, -12, 11, 16, 55, -140)]] },
  z: { adv: 50, strokes: [[P(10, 66), P(40, 66), P(10, 0), P(40, 0)]] },
  // ------------------------------------------------------------- digits
  '0': { adv: 60, strokes: [ell(30, 50, 22, 50)] },
  '1': { adv: 52, strokes: [[P(16, 82), P(31, 100), P(31, 0)], [P(15, 0), P(47, 0)]] },
  '2': { adv: 58, strokes: [[...arc(29, 71, 19, 27, 150, -60), P(10, 2), P(10, 0), P(49, 0)]] },
  '3': {
    adv: 56, strokes: [
      [P(12, 92), ...arc(27, 74, 16, 24, 120, -110), P(14, 50)],
      [P(14, 50), ...arc(28, 25, 18, 25, 130, -150)],
    ],
  },
  '4': { adv: 60, strokes: [[P(38, 0), P(38, 100), P(10, 30), P(54, 30)]] },
  '5': { adv: 56, strokes: [[P(46, 100), P(15, 100), P(13, 60), ...arc(28, 32, 18, 30, 130, -140)]] },
  '6': { adv: 58, strokes: [[...arc(35, 74, 13, 20, 10, 230), ...arc(29, 27, 19, 27, 90, 450)]] },
  '7': { adv: 56, strokes: [[P(8, 100), P(48, 100), P(24, 0)]] },
  '8': { adv: 58, strokes: [ell(29, 73, 16, 26), ell(29, 25, 19, 25)] },
  '9': { adv: 58, strokes: [ell(29, 72, 19, 27), [P(48, 74), P(46, 40), P(38, 10), P(24, 0)]] },
  // ------------------------------------------------------------- punctuation
  '.': { adv: 26, strokes: [], dots: [P(13, 4)] },
  ',': { adv: 26, strokes: [[P(16, 6), P(11, -12)]], dots: [P(14, 7)] },
  ':': { adv: 26, strokes: [], dots: [P(13, 62), P(13, 4)] },
  "'": { adv: 22, strokes: [[P(13, 100), P(10, 76)]] },
  '-': { adv: 40, strokes: [[P(8, 42), P(32, 42)]] },
  '—': { adv: 72, strokes: [[P(6, 42), P(66, 42)]] },
  '+': { adv: 52, strokes: [[P(26, 22), P(26, 78)], [P(6, 50), P(46, 50)]] },
  '$': {
    adv: 58, strokes: [
      [...arc(30, 73, 17, 25, 40, 270), ...arc(30, 24, 19, 24, 90, -130).slice(1)],
      [P(30, 112), P(30, -12)],
    ],
  },
  ' ': { adv: 30, strokes: [] },
};

export interface TextOpts {
  size: number;        // cap height in canvas pixels
  weight: number;      // stroke width in glyph units (100 = cap height)
  tracking?: number;   // extra advance, in glyph units
  condense?: number;   // horizontal scale factor (default 1)
}

/** Width of a string in canvas pixels. */
export function measure(text: string, o: TextOpts): number {
  const u = o.size / 100;
  const track = o.tracking ?? 0;
  const cond = o.condense ?? 1;
  let w = 0;
  for (const ch of text) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    w += (g.adv + track) * u * cond;
  }
  return w;
}

/**
 * Draw text with its baseline at (x, yBaseline) in canvas coords (y down).
 * Returns the x position after the last glyph.
 */
export function drawText(cv: Canvas, text: string, x: number, yBaseline: number, color: RGB, o: TextOpts, alpha = 1): number {
  const u = o.size / 100;
  const track = o.tracking ?? 0;
  const cond = o.condense ?? 1;
  const wpx = o.weight * u;
  let cx = x;
  for (const ch of text) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (const stroke of g.strokes) {
      const pts = stroke.map(([gx, gy]) => [cx + gx * u * cond, yBaseline - gy * u] as const);
      cv.stroke(pts, wpx, color, alpha);
    }
    if (g.dots) {
      for (const [gx, gy] of g.dots) {
        cv.ellipse(cx + gx * u * cond, yBaseline - gy * u, wpx * 0.62, wpx * 0.62, color, alpha);
      }
    }
    cx += (g.adv + track) * u * cond;
  }
  return cx;
}

/** Greedy word wrap: returns lines that fit maxWidth (canvas px). */
export function wrap(text: string, o: TextOpts, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const trial = cur ? cur + ' ' + word : word;
    if (measure(trial, o) <= maxWidth || !cur) cur = trial;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}
