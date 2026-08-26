import { useMemo } from 'react';
import * as THREE from 'three';
import { makeCanvas, createPixelTexture } from '../pixel/PixelCanvas';

interface PropProps {
  position: [number, number, number];
  scale?: number;
}

function makeBushTexture(variant: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(14, 12);
  ctx.imageSmoothingEnabled = false;

  const palettes = [
    { dark: '#2a5a2a', base: '#3a6a3a', mid: '#427242', light: '#4a7a4a', bright: '#5a8a5a', highlight: '#6a9a6a' },
    { dark: '#285828', base: '#386838', mid: '#407040', light: '#487848', bright: '#588858', highlight: '#689868' },
    { dark: '#2c5c2c', base: '#3c6c3c', mid: '#447444', light: '#4c7c4c', bright: '#5c8c5c', highlight: '#6c9c6c' },
  ];
  const p = palettes[variant % palettes.length];

  const shapeSeed = variant * 17;
  const blobs = 3 + (shapeSeed % 3);

  for (let i = 0; i < blobs; i++) {
    const bx = 3 + ((shapeSeed + i * 7) % 8);
    const by = 4 + ((shapeSeed + i * 11) % 5);
    const bw = 3 + ((shapeSeed + i * 13) % 3);
    const bh = 2 + ((shapeSeed + i * 3) % 3);

    for (let dy = 0; dy < bh; dy++) {
      for (let dx = 0; dx < bw; dx++) {
        const px = bx + dx;
        const py = by + dy;
        if (px >= 0 && px < 14 && py >= 0 && py < 12) {
          const edgeDist = Math.min(dx, dy, bw - 1 - dx, bh - 1 - dy);
          if (edgeDist === 0 && ((px * 3 + py * 7 + shapeSeed) % 3 === 0)) continue;
          const ci = (dx + dy + shapeSeed) % 5;
          const color = ci < 1 ? p.dark : ci < 3 ? p.base : ci < 4 ? p.mid : p.light;
          ctx.fillStyle = color;
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 14; x++) {
      const data = ctx.getImageData(x, y, 1, 1).data;
      if (data[3] === 0) continue;
      if ((x * 7 + y * 13 + shapeSeed) % 9 < 2) {
        ctx.fillStyle = p.bright;
        ctx.fillRect(x, y, 1, 1);
      }
      if ((x * 5 + y * 11 + shapeSeed) % 13 < 1) {
        ctx.fillStyle = p.highlight;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(1, 10, 12, 2);

  return createPixelTexture(c, `bush-v${variant}`);
}

function makeRockTexture(variant: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(12, 10);
  ctx.imageSmoothingEnabled = false;

  const baseColor = variant % 2 === 0 ? '#78909c' : '#607d8b';
  const lightColor = variant % 2 === 0 ? '#b0bec5' : '#90a4ae';
  const darkColor = variant % 2 === 0 ? '#546e7a' : '#455a64';

  const blobs = [
    { x: 2, y: 3, w: 8, h: 5 },
    { x: 3, y: 2, w: 6, h: 4 },
    { x: 4, y: 1, w: 4, h: 3 },
  ];

  for (const blob of blobs) {
    for (let dy = 0; dy < blob.h; dy++) {
      for (let dx = 0; dx < blob.w; dx++) {
        const px = blob.x + dx;
        const py = blob.y + dy;
        if (px < 12 && py < 10) {
          const edgeDist = Math.min(dx, dy, blob.w - 1 - dx, blob.h - 1 - dy);
          if (edgeDist === 0 && ((px * 3 + py * 7 + variant) % 3 === 0)) continue;
          const ci = (dx + dy + variant) % 4;
          ctx.fillStyle = ci < 1 ? darkColor : ci < 3 ? baseColor : lightColor;
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  ctx.fillStyle = '#eceff1';
  ctx.fillRect(4 + (variant % 2), 2, 2, 1);
  ctx.fillRect(6, 1 + (variant % 2), 1, 1);

  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(1, 8, 10, 2);

  return createPixelTexture(c, `rock-v${variant}`);
}

function makeFlowerTex(color: string): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 12);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#388e3c';
  ctx.fillRect(3, 6, 2, 6);
  ctx.fillStyle = '#43a047';
  ctx.fillRect(2, 5, 4, 2);

  ctx.fillStyle = color;
  ctx.fillRect(2, 0, 4, 5);
  ctx.fillRect(1, 1, 6, 3);
  ctx.fillStyle = '#fff9c4';
  ctx.fillRect(3, 2, 2, 2);

  return createPixelTexture(c, `flower-tex-${color}`);
}

export function Bush3D({ position, scale = 1 }: PropProps) {
  const variant = useMemo(() => {
    const h = ((position[0] * 7 + position[2] * 13) | 0) % 3;
    return h;
  }, [position[0], position[2]]);

  const tex = useMemo(() => makeBushTexture(variant), [variant]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.85,
    metalness: 0,
  }), [tex]);
  const s = scale * (0.85 + (variant * 0.15));
  const rotOffset = variant * 0.3;

  return (
    <group position={position}>
      <mesh position={[0, 0.3 * s, 0]} material={mat} rotation={[0.03, rotOffset, 0]}>
        <planeGeometry args={[0.7 * s, 0.55 * s]} />
      </mesh>
      <mesh position={[0, 0.3 * s, 0]} material={mat} rotation={[0.02, Math.PI / 3 + rotOffset, -0.01]}>
        <planeGeometry args={[0.7 * s, 0.55 * s]} />
      </mesh>
      <mesh position={[0, 0.3 * s, 0]} material={mat} rotation={[-0.02, -Math.PI / 3 + rotOffset, 0.01]}>
        <planeGeometry args={[0.7 * s, 0.55 * s]} />
      </mesh>
    </group>
  );
}

export function Rock3D({ position, scale = 1 }: PropProps) {
  const variant = useMemo(() => {
    const h = ((position[0] * 11 + position[2] * 7) | 0) % 2;
    return h;
  }, [position[0], position[2]]);

  const tex = useMemo(() => makeRockTexture(variant), [variant]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.9,
    metalness: 0.05,
  }), [tex]);
  const s = scale * (0.9 + (variant * 0.2));

  return (
    <group position={position}>
      <mesh position={[0, 0.2 * s, 0]} material={mat}>
        <planeGeometry args={[0.6 * s, 0.45 * s]} />
      </mesh>
      <mesh position={[0, 0.2 * s, 0]} material={mat} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.5 * s, 0.45 * s]} />
      </mesh>
    </group>
  );
}

export function Flower3D({ position, scale = 1, color = '#c9908a' }: PropProps & { color?: string }) {
  const tex = useMemo(() => makeFlowerTex(color), [color]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.85,
    metalness: 0,
  }), [tex]);
  const s = scale;

  return (
    <group position={position}>
      <mesh position={[0, 0.25 * s, 0]} material={mat}>
        <planeGeometry args={[0.2 * s, 0.3 * s]} />
      </mesh>
    </group>
  );
}

