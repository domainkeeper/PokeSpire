#!/usr/bin/env node

/**
 * POKE_EXTRACT_FRAMES — Convert animated GIFs to Three.js-ready sprite atlases.
 *
 * For each Pokemon with an animated.gif, this script:
 *   1. Decompresses the GIF into individual RGBA frames (decompressFrames, patchData=true)
 *   2. Packs them into a GRID atlas bounded by MAX_ATLAS_DIM in both axes
 *   3. Writes animation.json with grid layout, frame count, durations and dimensions
 *
 * Output:
 *   public/assets/pokemon/{id}/sprite-sheet.png
 *   public/assets/pokemon/{id}/animation.json
 *
 * ── Why a grid instead of a horizontal strip ────────────────────────────────────
 * The previous version packed every frame into one row: `sheetWidth = w * n`. Measured
 * across all 993 atlases that produced a mean width of 4485px, with 447 over 4096px,
 * 87 over 8192px and a maximum of 57015px. GL_MAX_TEXTURE_SIZE is 4096 on most mobile
 * GPUs and 8192-16384 on desktop, so ~45% of species could not be uploaded as a
 * texture at all and rendered black. Grid packing bounds both axes at 2048px.
 *
 * ── Frame timing ───────────────────────────────────────────────────────────────
 * gifuct-js already reports `frame.delay` in milliseconds. The previous version
 * multiplied by 10 again, making every animation.json a uniform 400ms per frame
 * (Pikachu: 33 frames = a 13.2 second idle loop). Corrected below.
 *
 * Usage:
 *   node scripts/poke-extract-frames.mjs [--force] [--id=25] [--report]
 */

import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import { parseGIF, decompressFrames } from 'gifuct-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const PUBLIC_ASSETS = join(PROJECT_ROOT, 'public', 'assets', 'pokemon');

/** Hard ceiling for both atlas axes. Safe on every GL2 target including mobile. */
const MAX_ATLAS_DIM = 2048;
/** Idle loops longer than this are downsampled; keeps VRAM and decode cost sane. */
const MAX_FRAMES = 48;
/** Schema version so the runtime can detect and correct legacy metadata. */
const SCHEMA_VERSION = 2;

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const REPORT_ONLY = args.includes('--report');
const ID_FILTER = args.find((a) => a.startsWith('--id='))?.split('=')[1];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function fileExists(path) {
  try {
    return statSync(path).size > 0;
  } catch {
    return false;
  }
}

/**
 * Decode a GIF into fully-composited, full-canvas RGBA frames.
 *
 * gifuct's `frame.patch` is sized to that frame's SUB-RECTANGLE (`frame.dims`), not to
 * the logical screen. GIFs delta-encode: only frame 0 covers the whole canvas, and later
 * frames are smaller rects at an offset (Charizard frame 1 is 122x105 at (5,26) inside a
 * 133x140 canvas). Reading a patch with the logical width as its stride produces a
 * progressive horizontal shear - the sprite renders as diagonal streaks.
 *
 * So each frame must be composited onto a persistent canvas honouring dims.left/top and
 * the frame's disposal method. This is the standard GIF compositing algorithm.
 */
