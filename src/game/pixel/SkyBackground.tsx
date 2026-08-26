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
    if (meshRef.current) {
      meshRef.current.rotation.y = 0;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 10, -15]} renderOrder={-1000}>
        <planeGeometry args={[60, 20]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[0, 10, 30]} renderOrder={-1000}>
        <planeGeometry args={[60, 20]} />
        <primitive object={mat.clone()} attach="material" />
      </mesh>
    </group>
  );
}
