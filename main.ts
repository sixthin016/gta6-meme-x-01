// main.ts — GTA 6 jury duty summons meme generator for make.fun bounty gta6-meme-x-01.
//
// Node 22, standard library only. No network, no wall clock, no files
// outside the repository. Fully deterministic: two runs write the same bytes.
//
// The grader runs:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
// This program (a) draws the meme and writes meme.png into the
// output directory, and (b) copies POST.json there, which is what the gate
// reads. The post itself (its first picture on X + its text) is the entry:
// the house reads it from X and hands it to the AI judge. Nothing this
// program writes about the post is judged.
//
// v4 (22 Nov 2026) — "jury": Leonida Circuit Court jury duty summons,
// summoned 17 Sep 2013, trial date 26 May 2026, 13 years late, excused by
// my AI agent on make.fun. Panel winner over v3 (mean 84.0, h2h 3-0).

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32, fixed seed). Math.random is NOT
// deterministic across runs, so every speck of randomness comes from here.
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font. Each glyph is 7 rows of 5 bits, written as "0"/"1".
// Hand-drawn for this entry; only the characters the memes need are listed.
// ---------------------------------------------------------------------------
const FONT: Record<string, string> = {
  A: '01110/10001/10001/11111/10001/10001/10001',
  B: '11110/10001/10001/11110/10001/10001/11110',
  C: '01110/10001/10000/10000/10000/10001/01110',
  D: '11110/10001/10001/10001/10001/10001/11110',
  E: '11111/10000/10000/11110/10000/10000/11111',
  F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01110/10001/10000/10111/10001/10001/01111',
  H: '10001/10001/10001/11111/10001/10001/10001',
  I: '01110/00100/00100/00100/00100/00100/01110',
  J: '00111/00010/00010/00010/00010/10010/01100',
  K: '10001/10010/10100/11000/10100/10010/10001',
  L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001',
  N: '10001/11001/10101/10011/10001/10001/10001',
  O: '01110/10001/10001/10001/10001/10001/01110',
  P: '11110/10001/10001/11110/10000/10000/10000',
  Q: '01110/10001/10001/10001/10101/10010/01101',
  R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110',
  T: '11111/00100/00100/00100/00100/00100/00100',
  U: '10001/10001/10001/10001/10001/10001/01110',
  V: '10001/10001/10001/10001/10001/01010/00100',
  W: '10001/10001/10001/10101/10101/11011/10001',
  X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100',
  Z: '11111/00001/00010/00100/01000/10000/11111',
  '0': '01110/10001/10011/10101/11001/10001/01110',
  '1': '00100/01100/00100/00100/00100/00100/01110',
  '2': '01110/10001/00001/00110/01000/10000/11111',
  '3': '11111/00010/00100/00010/00001/10001/01110',
  '4': '00010/00110/01010/10010/11111/00010/00010',
  '5': '11111/10000/11110/00001/00001/10001/01110',
  '6': '00110/01000/10000/11110/10001/10001/01110',
  '7': '11111/00001/00010/00100/01000/01000/01000',
  '8': '01110/10001/10001/01110/10001/10001/01110',
  '9': '01110/10001/10001/01111/00001/00010/01100',
  ' ': '00000/00000/00000/00000/00000/00000/00000',
  '.': '00000/00000/00000/00000/00000/01100/01100',
  ':': '00000/01100/01100/00000/01100/01100/00000',
  $: '00100/01111/10100/01110/00101/11110/00100',
  '%': '11001/11010/00010/00100/01000/01011/10011',
  "'": '00100/00100/01000/00000/00000/00000/00000',
  '-': '00000/00000/00000/01110/00000/00000/00000',
  '!': '00100/00100/00100/00100/00100/00000/00100',
  '/': '00001/00010/00010/00100/01000/01000/10000',
  '(': '00010/00100/01000/01000/01000/00100/00010',
  ')': '01000/00100/00010/00010/00010/00100/01000',
};

type Color = [number, number, number]; // r, g, b — each 0..255

const WHITE: Color = [255, 255, 255];
const BLACK: Color = [0, 0, 0];
const MAGENTA: Color = [230, 0, 126]; // make.fun brand magenta
const NEON: Color = [255, 92, 225]; // neon sign pink

