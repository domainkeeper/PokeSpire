import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TrailConfig } from './types';
import { battleClock } from '../../battle/presentation/battleClock';

interface TrailEffectProps {
  config: TrailConfig;
  getPosition: () => THREE.Vector3;
  /** While false, the trail stops sampling and drains. */
  active?: () => boolean;
}

const MAX_POINTS = 32;

/**
 * Ribbon trail behind a moving emitter.
 *
 * Built as a camera-facing triangle strip that tapers and fades along its length; a
 * `THREE.Line` (the previous implementation) is 1px wide on every GPU and reads as a
 * hairline rather than a trail.
 */
export function TrailEffect({ config, getPosition, active }: TrailEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const points = useRef<THREE.Vector3[]>([]);
  const maxPoints = Math.max(3, Math.min(MAX_POINTS, config.maxLength * 3));

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 2 * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 2 * 3), 3));
    const indices: number[] = [];
    for (let i = 0; i < maxPoints - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setIndex(indices);
    return g;
  }, [maxPoints]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.color,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: config.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped: false,
      }),
    [config.color, config.additive],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const base = useMemo(() => new THREE.Color(config.color), [config.color]);

  useFrame(({ camera }, rawDelta) => {
    if (!meshRef.current) return;
    if (rawDelta * battleClock.timeScale <= 0) return;

    const isActive = active ? active() : true;
    if (isActive) {
      points.current.unshift(getPosition().clone());
    }
    while (points.current.length > maxPoints) points.current.pop();
    if (!isActive && points.current.length > 0) points.current.pop();

    const pts = points.current;
    if (pts.length < 2) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const camDir = camera.position.clone().sub(pts[0]).normalize();
    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();

    for (let i = 0; i < maxPoints; i++) {
      const clamped = Math.min(i, pts.length - 1);
      const p = pts[clamped];
      const next = pts[Math.min(clamped + 1, pts.length - 1)];
      tangent.copy(next).sub(p);
      if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
      side.crossVectors(tangent, camDir).normalize();

      // Taper from the head to the tail.
      const along = i / (maxPoints - 1);
      const halfWidth = config.width * (1 - along) * 0.5;
      const fade = Math.pow(1 - along, config.fadeOut) * (clamped < pts.length ? 1 : 0);

      const a = i * 2;
      posAttr.setXYZ(a, p.x + side.x * halfWidth, p.y + side.y * halfWidth, p.z + side.z * halfWidth);
      posAttr.setXYZ(a + 1, p.x - side.x * halfWidth, p.y - side.y * halfWidth, p.z - side.z * halfWidth);
      colAttr.setXYZ(a, base.r * fade, base.g * fade, base.b * fade);
      colAttr.setXYZ(a + 1, base.r * fade, base.g * fade, base.b * fade);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={29} />;
}
