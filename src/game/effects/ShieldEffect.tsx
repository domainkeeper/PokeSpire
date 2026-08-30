import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ShieldConfig } from './types';
import { battleClock } from '../../battle/presentation/battleClock';

interface ShieldEffectProps {
  config: ShieldConfig;
  /** Pulse the shield (called when it actually absorbs a hit). */
  pulseRef?: { current: number };
  onComplete?: () => void;
}

/**
 * Guard shield — a faceted dome that snaps into existence, holds, and flares when it
 * absorbs. Guard is a real strategic action, so it needs its own readable silhouette
 * rather than a generic ring.
 */
export function ShieldEffect({ config, pulseRef, onComplete }: ShieldEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);
  const pulseSeen = useRef(0);
  const pulseTime = useRef(-1);

  const shellMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity * 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [config.color, config.opacity],
  );

  const wireMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity * 0.8,
        wireframe: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [config.color, config.opacity],
  );

  useEffect(
    () => () => {
      shellMat.dispose();
      wireMat.dispose();
    },
    [shellMat, wireMat],
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

    // Snap in over 120ms, hold, then dissolve.
    const inT = Math.min(1, elapsedRef.current / 0.12);
    const holdEnd = 0.12 + config.holdSec;
    const outT =
      elapsedRef.current > holdEnd
        ? Math.min(1, (elapsedRef.current - holdEnd) / Math.max(0.001, config.lifetime - holdEnd))
        : 0;

    // Overshoot on entry so it reads as a snap.
    const scale = config.radius * (inT < 1 ? 1.18 * (1 - Math.pow(1 - inT, 3)) : 1) * (1 - outT * 0.12);

    // Absorb flare.
    if (pulseRef && pulseRef.current !== pulseSeen.current) {
      pulseSeen.current = pulseRef.current;
      pulseTime.current = elapsedRef.current;
    }
    let flare = 0;
    if (pulseTime.current >= 0) {
      const since = elapsedRef.current - pulseTime.current;
      flare = since < 0.22 ? Math.sin((since / 0.22) * Math.PI) : 0;
    }

    group.scale.set(scale * (1 + flare * 0.14), scale * (1 + flare * 0.14), scale * 0.6);
    group.rotation.y += rawDelta * 0.5 * battleClock.timeScale;

    const alpha = inT * (1 - outT);
    shellMat.opacity = config.opacity * (0.28 + flare * 0.5) * alpha;
    wireMat.opacity = config.opacity * (0.55 + flare * 0.45) * alpha;
  });

  return (
    <group ref={groupRef} renderOrder={25}>
      <mesh material={shellMat} renderOrder={25}>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      <mesh material={wireMat} scale={1.02} renderOrder={26}>
        <icosahedronGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
