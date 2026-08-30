import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ParticleConfig, EffectContext } from './types';
import { getParticleTexture } from './particleTextures';
import { useQualityStore } from './quality/qualityStore';
import { battleClock } from '../../battle/presentation/battleClock';

interface ParticleState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  home: THREE.Vector3;
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

const MAX_PARTICLES = 160;

export function ParticleEffect({ config, context, onComplete }: ParticleEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const statesRef = useRef<ParticleState[]>([]);
  const doneRef = useRef(false);
  const particleScale = useQualityStore((s) => s.particleScale);

  // Quality tier scales the count, never the visual language.
  const count = Math.max(1, Math.min(MAX_PARTICLES, Math.round(config.count * particleScale)));

  const texture = useMemo(
    () => getParticleTexture(config.texture, config.color),
    [config.texture, config.color],
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: config.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped: false,
      }),
    [texture, config.additive],
  );

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const states: ParticleState[] = [];
    const dir = new THREE.Vector3(...context.direction).normalize();
    const bias = config.directionBias ?? 0;

    for (let i = 0; i < count; i++) {
      // Uniform-ish sphere sample, then blended toward the attack direction.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radial = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi) * 0.7,
        Math.sin(phi) * Math.sin(theta),
      );
      const heading = radial.clone().lerp(dir, bias).normalize();
      const speed = config.speed * (1 + (Math.random() - 0.5) * config.speedVariance);
      const lifetime = config.lifetime * (0.7 + Math.random() * 0.6);
      const scale = config.scale * (0.6 + Math.random() * config.scaleVariance);

      if (config.converge) {
        // Charge-up: start out on a shell and fall inward.
        const start = heading.clone().multiplyScalar(config.spread * (0.7 + Math.random() * 0.6));
        states.push({
          pos: start,
          vel: start.clone().multiplyScalar(-speed / Math.max(0.01, config.spread)),
          home: new THREE.Vector3(0, 0, 0),
          scale,
          life: 0,
          maxLife: lifetime,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * config.rotationSpeed,
        });
      } else {
        states.push({
          pos: heading.clone().multiplyScalar(Math.random() * 0.12),
          vel: heading.clone().multiplyScalar(speed).addScaledVector(
            new THREE.Vector3(
              (Math.random() - 0.5) * config.spread,
              (Math.random() - 0.5) * config.spread,
              (Math.random() - 0.5) * config.spread,
            ),
            1,
          ),
          home: new THREE.Vector3(0, 0, 0),
          scale,
          life: 0,
          maxLife: lifetime,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * config.rotationSpeed,
        });
      }
    }

    statesRef.current = states;
    doneRef.current = false;
  }, [
    count, config.lifetime, config.speed, config.speedVariance, config.spread,
    config.scale, config.scaleVariance, config.rotationSpeed, config.converge,
    config.directionBias,
    context.direction[0], context.direction[1], context.direction[2],
  ]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorA = useMemo(() => new THREE.Color(config.color), [config.color]);
  const colorB = useMemo(
    () => (config.colorEnd ? new THREE.Color(config.colorEnd) : null),
    [config.colorEnd],
  );
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (doneRef.current || !mesh) return;

    // Particles freeze during hit-stop; that is what sells the impact beat.
    const delta = rawDelta * battleClock.timeScale;
    if (delta <= 0) return;

    const states = statesRef.current;
    let alive = false;

    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      s.life += delta;

      if (s.life >= s.maxLife) {
        dummy.position.set(0, 0, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      alive = true;
      const t = s.life / s.maxLife;

      s.vel.y -= config.gravity * delta;
      s.pos.addScaledVector(s.vel, delta);
      s.rot += s.rotSpeed * delta;

      // Fast pop-in, long ease-out.
      const grow = t < 0.12 ? t / 0.12 : 1;
      const shrink = 1 - Math.max(0, (t - 0.12) / 0.88) * 0.75;
      const finalScale = Math.max(0.001, s.scale * grow * shrink * context.scale);

      dummy.position.copy(s.pos);
      dummy.scale.setScalar(finalScale);
      dummy.rotation.set(0, 0, s.rot);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const opacity = Math.max(0, config.opacity * (1 - t * config.opacityFade));
      if (colorB) tmp.lerpColors(colorA, colorB, t);
      else tmp.copy(colorA);
      tmp.multiplyScalar(opacity);
      mesh.setColorAt(i, tmp);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (!alive) {
      doneRef.current = true;
      onComplete?.();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false} renderOrder={30}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  );
}
