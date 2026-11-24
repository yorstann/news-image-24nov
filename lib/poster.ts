// Poster composition: "THE WORLD TODAY — Tuesday 24 November 2026".
// All layout numbers are in 1024-space and scaled by S (supersampling).
import { Canvas, hex, mix, mulberry32 } from './raster.ts';
import type { RGB } from './raster.ts';
import { drawText, measure, wrap } from './font.ts';
import type { TextOpts } from './font.ts';

const INK = hex('#0d1420');
const INK_TOP = hex('#111c2e');
const INK_BOT = hex('#090e17');
const CREAM = hex('#f2ede3');
const ORANGE = hex('#ff7a1a');
const CYAN = hex('#7fd4e6');
const RED = hex('#e5484d');
const DIM = hex('#8fa3b5');
const FAINT = hex('#5b7186');
const RULE = hex('#33465e');
const CARD = mix(INK, CREAM, 0.05); // tile card fill: a subtle lift off the background

const M = 54;            // margin
const W = 1024;
const RIGHT = W - M;     // 970
const CW = RIGHT - M;    // 916

export function renderPoster(S: number): Canvas {
  const cv = new Canvas(W * S, W * S, INK);
  const X = (v: number) => v * S;
  const rnd = mulberry32(20261124);

  // ---- background: gentle vertical gradient
  cv.rect(0, 0, X(W), X(W), (y) => mix(INK_TOP, INK_BOT, y / X(W)));

  // ============================================================ masthead
  cv.rect(X(M), X(46), X(M + 15), X(61), ORANGE);
  drawText(cv, 'THE WORLD TODAY', X(M + 28), X(106), CREAM, { size: X(57), weight: 17, tracking: 3 });
  const dateOpts: TextOpts = { size: X(20), weight: 14.5, tracking: 2 };
  drawText(cv, 'TUESDAY 24 NOVEMBER 2026', RIGHT * S - measure('TUESDAY 24 NOVEMBER 2026', dateOpts), X(82), CREAM, dateOpts);
  const tagOpts: TextOpts = { size: X(15), weight: 12, tracking: 2.5 };
  drawText(cv, 'ONE IMAGE, THE WHOLE DAY', RIGHT * S - measure('ONE IMAGE, THE WHOLE DAY', tagOpts), X(108), CYAN, tagOpts);
  cv.rect(X(M), X(124), X(RIGHT), X(126.5), RULE);
  cv.rect(X(M), X(123.5), X(M + 150), X(127), ORANGE);

  // ============================================================ kicker + headline
  drawText(cv, 'CLIMATE SUMMIT — ANTALYA', X(M), X(160), ORANGE, { size: X(26), weight: 15, tracking: 6 });
  const headOpts: TextOpts = { size: X(130), weight: 18.5, tracking: 1 };
  drawText(cv, 'COP31 TALKS', X(M - 3), X(310), CREAM, headOpts);
  drawText(cv, 'COLLAPSE', X(M - 3), X(466), CREAM, headOpts);

  // ---- deck
  const deckOpts: TextOpts = { size: X(22.5), weight: 10.5, tracking: 0.2 };
  const deck = 'Fifty hours of overtime produced no deal: more than ninety nations rejected the draft, and fossil fuels went unmentioned.';
  const deckLines = wrap(deck, deckOpts, X(CW));
  deckLines.forEach((line, i) => {
    drawText(cv, line, X(M), X(510 + i * 31), mix(CREAM, INK, 0.12), deckOpts);
  });

  // ============================================================ central visual
  const px0 = M, px1 = RIGHT, py0 = 556, py1 = 736;
  const horizon = py0 + (py1 - py0) * 0.58;
  // sky
  cv.rect(X(px0), X(py0), X(px1), X(horizon), (y) => mix(hex('#1a2f47'), hex('#0f1e30'), (y / S - py0) / (horizon - py0)));
  // sun glow + sun (low, behind the bergs, centred on the crack)
  const sunX = 512, sunY = horizon - 4, sunR = 92;
  cv.glow(X(sunX), X(sunY), X(210), ORANGE, 0.34);
  cv.ellipse(X(sunX), X(sunY), X(sunR), X(sunR), mix(ORANGE, hex('#ffb066'), 0.25));
  cv.ellipse(X(sunX), X(sunY), X(sunR * 0.72), X(sunR * 0.72), mix(ORANGE, hex('#ffd9a0'), 0.45));
  // distant berg silhouettes
  cv.poly([[X(70), X(horizon)], [X(120), X(horizon - 26)], [X(168), X(horizon)]], hex('#27455e'));
  cv.poly([[X(856), X(horizon)], [X(906), X(horizon - 20)], [X(954), X(horizon)]], hex('#27455e'));

  // sea
  cv.rect(X(px0), X(horizon), X(px1), X(py1), (y) => mix(hex('#0d1d2e'), hex('#081220'), (y / S - horizon) / (py1 - horizon)));

  const ICE_LIT = hex('#e9f8fc');
  const ICE_MID = hex('#a9dcea');
  const ICE_SHD = hex('#6fa8bf');
  const ICE_DEEP = hex('#41748e');
  const ICE_SUB = hex('#175d75');

  // ---- left berg (above water), facets
  const leftBerg: Array<[Array<[number, number]>, RGB]> = [
    [[[150, horizon], [196, horizon - 96], [262, horizon - 118], [300, horizon]], ICE_MID],
    [[[196, horizon - 96], [262, horizon - 118], [252, horizon - 40], [214, horizon - 30]], ICE_LIT],
    [[[252, horizon - 40], [262, horizon - 118], [300, horizon], [268, horizon - 6]], ICE_SHD],
    [[[150, horizon], [214, horizon - 30], [268, horizon - 6], [238, horizon], [186, horizon]], ICE_DEEP],
    [[[300, horizon], [338, horizon - 76], [392, horizon - 84], [430, horizon]], ICE_MID],
    [[[338, horizon - 76], [392, horizon - 84], [398, horizon - 34], [356, horizon - 22]], ICE_LIT],
    [[[356, horizon - 22], [398, horizon - 34], [430, horizon], [388, horizon]], ICE_SHD],
  ];
  // ---- right berg (mirror-ish, its own facet rhythm)
  const rightBerg: Array<[Array<[number, number]>, RGB]> = [
    [[[594, horizon], [632, horizon - 80], [686, horizon - 86], [724, horizon]], ICE_MID],
    [[[632, horizon - 80], [686, horizon - 86], [676, horizon - 36], [640, horizon - 26]], ICE_MID],
    [[[676, horizon - 36], [686, horizon - 86], [724, horizon], [690, horizon - 4]], ICE_SHD],
    [[[724, horizon], [762, horizon - 108], [828, horizon - 122], [874, horizon]], ICE_MID],
    [[[762, horizon - 108], [828, horizon - 122], [820, horizon - 44], [778, horizon - 30]], ICE_LIT],
    [[[778, horizon - 30], [820, horizon - 44], [874, horizon], [806, horizon]], ICE_DEEP],
    [[[594, horizon], [640, horizon - 26], [690, horizon - 4], [660, horizon]], ICE_DEEP],
  ];
  // submerged bodies (drawn on the sea, translucent)
  for (const [pts, _c] of [...leftBerg, ...rightBerg]) {
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const sub = pts.map(([x, y]) => [x + (x - cx) * 0.10, horizon + (horizon - y) * 0.52] as [number, number]);
    cv.poly(sub.map(([x, y]) => [X(x), X(y)] as const), ICE_SUB, 0.5);
  }
  for (const [pts, c] of [...leftBerg, ...rightBerg]) {
    cv.poly(pts.map(([x, y]) => [X(x), X(y)] as const), c);
  }
  // facet edge lines
  cv.stroke([[X(196), X(horizon - 96)], [X(252), X(horizon - 40)], [X(268), X(horizon - 6)]], X(1.6), CREAM, 0.28);
  cv.stroke([[X(338), X(horizon - 76)], [X(398), X(horizon - 34)]], X(1.6), CREAM, 0.22);
  cv.stroke([[X(632), X(horizon - 80)], [X(676), X(horizon - 36)]], X(1.6), CREAM, 0.25);
  cv.stroke([[X(762), X(horizon - 108)], [X(820), X(horizon - 44)], [X(806), X(horizon)]], X(1.6), CREAM, 0.22);

  // ---- the crack: glowing split between the bergs, sun shining through
  const crack: Array<[number, number]> = [
    [486, horizon - 118], [498, horizon - 84], [488, horizon - 52], [502, horizon - 22], [496, horizon + 6],
    [508, horizon + 40], [516, horizon + 64], [520, py1],
  ];
  const crackL = crack.map(([x, y]) => [x - 13 - (y - (horizon - 118)) * 0.03, y] as [number, number]);
  const crackR = crack.map(([x, y]) => [x + 13 + (y - (horizon - 118)) * 0.03, y] as [number, number]);
  const crackPoly = [...crackL, ...crackR.reverse()];
  cv.poly(crackPoly.map(([x, y]) => [X(x), X(y)] as const), mix(ORANGE, hex('#ffc98a'), 0.35), 0.92);
  cv.glow(X(512), X(horizon + 4), X(62), ORANGE, 0.22);
  cv.stroke(crack.map(([x, y]) => [X(x), X(y)] as const), X(3.2), hex('#ffe9c4'), 0.95);

  // ---- sea shimmer: sun/crack reflection + sparse sparkle
  for (let i = 0; i < 26; i++) {
    const t = i / 26;
    const y = horizon + 8 + t * (py1 - horizon - 16);
    const wdt = 14 + rnd() * 74 * (0.4 + t);
    const cx = 512 + (rnd() - 0.5) * (26 + t * 90);
    cv.rect(X(cx - wdt / 2), X(y), X(cx + wdt / 2), X(y + 2.2), ORANGE, 0.34 * (1 - t * 0.72));
  }
  for (let i = 0; i < 34; i++) {
    const x = px0 + 14 + rnd() * (CW - 28);
    const y = horizon + 6 + rnd() * (py1 - horizon - 12);
    cv.rect(X(x), X(y), X(x + 5 + rnd() * 12), X(y + 1.6), CYAN, 0.16 + rnd() * 0.14);
  }
  // panel frame
  cv.stroke(
    [[X(px0), X(py0)], [X(px1), X(py0)], [X(px1), X(py1)], [X(px0), X(py1)], [X(px0), X(py0)]],
    X(1.6), CYAN, 0.4,
  );

  // ============================================================ numbers row
  const nums: Array<[string, string]> = [
    ['50H', 'OF OVERTIME TALKS'],
    ['90+', 'NATIONS REJECT THE TEXT'],
    ['0', 'MENTIONS OF FOSSIL FUELS'],
  ];
  const colW = CW / 3;
  nums.forEach(([val, label], i) => {
    const cx = M + colW * i + colW / 2;
    const vOpts: TextOpts = { size: X(46), weight: 17, tracking: 1 };
    drawText(cv, val, X(cx) - measure(val, vOpts) / 2, X(788), i === 2 ? ORANGE : CREAM, vOpts);
    const lOpts: TextOpts = { size: X(14.5), weight: 11.5, tracking: 2 };
    drawText(cv, label, X(cx) - measure(label, lOpts) / 2, X(814), DIM, lOpts);
    if (i > 0) cv.rect(X(M + colW * i), X(748), X(M + colW * i + 1.6), X(814), RULE);
  });

  // ============================================================ story tiles
  const tiles: Array<[string, string, RGB]> = [
    ['LIBYA', 'Ukraine sinks Russian corvette at Benghazi', RED],
    ['IRAN', "Trump warns Tehran of a 'traumatic' outcome", RED],
    ['SAUDI ARABIA', "Houthi strike hits Riyadh's tallest tower again", RED],
    ['EUROPE', 'Russia warns Estonia its moves risk open war', RED],
    ['TECH', 'Nvidia chief back in post after Trump steps in', CYAN],
    ['IN FIGURES', '700,000 — leaked estimate of Russian military deaths', ORANGE],
  ];
  const gap = 22;
  const tileW = (CW - gap * 2) / 3;
  const tileTop = 830;
  const rowH = 72;
  const cardH = 64;
  const pad = 11;
  tiles.forEach(([tag, head, accent], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = M + col * (tileW + gap);
    const top = tileTop + row * rowH;
    // card: subtle lifted panel, thin accent rule across its top edge
    cv.rect(X(x), X(top), X(x + tileW), X(top + cardH), CARD);
    cv.rect(X(x), X(top), X(x + tileW), X(top + 3), accent);
    drawText(cv, tag, X(x + pad), X(top + 21), accent, { size: X(13.5), weight: 14, tracking: 2.2 });
    const hOpts: TextOpts = { size: X(15), weight: 11.5, tracking: 0.1 };
    const lines = wrap(head, hOpts, X(tileW - pad * 2));
    lines.slice(0, 2).forEach((line, li) => {
      drawText(cv, line, X(x + pad), X(top + 40 + li * 19), CREAM, hOpts);
    });
  });

  // ============================================================ ticker + footer
  const tickY = tileTop + rowH * 2 + 16; // text baseline 994, rule at 974
  cv.rect(X(M), X(tickY - 16), X(RIGHT), X(tickY - 14.6), RULE);
  const tickA: TextOpts = { size: X(13.5), weight: 15, tracking: 1.2, condense: 0.92 };
  const tickB: TextOpts = { size: X(13.5), weight: 11, tracking: 1.2, condense: 0.92 };
  const after = drawText(cv, 'ALSO TODAY: ', X(M), X(tickY + 4), ORANGE, tickA);
  drawText(cv, 'TRUMP SEALS INDONESIA TRADE DEAL — EU THREATENS $84B IN TARIFFS — SENEGAL RESTORED AS AFRICAN CHAMPIONS', after, X(tickY + 4), CREAM, tickB);
  const footOpts: TextOpts = { size: X(10.5), weight: 10.5, tracking: 3 };
  const foot = "DRAWN BY AN AI AGENT FROM THE DAY'S WIRES";
  drawText(cv, foot, (W * S - measure(foot, footOpts)) / 2, X(1014), FAINT, footOpts);

  return cv;
}
