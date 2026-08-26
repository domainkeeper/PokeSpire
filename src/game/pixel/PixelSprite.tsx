import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PixelSpriteProps {
  texture: THREE.Texture;
  position: [number, number, number];
  width?: number;
  height?: number;
  anchorY?: number;
  animScale?: boolean;
  animSway?: boolean;
  animWater?: boolean;
}

export function PixelSprite({
  texture,
  position,
  width = 1,
  height = 1,
  anchorY = 0.5,
  animScale = false,
  animSway = false,
  animWater = false,
}: PixelSpriteProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  const baseY = useRef(position[1] + height * anchorY);

  const mat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }, [texture]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    if (animScale) {
      const s = 1 + Math.sin(t * 1.5 + phase.current) * 0.08;
      meshRef.current.scale.set(s, s, s);
    }

    if (animSway) {
      meshRef.current.rotation.z = Math.sin(t * 0.8 + phase.current) * 0.04;
      meshRef.current.rotation.y = Math.sin(t * 0.5 + phase.current * 0.7) * 0.03;
    }

    if (animWater) {
      meshRef.current.position.y = baseY.current + Math.sin(t * 0.6 + phase.current) * 0.04;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], baseY.current, position[2]]}
      material={mat}
      renderOrder={position[2] * 10}
    >
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}
