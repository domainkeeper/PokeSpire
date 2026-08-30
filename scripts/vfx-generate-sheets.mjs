/**
 * VFX flipbook generator.
 *
 * Produces the small set of hero flipbook sheets the battle animation director layers
 * on top of particles, beams and rings. Everything is generated procedurally so there
 * is no binary art dependency, and the sheets stay in the repo as plain PNGs.
 *
 * The previous version emitted 32x32 sheets that were 152 and 322 bytes - effectively
 * blank, drawn with a hard `dist < 12 && angleDiff < 0.6` mask and no falloff. These
 * are 64x64 with soft radial falloff, additive-friendly premultiplied edges and a
 * proper ease over the frame range.
 *
 * Output: public/assets/vfx/{name}.png + {name}.json
 *
 * Usage: node scripts/vfx-generate-sheets.mjs
 */

import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets/vfx');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SIZE = 64;

// ─── helpers ────────────────────────────────────────────────────────────────
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeIn = (t) => t * t;
/** Smooth band: 1 at `centre`, 0 at +-`halfWidth`. */
function band(value, centre, halfWidth) {
  if (halfWidth <= 0) return 0;
  const d = Math.abs(value - centre) / halfWidth;
  return d >= 1 ? 0 : Math.cos(d * Math.PI * 0.5);
}

/**
 * `shade(frameProgress, nx, ny)` returns { a, r, g, b } with a in 0..1.
 * nx/ny are -1..1 relative to the cell centre.
 */
function writeSheet(name, frames, fps, shade) {
  const png = new PNG({ width: SIZE * frames, height: SIZE });

  for (let f = 0; f < frames; f++) {
    const p = frames === 1 ? 0 : f / (frames - 1);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const nx = (x - SIZE / 2 + 0.5) / (SIZE / 2);
        const ny = (y - SIZE / 2 + 0.5) / (SIZE / 2);
        const s = shade(p, nx, ny);
        const idx = (png.width * y + (f * SIZE + x)) << 2;
        const a = clamp01(s.a);
        // White-ish base: the director tints per move type, so keep these neutral
        // and let additive blending carry the colour.
        png.data[idx] = Math.round(clamp01(s.r ?? 1) * 255);
        png.data[idx + 1] = Math.round(clamp01(s.g ?? 1) * 255);
        png.data[idx + 2] = Math.round(clamp01(s.b ?? 1) * 255);
        png.data[idx + 3] = Math.round(a * 255);
      }
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.png`), PNG.sync.write(png));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${name}.json`),
    JSON.stringify({ frameWidth: SIZE, frameHeight: SIZE, frames, fps }, null, 2),
  );
  console.log(`  ${name}.png  ${frames} frames @ ${fps}fps`);
}

// ─── impact: spiked star that expands and thins ─────────────────────────────
function impact(p, nx, ny) {
  const r = Math.hypot(nx, ny);
  const ang = Math.atan2(ny, nx);
  const radius = 0.12 + easeOut(p) * 0.82;
  // 6-point spike modulation.
  const spike = 1 + 0.35 * Math.cos(ang * 6);
  const thickness = 0.34 * (1 - p * 0.72) + 0.03;
  const shell = band(r, radius * spike, thickness);
  // Hot core early on.
  const core = (1 - easeIn(Math.min(1, p * 1.6))) * band(r, 0, 0.3);
  const a = (shell * (1 - p * 0.55) + core) * (1 - easeIn(p) * 0.35);
  return { a: a * 1.15, r: 1, g: 0.96 - p * 0.15, b: 0.82 - p * 0.3 };
}

// ─── slash: crescent arc sweeping through ───────────────────────────────────
function slash(p, nx, ny) {
  const r = Math.hypot(nx, ny);
  const ang = Math.atan2(ny, nx);
  // The arc rotates through the frame range and stretches.
  const sweep = -1.15 + p * 2.3;
  const arcHalf = (0.55 + p * 0.35) * (1 - easeIn(p) * 0.5);
  let d = ang - sweep;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const along = band(d, 0, arcHalf);
  const radial = band(r, 0.62 - p * 0.06, 0.2 * (1 - p * 0.55) + 0.02);
  // Leading edge is brighter than the tail.
  const lead = clamp01(1 - Math.abs(d - arcHalf * 0.35) / (arcHalf + 0.001));
  const a = along * radial * (0.7 + lead * 0.6) * (1 - easeIn(p) * 0.45);
  return { a: a * 1.35, r: 1, g: 1, b: 1 };
}

