import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FlashEffectProps {
  color: string;
  duration: number;
  intensity?: number;
  onComplete?: () => void;
}

export function FlashEffect({ color, duration, intensity = 0.6, onComplete }: FlashEffectProps) {
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: intensity,
      depthWrite: false,
      toneMapped: false,
    });
  }, [color, intensity]);

  useEffect(() => {
    elapsedRef.current = 0;
    doneRef.current = false;
  }, [color, duration, intensity]);

  useFrame((_, delta) => {
    if (doneRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current / duration;

    if (t >= 1) {
      doneRef.current = true;
      material.opacity = 0;
      onComplete?.();
      return;
    }

    // Quick flash: rise fast, fall slow
    material.opacity = t < 0.15
      ? intensity * (t / 0.15)
      : intensity * (1 - (t - 0.15) / 0.85);
  });

  return (
    <mesh position={[0, 0, -5]} renderOrder={100}>
      <planeGeometry args={[50, 50]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
