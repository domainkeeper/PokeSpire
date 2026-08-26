import { useMemo } from 'react';
import * as THREE from 'three';
import { makeCanvas, createPixelTexture } from '../pixel/PixelCanvas';

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

function makeLeafTexture(baseColor: string, lightColor: string, darkColor: string, size: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size, size);
  ctx.imageSmoothingEnabled = false;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= r) continue;

      const angle = Math.atan2(dy, dx);
      const edgeNoise = Math.sin(angle * 5) * 2 + Math.cos(angle * 3) * 1.5;
      const effectiveR = r + edgeNoise;

      if (dist > effectiveR) continue;

      const noise = ((x * 7 + y * 13 + (size | 0)) % 9);
      if (noise < 2) {
        ctx.fillStyle = lightColor;
      } else if (noise < 5) {
        ctx.fillStyle = baseColor;
      } else {
        ctx.fillStyle = darkColor;
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const edgeR = r - 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < edgeR) continue;

      const angle = Math.atan2(dy, dx);
      const edgeNoise = Math.sin(angle * 5) * 2 + Math.cos(angle * 3) * 1.5;
      const effectiveR = r + edgeNoise;

      if (dist >= effectiveR - 1 && dist < effectiveR) {
        const edgeBlend = (dist - (effectiveR - 1));
        if (edgeBlend > 0.5) {
          ctx.clearRect(x, y, 1, 1);
        }
      }
    }
  }

  return createPixelTexture(c, `leaf-${baseColor}-${size}`);
}

function makeTrunkTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 16);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 8; x++) {
      const noise = (x * 3 + y * 7) % 5;
      if (x === 0 || x === 7) {
        ctx.fillStyle = '#3e2723';
      } else if (noise < 1) {
        ctx.fillStyle = '#5d4037';
      } else if (noise < 2) {
        ctx.fillStyle = '#6d4c41';
      } else {
        ctx.fillStyle = '#4e342e';
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return createPixelTexture(c, 'trunk-v2');
}

function makeSmallLeafTexture(baseColor: string, lightColor: string, darkColor: string, size: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size, size);
  ctx.imageSmoothingEnabled = false;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= r) continue;

      const angle = Math.atan2(dy, dx);
      const edgeNoise = Math.sin(angle * 4) * 1.5;
      const effectiveR = r + edgeNoise;

      if (dist > effectiveR) continue;

      const noise = ((x * 5 + y * 11 + (size | 0)) % 7);
      if (noise < 2) {
        ctx.fillStyle = lightColor;
      } else if (noise < 4) {
        ctx.fillStyle = baseColor;
      } else {
        ctx.fillStyle = darkColor;
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return createPixelTexture(c, `sleaf-${baseColor}-${size}`);
}

