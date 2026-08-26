import { useMemo } from 'react';
import { getToonMat } from '../fx/ToonMaterial';

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

export function Tree({ position, scale = 1 }: TreeProps) {
  const mats = useMemo(() => ({
    trunk: getToonMat('#6d4c41'),
    trunkDark: getToonMat('#4e342e'),
    foliage1: getToonMat('#2e7d32'),
    foliage2: getToonMat('#43a047'),
    foliage3: getToonMat('#66bb6a'),
  }), []);

  const s = scale;

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.5 * s, 0]} material={mats.trunk} castShadow>
        <cylinderGeometry args={[0.12 * s, 0.18 * s, 1.0 * s, 6]} />
      </mesh>
      <mesh position={[0, 0.5 * s, 0]} material={mats.trunkDark} castShadow>
        <cylinderGeometry args={[0.13 * s, 0.19 * s, 1.0 * s, 6]} />
      </mesh>

      {/* Foliage - layered spheres */}
      <mesh position={[0, 1.4 * s, 0]} material={mats.foliage1} castShadow>
        <sphereGeometry args={[0.7 * s, 8, 6]} />
      </mesh>
      <mesh position={[0.2 * s, 1.6 * s, 0.1 * s]} material={mats.foliage2} castShadow>
        <sphereGeometry args={[0.55 * s, 8, 6]} />
      </mesh>
      <mesh position={[-0.15 * s, 1.8 * s, -0.1 * s]} material={mats.foliage3} castShadow>
        <sphereGeometry args={[0.4 * s, 8, 6]} />
      </mesh>
      <mesh position={[0, 2.0 * s, 0.15 * s]} material={mats.foliage2} castShadow>
        <sphereGeometry args={[0.3 * s, 8, 6]} />
      </mesh>
    </group>
  );
}

export function SmallTree({ position, scale = 1 }: TreeProps) {
  const mats = useMemo(() => ({
    trunk: getToonMat('#8d6e63'),
    foliage1: getToonMat('#388e3c'),
    foliage2: getToonMat('#66bb6a'),
  }), []);

  const s = scale;

  return (
    <group position={position}>
      <mesh position={[0, 0.35 * s, 0]} material={mats.trunk} castShadow>
        <cylinderGeometry args={[0.08 * s, 0.12 * s, 0.7 * s, 6]} />
      </mesh>
      <mesh position={[0, 0.9 * s, 0]} material={mats.foliage1} castShadow>
        <sphereGeometry args={[0.5 * s, 8, 6]} />
      </mesh>
      <mesh position={[0.1 * s, 1.1 * s, 0.05 * s]} material={mats.foliage2} castShadow>
        <sphereGeometry args={[0.35 * s, 8, 6]} />
      </mesh>
    </group>
  );
}