// ---------------------------------------------------------------------------
// Canvas: a plain RGBA buffer with a small set of drawing primitives.
// Everything here is written for this entry; no image library is used.
// ---------------------------------------------------------------------------
class Canvas {
  readonly w: number;
  readonly h: number;
  private readonly buf: Buffer;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 4);
  }

  pixel(x: number, y: number, c: Color, a: number): void {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return;
    const i = (yi * this.w + xi) * 4;
    const sa = a < 0 ? 0 : a > 1 ? 1 : a;
    const da = 1 - sa;
    this.buf[i] = Math.round(c[0] * sa + this.buf[i] * da);
    this.buf[i + 1] = Math.round(c[1] * sa + this.buf[i + 1] * da);
    this.buf[i + 2] = Math.round(c[2] * sa + this.buf[i + 2] * da);
    this.buf[i + 3] = 255;
  }

  rect(x: number, y: number, w: number, h: number, c: Color, a = 1): void {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.ceil(x + w));
    const y1 = Math.min(this.h, Math.ceil(y + h));
    const sa = a < 0 ? 0 : a > 1 ? 1 : a;
    const da = 1 - sa;
    for (let yy = y0; yy < y1; yy++) {
      let i = (yy * this.w + x0) * 4;
      for (let xx = x0; xx < x1; xx++) {
        this.buf[i] = Math.round(c[0] * sa + this.buf[i] * da);
        this.buf[i + 1] = Math.round(c[1] * sa + this.buf[i + 1] * da);
        this.buf[i + 2] = Math.round(c[2] * sa + this.buf[i + 2] * da);
        this.buf[i + 3] = 255;
        i += 4;
      }
    }
  }

  // Vertical gradient between stops: [position 0..1, color].
  vGradient(y0: number, y1: number, stops: Array<[number, Color]>): void {
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
      const t = (y - y0) / (y1 - y0);
      let c0 = stops[0][1];
      let c1 = stops[stops.length - 1][1];
      let tt = 0;
      for (let s = 0; s < stops.length - 1; s++) {
        if (t >= stops[s][0] && t <= stops[s + 1][0]) {
          c0 = stops[s][1];
          c1 = stops[s + 1][1];
          tt = (t - stops[s][0]) / (stops[s + 1][0] - stops[s][0]);
          break;
        }
      }
      const c: Color = [
        Math.round(c0[0] + (c1[0] - c0[0]) * tt),
        Math.round(c0[1] + (c1[1] - c0[1]) * tt),
        Math.round(c0[2] + (c1[2] - c0[2]) * tt),
      ];
      this.rect(0, y, this.w, 1, c);
    }
  }

  circle(cx: number, cy: number, r: number, c: Color, a = 1): void {
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r * r) this.pixel(x, y, c, a);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color, a = 1): void {
    const x0 = Math.max(0, Math.floor(cx - rx));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + rx));
    const y0 = Math.max(0, Math.floor(cy - ry));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + ry));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.pixel(x, y, c, a);
      }
    }
  }

  // Thick line: stamp circles along the segment.
  line(x0: number, y0: number, x1: number, y1: number, width: number, c: Color, a = 1): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(len));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.circle(x0 + dx * t, y0 + dy * t, width / 2, c, a);
    }
  }

  // Quadratic bezier, drawn as a thick line.
  curve(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, width: number, c: Color, a = 1): void {
    const steps = 24;
    let px = x0;
    let py = y0;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
      const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      this.line(px, py, x, y, width, c, a);
      px = x;
      py = y;
    }
  }

  // Even-odd scanline fill for a simple polygon.
  polygon(pts: Array<[number, number]>, c: Color, a = 1): void {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(this.h - 1, Math.ceil(maxY)); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        this.rect(xs[k], y, xs[k + 1] - xs[k], 1, c, a);
      }
    }
  }

  // Thick outline of a polygon (closed).
  strokePolygon(pts: Array<[number, number]>, width: number, c: Color, a = 1): void {
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      this.line(x0, y0, x1, y1, width, c, a);
    }
  }

  // Four-pointed sparkle (the make.fun ghost's eyes): 8 alternating points.
  sparkle(cx: number, cy: number, outer: number, inner: number, c: Color, a = 1): void {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const ang = (Math.PI / 4) * i - Math.PI / 2;
      pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
    }
    this.polygon(pts, c, a);
  }

  // Five-pointed star (the coin's star).
  star(cx: number, cy: number, outer: number, inner: number, c: Color, a = 1): void {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
    }
    this.polygon(pts, c, a);
  }

  textWidth(s: string, scale: number): number {
    return s.length * 6 * scale - scale;
  }

  // Draw one line of bitmap text. (x, y) is the top-left of the first glyph.
  drawText(s: string, x: number, y: number, scale: number, c: Color, outline?: { color: Color; width: number }): void {
    const glyphs = s.split('').map((ch) => FONT[ch] ?? FONT[' ']);
    const draw = (ox: number, oy: number, col: Color): void => {
      for (let gi = 0; gi < glyphs.length; gi++) {
        const rows = glyphs[gi].split('/');
        for (let r = 0; r < 7; r++) {
          const row = rows[r];
          for (let cc = 0; cc < 5; cc++) {
            if (row[cc] === '1') {
              this.rect(x + ox + (gi * 6 + cc) * scale, y + oy + r * scale, scale, scale, col);
            }
          }
        }
      }
    };
    if (outline) {
      const w = outline.width;
      for (const [dx, dy] of [[-w, 0], [w, 0], [0, -w], [0, w], [-w, -w], [w, -w], [-w, w], [w, w]] as const) {
        draw(dx, dy, outline.color);
      }
    }
    draw(0, 0, c);
  }

  drawTextCentered(s: string, cx: number, y: number, scale: number, c: Color, outline?: { color: Color; width: number }): void {
    this.drawText(s, cx - this.textWidth(s, scale) / 2, y, scale, c, outline);
  }

  // Neon glow text: several soft passes in the glow color, then a bright core.
  glowText(s: string, cx: number, y: number, scale: number, core: Color, glow: Color): void {
    const x = cx - this.textWidth(s, scale) / 2;
    for (const r of [10, 7, 4]) {
      for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r], [-r, -r], [r, -r], [-r, r], [r, r]] as const) {
        this.drawText(s, x + dx, y + dy, scale, glow);
      }
    }
    this.drawText(s, x, y, scale, core);
  }

  raw(): Buffer {
    return this.buf;
  }
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder: zlib deflate + IHDR/IDAT/IEND chunks with CRC32.
// ---------------------------------------------------------------------------
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 0);
  crc.copy(out, 8 + data.length);
  return out;
}

