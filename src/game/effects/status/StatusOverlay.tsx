import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StatusPreset } from '../presets/statusPresets';
import { getAnchorOffset } from './anchors';

interface StatusOverlayProps {
  preset: StatusPreset;
  width?: number;
  height?: number;
}

export const StatusOverlay: React.FC<StatusOverlayProps> = ({
  preset,
  width = 1,
  height = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const offset = getAnchorOffset(preset.anchor, width, height);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (groupRef.current) {
      const bob = Math.sin(elapsedRef.current * 4) * 0.05;
      groupRef.current.position.set(offset[0], offset[1] + bob, offset[2]);
    }
  });

  return (
    <group ref={groupRef} position={offset}>
      <mesh>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial
          color={preset.color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};
