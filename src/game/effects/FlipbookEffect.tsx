import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FlipbookConfig } from './types';
import { battleClock } from '../../battle/presentation/battleClock';

interface FlipbookEffectProps {
  /** Sheet name under /assets/vfx (impact, slash, burst, sparkle, shockring, crack). */
  sheet: string;
  config: FlipbookConfig;
  /** Radians. Randomise per spawn so repeated hits do not look stamped. */
  rotation?: number;
  /** Lay flat on the ground plane. */
  flat?: boolean;
  onComplete?: () => void;
}

const textureCache = new Map<string, THREE.Texture>();

function loadSheet(sheet: string): THREE.Texture {
  const hit = textureCache.get(sheet);
  if (hit) return hit;
  const tex = new THREE.TextureLoader().load(`/assets/vfx/${sheet}.png`);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(sheet, tex);
  return tex;
}

/**
 * Hero flipbook layer. Positioned by the parent group.
 *
 * The shared sheet texture is cached but each instance needs its own UV window, so the
 * texture is cloned per instance - mutating a shared texture's offset makes every
 * concurrent flipbook show the same frame.
 */
export function FlipbookEffect({ sheet, config, rotation = 0, flat = false, onComplete }: FlipbookEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);
  const frameRef = useRef(-1);
  const doneRef = useRef(false);

  const texture = useMemo(() => {
    const clone = loadSheet(sheet).clone();
    clone.needsUpdate = true;
    clone.repeat.set(1 / config.frames, 1);
    return clone;
  }, [sheet, config.frames]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        blending: config.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [texture, config.color, config.opacity, config.additive],
  );

  useEffect(() => {
    return () => {
      material.dispose();
      texture.dispose();
    };
  }, [material, texture]);

  useFrame((_, rawDelta) => {
    if (doneRef.current || !meshRef.current) return;

    elapsedRef.current += rawDelta * battleClock.timeScale;
    const total = config.frames / config.fps;

    if (elapsedRef.current >= total) {
      if (!config.loop) {
        doneRef.current = true;
        meshRef.current.visible = false;
        onComplete?.();
        return;
      }
      elapsedRef.current %= total;
    }

    const frame = Math.min(config.frames - 1, Math.floor(elapsedRef.current * config.fps));
    if (frame !== frameRef.current) {
      frameRef.current = frame;
      texture.offset.x = frame / config.frames;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={flat ? [-Math.PI / 2, 0, rotation] : [0, 0, rotation]}
      scale={[config.scale, config.scale, 1]}
      material={material}
      renderOrder={flat ? 12 : 33}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
