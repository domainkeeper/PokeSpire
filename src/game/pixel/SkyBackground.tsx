import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeSkyBackground, makeRouteBackground } from './Background';

interface SkyBackgroundProps {
  type: 'town' | 'route';
}

export function SkyBackground({ type }: SkyBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const tex = useMemo(() => {
    return type === 'town' ? makeSkyBackground() : makeRouteBackground();
  }, [type]);

  const mat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    });
  }, [tex]);

  useFrame(() => {
    // reserved for future cloud parallax
  });

  return (
    <mesh ref={meshRef} position={[0, 8, -20]} renderOrder={-1000}>
      <planeGeometry args={[50, 15]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
