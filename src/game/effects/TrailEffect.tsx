import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TrailConfig } from './types';

interface TrailEffectProps {
  config: TrailConfig;
  getPosition: () => THREE.Vector3;
}

export const TrailEffect: React.FC<TrailEffectProps> = ({
  config,
  getPosition,
}) => {
  const pointsRef = useRef<THREE.Vector3[]>([]);
  const lineGeometryRef = useRef<THREE.BufferGeometry>(null);

  const maxPoints = config.maxLength;

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.8,
      blending: config.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      toneMapped: false,
    });
  }, [config.color, config.additive]);

  useFrame(() => {
    const currentPos = getPosition();
    pointsRef.current.unshift(currentPos.clone());
    if (pointsRef.current.length > maxPoints) {
      pointsRef.current.pop();
    }

    if (lineGeometryRef.current && pointsRef.current.length >= 2) {
      lineGeometryRef.current.setFromPoints(pointsRef.current);
    }
  });

  return (
    <line>
      <bufferGeometry ref={lineGeometryRef} />
      <primitive object={material} attach="material" />
    </line>
  );
};
