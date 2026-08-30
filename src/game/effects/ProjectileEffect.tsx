import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProjectileConfig, EffectContext } from './types';
import { TrailEffect } from './TrailEffect';
import { battleClock } from '../../battle/presentation/battleClock';
import { useQualityStore } from './quality/qualityStore';

interface ProjectileEffectProps {
  config: ProjectileConfig;
  context: EffectContext;
  onArrive?: () => void;
}

/**
 * A travelling projectile core plus trail.
 *
 * Flight time is an explicit `durationSec` supplied by the director from the TRAVEL
 * stage length, so arrival lands on the IMPACT beat by construction. `onArrive` is
 * cosmetic only - it is never on the logic path, which removes the arrival race the
 * old system had to guard against.
 */
export function ProjectileEffect({ config, context, onArrive }: ProjectileEffectProps) {
  const coreRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const arrivedRef = useRef(false);
  const enableTrails = useQualityStore((s) => s.enableTrails);

  const origin = useMemo(() => new THREE.Vector3(...context.origin), [context.origin]);
  const target = useMemo(() => new THREE.Vector3(...context.target), [context.target]);
  const currentPos = useRef(new THREE.Vector3().copy(origin));
  const duration = Math.max(0.03, config.durationSec);

  useEffect(() => {
    elapsedRef.current = 0;
    arrivedRef.current = false;
    currentPos.current.copy(origin);
  }, [origin]);

  useFrame((_, rawDelta) => {
    if (!coreRef.current) return;

    if (!arrivedRef.current) {
      elapsedRef.current += rawDelta * battleClock.timeScale;
      const t = Math.min(1, elapsedRef.current / duration);

      // Slight ease-in so the projectile accelerates out of the muzzle.
      const eased = t * t * 0.25 + t * 0.75;
      const pos = new THREE.Vector3().lerpVectors(origin, target, eased);
      pos.y += Math.sin(eased * Math.PI) * config.arcHeight;
      currentPos.current.copy(pos);
      coreRef.current.position.copy(pos);

      if (config.spin) coreRef.current.rotation.z += config.spin * rawDelta * battleClock.timeScale;

      if (t >= 1) {
        arrivedRef.current = true;
        coreRef.current.visible = false;
        onArrive?.();
      }
    }
  });

  return (
    <group>
      <group ref={coreRef} position={context.origin}>
        {/* Hot inner core */}
        <mesh renderOrder={32}>
          <sphereGeometry args={[config.coreScale, 12, 12]} />
          <meshBasicMaterial
            color={config.coreColor}
            transparent
            opacity={1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Soft outer glow */}
        <mesh renderOrder={31}>
          <sphereGeometry args={[config.coreScale * 2.1, 12, 12]} />
          <meshBasicMaterial
            color={config.trailColor}
            transparent
            opacity={0.32}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {enableTrails && (
        <TrailEffect
          config={{
            maxLength: config.trailLength,
            width: config.trailWidth,
            color: config.trailColor,
            fadeOut: 0.85,
            additive: true,
          }}
          getPosition={() => currentPos.current}
          active={() => !arrivedRef.current}
        />
      )}
    </group>
  );
}
