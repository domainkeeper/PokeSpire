import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BeamConfig, EffectContext } from './types';
import { battleClock } from '../../battle/presentation/battleClock';

interface BeamEffectProps {
  config: BeamConfig;
  context: EffectContext;
  onComplete?: () => void;
}

/**
 * Sustained beam: extends from the muzzle to the target, holds, then retracts.
 *
 * Built as a segmented ribbon rather than a stretched box so it can wobble (electric,
 * dragon) and taper, and so the glow shell reads correctly from the fixed battle
 * camera angle.
 */
export function BeamEffect({ config, context, onComplete }: BeamEffectProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  const origin = useMemo(() => new THREE.Vector3(...context.origin), [context.origin]);
  const target = useMemo(() => new THREE.Vector3(...context.target), [context.target]);
  const fullLength = useMemo(() => origin.distanceTo(target), [origin, target]);
  const segments = Math.max(2, config.segments);

  const coreMat = useMemo(
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
        opacity: config.opacity * 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [config.glowColor, config.opacity],
  );

  useEffect(() => {
    return () => {
      coreMat.dispose();
      glowMat.dispose();
    };
  }, [coreMat, glowMat]);

  // A tube along +Z that the group aims at the target.
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 12, segments, true);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, 0.5); // origin at the muzzle end
    return g;
  }, [segments]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const extendRatio = config.extendRatio ?? 0.25;

  useFrame((_, rawDelta) => {
    if (doneRef.current || !groupRef.current) return;

    elapsedRef.current += rawDelta * battleClock.timeScale;
    const t = elapsedRef.current / config.lifetime;

    if (t >= 1) {
      doneRef.current = true;
      groupRef.current.visible = false;
      onComplete?.();
      return;
    }

    // Extend -> sustain -> retract.
    let lengthFactor: number;
    let opacityFactor: number;
    if (t < extendRatio) {
      const e = t / extendRatio;
      lengthFactor = 1 - (1 - e) * (1 - e);
      opacityFactor = e;
    } else if (t < 0.75) {
      lengthFactor = 1;
      opacityFactor = 1;
    } else {
      const e = (t - 0.75) / 0.25;
      lengthFactor = 1;
      opacityFactor = 1 - e;
    }

    const length = Math.max(0.001, fullLength * lengthFactor);

    // Width pulses so a sustained beam never looks like a static bar.
    const pulse = 1 + Math.sin(elapsedRef.current * 42) * 0.09;
    const width = config.width * pulse;

    groupRef.current.position.copy(origin);
    groupRef.current.lookAt(target);
    if (config.wobble) {
      groupRef.current.rotation.z += Math.sin(elapsedRef.current * 30) * config.wobble;
    }

    if (coreRef.current) coreRef.current.scale.set(width, width, length);
    if (glowRef.current) glowRef.current.scale.set(width * 2.1, width * 2.1, length * 0.995);

    coreMat.opacity = config.opacity * opacityFactor;
    glowMat.opacity = config.opacity * 0.45 * opacityFactor;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={glowRef} geometry={geometry} material={glowMat} renderOrder={26} />
      <mesh ref={coreRef} geometry={geometry} material={coreMat} renderOrder={27} />
    </group>
  );
}
