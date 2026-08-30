import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WaveConfig, EffectContext } from './types';
import { battleClock } from '../../battle/presentation/battleClock';

interface WaveEffectProps {
  config: WaveConfig;
  context: EffectContext;
  onComplete?: () => void;
}

/**
 * Sweeping wall — a wide crest that travels from the attacker across the arena.
 *
 * This is the AREA_WAVE silhouette (Surf, Sludge Wave, Heat Wave, Hurricane): the whole
 * screen-width front moves, which reads completely differently from a projectile or a
 * beam even when both use the same type palette.
 */
export function WaveEffect({ config, context, onComplete }: WaveEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  const origin = useMemo(() => new THREE.Vector3(...context.origin), [context.origin]);
  const target = useMemo(() => new THREE.Vector3(...context.target), [context.target]);

  const crestMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [config.color, config.opacity],
  );

  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.glowColor,
        transparent: true,
        opacity: config.opacity * 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [config.glowColor, config.opacity],
  );

  useEffect(
    () => () => {
      crestMat.dispose();
      glowMat.dispose();
    },
    [crestMat, glowMat],
  );

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (doneRef.current || !group) return;

    elapsedRef.current += rawDelta * battleClock.timeScale;
    const t = elapsedRef.current / config.lifetime;

    if (t >= 1) {
      doneRef.current = true;
      group.visible = false;
      onComplete?.();
      return;
    }

    // Travel past the target so the crest visibly exits the far side.
    const travel = -0.15 + t * 1.3;
    const pos = new THREE.Vector3().lerpVectors(origin, target, travel);
    group.position.copy(pos);
    group.lookAt(target.x, pos.y, target.z);

    // Rise, crest, then collapse.
    const rise = t < 0.3 ? t / 0.3 : 1;
    const fall = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
    const h = config.height * rise * fall;
    group.scale.set(config.width, Math.max(0.001, h), 1);

    crestMat.opacity = config.opacity * rise * fall;
    glowMat.opacity = config.opacity * 0.4 * rise * fall;
  });

  return (
    <group ref={groupRef}>
      {/* Crest face, anchored at the ground line. */}
      <mesh material={crestMat} position={[0, 0.5, 0]} renderOrder={23}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh material={glowMat} position={[0, 0.55, -0.06]} scale={[1.12, 1.25, 1]} renderOrder={22}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