export function Fence3D({ position, scale = 1 }: PropProps) {
  const s = scale;

  const postMat = useMemo(() => {
    const [c, ctx] = makeCanvas(4, 8);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, 0, 4, 8);
    ctx.fillStyle = '#a1887f';
    ctx.fillRect(1, 0, 2, 8);
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(0, 0, 1, 8);
    return new THREE.MeshStandardMaterial({ map: createPixelTexture(c, 'fence-post'), roughness: 0.9, metalness: 0 });
  }, []);

  const railMat = useMemo(() => {
    const [c, ctx] = makeCanvas(12, 2);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#a1887f';
    ctx.fillRect(0, 0, 12, 2);
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(0, 0, 12, 1);
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(0, 1, 12, 1);
    return new THREE.MeshStandardMaterial({ map: createPixelTexture(c, 'fence-rail'), roughness: 0.9, metalness: 0 });
  }, []);

  return (
    <group position={position}>
      <mesh position={[-0.4 * s, 0.35 * s, 0]} material={postMat} castShadow>
        <boxGeometry args={[0.06 * s, 0.7 * s, 0.06 * s]} />
      </mesh>
      <mesh position={[0, 0.35 * s, 0]} material={postMat} castShadow>
        <boxGeometry args={[0.06 * s, 0.7 * s, 0.06 * s]} />
      </mesh>
      <mesh position={[0.4 * s, 0.35 * s, 0]} material={postMat} castShadow>
        <boxGeometry args={[0.06 * s, 0.7 * s, 0.06 * s]} />
      </mesh>
      <mesh position={[0, 0.4 * s, 0]} material={railMat}>
        <boxGeometry args={[0.9 * s, 0.05 * s, 0.04 * s]} />
      </mesh>
      <mesh position={[0, 0.22 * s, 0]} material={railMat}>
        <boxGeometry args={[0.9 * s, 0.05 * s, 0.04 * s]} />
      </mesh>
    </group>
  );
}

export function Sign3D({ position, scale = 1 }: PropProps) {
  const s = scale;

  const boardTex = useMemo(() => {
    const [c, ctx] = makeCanvas(8, 8);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#d4a840';
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#e0c070';
    ctx.fillRect(1, 1, 6, 6);
    ctx.fillStyle = '#b08830';
    ctx.fillRect(2, 2, 4, 1);
    ctx.fillRect(2, 4, 4, 1);
    ctx.fillRect(2, 6, 4, 1);
    ctx.fillStyle = '#c89838';
    ctx.fillRect(0, 0, 8, 1);
    ctx.fillRect(0, 0, 1, 8);
    ctx.fillStyle = '#a08028';
    ctx.fillRect(0, 7, 8, 1);
    ctx.fillRect(7, 0, 1, 8);
    return new THREE.MeshStandardMaterial({ map: createPixelTexture(c, 'sign-board-v2'), roughness: 0.85, metalness: 0 });
  }, []);

  return (
    <group position={position}>
      <mesh position={[0, 0.3 * s, 0]} castShadow>
        <cylinderGeometry args={[0.03 * s, 0.04 * s, 0.6 * s, 5]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 0.7 * s, 0.02]} material={boardTex}>
        <planeGeometry args={[0.45 * s, 0.4 * s]} />
      </mesh>
    </group>
  );
}
