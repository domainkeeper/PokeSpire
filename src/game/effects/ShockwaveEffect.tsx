import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ShockwaveConfig } from './types';
import { battleClock } from '../../battle/presentation/battleClock';

interface ShockwaveEffectProps {
  config: ShockwaveConfig;
  onComplete?: () => void;
}

/**
 * Volumetric shockwave — an expanding, thinning shell. `dome` controls the vertical
 * squash so a ground slam produces a low disc and an explosion produces a sphere.
 *
 * Distinct from RingEffect: this reads as displaced air/force, so heavy AREA moves get
 * a different silhouette from a contact ring.
 */
export function ShockwaveEffect({ config, onComplete }: ShockwaveEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        wireframe: false,
      }),
    [config.color, config.opacity],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (doneRef.current || !mesh) return;

    elapsedRef.current += rawDelta * battleClock.timeScale;
    const t = elapsedRef.current / config.lifetime;

    if (t >= 1) {
      doneRef.current = true;
      mesh.visible = false;
      onComplete?.();
      return;
    }

    // Hard initial burst that decelerates sharply.
    const eased = 1 - Math.pow(1 - t, 3);
    const r = Math.max(0.001, config.radius * eased);
    const flatten = 0.12 + config.dome * 0.88;
    mesh.scale.set(r, r * flatten, r);
    // Thin out fast so it never obscures the combatants.
    material.opacity = config.opacity * (1 - t) * (1 - t);
  });

  return (
    <mesh ref={meshRef} material={material} renderOrder={24}>
      <sphereGeometry args={[1, 24, 12]} />
    </mesh>
  );
}