function decodeGif(gifBuffer) {
  const gif = parseGIF(gifBuffer);
  const raw = decompressFrames(gif, true);
  if (!raw || raw.length === 0) return null;

  const W = gif.lsd.width;
  const H = gif.lsd.height;
  const stride = W * 4;

  // Persistent composite surface. Zero-filled = fully transparent.
  let canvas = new Uint8ClampedArray(W * H * 4);
  const frames = [];

  for (const frame of raw) {
    const { left, top, width, height } = frame.dims;
    const patch = frame.patch;

    // Disposal 3 = restore to previous: snapshot before drawing.
    const saved = frame.disposalType === 3 ? canvas.slice() : null;

    for (let y = 0; y < height; y++) {
      const cy = top + y;
      if (cy < 0 || cy >= H) continue;
      const srcRow = y * width * 4;
      const dstRow = cy * stride;
      for (let x = 0; x < width; x++) {
        const cx = left + x;
        if (cx < 0 || cx >= W) continue;
        const s = srcRow + x * 4;
        // Alpha 0 means the GIF transparent index: keep whatever is underneath.
        if (patch[s + 3] === 0) continue;
        const d = dstRow + cx * 4;
        canvas[d] = patch[s];
        canvas[d + 1] = patch[s + 1];
        canvas[d + 2] = patch[s + 2];
        canvas[d + 3] = patch[s + 3];
      }
    }

    // The composited surface at this instant IS the frame.
    frames.push(canvas.slice());

    if (frame.disposalType === 2) {
      // Restore to background: clear only this frame's rect.
      for (let y = 0; y < height; y++) {
        const cy = top + y;
        if (cy < 0 || cy >= H) continue;
        const dstRow = cy * stride;
        for (let x = 0; x < width; x++) {
          const cx = left + x;
          if (cx < 0 || cx >= W) continue;
          const d = dstRow + cx * 4;
          canvas[d] = 0;
          canvas[d + 1] = 0;
          canvas[d + 2] = 0;
          canvas[d + 3] = 0;
        }
      }
    } else if (frame.disposalType === 3 && saved) {
      canvas = saved;
    }
  }

  return {
    width: W,
    height: H,
    // gifuct delay is ALREADY milliseconds. Clamp to a sane playback range: a 0 delay
    // means "as fast as possible", which browsers treat as ~100ms.
    durations: raw.map((f) => {
      const d = Number(f.delay) || 0;
      return d <= 0 ? 100 : Math.max(20, Math.min(1000, d));
    }),
    frames,
  };
}

/**
 * Choose a grid that fits inside MAX_ATLAS_DIM. Returns the layout plus the frame
 * indices to keep (evenly sampled when the full set cannot fit).
 */
function planGrid(width, height, frameCount) {
  const maxCols = Math.max(1, Math.floor(MAX_ATLAS_DIM / width));
  const maxRows = Math.max(1, Math.floor(MAX_ATLAS_DIM / height));
  const capacity = maxCols * maxRows;

  const keepCount = Math.min(frameCount, capacity, MAX_FRAMES);

  // Prefer a squarish grid so neither axis is wasted.
  let cols = Math.min(maxCols, Math.ceil(Math.sqrt(keepCount)));
  cols = Math.max(1, cols);
  let rows = Math.ceil(keepCount / cols);

  // Widen until it fits vertically.
  while (rows > maxRows && cols < maxCols) {
    cols += 1;
    rows = Math.ceil(keepCount / cols);
  }

  const oversized = width > MAX_ATLAS_DIM || height > MAX_ATLAS_DIM;

  return { cols, rows, keepCount, oversized };
}

/** Evenly sample `keep` indices out of `total`, always including frame 0. */
function sampleIndices(total, keep) {
  if (keep >= total) return Array.from({ length: total }, (_, i) => i);
  const out = [];
  for (let i = 0; i < keep; i++) {
    out.push(Math.floor((i * total) / keep));
  }
  return out;
}

function buildAtlas(decoded, plan, indices) {
  const { width, height, frames } = decoded;
  const { cols, rows } = plan;

  const sheetWidth = cols * width;
  const sheetHeight = rows * height;
  const png = new PNG({ width: sheetWidth, height: sheetHeight });

  // pngjs zero-fills, so untouched cells are fully transparent.
  for (let f = 0; f < indices.length; f++) {
    const src = frames[indices[f]];
    if (!src) continue;

    const col = f % cols;
    const row = Math.floor(f / cols);
    const originX = col * width;
    const originY = row * height;

    // Frames are already full-canvas composites, so this is a straight blit.
    for (let y = 0; y < height; y++) {
      const srcRow = y * width * 4;
      const destRow = (originY + y) * sheetWidth * 4;
      for (let x = 0; x < width; x++) {
        const s = srcRow + x * 4;
        const d = destRow + (originX + x) * 4;
        png.data[d] = src[s];
        png.data[d + 1] = src[s + 1];
        png.data[d + 2] = src[s + 2];
        png.data[d + 3] = src[s + 3];
      }
    }
  }

  return { buffer: PNG.sync.write(png), sheetWidth, sheetHeight };
}