function encodePng(c: Canvas): Buffer {
  const raw = Buffer.alloc((c.w * 4 + 1) * c.h);
  const src = c.raw();
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w * 4 + 1)] = 0; // filter: none
    src.copy(raw, y * (c.w * 4 + 1) + 1, y * c.w * 4, (y + 1) * c.w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// The make.fun ghost, drawn from the press-kit's description: a white ghost
// with a thick black outline, two black four-pointed sparkle eyes and a round
// little hand, holding a magenta coin with a white star.
// (cx, topY): centre x and top of the dome. r: dome radius (body width 2r).
// ---------------------------------------------------------------------------
function ghostPoints(cx: number, topY: number, r: number, hemY: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const cy = topY + r;
  // Dome over the top: screen y grows downward, so the arc subtracts sin.
  for (let deg = 180; deg >= 0; deg -= 6) {
    const a = (deg * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]);
  }
  // Right side down to the hem.
  pts.push([cx + r, hemY]);
  // Hem: three scallops bulging downward, right to left.
  const scallops = 3;
  const sw = (2 * r) / scallops;
  for (let s = 0; s < scallops; s++) {
    const ccx = cx + r - (s + 0.5) * sw;
    for (let deg = 0; deg <= 180; deg += 12) {
      const a = (deg * Math.PI) / 180;
      pts.push([ccx + (sw / 2) * Math.cos(a), hemY + (sw / 2) * Math.sin(a)]);
    }
  }
  pts.push([cx - r, hemY]);
  return pts;
}

