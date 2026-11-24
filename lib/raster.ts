// Tiny software rasterizer: float RGB canvas, supersampled, with
// distance-based strokes, scanline polygons, gradients and additive glow.

export type RGB = [number, number, number];

export function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export class Canvas {
  readonly w: number;
  readonly h: number;
  readonly px: Float32Array; // RGB, 0..1

  constructor(w: number, h: number, bg: RGB) {
    this.w = w; this.h = h;
    this.px = new Float32Array(w * h * 3);
    for (let i = 0; i < w * h; i++) {
      this.px[i * 3] = bg[0]; this.px[i * 3 + 1] = bg[1]; this.px[i * 3 + 2] = bg[2];
    }
  }

  blend(x: number, y: number, c: RGB, a: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = (y * this.w + x) * 3;
    const ia = 1 - a;
    this.px[i] = this.px[i] * ia + c[0] * a;
    this.px[i + 1] = this.px[i + 1] * ia + c[1] * a;
    this.px[i + 2] = this.px[i + 2] * ia + c[2] * a;
  }

  add(x: number, y: number, c: RGB, a: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = (y * this.w + x) * 3;
    this.px[i] = Math.min(1, this.px[i] + c[0] * a);
    this.px[i + 1] = Math.min(1, this.px[i + 1] + c[1] * a);
    this.px[i + 2] = Math.min(1, this.px[i + 2] + c[2] * a);
  }

  /** Filled rectangle with optional vertical gradient (colour fn of y). */
  rect(x0: number, y0: number, x1: number, y1: number, c: RGB | ((y: number) => RGB), alpha = 1): void {
    const fn = typeof c === 'function' ? (c as (y: number) => RGB) : null;
    const solid = fn ? null : (c as RGB);
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(this.h, Math.ceil(y1)); y++) {
      const col = fn ? fn(y + 0.5) : (solid as RGB);
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(this.w, Math.ceil(x1)); x++) {
        const cov = Math.min(1, Math.min(x + 1, x1) - Math.max(x, x0)) *
          Math.min(1, Math.min(y + 1, y1) - Math.max(y, y0));
        this.blend(x, y, col, alpha * cov);
      }
    }
  }

  /** Filled polygon, scanline with fractional horizontal edge coverage. */
  poly(pts: ReadonlyArray<readonly [number, number]>, c: RGB, alpha = 1): void {
    if (pts.length < 3) return;
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    const yA = Math.max(0, Math.floor(minY)), yB = Math.min(this.h - 1, Math.ceil(maxY) - 1);
    const n = pts.length;
    for (let y = yA; y <= yB; y++) {
      const yc = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < n; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % n];
        if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) {
          xs.push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      if (xs.length < 2) continue;
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = xs[k], xb = xs[k + 1];
        for (let x = Math.max(0, Math.floor(xa)); x <= Math.min(this.w - 1, Math.ceil(xb) - 1); x++) {
          const cov = Math.min(x + 1, xb) - Math.max(x, xa);
          if (cov > 0) this.blend(x, y, c, alpha * Math.min(1, cov));
        }
      }
    }
  }

  /** Stroked polyline with round caps/joins, via segment distance fields. */
  stroke(pts: ReadonlyArray<readonly [number, number]>, width: number, c: RGB, alpha = 1): void {
    const r = width / 2;
    for (let s = 0; s + 1 < pts.length; s++) {
      const [x1, y1] = pts[s];
      const [x2, y2] = pts[s + 1];
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      const xA = Math.max(0, Math.floor(Math.min(x1, x2) - r - 1)), xB = Math.min(this.w - 1, Math.ceil(Math.max(x1, x2) + r + 1));
      const yA = Math.max(0, Math.floor(Math.min(y1, y2) - r - 1)), yB = Math.min(this.h - 1, Math.ceil(Math.max(y1, y2) + r + 1));
      for (let y = yA; y <= yB; y++) {
        for (let x = xA; x <= xB; x++) {
          const px = x + 0.5, py = y + 0.5;
          let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const ex = x1 + t * dx - px, ey = y1 + t * dy - py;
          const d = Math.sqrt(ex * ex + ey * ey);
          const cov = clamp01(r - d + 0.5);
          if (cov > 0) this.blend(x, y, c, alpha * cov);
        }
      }
    }
  }

  /** Filled circle/ellipse with soft edge. */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB, alpha = 1): void {
    const xA = Math.max(0, Math.floor(cx - rx - 1)), xB = Math.min(this.w - 1, Math.ceil(cx + rx + 1));
    const yA = Math.max(0, Math.floor(cy - ry - 1)), yB = Math.min(this.h - 1, Math.ceil(cy + ry + 1));
    for (let y = yA; y <= yB; y++) {
      for (let x = xA; x <= xB; x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        const cov = clamp01((1 - d) * Math.min(rx, ry) + 0.5);
        if (cov > 0) this.blend(x, y, c, alpha * cov);
      }
    }
  }

  /** Additive radial glow. */
  glow(cx: number, cy: number, radius: number, c: RGB, strength: number): void {
    const xA = Math.max(0, Math.floor(cx - radius)), xB = Math.min(this.w - 1, Math.ceil(cx + radius));
    const yA = Math.max(0, Math.floor(cy - radius)), yB = Math.min(this.h - 1, Math.ceil(cy + radius));
    for (let y = yA; y <= yB; y++) {
      for (let x = xA; x <= xB; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const d = Math.sqrt(dx * dx + dy * dy) / radius;
        if (d >= 1) continue;
        const fall = (1 - d) * (1 - d);
        this.add(x, y, c, strength * fall);
      }
    }
  }

  /** Downsample by an integer factor (box average) into a new canvas. */
  downsample(f: number): Canvas {
    const out = new Canvas(this.w / f, this.h / f, [0, 0, 0]);
    for (let y = 0; y < out.h; y++) {
      for (let x = 0; x < out.w; x++) {
        let r = 0, g = 0, b = 0;
        for (let dy = 0; dy < f; dy++) {
          for (let dx = 0; dx < f; dx++) {
            const i = ((y * f + dy) * this.w + x * f + dx) * 3;
            r += this.px[i]; g += this.px[i + 1]; b += this.px[i + 2];
          }
        }
        const o = (y * out.w + x) * 3, n = f * f;
        out.px[o] = r / n; out.px[o + 1] = g / n; out.px[o + 2] = b / n;
      }
    }
    return out;
  }

  toRgbBytes(): Uint8Array {
    const out = new Uint8Array(this.w * this.h * 3);
    for (let i = 0; i < this.w * this.h; i++) {
      out[i * 3] = Math.round(clamp01(this.px[i * 3]) * 255);
      out[i * 3 + 1] = Math.round(clamp01(this.px[i * 3 + 1]) * 255);
      out[i * 3 + 2] = Math.round(clamp01(this.px[i * 3 + 2]) * 255);
    }
    return out;
  }
}