function main() {
  console.log('=== Pokemon Frame Extraction (grid atlas, max ' + MAX_ATLAS_DIM + 'px) ===\n');

  const speciesDirs = [];
  for (const entry of readdirSync(PUBLIC_ASSETS)) {
    if (!/^\d{3,4}$/.test(entry)) continue;
    const id = parseInt(entry, 10);
    if (ID_FILTER && id !== parseInt(ID_FILTER, 10)) continue;
    speciesDirs.push({ id, dir: join(PUBLIC_ASSETS, entry) });
  }
  speciesDirs.sort((a, b) => a.id - b.id);

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let noGif = 0;
  let downsampled = 0;
  let oversized = 0;
  let maxDim = 0;

  for (const { id, dir } of speciesDirs) {
    const gifPath = join(dir, 'animated.gif');
    const sheetPath = join(dir, 'sprite-sheet.png');
    const metaPath = join(dir, 'animation.json');

    if (!fileExists(gifPath)) {
      noGif++;
      continue;
    }

    if (!FORCE && fileExists(sheetPath) && fileExists(metaPath)) {
      // Only skip if the existing metadata is already the new schema.
      try {
        const existing = JSON.parse(readFileSync(metaPath, 'utf8'));
        if (existing.version === SCHEMA_VERSION) {
          skipped++;
          continue;
        }
      } catch {
        /* fall through and regenerate */
      }
    }

    try {
      const decoded = decodeGif(readFileSync(gifPath));
      if (!decoded) {
        console.log(`  #${id}: no frames extracted`);
        failed++;
        continue;
      }

      const totalSource = decoded.frames.length;
      const plan = planGrid(decoded.width, decoded.height, totalSource);
      if (plan.oversized) {
        oversized++;
        console.warn(`  #${id}: single frame ${decoded.width}x${decoded.height} exceeds ${MAX_ATLAS_DIM}px`);
      }

      const indices = sampleIndices(totalSource, plan.keepCount);
      if (indices.length < totalSource) downsampled++;

      // Preserve total loop duration when frames are dropped by folding the skipped
      // frames' time into the frame that replaces them.
      const durations = indices.map((start, i) => {
        const end = i + 1 < indices.length ? indices[i + 1] : totalSource;
        let sum = 0;
        for (let k = start; k < end; k++) sum += decoded.durations[k] ?? 0;
        return Math.max(20, sum);
      });

      if (REPORT_ONLY) {
        maxDim = Math.max(maxDim, plan.cols * decoded.width, plan.rows * decoded.height);
        processed++;
        continue;
      }

      ensureDir(dir);
      const atlas = buildAtlas(decoded, plan, indices);
      writeFileSync(sheetPath, atlas.buffer);

      maxDim = Math.max(maxDim, atlas.sheetWidth, atlas.sheetHeight);

      writeFileSync(
        metaPath,
        JSON.stringify(
          {
            version: SCHEMA_VERSION,
            id,
            frameWidth: decoded.width,
            frameHeight: decoded.height,
            totalFrames: indices.length,
            cols: plan.cols,
            rows: plan.rows,
            sheetWidth: atlas.sheetWidth,
            sheetHeight: atlas.sheetHeight,
            durations,
            totalDuration: durations.reduce((a, b) => a + b, 0),
            sourceFrames: totalSource,
            spriteSheet: 'sprite-sheet.png',
          },
          null,
          2,
        ),
      );

      processed++;
      if (processed % 100 === 0) console.log(`  Progress: ${processed} processed...`);
    } catch (e) {
      console.error(`  #${id}: FAILED - ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== Extraction Complete ===`);
  console.log(`  Processed:            ${processed}`);
  console.log(`  Skipped (v${SCHEMA_VERSION} exists):  ${skipped}`);
  console.log(`  No animated.gif:      ${noGif}`);
  console.log(`  Downsampled frames:   ${downsampled}`);
  console.log(`  Oversized frames:     ${oversized}`);
  console.log(`  Failed:               ${failed}`);
  console.log(`  Largest atlas axis:   ${maxDim}px (limit ${MAX_ATLAS_DIM})`);
  if (maxDim > MAX_ATLAS_DIM) {
    console.error('  ERROR: an atlas exceeded the limit.');
    process.exitCode = 1;
  }
}

main();