function drawGhost(c: Canvas, cx: number, topY: number, r: number, hemY: number, opts: { coin?: boolean; celebrate?: boolean } = {}): void {
  const { coin = true, celebrate = false } = opts;
  const pts = ghostPoints(cx, topY, r, hemY);
  c.polygon(pts, WHITE);
  c.strokePolygon(pts, Math.max(6, Math.round(r / 14)), BLACK);
  // Sparkle eyes (the ghost's normal eyes, not dizzy).
  const eyeY = topY + r * 0.95;
  const eyeDX = r * 0.38;
  c.sparkle(cx - eyeDX, eyeY, r * 0.19, r * 0.07, BLACK);
  c.sparkle(cx + eyeDX, eyeY, r * 0.19, r * 0.07, BLACK);
  if (celebrate) {
    // Happy smile + both little hands raised in celebration.
    c.curve(cx - r * 0.26, topY + r * 1.32, cx, topY + r * 1.55, cx + r * 0.26, topY + r * 1.32, Math.max(5, Math.round(r / 18)), BLACK);
    for (const side of [-1, 1] as const) {
      const hx = cx + side * r * 1.04;
      const hy = topY + r * 0.92;
      c.circle(hx, hy, r * 0.14, WHITE);
      for (let deg = 0; deg < 360; deg += 15) {
        const a = (deg * Math.PI) / 180;
        c.circle(hx + (r * 0.14) * Math.cos(a), hy + (r * 0.14) * Math.sin(a), Math.max(2, r * 0.02), BLACK);
      }
    }
    return;
  }
  // Little hand on the right side, holding the coin.
  const hx = cx + r * 0.98;
  const hy = topY + r * 1.75;
  c.circle(hx, hy, r * 0.14, WHITE);
  // Hand outline: ring of black dots around the hand.
  for (let deg = 0; deg < 360; deg += 15) {
    const a = (deg * Math.PI) / 180;
    c.circle(hx + (r * 0.14) * Math.cos(a), hy + (r * 0.14) * Math.sin(a), Math.max(2, r * 0.02), BLACK);
  }
  if (!coin) return;
  // Magenta coin with a white star, held up by the hand.
  const coinX = hx + r * 0.22;
  const coinY = hy - r * 0.12;
  c.circle(coinX, coinY, r * 0.24, MAGENTA);
  for (let deg = 0; deg < 360; deg += 12) {
    const a = (deg * Math.PI) / 180;
    c.circle(coinX + (r * 0.24) * Math.cos(a), coinY + (r * 0.24) * Math.sin(a), Math.max(2, r * 0.02), BLACK);
  }
  c.star(coinX, coinY, r * 0.17, r * 0.075, WHITE);
}

// A generic grey GTA player, slumped flat on the ground: the one who got
// WASTED. Drawn lying on his back, head to the left, one arm flopped out.
function drawSlumpedPlayer(c: Canvas, x: number, y: number): void {
  const GREY: Color = [128, 128, 136];
  const DARK: Color = [52, 52, 60];
  // Legs, stretched out to the right, parallel.
  c.line(x + 175, y + 12, x + 268, y + 20, 22, GREY);
  c.line(x + 175, y + 34, x + 268, y + 42, 22, GREY);
  // Torso: a horizontal capsule.
  c.ellipse(x + 120, y + 22, 78, 30, GREY);
  // Head, tipped back.
  c.circle(x + 28, y + 8, 26, GREY);
  // One arm flopped out on the ground beside the head.
  c.line(x + 55, y + 32, x + 8, y + 52, 14, GREY);
  // The other arm across the chest.
  c.line(x + 105, y + 8, x + 150, y + 30, 14, GREY);
  // Closed "X" eyes on the head, so he reads as knocked out.
  c.line(x + 16, y - 2, x + 28, y + 10, 4, DARK);
  c.line(x + 28, y - 2, x + 16, y + 10, 4, DARK);
}

// A simple dark sports car silhouette on the road, with a hint of neon
// underglow — the GTA vehicle in the foreground. v3: drawn ~1.5x larger
// so it reads as a sports car (not a blob) at the 480px judge size.
function drawSportsCar(c: Canvas, x: number, y: number, s = 1): void {
  const BODY: Color = [22, 22, 38];
  // Neon underglow first, so the body sits on top of it.
  c.ellipse(x + 135 * s, y + 82 * s, 135 * s, 9 * s, NEON, 0.55);
  // Wheels.
  c.circle(x + 55 * s, y + 72 * s, 19 * s, BLACK);
  c.circle(x + 55 * s, y + 72 * s, 8 * s, [70, 70, 82]);
  c.circle(x + 220 * s, y + 72 * s, 19 * s, BLACK);
  c.circle(x + 220 * s, y + 72 * s, 8 * s, [70, 70, 82]);
  // Low wedge body with a cabin.
  c.polygon(
    [
      [x, y + 72 * s],
      [x + 10 * s, y + 38 * s],
      [x + 62 * s, y + 30 * s],
      [x + 92 * s, y + 4 * s],
      [x + 178 * s, y + 4 * s],
      [x + 205 * s, y + 30 * s],
      [x + 262 * s, y + 38 * s],
      [x + 272 * s, y + 72 * s],
    ],
    BODY,
  );
  // Cabin glass.
  c.polygon(
    [
      [x + 100 * s, y + 12 * s],
      [x + 172 * s, y + 12 * s],
      [x + 192 * s, y + 30 * s],
      [x + 82 * s, y + 30 * s],
    ],
    [96, 150, 185],
  );
  // Headlight slash (front, right) + taillight slash (rear, left).
  c.line(x + 252 * s, y + 44 * s, x + 268 * s, y + 46 * s, 5 * s, [255, 240, 160]);
  c.line(x + 4 * s, y + 46 * s, x + 18 * s, y + 44 * s, 5 * s, [255, 60, 80]);
}

