import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameMap } from '../../data/mapTypes';
import type { Theme, Ramp } from '../../theme/types';
import { TILE_SIZE, WATER_SURFACE_DEPTH } from '../../utils/constants';
import { buildWaterMask } from '../terrain/groundTexture';
import { makeCanvas, toPixelTexture } from '../pixel/textureLib';

/** World units covered by one repetition of the 16px water texture. */
const WATER_TEX_SCALE = 1.5;
const FRAME_COUNT = 4;
const FPS = 2.5;

/**
 * Animated water frames, generated from the theme's waterSurface ramp so water
 * re-skins with everything else. Coastal teal and dusk violet come from the same
 * generator.
 */
function makeWaterFrame(ramp: Ramp, frame: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 16);
  const bands = [ramp.darkest, ramp.dark, ramp.base, ramp.light, ramp.lightest];

  const wave = (x: number, y: number, t: number) => ((x * 7 + y * 13 + t * 5) % 11) / 11;

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const wx = x + frame * 3;
      const wy = y + Math.floor(Math.sin((wx * 0.4 + y * 0.2) * 0.5) * 1.5);
      const n = wave(wx, wy, frame);
      const idx = n < 0.25 ? 0 : n < 0.5 ? 1 : n < 0.72 ? 2 : n < 0.9 ? 3 : 4;
      ctx.fillStyle = bands[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Drifting wave crests.
  ctx.fillStyle = ramp.lightest;
  for (let row = 0; row < 4; row++) {
    const baseY = (row * 4 + frame * 2) % 16;
    for (let x = 0; x < 16; x++) {
      const wy = baseY + Math.round(Math.sin((x + frame * 3) * 0.6) * 1.2);
      if (wy >= 0 && wy < 16) ctx.fillRect(x, wy, 1, 1);
    }
  }

  if (frame % 2 === 0) {
    ctx.fillStyle = ramp.lightest;
    ctx.fillRect(((frame * 7 + 3) % 14) + 1, ((frame * 11 + 5) % 14) + 1, 1, 1);
  }

  const tex = toPixelTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const frameCache = new Map<string, THREE.CanvasTexture[]>();
function getWaterFrames(theme: Theme): THREE.CanvasTexture[] {
  let f = frameCache.get(theme.id);
  if (!f) {
    f = Array.from({ length: FRAME_COUNT }, (_, i) =>
      makeWaterFrame(theme.palette.waterSurface, i),
    );
    frameCache.set(theme.id, f);
  }
  return f;
}

/**
 * One animated water surface for the whole map, shaped by a per-tile alpha mask.
 *
 * Replaces WaterSurface, which built ~20 meshes per water MapObject and never
 * rendered at all because neither map declared a water object. Water lives in the
 * ground grid, so that is what drives this. The terrain heightfield sinks water
 * tiles by WATER_DEPTH, so this plane sits inside a real basin.
 */
export function WaterPlane({ mapData, theme }: { mapData: GameMap; theme: Theme }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const time = useRef(0);
  const frameIdx = useRef(-1);

  const mask = useMemo(() => buildWaterMask(mapData), [mapData]);

  const width = mapData.width * TILE_SIZE;
  const depth = mapData.height * TILE_SIZE;

  // Frames are shared per theme, so clone to give this map its own repeat.
  const frames = useMemo(() => {
    return getWaterFrames(theme).map((f) => {
      const t = f.clone();
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(width / WATER_TEX_SCALE, depth / WATER_TEX_SCALE);
      t.needsUpdate = true;
      return t;
    });
  }, [theme, width, depth]);

  useFrame((_, delta) => {
    time.current += delta;
    const idx = Math.floor(time.current * FPS) % FRAME_COUNT;
    if (idx !== frameIdx.current && matRef.current) {
      frameIdx.current = idx;
      matRef.current.map = frames[idx];
      matRef.current.needsUpdate = true;
    }
  });

  return (
    <mesh
      position={[width / 2, -WATER_SURFACE_DEPTH, depth / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        ref={matRef}
        map={frames[0]}
        alphaMap={mask}
        transparent
        // Mask is 0/1 with NearestFilter, so alphaTest cuts cleanly and discards
        // land fragments outright rather than blending alpha=0 across the map.
        alphaTest={0.5}
        opacity={theme.water.opacity}
        // Only large transparent surface in the scene: keep it out of the depth
        // buffer so it never z-fights the bank geometry.
        depthWrite={false}
        roughness={0.22}
        metalness={0.14}
        // Frames are already authored in the theme palette; tinting them again
        // is what previously turned water into a near-black hole.
        color={theme.water.tint}
      />
    </mesh>
  );
}
