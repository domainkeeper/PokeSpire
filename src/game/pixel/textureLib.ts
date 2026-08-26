import * as THREE from 'three';
import type { Ramp } from '../../theme/types';
import { getActiveThemeId } from '../../theme';

/**
 * Theme-aware pixel texture generators.
 *
 * Every generator takes Ramps from the active Theme, so a palette swap
 * re-skins the whole game with no code change. Results are cached by
 * (themeId, generator, params) - textures are never rebuilt per instance, which
 * was a real cost before (each of ~640 trees re-rasterised its own canvases).
 */

const cache = new Map<string, THREE.CanvasTexture>();

function cacheKey(kind: string, ...parts: (string | number)[]): string {
  return `${getActiveThemeId()}|${kind}|${parts.join(',')}`;
}

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

export function toPixelTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function cached(key: string, build: () => HTMLCanvasElement): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const tex = toPixelTexture(build());
  cache.set(key, tex);
  return tex;
}

/** Drop every cached texture. Call after switching theme. */
export function clearTextureCache(): void {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}

/** Deterministic hash so texture noise is stable across rebuilds. */
function h2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

function bandFor(n: number, ramp: Ramp): string {
  // Weighted toward `base`, which reads better than a flat distribution.
  if (n < 12) return ramp.darkest;
  if (n < 34) return ramp.dark;
  if (n < 68) return ramp.base;
  if (n < 88) return ramp.light;
  return ramp.lightest;
}

/* ------------------------------------------------------------- foliage ---- */

export interface BlobOptions {
  /** Radial wobble amplitude in pixels. */
  wobble?: number;
  /** 0..1 how much of the lower half is shaded down a band. */
  shade?: number;
  seed?: number;
}

/**
 * Rounded, dithered organic blob - the workhorse for foliage, bushes and
 * canopy cards. Alpha outside the wobbled radius so it cuts out cleanly.
 */
export function blobTexture(ramp: Ramp, size: number, opts: BlobOptions = {}): THREE.CanvasTexture {
  const { wobble = 2, shade = 0.45, seed = 0 } = opts;
  return cached(cacheKey('blob', ramp.base, size, wobble, shade, seed), () => {
    const [c, ctx] = makeCanvas(size, size);
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.45;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const a = Math.atan2(dy, dx);
        const rr = r + Math.sin(a * 5 + seed) * wobble + Math.cos(a * 3 - seed) * (wobble * 0.7);
        if (dist > rr) continue;

        let n = h2(x, y, seed) % 100;
        // Vertical form: lighter at top, darker at the bottom of the mass.
        const vertical = (y / size - 0.5) * 2;
        n -= vertical * shade * 55;
        // Rim light on the upper-left.
        if (dist > rr - 1.5 && dy < 0 && dx < 0) n += 45;

        ctx.fillStyle = bandFor(Math.max(0, Math.min(99, n)), ramp);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  });
}

/** Vertical-streak bark for trunks and posts. */
export function barkTexture(ramp: Ramp, w = 8, h = 16): THREE.CanvasTexture {
  return cached(cacheKey('bark', ramp.base, w, h), () => {
    const [c, ctx] = makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const edge = x === 0 || x === w - 1;
        const streak = h2(x, 0, 7) % 100;
        let n = (streak + (h2(x, y, 3) % 30)) % 100;
        if (edge) n -= 40;
        // Highlight column, reads as a cylindrical form.
        if (x === Math.floor(w * 0.35)) n += 30;
        ctx.fillStyle = bandFor(Math.max(0, Math.min(99, n)), ramp);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  });
}

