#!/usr/bin/env node

/**
 * POKE_EXTRACT_FRAMES — Convert animated GIFs to Three.js-ready sprite sheets.
 *
 * For each Pokemon with an animated.gif, this script:
 *   1. Decompresses the GIF into individual RGBA frames (using decompressFrames with patchData=true)
 *   2. Packs them into a horizontal sprite sheet PNG
 *   3. Writes animation.json with frame count, durations, and dimensions
 *
 * Output:
 *   public/assets/pokemon/{id}/sprite-sheet.png
 *   public/assets/pokemon/{id}/animation.json
 *
 * Usage:
 *   node scripts/poke-extract-frames.mjs [--force] [--id=25]
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

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ID_FILTER = args.find(a => a.startsWith('--id='))?.split('=')[1];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function fileExists(path) {
  try { return statSync(path).size > 0; } catch { return false; }
}

function processGif(gifBuffer) {
  const gif = parseGIF(gifBuffer);
  // patchData=true gives us pre-composited RGBA pixels in each frame's .patch
  const frames = decompressFrames(gif, true);

  if (!frames || frames.length === 0) {
    return null;
  }

  const width = gif.lsd.width;
  const height = gif.lsd.height;
  const totalFrames = frames.length;

  // Extract frame durations (gifuct delay is in centiseconds → ms)
  const durations = frames.map(f => {
    const delay = (f.delay || 10) * 10;
    return Math.max(delay, 20); // minimum 20ms
  });

  // Collect composited RGBA patches
  const patches = frames.map(f => f.patch);

  return { width, height, totalFrames, durations, patches };
}

function buildSpriteSheet(result) {
  const { width, height, totalFrames, patches } = result;

  // Horizontal sprite sheet: width * totalFrames x height
  const sheetWidth = width * totalFrames;
  const sheetHeight = height;

  const png = new PNG({ width: sheetWidth, height: sheetHeight });

  for (let f = 0; f < totalFrames; f++) {
    const patch = patches[f];
    // patch is Uint8ClampedArray of RGBA values, already full frame size
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const destX = f * width + x;
        const destIdx = (y * sheetWidth + destX) * 4;

        png.data[destIdx + 0] = patch[srcIdx + 0]; // R
        png.data[destIdx + 1] = patch[srcIdx + 1]; // G
        png.data[destIdx + 2] = patch[srcIdx + 2]; // B
        png.data[destIdx + 3] = patch[srcIdx + 3]; // A
      }
    }
  }

  return PNG.sync.write(png);
}

function main() {
  console.log('=== Pokemon Frame Extraction ===\n');

  const speciesDirs = [];
  for (const entry of readdirSync(PUBLIC_ASSETS)) {
    if (!/^\d{3}$/.test(entry)) continue;
    const id = parseInt(entry, 10);
    if (ID_FILTER && id !== parseInt(ID_FILTER, 10)) continue;
    speciesDirs.push({ id, dir: join(PUBLIC_ASSETS, entry) });
  }

  speciesDirs.sort((a, b) => a.id - b.id);

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let noGif = 0;

  for (const { id, dir } of speciesDirs) {
    const gifPath = join(dir, 'animated.gif');
    const sheetPath = join(dir, 'sprite-sheet.png');
    const metaPath = join(dir, 'animation.json');

    if (!fileExists(gifPath)) {
      noGif++;
      continue;
    }

    if (!FORCE && fileExists(sheetPath) && fileExists(metaPath)) {
      skipped++;
      continue;
    }

    try {
      const gifBuffer = readFileSync(gifPath);
      const result = processGif(gifBuffer);

      if (!result) {
        console.log(`  #${id}: no frames extracted`);
        failed++;
        continue;
      }

      // Build and write sprite sheet
      const sheetPng = buildSpriteSheet(result);
      writeFileSync(sheetPath, sheetPng);

      // Write animation metadata
      const metadata = {
        id,
        frameWidth: result.width,
        frameHeight: result.height,
        totalFrames: result.totalFrames,
        durations: result.durations, // ms per frame
        totalDuration: result.durations.reduce((a, b) => a + b, 0),
        spriteSheet: 'sprite-sheet.png',
      };
      writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

      processed++;

      if (processed % 100 === 0) {
        console.log(`  Progress: ${processed} processed...`);
      }
    } catch (e) {
      console.error(`  #${id}: FAILED - ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== Extraction Complete ===`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  No animated.gif: ${noGif}`);
  console.log(`  Failed: ${failed}`);
}

main();
