import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BeamConfig, EffectContext } from './types';

interface BeamEffectProps {
  config: BeamConfig;
  context: EffectContext;
  onComplete?: () => void;
}

export function BeamEffect({ config, context, onComplete }: BeamEffectProps) {
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
      toneMapped: false,
    });
  }, [config.color, config.opacity]);

  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: config.glowColor,
      transparent: true,
      opacity: config.opacity * 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
  }, [config.glowColor, config.opacity]);

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

    // Animate beam: grow from origin to target, then fade
    const growT = Math.min(1, t * 2);
    const fadeT = t > 0.5 ? (t - 0.5) * 2 : 0;

    material.opacity = config.opacity * (1 - fadeT);
    glowMaterial.opacity = config.opacity * 0.5 * (1 - fadeT);

    const origin = new THREE.Vector3(...context.origin);
    const target = new THREE.Vector3(...context.target);
    const dir = target.clone().sub(origin);
    const length = dir.length() * growT;

    // Position at midpoint of the grown beam
    const midpoint = origin.clone().add(dir.normalize().multiplyScalar(length * 0.5));
    groupRef.current.position.copy(midpoint);
    groupRef.current.lookAt(target);
    groupRef.current.scale.set(config.width, config.width, length);
  });

  return (
    <group ref={groupRef}>
      {/* Core beam */}
      <mesh material={material}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      {/* Glow */}
      <mesh material={glowMaterial} scale={[1.3, 1.3, 1.01]}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
    </group>
  );
}