export function Tree({ position, scale = 1 }: TreeProps) {
  const s = scale;
  const trunkTex = useMemo(() => makeTrunkTexture(), []);
  const leafTex1 = useMemo(() => makeLeafTexture('#3a6a3a', '#5a8a5a', '#2a5a2a', 32), []);
  const leafTex2 = useMemo(() => makeLeafTexture('#3e6e3e', '#5e8e5e', '#2e5e2e', 26), []);
  const leafTex3 = useMemo(() => makeLeafTexture('#427242', '#629262', '#326232', 22), []);

  const leafMats = useMemo(() => {
    const makeMat = (tex: THREE.Texture) => new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.85,
      metalness: 0,
    });
    return {
      main: makeMat(leafTex1),
      side1: makeMat(leafTex2),
      side2: makeMat(leafTex3),
      top: makeMat(leafTex2),
    };
  }, [leafTex1, leafTex2, leafTex3]);

  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: trunkTex,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    roughness: 0.9,
    metalness: 0,
  }), [trunkTex]);

  return (
    <group position={position}>
      <mesh position={[0, 0.5 * s, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06 * s, 0.09 * s, 1.0 * s, 6]} />
        <primitive object={trunkMat} attach="material" />
      </mesh>

      <mesh position={[0, 1.25 * s, 0]} rotation={[0.08, 0, 0.03]} material={leafMats.main} castShadow>
        <planeGeometry args={[1.2 * s, 1.1 * s]} />
      </mesh>
      <mesh position={[0, 1.25 * s, 0]} rotation={[0.05, Math.PI / 5, -0.02]} material={leafMats.side1} castShadow>
        <planeGeometry args={[1.2 * s, 1.1 * s]} />
      </mesh>
      <mesh position={[0, 1.25 * s, 0]} rotation={[-0.04, -Math.PI / 5, 0.02]} material={leafMats.side2} castShadow>
        <planeGeometry args={[1.2 * s, 1.1 * s]} />
      </mesh>
      <mesh position={[0, 1.25 * s, 0]} rotation={[0.03, Math.PI * 0.4, 0.01]} material={leafMats.side1} castShadow>
        <planeGeometry args={[1.2 * s, 1.1 * s]} />
      </mesh>
      <mesh position={[0, 1.25 * s, 0]} rotation={[-0.02, -Math.PI * 0.4, -0.03]} material={leafMats.side2} castShadow>
        <planeGeometry args={[1.2 * s, 1.1 * s]} />
      </mesh>

      <mesh position={[0.05 * s, 1.65 * s, 0]} rotation={[0.1, 0.2, 0]} material={leafMats.top} castShadow>
        <planeGeometry args={[0.9 * s, 0.8 * s]} />
      </mesh>
      <mesh position={[-0.03 * s, 1.65 * s, 0.04 * s]} rotation={[-0.05, Math.PI / 4, 0.06]} material={leafMats.side1} castShadow>
        <planeGeometry args={[0.9 * s, 0.8 * s]} />
      </mesh>
      <mesh position={[0.02 * s, 1.65 * s, -0.03 * s]} rotation={[0.04, -Math.PI / 4, -0.03]} material={leafMats.side2} castShadow>
        <planeGeometry args={[0.9 * s, 0.8 * s]} />
      </mesh>
      <mesh position={[0, 1.65 * s, 0]} rotation={[0.06, Math.PI / 2, 0.02]} material={leafMats.main} castShadow>
        <planeGeometry args={[0.9 * s, 0.8 * s]} />
      </mesh>

      <mesh position={[0.1 * s, 1.95 * s, 0.02 * s]} rotation={[0.08, 0.5, 0]} material={leafMats.main} castShadow>
        <planeGeometry args={[0.5 * s, 0.4 * s]} />
      </mesh>
      <mesh position={[-0.05 * s, 1.92 * s, 0.06 * s]} rotation={[-0.03, 1.2, 0.04]} material={leafMats.side1} castShadow>
        <planeGeometry args={[0.4 * s, 0.35 * s]} />
      </mesh>
    </group>
  );
}

export function SmallTree({ position, scale = 1 }: TreeProps) {
  const s = scale;
  const leafTex1 = useMemo(() => makeSmallLeafTexture('#3e6e3e', '#5e8e5e', '#2e5e2e', 26), []);
  const leafTex2 = useMemo(() => makeSmallLeafTexture('#427242', '#629262', '#326232', 20), []);

  const leafMats = useMemo(() => {
    const makeMat = (tex: THREE.Texture) => new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.85,
      metalness: 0,
    });
    return {
      main: makeMat(leafTex1),
      side: makeMat(leafTex2),
    };
  }, [leafTex1, leafTex2]);

  return (
    <group position={position}>
      <mesh position={[0, 0.35 * s, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04 * s, 0.06 * s, 0.7 * s, 5]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.9} metalness={0} />
      </mesh>

      <mesh position={[0, 0.82 * s, 0]} rotation={[0.06, 0, 0.03]} material={leafMats.main} castShadow>
        <planeGeometry args={[0.85 * s, 0.75 * s]} />
      </mesh>
      <mesh position={[0, 0.82 * s, 0]} rotation={[0.04, Math.PI / 3, -0.02]} material={leafMats.side} castShadow>
        <planeGeometry args={[0.85 * s, 0.75 * s]} />
      </mesh>
      <mesh position={[0, 0.82 * s, 0]} rotation={[-0.03, -Math.PI / 3, 0.02]} material={leafMats.side} castShadow>
        <planeGeometry args={[0.85 * s, 0.75 * s]} />
      </mesh>
      <mesh position={[0, 0.82 * s, 0]} rotation={[0.02, Math.PI / 2, 0.01]} material={leafMats.main} castShadow>
        <planeGeometry args={[0.85 * s, 0.75 * s]} />
      </mesh>

      <mesh position={[0.03 * s, 1.08 * s, 0.02 * s]} rotation={[0.05, 0.3, 0]} material={leafMats.main} castShadow>
        <planeGeometry args={[0.55 * s, 0.5 * s]} />
      </mesh>
      <mesh position={[-0.02 * s, 1.06 * s, 0.03 * s]} rotation={[-0.02, Math.PI / 4, 0.03]} material={leafMats.side} castShadow>
        <planeGeometry args={[0.45 * s, 0.4 * s]} />
      </mesh>
    </group>
  );
}
