import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_GRADIENT, TRUNK_GRADIENT } from '../../utils/toonMaterials';

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

export function Tree({ position, scale = 1 }: TreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + phase) * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.5, 6]} />
        <meshToonMaterial color="#8d6e63" gradientMap={TRUNK_GRADIENT} />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[0.9, 1.8, 6]} />
        <meshToonMaterial color="#2e7d32" gradientMap={TREE_GRADIENT} />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.6, 1.3, 6]} />
        <meshToonMaterial color="#1b5e20" gradientMap={TREE_GRADIENT} />
      </mesh>
    </group>
  );
}

export function SmallTree({ position }: { position: [number, number, number] }) {
  return <Tree position={position} scale={0.6} />;
}
