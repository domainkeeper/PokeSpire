import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WATER_GRADIENT } from '../../utils/toonMaterials';

interface WaterProps {
  position: [number, number, number];
  width?: number;
  height?: number;
}

export function Water({ position, width = 1, height = 1 }: WaterProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const geo = meshRef.current.geometry as THREE.PlaneGeometry;
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin(state.clock.elapsedTime * 2 + x * 3 + y * 3) * 0.03);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height, 8, 8]} />
      <meshToonMaterial color="#29b6f6" gradientMap={WATER_GRADIENT} transparent opacity={0.8} />
    </mesh>
  );
}
