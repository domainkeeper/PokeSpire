import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RingConfig, EffectContext } from './types';

interface RingEffectProps {
  config: RingConfig;
  context: EffectContext;
  onComplete?: () => void;
}

export function RingEffect({ config, context, onComplete }: RingEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
  }, [config.color, config.opacity]);

  useEffect(() => {
    elapsedRef.current = 0;
    doneRef.current = false;
  }, [config]);

  useFrame((_, delta) => {
    if (doneRef.current || !groupRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current / config.lifetime;

    if (t >= 1) {
      doneRef.current = true;
      onComplete?.();
      return;
    }

    const radius = config.radius + config.radiusGrow * t;
    const opacity = config.opacity * (1 - t);
    const thickness = config.thickness * (1 - t * 0.3);

    groupRef.current.scale.set(radius, radius, radius);
    material.opacity = opacity;

    // Update ring geometry to match radius
    const children = groupRef.current.children;
    for (const child of children) {
      if (child instanceof THREE.Mesh) {
        child.scale.set(thickness, thickness, thickness);
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={context.target}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <mesh material={material}>
        <ringGeometry args={[0.9, 1, 32]} />
      </mesh>
    </group>
  );
}
