import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RingConfig } from './types';
import { battleClock } from '../../battle/presentation/battleClock';

interface RingEffectProps {
  config: RingConfig;
  onComplete?: () => void;
}

/**
 * Expanding ring. Positioned by the parent group; `flat` lays it on the ground plane
 * (impact craters, ground slams) instead of facing the camera (contact rings).
 */
export function RingEffect({ config, onComplete }: RingEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
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
      }),
    [config.color, config.opacity],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (doneRef.current || !group) return;

    elapsedRef.current += rawDelta * battleClock.timeScale;
    const t = elapsedRef.current / config.lifetime;

    if (t >= 1) {
      doneRef.current = true;
      group.visible = false;
      onComplete?.();
      return;
    }

    // Fast expansion that decelerates, opacity falling off faster than the radius so
    // the ring reads as a shockwave rather than a growing disc.
    const eased = 1 - (1 - t) * (1 - t);
    const radius = config.radius + config.radiusGrow * eased;
    group.scale.setScalar(Math.max(0.001, radius));
    material.opacity = config.opacity * (1 - t) * (1 - t * 0.3);
  });

  const inner = Math.max(0.05, 1 - config.thickness);

  return (
    <group ref={groupRef} rotation={config.flat ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <mesh material={material} renderOrder={28}>
        <ringGeometry args={[inner, 1, 48]} />
      </mesh>
    </group>
  );
}
