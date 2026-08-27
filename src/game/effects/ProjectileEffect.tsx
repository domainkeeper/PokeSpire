import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProjectileConfig, EffectContext } from './types';
import { TrailEffect } from './TrailEffect';

interface ProjectileEffectProps {
  config: ProjectileConfig;
  context: EffectContext;
  onArrive?: () => void;
}

export const ProjectileEffect: React.FC<ProjectileEffectProps> = ({
  config,
  context,
  onArrive,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);
  const arrivedRef = useRef(false);

  const origin = useMemoVector(context.origin);
  const target = useMemoVector(context.target);
  const distance = origin.distanceTo(target);
  const duration = distance / Math.max(1, config.speed);

  const currentPosRef = useRef(new THREE.Vector3().copy(origin));

  useFrame((_, delta) => {
    if (arrivedRef.current) return;

    elapsedRef.current += delta;
    const t = Math.min(1, elapsedRef.current / duration);

    // Lerp position with arc height
    const pos = new THREE.Vector3().lerpVectors(origin, target, t);
    pos.y += Math.sin(t * Math.PI) * config.arcHeight;
    currentPosRef.current.copy(pos);

    if (meshRef.current) {
      meshRef.current.position.copy(pos);
    }

    if (t >= 1) {
      arrivedRef.current = true;
      onArrive?.();
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={context.origin}>
        <sphereGeometry args={[config.coreScale, 16, 16]} />
        <meshBasicMaterial
          color={config.coreColor}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <TrailEffect
        config={{
          maxLength: config.trailLength,
          width: config.trailWidth,
          color: config.trailColor,
          fadeOut: 0.8,
          additive: true,
        }}
        getPosition={() => currentPosRef.current}
      />
    </group>
  );
};

function useMemoVector(arr: [number, number, number]) {
  return React.useMemo(() => new THREE.Vector3(...arr), [arr[0], arr[1], arr[2]]);
}