// ─── burst: dense soft explosion with radial streaks ────────────────────────
function burst(p, nx, ny) {
  const r = Math.hypot(nx, ny);
  const ang = Math.atan2(ny, nx);
  const grow = easeOut(p);
  const radius = 0.1 + grow * 0.72;
  const streak = 0.72 + 0.28 * Math.cos(ang * 11 + 0.6);
  const shell = band(r, radius * streak, 0.42 * (1 - p * 0.5) + 0.05);
  const glow = band(r, 0, 0.45 + grow * 0.3) * (1 - p) * 0.55;
  const a = (shell + glow) * (1 - easeIn(p) * 0.5);
  return { a: a * 1.2, r: 1, g: 0.94, b: 0.85 };
}

// ─── sparkle: four-point twinkle, used for heal/buff/status ─────────────────
function sparkle(p, nx, ny) {
  // Pop out then fade.
  const scale = p < 0.35 ? easeOut(p / 0.35) : 1 - easeIn((p - 0.35) / 0.65) * 0.55;
  const s = Math.max(0.08, scale);
  const ax = Math.abs(nx) / s;
  const ay = Math.abs(ny) / s;
  // Star: thin along one axis at a time.
  const horiz = band(ay, 0, 0.1) * clamp01(1 - ax / 1.0);
  const vert = band(ax, 0, 0.1) * clamp01(1 - ay / 1.0);
  const diagA = band(Math.abs(nx - ny) / s, 0, 0.09) * clamp01(1 - Math.hypot(nx, ny) / (s * 0.8));
  const diagB = band(Math.abs(nx + ny) / s, 0, 0.09) * clamp01(1 - Math.hypot(nx, ny) / (s * 0.8));
  const core = band(Math.hypot(ax, ay), 0, 0.22);
  const a = (horiz + vert + (diagA + diagB) * 0.6 + core * 0.9) * (1 - easeIn(p) * 0.7);
  return { a: a * 1.1, r: 1, g: 1, b: 1 };
}

// ─── shockring: flat expanding ground ring ──────────────────────────────────
function shockring(p, nx, ny) {
  const r = Math.hypot(nx, ny);
  const radius = 0.08 + easeOut(p) * 0.88;
  const thickness = 0.2 * (1 - p * 0.8) + 0.015;
  const a = band(r, radius, thickness) * (1 - easeIn(p) * 0.8);
  return { a: a * 1.3, r: 1, g: 1, b: 1 };
}

// ─── crack: ground fracture decal, holds then fades ─────────────────────────
function crack(p, nx, ny) {
  const r = Math.hypot(nx, ny);
  const ang = Math.atan2(ny, nx);
  // Five radial fractures with jitter, growing outward.
  const reach = 0.2 + easeOut(Math.min(1, p * 2)) * 0.75;
  let a = 0;
  for (let i = 0; i < 5; i++) {
    const base = (i / 5) * Math.PI * 2 + 0.4;
    const wobble = Math.sin(r * 9 + i * 2.1) * 0.13;
    let d = ang - (base + wobble);
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const taper = clamp01(1 - r / reach);
    a += band(d, 0, 0.075 * taper + 0.008) * taper;
  }
  a += band(r, 0, 0.16) * 0.5;
  // Holds through the middle of the range, then fades.
  const life = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
  return { a: clamp01(a) * life, r: 0.9, g: 0.86, b: 0.8 };
}

console.log('=== VFX flipbook generation (64x64) ===');
writeSheet('impact', 8, 26, impact);
writeSheet('slash', 8, 30, slash);
writeSheet('burst', 8, 24, burst);
writeSheet('sparkle', 6, 18, sparkle);
writeSheet('shockring', 8, 26, shockring);
writeSheet('crack', 8, 16, crack);
console.log('Done.');
