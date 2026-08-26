import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NPC_GRADIENT, SKIN_GRADIENT } from '../../utils/toonMaterials';

interface NPCProps {
  position: [number, number, number];
  name?: string;
}

export function NPC({ position, name: _name }: NPCProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.35, 8, 16]} />
        <meshToonMaterial color="#7b1fa2" gradientMap={NPC_GRADIENT} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshToonMaterial color="#ffcc80" gradientMap={SKIN_GRADIENT} />
      </mesh>
      <mesh position={[0, 1.12, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.15, 8]} />
        <meshToonMaterial color="#4a148c" gradientMap={NPC_GRADIENT} />
      </mesh>
    </group>
  );
}