// ---------------------------------------------------------------------------
// Vice City backdrop: sunset sky, sun, skyline with lit windows, palms, road.
// Shared by both variants so the setting reads "GTA VI / Vice City" at once.
// ---------------------------------------------------------------------------
const SKY: Array<[number, Color]> = [
  [0, [26, 11, 46]],
  [0.42, [107, 45, 122]],
  [0.6, [232, 93, 138]],
  [0.72, [255, 158, 87]],
  [1, [255, 196, 107]],
];

function drawSky(c: Canvas, horizonY: number, rng: () => number): void {
  c.vGradient(0, horizonY, SKY);
  // Stars in the upper sky.
  for (let i = 0; i < 130; i++) {
    const x = rng() * c.w;
    const y = rng() * horizonY * 0.42;
    const s = rng();
    c.circle(x, y, s < 0.8 ? 1 : 2, WHITE, 0.25 + rng() * 0.55);
  }
  // A pale moon high in the upper sky (the low sun was always hidden
  // behind the skyline, so the sky gets its light up here instead).
  const moonX = 850;
  const moonY = 285;
  c.circle(moonX, moonY, 120, [255, 239, 192], 0.06);
  c.circle(moonX, moonY, 92, [255, 239, 192], 0.1);
  c.circle(moonX, moonY, 64, [255, 243, 207]);
  c.circle(moonX - 20, moonY - 12, 12, [235, 220, 180], 0.6);
  c.circle(moonX + 16, moonY + 18, 8, [235, 220, 180], 0.6);
}

interface Building {
  x: number;
  w: number;
  top: number;
  color: Color;
}

function drawSkyline(c: Canvas, horizonY: number, rng: () => number): Building[] {
  const buildings: Building[] = [];
  let x = -20;
  while (x < c.w) {
    const w = 90 + rng() * 130;
    const h = 90 + rng() * 170;
    const shade = rng();
    const color: Color = shade < 0.5 ? [34, 16, 63] : [26, 12, 51];
    buildings.push({ x, w, top: horizonY - h, color });
    x += w + 8 + rng() * 20;
  }
  for (const b of buildings) {
    c.rect(b.x, b.top, b.w, horizonY - b.top + 20, b.color);
    // Lit windows.
    const cols = Math.floor(b.w / 22);
    const rows = Math.floor((horizonY - b.top) / 26);
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        if (rng() < 0.26) {
          c.rect(b.x + 8 + cx * 22, b.top + 10 + cy * 26, 8, 11, [255, 215, 106], 0.85);
        }
      }
    }
  }
  return buildings;
}

function drawPalm(c: Canvas, baseX: number, baseY: number, lean: number, h: number): void {
  const crownX = baseX + lean;
  const crownY = baseY - h;
  const col: Color = [20, 9, 42];
  // Leaning trunk.
  c.curve(baseX, baseY, baseX + lean * 0.3, baseY - h * 0.55, crownX, crownY, 15, col);
  // Fronds drooping from the crown.
  const fronds: Array<[number, number, number, number]> = [
    [-150, -30, -260, 60],
    [-110, -70, -210, -30],
    [-40, -95, -90, -190],
    [40, -95, 90, -190],
    [110, -70, 210, -30],
    [150, -30, 260, 60],
  ];
  for (const [dx1, dy1, dx2, dy2] of fronds) {
    c.curve(crownX, crownY, crownX + dx1, crownY + dy1, crownX + dx2, crownY + dy2, 9, col);
  }
}

function drawRoad(c: Canvas, horizonY: number): void {
  c.rect(0, horizonY, c.w, c.h - horizonY, [20, 16, 29]);
  // Wet reflections: sun streak and neon streak.
  c.rect(c.w / 2 - 60, horizonY, 120, c.h - horizonY, [255, 158, 87], 0.1);
  c.rect(c.w / 2 + 170, horizonY, 80, c.h - horizonY, NEON, 0.08);
  // Dashed centre line.
  for (let x = 40; x < c.w; x += 130) {
    c.rect(x, horizonY + 165, 70, 10, [232, 212, 77], 0.55);
  }
}

