// Generates the PWA icon set into public/.
//
// Hand-rolled PNG encoder (zlib is the only dependency) so the repo doesn't
// pull in sharp/canvas just to draw a crescent. Run with `npm run icons`.
//
// Design: parchment crescent on the accent green from src/theme/colors.ts.
// Green-on-light reads better against the pale home screens most phones ship
// with than the app's own parchment background would.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public');

const GREEN = [0x2d, 0x6a, 0x4f]; // light.accent
const PARCHMENT = [0xf5, 0xea, 0xc7]; // light.bg

// ---------------------------------------------------------------- PNG encoder

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4 + 1; // +1 filter byte per scanline
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------- drawing

// Crescent = big circle minus a smaller circle nudged to the right, so the
// horns open rightward (the usual orientation). Geometry is expressed as
// multiples of the outer radius R so it scales cleanly to any icon size.
const CUTOUT_RADIUS = 0.88; // × R
const CUTOUT_OFFSET = 0.36; // × R, along +x

const SS = 4; // supersample factor per axis — 16 samples/pixel

function drawIcon(size, crescentScale) {
  const rgba = Buffer.alloc(size * size * 4);

  const R = (crescentScale * size) / 2;
  const cx = size / 2 - 0.04 * R; // nudge left so the mass looks centred
  const cy = size / 2;
  const r2 = CUTOUT_RADIUS * R;
  const cx2 = cx + CUTOUT_OFFSET * R;

  const rSq = R * R;
  const r2Sq = r2 * r2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          const dx = px - cx;
          const dy = py - cy;
          if (dx * dx + dy * dy > rSq) continue;
          const dx2 = px - cx2;
          if (dx2 * dx2 + dy * dy < r2Sq) continue;
          hits++;
        }
      }

      const a = hits / (SS * SS);
      const i = (y * size + x) * 4;
      // Composite the crescent over the green field, opaque everywhere.
      rgba[i] = Math.round(GREEN[0] + (PARCHMENT[0] - GREEN[0]) * a);
      rgba[i + 1] = Math.round(GREEN[1] + (PARCHMENT[1] - GREEN[1]) * a);
      rgba[i + 2] = Math.round(GREEN[2] + (PARCHMENT[2] - GREEN[2]) * a);
      rgba[i + 3] = 0xff;
    }
  }

  return encodePng(size, rgba);
}

// ---------------------------------------------------------------------- main

// Maskable icons get cropped to the inner 80% circle by Android, so the art
// has to sit well inside that safe zone.
const TARGETS = [
  { file: 'icon-192.png', size: 192, scale: 0.8 },
  { file: 'icon-512.png', size: 512, scale: 0.8 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.56 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.8 },
  { file: 'favicon.png', size: 48, scale: 0.88 },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const { file, size, scale } of TARGETS) {
  const png = drawIcon(size, scale);
  writeFileSync(join(OUT_DIR, file), png);
  console.info(`${file}  ${size}×${size}  ${(png.length / 1024).toFixed(1)} KB`);
}
