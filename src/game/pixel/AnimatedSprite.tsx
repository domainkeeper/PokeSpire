import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Animation metadata produced by poke-extract-frames.mjs.
 *
 * v2 packs frames into a GRID bounded at 2048px per axis. v1 packed a single
 * horizontal strip, which pushed 447/993 atlases past the 4096px GL texture limit
 * (max 57015px) so they could not be uploaded at all. v1 also stored durations that
 * were 10x too long. Both are normalised on load, so stale metadata still plays.
 */
export interface PokemonAnimData {
  version?: number;
  id: number;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  /** v2 grid layout. Absent in v1 (implies cols = totalFrames, rows = 1). */
  cols?: number;
  rows?: number;
  sheetWidth?: number;
  sheetHeight?: number;
  durations: number[]; // ms per frame
  totalDuration: number;
  sourceFrames?: number;
  spriteSheet: string;
}

/** Grid layout + corrected timing, whichever schema version was loaded. */
export interface NormalisedAnim {
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  cols: number;
  rows: number;
  durations: number[];
  totalDuration: number;
  aspect: number;
}

export function normaliseAnimData(data: PokemonAnimData): NormalisedAnim {
  const isV2 = (data.version ?? 1) >= 2 && Boolean(data.cols);
  const cols = isV2 ? data.cols! : data.totalFrames;
  const rows = isV2 ? (data.rows ?? 1) : 1;

  // v1 double-multiplied gifuct's already-ms delay, producing a uniform 400ms.
  const scale = isV2 ? 1 : 0.1;
  const durations = data.durations.map((d) => Math.max(20, Math.round(d * scale)));

  return {
    frameWidth: data.frameWidth,
    frameHeight: data.frameHeight,
    totalFrames: Math.min(data.totalFrames, cols * rows),
    cols,
    rows,
    durations,
    totalDuration: durations.reduce((a, b) => a + b, 0),
    aspect: data.frameWidth / data.frameHeight,
  };
}

interface AnimatedSpriteProps {
  /** Path to the atlas PNG (e.g. /assets/pokemon/025/sprite-sheet.png) */
  sheetPath: string;
  animData: PokemonAnimData;
  /** Display width in world units. */
  width: number;
  /** Display height in world units (derived from aspect when omitted). */
  height?: number;
  /** Playback speed multiplier. 1 = original GIF timing. */
  speed?: number;
  /**
   * Per-frame speed multiplier, read imperatively. Props cannot change mid-frame, so
   * this is how a caller applies a shared timescale (battle hit-stop) without forcing a
   * re-render every frame. Returning 0 freezes on the current frame.
   */
  getSpeed?: () => number;
  loop?: boolean;
  /** Freeze on the current frame without resetting. */
  paused?: boolean;
  onEnd?: () => void;
  /** Multiplied over the sprite. Drives hit flash, status tint and KO desaturation. */
  tint?: THREE.Color | string;
  opacity?: number;
  /** Mirror horizontally. Front-facing atlases are used for both sides. */
  flipX?: boolean;
  /** 0 = bottom aligned, 0.5 = centred, 1 = top aligned. */
  anchorY?: number;
  castShadow?: boolean;
  renderOrder?: number;
}

/**
 * AnimatedSprite — plays a grid atlas at the original GIF's frame timing.
 */
export function AnimatedSprite({
  sheetPath,
  animData,
  width,
  height: heightProp,
  speed = 1,
  getSpeed,
  loop = true,
  paused = false,
  onEnd,
  tint,
  opacity = 1,
  flipX = false,
  anchorY = 0,
  castShadow = false,
  renderOrder = 0,
}: AnimatedSpriteProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const frameIndex = useRef(-1);
  const elapsed = useRef(0);
  const finished = useRef(false);

  const anim = useMemo(() => normaliseAnimData(animData), [animData]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(sheetPath, (t) => {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
    });
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    // One cell of the grid.
    tex.repeat.set(1 / anim.cols, 1 / anim.rows);
    setTexture(tex);
    frameIndex.current = -1;
    elapsed.current = 0;
    finished.current = false;
    return () => {
      tex.dispose();
    };
  }, [sheetPath, anim.cols, anim.rows]);

  const material = useMemo(() => {
    if (!texture) return null;
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.04,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
  }, [texture]);

  useEffect(() => () => material?.dispose(), [material]);

  // Tint / opacity are applied every frame by the rig, so read them imperatively.
  useEffect(() => {
    if (!material) return;
    material.color.set(tint ?? 0xffffff);
    material.opacity = opacity;
  }, [material, tint, opacity]);

  const displayHeight = heightProp ?? width / anim.aspect;

  useFrame((_, delta) => {
    if (!material?.map) return;

    if (!paused && !finished.current) {
      const rate = speed * (getSpeed ? getSpeed() : 1);
      if (rate > 0) {
        elapsed.current += delta * 1000 * rate;

        if (elapsed.current >= anim.totalDuration) {
          if (loop) {
            elapsed.current %= anim.totalDuration || 1;
          } else {
            elapsed.current = anim.totalDuration;
            finished.current = true;
            onEnd?.();
          }
        }
      }
    }

    // Walk the duration table to find the active frame.
    let acc = 0;
    let frame = anim.totalFrames - 1;
    for (let i = 0; i < anim.totalFrames; i++) {
      acc += anim.durations[i] ?? 0;
      if (elapsed.current < acc) {
        frame = i;
        break;
      }
    }

    if (frame !== frameIndex.current) {
      frameIndex.current = frame;
      const col = frame % anim.cols;
      const row = Math.floor(frame / anim.cols);
      // Three's V axis runs bottom-up; atlas rows run top-down.
      material.map.offset.set(col / anim.cols, 1 - (row + 1) / anim.rows);
    }
  });

  if (!material) return null;

  const yOff = displayHeight * (0.5 - anchorY);

  return (
    <mesh
      ref={meshRef}
      position={[0, yOff, 0]}
      scale={[flipX ? -1 : 1, 1, 1]}
      material={material}
      castShadow={castShadow}
      renderOrder={renderOrder}
    >
      <planeGeometry args={[width, displayHeight]} />
    </mesh>
  );
}

/** Load atlas metadata for a Pokemon by dex id. */
export async function loadPokemonAnimData(id: number): Promise<PokemonAnimData | null> {
  const paddedId = String(id).padStart(3, '0');
  try {
    const resp = await fetch(`/assets/pokemon/${paddedId}/animation.json`);
    if (!resp.ok) return null;
    return (await resp.json()) as PokemonAnimData;
  } catch {
    return null;
  }
}

export function pokemonSpriteSheetPath(id: number): string {
  return `/assets/pokemon/${String(id).padStart(3, '0')}/sprite-sheet.png`;
}
