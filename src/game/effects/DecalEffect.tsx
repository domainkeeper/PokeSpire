import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { DecalConfig } from './types';
import { battleClock } from '../../battle/presentation/battleClock';

interface DecalEffectProps {
  config: DecalConfig;
  /** Radians about the ground normal. Randomised per spawn. */
  rotation?: number;
  onComplete?: () => void;
}

const cache = new Map<string, THREE.Texture>();

function sheet(name: string): THREE.Texture {
  const hit = cache.get(name);
  if (hit) return hit;
  const tex = new THREE.TextureLoader().load(`/assets/vfx/${name}.png`);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  cache.set(name, tex);
  return tex;
}

/**
 * Ground decal — a flipbook laid flat on the arena floor. Used for craters, scorch
 * marks and frost patches so heavy ground attacks leave evidence rather than just
 * puffing particles.
 *
 * Rendered with normal blending and a slight lift off the floor to avoid z-fighting.
 */
export function DecalEffect({ config, rotation = 0, onComplete }: DecalEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);
  const frameRef = useRef(-1);
  const doneRef = useRef(false);

  const texture = useMemo(() => {
    const clone = sheet(config.sheet).clone();
    clone.needsUpdate = true;
    clone.repeat.set(1 / config.frames, 1);
    return clone;
  }, [config.sheet, config.frames]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [texture, config.color, config.opacity],
  );

  useEffect(
    () => () => {
      material.dispose();
      texture.dispose();
    },
    [material, texture],
  );

  useFrame((_, rawDelta) => {
    if (doneRef.current || !meshRef.current) return;

    elapsedRef.current += rawDelta * battleClock.timeScale;
    const total = config.frames / config.fps;

    if (elapsedRef.current >= total) {
      doneRef.current = true;
      meshRef.current.visible = false;
      onComplete?.();
      return;
    }

    const frame = Math.min(config.frames - 1, Math.floor(elapsedRef.current * config.fps));
    if (frame !== frameRef.current) {
      frameRef.current = frame;
      texture.offset.x = frame / config.frames;
    }
  });

  const d = config.radius * 2;

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, rotation]}
      position={[0, 0.012, 0]}
      material={material}
      renderOrder={10}
    >
      <planeGeometry args={[d, d]} />
    </mesh>
  );
}
