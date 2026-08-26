import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLOWER_GRADIENT } from '../../utils/toonMaterials';

interface FlowerProps {
  position: [number, number, number];
}

export function Flower({ position }: FlowerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + phase) * 0.08;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8 + phase) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshToonMaterial color="#4caf50" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshToonMaterial color="#f48fb1" gradientMap={FLOWER_GRADIENT} />
      </mesh>
    </group>
  );
}

interface GrassTuftProps {
  position: [number, number, number];
}

export function GrassTuft({ position }: GrassTuftProps) {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + phase) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.12, 0]}>
        <coneGeometry args={[0.06, 0.24, 4]} />
        <meshToonMaterial color="#66bb6a" />
      </mesh>
      <mesh position={[0.06, 0.1, 0.03]}>
        <coneGeometry args={[0.05, 0.2, 4]} />
        <meshToonMaterial color="#81c784" />
      </mesh>
      <mesh position={[-0.05, 0.1, -0.02]}>
        <coneGeometry args={[0.05, 0.18, 4]} />
        <meshToonMaterial color="#a5d6a7" />
      </mesh>
    </group>
  );
}
