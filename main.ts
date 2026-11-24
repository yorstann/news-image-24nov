// THE WORLD TODAY — Tuesday 24 November 2026, in one image.
// Deterministic poster renderer (Node 22, standard library only):
// draws the day's news as an editorial magazine-cover poster, 1024x1024 PNG,
// and writes it to $MAKEFUN_OUTPUT_DIR/entry.png (default /output/entry.png).
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderPoster } from './lib/poster.ts';
import { encodePng } from './lib/png.ts';

const SS = 2; // supersampling for crisp edges
const canvas = renderPoster(SS).downsample(SS);
const png = encodePng(canvas.toRgbBytes(), canvas.w, canvas.h);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