/** Chunky faceted rock silhouette. */
export function rockTexture(ramp: Ramp, variant = 0, w = 12, h = 10): THREE.CanvasTexture {
  return cached(cacheKey('rock', ramp.base, variant, w, h), () => {
    const [c, ctx] = makeCanvas(w, h);
    const blobs =
      variant % 2 === 0
        ? [
            { x: 1, y: 3, w: w - 2, h: h - 3 },
            { x: 3, y: 1, w: w - 6, h: h - 4 },
          ]
        : [
            { x: 2, y: 2, w: w - 3, h: h - 2 },
            { x: 4, y: 0, w: w - 8, h: h - 3 },
          ];

    for (const b of blobs) {
      for (let dy = 0; dy < b.h; dy++) {
        for (let dx = 0; dx < b.w; dx++) {
          const x = b.x + dx;
          const y = b.y + dy;
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          const edge = Math.min(dx, dy, b.w - 1 - dx, b.h - 1 - dy) === 0;
          if (edge && h2(x, y, variant) % 3 === 0) continue;
          let n = h2(x, y, variant + 11) % 100;
          n -= (y / h - 0.4) * 60;
          if (dy < 2) n += 35;
          ctx.fillStyle = bandFor(Math.max(0, Math.min(99, n)), ramp);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return c;
  });
}

/** Single stemmed flower. Petal colour comes from theme accents. */
export function flowerTexture(stem: Ramp, petal: string, w = 8, h = 12): THREE.CanvasTexture {
  return cached(cacheKey('flower', stem.base, petal, w, h), () => {
    const [c, ctx] = makeCanvas(w, h);
    ctx.fillStyle = stem.dark;
    ctx.fillRect(3, 6, 2, h - 6);
    ctx.fillStyle = stem.base;
    ctx.fillRect(2, 5, 4, 2);
    ctx.fillStyle = stem.light;
    ctx.fillRect(3, 6, 1, h - 7);

    ctx.fillStyle = petal;
    ctx.fillRect(2, 0, 4, 5);
    ctx.fillRect(1, 1, 6, 3);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.55;
    ctx.fillRect(2, 1, 2, 2);
    ctx.globalAlpha = 1;
    return c;
  });
}

/** Horizontal plank / rail. */
export function plankTexture(ramp: Ramp, w = 16, h = 4): THREE.CanvasTexture {
  return cached(cacheKey('plank', ramp.base, w, h), () => {
    const [c, ctx] = makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let n = h2(x, y, 5) % 100;
        if (y === 0) n += 40;
        if (y === h - 1) n -= 45;
        ctx.fillStyle = bandFor(Math.max(0, Math.min(99, n)), ramp);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  });
}

/** Mortared block wall / masonry. */
export function masonryTexture(ramp: Ramp, w = 16, h = 16, block = 4): THREE.CanvasTexture {
  return cached(cacheKey('masonry', ramp.base, w, h, block), () => {
    const [c, ctx] = makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const row = Math.floor(y / block);
        const offset = row % 2 === 1 ? block / 2 : 0;
        const lx = (x + offset) % block;
        const ly = y % block;
        const mortar = lx === 0 || ly === 0;
        let n = h2(Math.floor((x + offset) / block), row, 9) % 100;
        n = mortar ? n - 55 : n + (h2(x, y, 2) % 18) - 9;
        if (!mortar && ly === 1) n += 22;
        ctx.fillStyle = bandFor(Math.max(0, Math.min(99, n)), ramp);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  });
}

/** Overlapping roof shingles. */
export function shingleTexture(ramp: Ramp, w = 16, h = 16, tile = 4): THREE.CanvasTexture {
  return cached(cacheKey('shingle', ramp.base, w, h, tile), () => {
    const [c, ctx] = makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const row = Math.floor(y / tile);
        const offset = row % 2 === 1 ? tile / 2 : 0;
        const lx = (x + offset) % tile;
        const ly = y % tile;
        let n = 55 + (h2(Math.floor((x + offset) / tile), row, 4) % 22);
        if (ly === 0) n -= 55;
        if (lx === 0) n -= 30;
        if (ly === 1 && lx === 1) n += 30;
        ctx.fillStyle = bandFor(Math.max(0, Math.min(99, n)), ramp);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  });
}

/** Lit window pane with a warm interior glow. */
export function windowTexture(ramp: Ramp, size = 8): THREE.CanvasTexture {
  return cached(cacheKey('window', ramp.base, size), () => {
    const [c, ctx] = makeCanvas(size, size);
    ctx.fillStyle = ramp.darkest;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = ramp.base;
    ctx.fillRect(1, 1, size - 2, size - 2);
    ctx.fillStyle = ramp.light;
    ctx.fillRect(1, 1, Math.floor(size / 2) - 1, Math.floor(size / 2) - 1);
    ctx.fillStyle = ramp.lightest;
    ctx.fillRect(1, 1, 2, 2);
    // Muntin bars.
    ctx.fillStyle = ramp.darkest;
    ctx.fillRect(Math.floor(size / 2) - 0, 1, 1, size - 2);
    ctx.fillRect(1, Math.floor(size / 2) - 0, size - 2, 1);
    return c;
  });
}

/** Plank door with a handle accent. */
export function doorTexture(ramp: Ramp, accent: string, w = 8, h = 12): THREE.CanvasTexture {
  return cached(cacheKey('door', ramp.base, accent, w, h), () => {
    const [c, ctx] = makeCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const seam = x % 3 === 0;
        let n = (h2(x, y, 6) % 40) + 30;
        if (seam) n -= 40;
        ctx.fillStyle = bandFor(Math.max(0, Math.min(99, n)), ramp);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = ramp.light;
    ctx.fillRect(0, 0, w, 1);
    ctx.fillStyle = ramp.darkest;
    ctx.fillRect(0, h - 1, w, 1);
    ctx.fillStyle = accent;
    ctx.fillRect(w - 2, Math.floor(h / 2), 1, 2);
    return c;
  });
}

/** Soft elliptical contact shadow. */
let contactShadow: THREE.CanvasTexture | null = null;
export function contactShadowTexture(): THREE.CanvasTexture {
  if (contactShadow) return contactShadow;
  const [c, ctx] = makeCanvas(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = (x - 7.5) / 7.5;
      const dy = (y - 7.5) / 7.5;
      const d = Math.hypot(dx, dy);
      if (d > 1) continue;
      ctx.fillStyle = `rgba(0,0,0,${(1 - d) * (1 - d)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  contactShadow = toPixelTexture(c);
  return contactShadow;
}