function drawVignette(c: Canvas): void {
  for (let k = 0; k < 12; k++) {
    const inset = k * 12;
    const a = 0.022;
    c.rect(inset, inset, c.w - inset * 2, 12, BLACK, a);
    c.rect(inset, c.h - inset - 12, c.w - inset * 2, 12, BLACK, a);
    c.rect(inset, inset, 12, c.h - inset * 2, BLACK, a);
    c.rect(c.w - inset - 12, inset, 12, c.h - inset * 2, BLACK, a);
  }
}

// V4 jury — Leonida Circuit Court jury duty summons, 13 years late.
function renderVariant(): Canvas {
  const c = new Canvas(1080, 1080);
  const rng = mulberry32(20261126);
  const horizonY = 780;

  drawSky(c, horizonY, rng);
  drawSkyline(c, horizonY, rng);
  drawRoad(c, horizonY);
  drawPalm(c, 110, 1080, -30, 380);
  drawPalm(c, 990, 1080, 25, 350);

  // Summons paper.
  const px = 90;
  const py = 60;
  const pw = 900;
  const ph = 960;
  c.rect(px, py, pw, ph, [248, 244, 230]);
  c.rect(px, py, pw, 8, [30, 20, 10]);
  c.rect(px, py + ph - 8, pw, 8, [30, 20, 10]);
  c.rect(px, py, 8, ph, [30, 20, 10]);
  c.rect(px + pw - 8, py, 8, ph, [30, 20, 10]);
  c.rect(px + 18, py + 18, pw - 36, ph - 36, [248, 244, 230]);
  c.rect(px + 18, py + 18, pw - 36, 3, [30, 20, 10]);
  c.rect(px + 18, py + ph - 21, pw - 36, 3, [30, 20, 10]);
  c.rect(px + 18, py + 18, 3, ph - 36, [30, 20, 10]);
  c.rect(px + pw - 21, py + 18, 3, ph - 36, [30, 20, 10]);

  const INK: Color = [30, 20, 10];
  c.drawTextCentered('STATE OF LEONIDA', 540, 90, 5, INK);
  c.drawTextCentered('CIRCUIT COURT', 540, 140, 4, INK);

  c.drawTextCentered('JURY DUTY', 540, 190, 9, INK);
  c.drawTextCentered('SUMMONS', 540, 265, 9, INK);

  c.rect(190, 348, 700, 4, INK);

  c.drawTextCentered('SUMMONED: 17 SEP 2013', 540, 380, 4, INK);
  c.drawTextCentered('TRIAL DATE: 26 MAY 2026', 540, 440, 4, INK);
  c.drawTextCentered('13 YEARS LATE', 540, 510, 7, MAGENTA);
  c.drawTextCentered('EXCUSED BY: MY AI AGENT', 540, 600, 4, INK);
  c.drawTextCentered('ON MAKE.FUN', 540, 660, 6, MAGENTA);

  // Judge's gavel, bottom-left.
  const WOOD: Color = [122, 72, 28];
  const WOOD2: Color = [92, 52, 20];
  c.polygon([[150, 770], [280, 740], [295, 790], [165, 820]], WOOD);
  c.rect(150, 770, 130, 10, WOOD2);
  c.line(215, 795, 310, 900, 14, WOOD2);
  c.rect(270, 905, 110, 16, WOOD);
  // Sound block under the gavel handle.
  c.rect(255, 905, 140, 16, WOOD2);

  // The make.fun ghost as the bailiff, bottom-right, coin in hand.
  c.ellipse(850, 1006, 90, 14, BLACK, 0.3);
  drawGhost(c, 850, 760, 70, 990, { coin: true });

  c.drawText('BRING THIS NOTICE', 200, 972, 3, INK);

  drawVignette(c);
  return c;
}

// ---------------------------------------------------------------------------
// Entry point: draw the meme into the output directory, then copy POST.json
// there — the copy is the one thing the gate reads. Prints nothing on success.
// ---------------------------------------------------------------------------
const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const canvas = renderVariant();
mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, 'meme.png'), encodePng(canvas));
try {
  copyFileSync(join(BOT_DIR, 'POST.json'), join(OUTPUT_DIR, 'POST.json'));
} catch (err) {
  console.error(`POST.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}
