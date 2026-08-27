import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ParticleConfig, EffectContext } from './types';
import { getParticleTexture } from './particleTextures';

interface ParticleState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  scale: number;
  life: number;
  maxLife: number;
  rot: number;
  rotSpeed: number;
}

interface ParticleEffectProps {
  config: ParticleConfig;
  context: EffectContext;
  onComplete?: () => void;
}

const MAX_PARTICLES = 128;

export function ParticleEffect({ config, context, onComplete }: ParticleEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const statesRef = useRef<ParticleState[]>([]);
  const elapsedRef = useRef(0);
  const doneRef = useRef(false);

  const texture = useMemo(
    () => getParticleTexture(config.texture, config.color),
    [config.texture, config.color],
  );

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: config.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      toneMapped: false,
    });
  }, [texture, config.additive]);

  // Initialize particles once per config+context combination
  useEffect(() => {
    const count = Math.min(config.count, MAX_PARTICLES);
    const states: ParticleState[] = [];

    const origin = new THREE.Vector3(...context.origin);
    const dir = new THREE.Vector3(...context.direction).normalize();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * config.spread;
      const speed = config.speed * (1 + (Math.random() - 0.5) * config.speedVariance);

      const spreadDir = new THREE.Vector3(
        dir.x + Math.cos(angle) * config.spread * (0.3 + Math.random() * 0.7),
        dir.y + elevation + Math.sin(angle) * config.spread * 0.3,
        dir.z + Math.sin(angle) * config.spread * (0.3 + Math.random() * 0.7),
      ).normalize();

      const lifetime = config.lifetime * (0.7 + Math.random() * 0.6);
      const scale = config.scale * (0.6 + Math.random() * config.scaleVariance);

      states.push({
        pos: origin.clone().add(spreadDir.clone().multiplyScalar(Math.random() * 0.2)),
        vel: spreadDir.multiplyScalar(speed),
        scale,
        life: 0,
        maxLife: lifetime,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * config.rotationSpeed,
      });
    }

    statesRef.current = states;
    elapsedRef.current = 0;
    doneRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.count, config.lifetime, config.speed, config.speedVariance, config.spread,
      config.scale, config.scaleVariance, config.rotationSpeed, config.gravity,
      config.opacity, config.opacityFade, config.texture, config.color, config.additive,
      context.origin[0], context.origin[1], context.origin[2],
      context.direction[0], context.direction[1], context.direction[2], context.scale]);

  useFrame((_, delta) => {
    if (doneRef.current || !meshRef.current) return;

    elapsedRef.current += delta;
    const states = statesRef.current;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color(config.color);
    const colorEnd = config.colorEnd ? new THREE.Color(config.colorEnd) : null;
    const tmpColor = new THREE.Color();
    let allDead = true;

    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      s.life += delta;

      if (s.life >= s.maxLife) {
        dummy.scale.set(0, 0, 0);
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      allDead = false;
      const t = s.life / s.maxLife;

      // Update position
      s.vel.y -= config.gravity * delta;
      s.pos.addScaledVector(s.vel, delta);
      s.rot += s.rotSpeed * delta;

      // Scale: ease out
      const scaleMult = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) * 0.8 / 0.9;
      const finalScale = s.scale * Math.max(0.01, scaleMult) * context.scale;

      dummy.position.copy(s.pos);
      dummy.scale.set(finalScale, finalScale, finalScale);
      dummy.rotation.set(0, 0, s.rot);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Opacity via color alpha (multiply by opacity config)
      const opacity = config.opacity * (1 - t * config.opacityFade);
      if (colorEnd) {
        tmpColor.lerpColors(color, colorEnd, t);
      } else {
        tmpColor.copy(color);
      }
      tmpColor.multiplyScalar(opacity);
      meshRef.current.setColorAt(i, tmpColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    if (allDead && elapsedRef.current > 0.1) {
      doneRef.current = true;
      onComplete?.();
    }
  });

  const count = Math.min(config.count, MAX_PARTICLES);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      renderOrder={10}
    >
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  );
}
