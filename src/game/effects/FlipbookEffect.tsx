import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FlipbookConfig, EffectContext } from './types';

interface FlipbookEffectProps {
  sheet: string; // e.g. 'slash' or 'impact'
  config: FlipbookConfig;
  context: EffectContext;
  onComplete?: () => void;
}

export const FlipbookEffect: React.FC<FlipbookEffectProps> = ({
  sheet,
  config,
  context,
  onComplete,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);
  const frameRef = useRef(0);
  const doneRef = useRef(false);

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(`/assets/vfx/${sheet}.png`);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.repeat.set(1 / config.frames, 1);
    return tex;
  }, [sheet, config.frames]);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: config.opacity,
      blending: config.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      toneMapped: false,
    });
  }, [texture, config.opacity, config.additive]);

  useFrame((_, delta) => {
    if (doneRef.current) return;

    elapsedRef.current += delta;
    const totalDuration = config.frames / config.fps;
    const t = elapsedRef.current / totalDuration;

    if (t >= 1) {
      if (!config.loop) {
        doneRef.current = true;
        onComplete?.();
        return;
      }
      elapsedRef.current = 0;
    }

    const currentFrame = Math.min(
      config.frames - 1,
      Math.floor(elapsedRef.current * config.fps)
    );

    if (currentFrame !== frameRef.current) {
      frameRef.current = currentFrame;
      texture.offset.x = currentFrame / config.frames;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={context.target}
      scale={[config.scale, config.scale, 1]}
    >
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};
