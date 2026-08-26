import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Theme, SkylineStyle } from '../../theme/types';
import { makeCanvas, toPixelTexture } from '../pixel/textureLib';

/**
 * Theme-driven parallax sky dome.
 *
 * Replaces the old fixed pair of quads pinned at world x=0, z=-15/+30, which
 * never followed the camera and drifted out of frame (they were effectively
 * invisible). This is a cylinder centred on the camera every frame, so it always
 * surrounds the view, and every colour comes from Theme.sky.
 *
 * Skyline style is data-driven ('hills' | 'mountains' | 'city' | 'none'), so a
 * new region silhouette is a theme field, not new code.
 */

const TEX_W = 1024;
const TEX_H = 256;
const HORIZON = Math.round(TEX_H * 0.62);

function h2(x: number, seed = 0): number {
  let h = (x * 374761393 + seed * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

function lerpHex(a: string, b: string, t: number): string {
  const ai = parseInt(a.slice(1), 16);
  const bi = parseInt(b.slice(1), 16);
  const r = Math.round((((ai >> 16) & 255) * (1 - t) + ((bi >> 16) & 255) * t));
  const g = Math.round((((ai >> 8) & 255) * (1 - t) + ((bi >> 8) & 255) * t));
  const bl = Math.round(((ai & 255) * (1 - t) + (bi & 255) * t));
  return `rgb(${r},${g},${bl})`;
}

/** Bayer-ish ordered dither, gives the banded pixel-art gradient look. */
const DITHER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function skylineBand(
  ctx: CanvasRenderingContext2D,
  style: SkylineStyle,
  color: string,
  baseY: number,
  amp: number,
  seed: number,
  step: number,
): void {
  ctx.fillStyle = color;
  if (style === 'none') return;

  if (style === 'city') {
    let x = 0;
    while (x < TEX_W) {
      const w = 8 + (h2(x, seed) % 26);
      const hh = amp * 0.4 + (h2(x, seed + 1) % Math.max(1, Math.round(amp)));
      ctx.fillRect(x, baseY - hh, w, hh + TEX_H);
      // Window specks.
      for (let wy = baseY - hh + 3; wy < baseY - 2; wy += 5) {
        for (let wx = x + 2; wx < x + w - 2; wx += 4) {
          if (h2(wx * 31 + wy, seed + 2) % 5 === 0) {
        const prev: string = ctx.fillStyle;
            ctx.fillStyle = 'rgba(255,220,150,0.5)';
            ctx.fillRect(wx, wy, 1, 2);
            ctx.fillStyle = prev;
          }
        }
      }
      x += w + 1 + (h2(x, seed + 3) % 3);
    }
    return;
  }

  const sharp = style === 'mountains';
  for (let x = 0; x < TEX_W; x += step) {
    const t = x / TEX_W;
    const wave = sharp
      ? Math.abs(Math.sin(t * 9 + seed)) * amp + Math.abs(Math.sin(t * 23 + seed)) * amp * 0.35
      : Math.sin(t * 6 + seed) * amp * 0.6 + Math.sin(t * 14 + seed * 1.7) * amp * 0.3 + amp * 0.5;
    const hh = Math.max(2, Math.round(wave));
    ctx.fillRect(x, baseY - hh, step, hh + TEX_H);
  }
}

function makeSkyTexture(theme: Theme): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(TEX_W, TEX_H);
  const sky = theme.sky;

  // Dithered vertical gradient: top -> mid -> horizon.
  for (let y = 0; y < HORIZON; y++) {
    const t = y / HORIZON;
    const base = t < 0.5 ? lerpHex(sky.top, sky.mid, t * 2) : lerpHex(sky.mid, sky.horizon, (t - 0.5) * 2);
    const next = t < 0.5 ? lerpHex(sky.top, sky.mid, Math.min(1, t * 2 + 0.08)) : lerpHex(sky.mid, sky.horizon, Math.min(1, (t - 0.5) * 2 + 0.08));
    for (let x = 0; x < TEX_W; x++) {
      const d = DITHER[y & 3][x & 3];
      ctx.fillStyle = d < 6 ? next : base;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Optional low sun / moon disc.
  if (sky.disc) {
    const dx = sky.disc.x * TEX_W;
    const dy = sky.disc.y * HORIZON;
    ctx.fillStyle = sky.disc.color;
    for (let y = -sky.disc.radius; y <= sky.disc.radius; y++) {
      for (let x = -sky.disc.radius; x <= sky.disc.radius; x++) {
        if (Math.hypot(x, y) <= sky.disc.radius) ctx.fillRect(dx + x, dy + y, 1, 1);
      }
    }
  }

  // Chunky dithered clouds.
  for (let i = 0; i < 14; i++) {
    const cx = (h2(i, 41) % TEX_W) | 0;
    const cy = 12 + (h2(i, 42) % Math.round(HORIZON * 0.55));
    const cw = 40 + (h2(i, 43) % 90);
    const chh = 8 + (h2(i, 44) % 12);
    ctx.fillStyle = sky.cloudShade;
    ctx.fillRect(cx, cy + Math.round(chh * 0.5), cw, chh);
    ctx.fillStyle = sky.cloud;
    ctx.fillRect(cx + 4, cy, cw - 8, chh);
    ctx.fillRect(cx + Math.round(cw * 0.25), cy - Math.round(chh * 0.5), Math.round(cw * 0.4), chh);
    // Dither the lower edge so clouds don't look like bricks.
    for (let x = cx; x < cx + cw; x++) {
      if (h2(x, 45 + i) % 3 === 0) {
        ctx.fillStyle = sky.cloud;
        ctx.fillRect(x, cy + chh + Math.round(chh * 0.5), 1, 1);
      }
    }
  }

  // Optional sea band on the horizon (coastal themes).
  if (sky.sea) {
    ctx.fillStyle = sky.sea.color;
    ctx.fillRect(0, HORIZON - 22, TEX_W, 22);
    ctx.fillStyle = sky.sea.shimmer;
    for (let y = HORIZON - 22; y < HORIZON; y += 3) {
      for (let x = 0; x < TEX_W; x++) {
        if (h2(x * 7 + y, 51) % 7 === 0) ctx.fillRect(x, y, 2, 1);
      }
    }
  }

  // Parallax silhouette bands, far to near.
  skylineBand(ctx, sky.skylineStyle, sky.skylineFar, HORIZON - 6, 26, 0.4, 4);
  skylineBand(ctx, sky.skylineStyle, sky.skylineMid, HORIZON - 2, 18, 2.1, 3);
  skylineBand(ctx, sky.skylineStyle, sky.skylineNear, HORIZON + 4, 12, 4.7, 2);

  // Below the horizon: solid nearest band so no gap shows under the dome.
  ctx.fillStyle = sky.skylineNear;
  ctx.fillRect(0, HORIZON + 14, TEX_W, TEX_H - HORIZON - 14);

  return toPixelTexture(c);
}

const texCache = new Map<string, THREE.CanvasTexture>();
function skyTexture(theme: Theme): THREE.CanvasTexture {
  let t = texCache.get(theme.id);
  if (!t) {
    t = makeSkyTexture(theme);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    texCache.set(theme.id, t);
  }
  return t;
}

const RADIUS = 60;
const HEIGHT = 34;

export function SkyDome({ theme }: { theme: Theme }) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const tex = useMemo(() => skyTexture(theme), [theme]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.BackSide,
        depthWrite: false,
        // Sky must not be fogged or it collapses to a flat fog-coloured wall.
        fog: false,
        toneMapped: false,
      }),
    [tex],
  );

  // Keep the dome centred on the camera so it reads as infinitely distant.
  useFrame(() => {
    if (ref.current) ref.current.position.set(camera.position.x, 0, camera.position.z);
  });

  return (
    <group ref={ref} renderOrder={-1000}>
      <mesh material={material}>
        <cylinderGeometry args={[RADIUS, RADIUS, HEIGHT, 32, 1, true]} />
      </mesh>
    </group>
  );
}
