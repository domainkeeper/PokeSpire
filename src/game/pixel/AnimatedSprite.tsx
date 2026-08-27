import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Animation metadata produced by poke-extract-frames.mjs.
 * Stored as animation.json alongside sprite-sheet.png.
 */
export interface PokemonAnimData {
  id: number;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  durations: number[]; // ms per frame
  totalDuration: number;
  spriteSheet: string;
}

interface AnimatedSpriteProps {
  /** Path to the sprite sheet PNG (e.g. /assets/pokemon/025/sprite-sheet.png) */
  sheetPath: string;
  /** Animation metadata loaded from animation.json */
  animData: PokemonAnimData;
  /** Display width in world units */
  width: number;
  /** Display height in world units (auto-calculated from aspect if omitted) */
  height?: number;
  /** Speed multiplier. 1 = original GIF timing. */
  speed?: number;
  /** Whether to loop. */
  loop?: boolean;
  /** Called when a non-looping animation finishes. */
  onEnd?: () => void;
  /** Material overrides. */
  material?: THREE.Material;
  /** Anchor Y: 0 = bottom, 1 = top. */
  anchorY?: number;
}

/**
 * AnimatedSprite — plays back a horizontal sprite sheet at the original GIF's frame timing.
 *
 * Usage:
 *   <AnimatedSprite sheetPath="/assets/pokemon/025/sprite-sheet.png" animData={data} width={0.8} />
 */
export function AnimatedSprite({
  sheetPath,
  animData,
  width,
  height: heightProp,
  speed = 1,
  loop = true,
  onEnd,
  material: matProp,
  anchorY = 0,
}: AnimatedSpriteProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const frameIndex = useRef(0);
  const elapsed = useRef(0);
  const finished = useRef(false);

  // Load sprite sheet texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(sheetPath, (t) => {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.colorSpace = THREE.SRGBColorSpace;
    });
    setTexture(tex);
    return () => { tex.dispose(); };
  }, [sheetPath]);

  // Calculate display height from aspect ratio
  const aspect = animData.frameWidth / animData.frameHeight;
  const displayHeight = heightProp ?? width / aspect;

  // Build UV scale/offset for the current frame
  const totalColumns = animData.totalFrames;
  const uvScaleX = 1 / totalColumns;
  const uvScaleY = 1;

  const mat = useMemo(() => {
    if (matProp) return matProp;
    if (!texture) return null;
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [texture, matProp]);

  useEffect(() => {
    return () => { if (mat && !matProp) mat.dispose(); };
  }, [mat, matProp]);

  useFrame((_, delta) => {
    if (!mat || finished.current) return;

    elapsed.current += delta * 1000 * speed;

    // Find which frame we should be on
    let accumulated = 0;
    let newFrame = 0;
    for (let i = 0; i < animData.totalFrames; i++) {
      accumulated += animData.durations[i];
      if (elapsed.current < accumulated) {
        newFrame = i;
        break;
      }
      if (i === animData.totalFrames - 1) {
        // Reached end
        if (loop) {
          elapsed.current = elapsed.current % animData.totalDuration;
          newFrame = 0;
        } else {
          newFrame = animData.totalFrames - 1;
          finished.current = true;
          onEnd?.();
        }
      }
    }

    if (newFrame !== frameIndex.current) {
      frameIndex.current = newFrame;
    }

    // Apply UV offset for the current frame
    const u = frameIndex.current * uvScaleX;
    // Flip V if needed (Three.js texture V is bottom-up, sprite sheet is top-down)
    const v = 0;

    if (mat instanceof THREE.MeshBasicMaterial) {
      mat.map!.offset.set(u, v);
      mat.map!.repeat.set(uvScaleX, uvScaleY);
      mat.map!.needsUpdate = true;
    }
  });

  if (!mat) return null;

  // Y anchor: 0 = bottom aligned, 0.5 = center, 1 = top aligned
  const yOff = -displayHeight * anchorY + displayHeight * 0.5;

  return (
    <mesh ref={meshRef} position={[0, yOff, 0]} material={mat}>
      <planeGeometry args={[width, displayHeight]} />
    </mesh>
  );
}

/**
 * Load animation metadata for a Pokemon by its dex ID.
 * Returns null if the metadata file doesn't exist.
 */
export async function loadPokemonAnimData(id: number): Promise<PokemonAnimData | null> {
  const paddedId = String(id).padStart(3, '0');
  try {
    const resp = await fetch(`/assets/pokemon/${paddedId}/animation.json`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

/**
 * Get the sprite sheet path for a Pokemon by its dex ID.
 */
export function pokemonSpriteSheetPath(id: number): string {
  const paddedId = String(id).padStart(3, '0');
  return `/assets/pokemon/${paddedId}/sprite-sheet.png`;
}

/**
 * Check if a Pokemon has animation data on disk.
 */
export function pokemonHasAnimation(_id: number): boolean {
  // This is a synchronous check; prefer loadPokemonAnimData for full metadata.
  // For build-time or static checks, just attempt the fetch.
  return false; // Caller should use loadPokemonAnimData instead.
}
