import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getToonMat } from '../fx/ToonMaterial';

interface CharacterColors {
  hair: string;
  skin: string;
  jacket: string;
  jacketAccent: string;
  shorts: string;
  shoe: string;
  eye: string;
  eyeHighlight: string;
  mouth: string;
}

const DEFAULT_COLORS: CharacterColors = {
  hair: '#4e342e',
  skin: '#ffcc80',
  jacket: '#1e88e5',
  jacketAccent: '#e3f2fd',
  shorts: '#0d47a1',
  shoe: '#c62828',
  eye: '#1a237e',
  eyeHighlight: '#e8eaf6',
  mouth: '#e57373',
};

export interface Character3DProps {
  isWalking: boolean;
  walkPhase: number;
  colors?: Partial<CharacterColors>;
  headScale?: number;
}

export function Character3D({
  isWalking,
  walkPhase,
  colors: c = {},
  headScale = 1,
}: Character3DProps) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const col = { ...DEFAULT_COLORS, ...c };

  const mats = useMemo(() => ({
    hair: getToonMat(col.hair),
    skin: getToonMat(col.skin),
    jacket: getToonMat(col.jacket),
    jacketAccent: getToonMat(col.jacketAccent),
    shorts: getToonMat(col.shorts),
    shoe: getToonMat(col.shoe),
    eye: getToonMat(col.eye),
    eyeHighlight: getToonMat(col.eyeHighlight),
    mouth: getToonMat(col.mouth),
  }), [col]);

  useFrame(() => {
    if (isWalking) {
      const swing = Math.sin(walkPhase * 8) * 0.5;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6;
      if (headRef.current) headRef.current.position.y = 1.35 + Math.abs(Math.sin(walkPhase * 8)) * 0.03;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (headRef.current) headRef.current.position.y = 1.35 + Math.sin(Date.now() * 0.002) * 0.01;
    }
  });

  const hs = 0.42 * headScale;

  return (
    <group>
      {/* Head */}
      <group ref={headRef} position={[0, 1.35, 0]}>
        <mesh position={[0, 0.05, -0.05]} material={mats.hair}>
          <boxGeometry args={[hs * 2.1, hs * 2.1, hs * 1.8]} />
        </mesh>
        <mesh position={[0, 0.15, hs * 0.7]} material={mats.hair}>
          <boxGeometry args={[hs * 2.2, hs * 0.8, hs * 0.4]} />
        </mesh>
        <mesh position={[-hs * 0.9, 0, 0]} material={mats.hair}>
          <boxGeometry args={[hs * 0.5, hs * 1.8, hs * 1.6]} />
        </mesh>
        <mesh position={[hs * 0.9, 0, 0]} material={mats.hair}>
          <boxGeometry args={[hs * 0.5, hs * 1.8, hs * 1.6]} />
        </mesh>
        <mesh position={[0, -0.02, hs * 0.55]} material={mats.skin}>
          <boxGeometry args={[hs * 1.8, hs * 1.6, hs * 0.8]} />
        </mesh>
        <mesh position={[-hs * 0.45, 0.02, hs * 1.0]} material={mats.eye}>
          <boxGeometry args={[hs * 0.55, hs * 0.5, 0.05]} />
        </mesh>
        <mesh position={[hs * 0.45, 0.02, hs * 1.0]} material={mats.eye}>
          <boxGeometry args={[hs * 0.55, hs * 0.5, 0.05]} />
        </mesh>
        <mesh position={[-hs * 0.35, 0.08, hs * 1.05]} material={mats.eyeHighlight}>
          <boxGeometry args={[hs * 0.2, hs * 0.2, 0.03]} />
        </mesh>
        <mesh position={[hs * 0.55, 0.08, hs * 1.05]} material={mats.eyeHighlight}>
          <boxGeometry args={[hs * 0.2, hs * 0.2, 0.03]} />
        </mesh>
        <mesh position={[0, -hs * 0.35, hs * 1.0]} material={mats.mouth}>
          <boxGeometry args={[hs * 0.35, hs * 0.12, 0.03]} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 1.08, 0]} material={mats.skin}>
        <boxGeometry args={[0.15, 0.1, 0.15]} />
      </mesh>

      {/* Body / Jacket */}
      <mesh position={[0, 0.75, 0]} material={mats.jacket}>
        <boxGeometry args={[0.5, 0.55, 0.3]} />
      </mesh>
      <mesh position={[0, 0.95, 0.12]} material={mats.jacketAccent}>
        <boxGeometry args={[0.4, 0.12, 0.1]} />
      </mesh>

      {/* Left Arm */}
      <group position={[-0.35, 0.85, 0]} ref={leftArmRef}>
        <mesh position={[0, -0.2, 0]} material={mats.jacket}>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={mats.skin}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[0.35, 0.85, 0]} ref={rightArmRef}>
        <mesh position={[0, -0.2, 0]} material={mats.jacket}>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={mats.skin}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
        </mesh>
      </group>

      {/* Shorts / Belt */}
      <mesh position={[0, 0.42, 0]} material={mats.shorts}>
        <boxGeometry args={[0.48, 0.2, 0.28]} />
      </mesh>

      {/* Left Leg */}
      <group position={[-0.13, 0.25, 0]} ref={leftLegRef}>
        <mesh position={[0, -0.05, 0]} material={mats.skin}>
          <boxGeometry args={[0.16, 0.3, 0.16]} />
        </mesh>
        <mesh position={[0, -0.22, 0.02]} material={mats.shoe}>
          <boxGeometry args={[0.18, 0.1, 0.22]} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.13, 0.25, 0]} ref={rightLegRef}>
        <mesh position={[0, -0.05, 0]} material={mats.skin}>
          <boxGeometry args={[0.16, 0.3, 0.16]} />
        </mesh>
        <mesh position={[0, -0.22, 0.02]} material={mats.shoe}>
          <boxGeometry args={[0.18, 0.1, 0.22]} />
        </mesh>
      </group>
    </group>
  );
}
