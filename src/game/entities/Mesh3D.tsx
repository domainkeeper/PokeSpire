import { useMemo } from 'react';
import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from '../pixel/PixelCanvas';

function makeTreeFront(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(32, 44);

  pixelRect(ctx, 13, 32, 6, 12, '#8d6e63');
  pixelRect(ctx, 14, 32, 4, 12, '#6d4c41');
  pixelRect(ctx, 13, 32, 2, 12, '#a1887f');

  pixelRect(ctx, 1, 18, 30, 16, '#2e7d32');
  pixelRect(ctx, 2, 16, 28, 16, '#388e3c');
  pixelRect(ctx, 3, 12, 26, 16, '#43a047');
  pixelRect(ctx, 4, 8, 24, 14, '#66bb6a');
  pixelRect(ctx, 6, 5, 20, 12, '#81c784');
  pixelRect(ctx, 8, 3, 16, 8, '#a5d6a7');
  pixelRect(ctx, 10, 1, 12, 5, '#c8e6c9');
  pixelRect(ctx, 12, 0, 8, 3, '#e8f5e9');

  pixelRect(ctx, 5, 14, 4, 4, '#c8e6c9');
  pixelRect(ctx, 22, 16, 4, 4, '#c8e6c9');
  pixelRect(ctx, 14, 8, 5, 3, '#a5d6a7');
  pixelRect(ctx, 8, 22, 3, 3, '#e8f5e9');
  pixelRect(ctx, 24, 10, 3, 3, '#e8f5e9');

  pixelRect(ctx, 2, 20, 4, 5, '#1b5e20');
  pixelRect(ctx, 26, 19, 4, 5, '#1b5e20');
  pixelRect(ctx, 10, 12, 4, 4, '#2e7d32');
  pixelRect(ctx, 18, 14, 3, 3, '#1b5e20');

  return createPixelTexture(c, 'tree-front-v6');
}

function makeTreeBack(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(32, 44);

  pixelRect(ctx, 13, 32, 6, 12, '#6d4c41');

  pixelRect(ctx, 1, 18, 30, 16, '#1b5e20');
  pixelRect(ctx, 2, 16, 28, 16, '#2e7d32');
  pixelRect(ctx, 3, 12, 26, 16, '#1b5e20');
  pixelRect(ctx, 4, 8, 24, 14, '#1b5e20');
  pixelRect(ctx, 6, 5, 20, 12, '#0d3b0d');
  pixelRect(ctx, 8, 3, 16, 8, '#1b5e20');
  pixelRect(ctx, 10, 1, 12, 5, '#0d3b0d');
  pixelRect(ctx, 12, 0, 8, 3, '#1b5e20');

  pixelRect(ctx, 2, 20, 4, 5, '#0a2a0a');
  pixelRect(ctx, 26, 19, 4, 5, '#0a2a0a');

  return createPixelTexture(c, 'tree-back-v6');
}

function makeTreeSide(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(14, 44);

  pixelRect(ctx, 4, 32, 6, 12, '#7d5e53');
  pixelRect(ctx, 5, 32, 4, 12, '#6d4c41');

  pixelRect(ctx, 1, 18, 12, 16, '#236e22');
  pixelRect(ctx, 0, 16, 14, 16, '#2e7d32');
  pixelRect(ctx, 1, 12, 12, 16, '#358030');
  pixelRect(ctx, 2, 8, 10, 14, '#2e7d32');
  pixelRect(ctx, 3, 5, 8, 12, '#236e22');
  pixelRect(ctx, 4, 3, 6, 8, '#1b5e20');
  pixelRect(ctx, 5, 1, 4, 5, '#1b5e20');
  pixelRect(ctx, 6, 0, 2, 3, '#0d3b0d');

  pixelRect(ctx, 2, 14, 3, 3, '#1b5e20');
  pixelRect(ctx, 9, 16, 2, 2, '#0d3b0d');

  return createPixelTexture(c, 'tree-side-v6');
}

export function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const frontTex = useMemo(() => makeTreeFront(), []);
  const backTex = useMemo(() => makeTreeBack(), []);
  const sideTex = useMemo(() => makeTreeSide(), []);

  const s = 2.2 * scale;
  const h = 3.2 * scale;
  const d = 0.8 * scale;

  return (
    <group position={position}>
      <mesh position={[0, h * 0.45, d / 2]} renderOrder={position[2] + d / 2}>
        <planeGeometry args={[s, h]} />
        <meshBasicMaterial map={frontTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh position={[0, h * 0.45, -d / 2]} rotation={[0, Math.PI, 0]} renderOrder={position[2] - d / 2}>
        <planeGeometry args={[s, h]} />
        <meshBasicMaterial map={backTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh position={[-s / 2, h * 0.45, 0]} rotation={[0, -Math.PI / 2, 0]} renderOrder={position[2]}>
        <planeGeometry args={[d, h]} />
        <meshBasicMaterial map={sideTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh position={[s / 2, h * 0.45, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={position[2]}>
        <planeGeometry args={[d, h]} />
        <meshBasicMaterial map={sideTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
    </group>
  );
}

function makeSmallTreeFront(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(20, 30);

  pixelRect(ctx, 8, 20, 4, 10, '#8d6e63');
  pixelRect(ctx, 9, 20, 2, 10, '#6d4c41');

  pixelRect(ctx, 1, 12, 18, 10, '#388e3c');
  pixelRect(ctx, 2, 10, 16, 10, '#43a047');
  pixelRect(ctx, 3, 7, 14, 10, '#66bb6a');
  pixelRect(ctx, 4, 5, 12, 8, '#81c784');
  pixelRect(ctx, 6, 3, 8, 6, '#a5d6a7');
  pixelRect(ctx, 8, 1, 4, 4, '#c8e6c9');

  pixelRect(ctx, 4, 13, 3, 3, '#c8e6c9');
  pixelRect(ctx, 14, 11, 3, 3, '#e8f5e9');

  pixelRect(ctx, 2, 14, 3, 4, '#1b5e20');
  pixelRect(ctx, 15, 13, 3, 4, '#1b5e20');

  return createPixelTexture(c, 'small-tree-front-v6');
}

function makeSmallTreeBack(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(20, 30);

  pixelRect(ctx, 8, 20, 4, 10, '#6d4c41');

  pixelRect(ctx, 1, 12, 18, 10, '#1b5e20');
  pixelRect(ctx, 2, 10, 16, 10, '#2e7d32');
  pixelRect(ctx, 3, 7, 14, 10, '#1b5e20');
  pixelRect(ctx, 4, 5, 12, 8, '#0d3b0d');
  pixelRect(ctx, 6, 3, 8, 6, '#1b5e20');
  pixelRect(ctx, 8, 1, 4, 4, '#0d3b0d');

  return createPixelTexture(c, 'small-tree-back-v6');
}

export function SmallTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const frontTex = useMemo(() => makeSmallTreeFront(), []);
  const backTex = useMemo(() => makeSmallTreeBack(), []);

  const s = 1.3 * scale;
  const h = 2.1 * scale;
  const d = 0.5 * scale;

  return (
    <group position={position}>
      <mesh position={[0, h * 0.45, d / 2]} renderOrder={position[2] + d / 2}>
        <planeGeometry args={[s, h]} />
        <meshBasicMaterial map={frontTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh position={[0, h * 0.45, -d / 2]} rotation={[0, Math.PI, 0]} renderOrder={position[2] - d / 2}>
        <planeGeometry args={[s, h]} />
        <meshBasicMaterial map={backTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
    </group>
  );
}

function makeBldFront(v: 'red' | 'blue'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(36, 40);

  const rc = v === 'red' ? '#c62828' : '#1565c0';
  const rl = v === 'red' ? '#ef5350' : '#42a5f5';
  const rd = v === 'red' ? '#880e0e' : '#0d47a1';
  const wc = v === 'red' ? '#fff8e1' : '#e3f2fd';
  const ws = v === 'red' ? '#ffe0b2' : '#bbdefb';
  const wh = v === 'red' ? '#fffde7' : '#e8f4fd';
  const wi = v === 'red' ? '#4fc3f7' : '#90caf9';
  const wl = v === 'red' ? '#b3e5fc' : '#e3f2fd';

  pixelRect(ctx, 0, 36, 36, 4, 'rgba(0,0,0,0.08)');

  pixelRect(ctx, 1, 9, 34, 2, rd);
  pixelRect(ctx, 2, 7, 32, 3, rc);
  pixelRect(ctx, 3, 6, 30, 2, rl);
  pixelRect(ctx, 5, 5, 26, 2, rc);
  pixelRect(ctx, 7, 4, 22, 2, rl);
  pixelRect(ctx, 9, 3, 18, 2, rc);
  pixelRect(ctx, 11, 2, 14, 2, rl);
  pixelRect(ctx, 13, 1, 10, 2, rc);
  pixelRect(ctx, 15, 0, 6, 2, rl);

  pixelRect(ctx, 1, 11, 34, 1, '#fff');

  pixelRect(ctx, 2, 12, 32, 23, wc);
  pixelRect(ctx, 2, 12, 2, 23, ws);
  pixelRect(ctx, 32, 12, 2, 23, ws);
  pixelRect(ctx, 2, 12, 32, 2, wh);

  pixelRect(ctx, 14, 27, 8, 8, '#5d4037');
  pixelRect(ctx, 15, 28, 6, 7, '#4e342e');
  pixelRect(ctx, 19, 30, 1, 1, '#ffc107');

  pixelRect(ctx, 4, 18, 8, 8, wi);
  pixelRect(ctx, 5, 18, 6, 4, wl);
  pixelRect(ctx, 24, 18, 8, 8, wi);
  pixelRect(ctx, 25, 18, 6, 4, wl);

  pixelRect(ctx, 4, 18, 8, 1, '#fff');
  pixelRect(ctx, 4, 18, 1, 8, '#fff');
  pixelRect(ctx, 24, 18, 8, 1, '#fff');
  pixelRect(ctx, 31, 18, 1, 8, '#fff');

  pixelRect(ctx, 4, 25, 8, 1, '#bdbdbd');
  pixelRect(ctx, 24, 25, 8, 1, '#bdbdbd');

  if (v === 'red') {
    pixelRect(ctx, 30, 0, 4, 9, '#8d6e63');
    pixelRect(ctx, 29, 0, 6, 1, '#6d4c41');
  }

  return createPixelTexture(c, `bld-front-v6-${v}`);
}

function makeBldSide(v: 'red' | 'blue'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(14, 40);

  const rc = v === 'red' ? '#a81818' : '#0d47a1';
  const rl = v === 'red' ? '#c62828' : '#1565c0';
  const wc = v === 'red' ? '#f5e6c8' : '#d4e8f7';
  const ws = v === 'red' ? '#e8d4b0' : '#b8d4ec';

  pixelRect(ctx, 0, 36, 14, 4, 'rgba(0,0,0,0.06)');

  pixelRect(ctx, 0, 9, 14, 2, rc);
  pixelRect(ctx, 0, 11, 14, 1, '#ccc');

  pixelRect(ctx, 0, 12, 14, 23, wc);
  pixelRect(ctx, 0, 12, 2, 23, ws);

  pixelRect(ctx, 2, 16, 8, 8, v === 'red' ? '#b0d4f0' : '#88b8e0');
  pixelRect(ctx, 3, 16, 6, 4, v === 'red' ? '#d0e8f8' : '#a8d0f0');

  pixelRect(ctx, 0, 7, 14, 3, rl);
  pixelRect(ctx, 0, 6, 14, 2, rc);
  pixelRect(ctx, 0, 5, 14, 2, rl);

  return createPixelTexture(c, `bld-side-v6-${v}`);
}

export function Building({
  position,
  variant = 'red',
  scale = 1,
}: {
  position: [number, number, number];
  variant?: 'red' | 'blue';
  scale?: number;
}) {
  const frontTex = useMemo(() => makeBldFront(variant), [variant]);
  const sideTex = useMemo(() => makeBldSide(variant), [variant]);

  const w = 4.2 * scale;
  const h = 4.8 * scale;
  const d = 3.2 * scale;

  const frontMat = useMemo(() => new THREE.MeshBasicMaterial({ map: frontTex, transparent: true, alphaTest: 0.1, side: THREE.FrontSide, depthWrite: true }), [frontTex]);
  const sideMat = useMemo(() => new THREE.MeshBasicMaterial({ map: sideTex, transparent: true, alphaTest: 0.1, side: THREE.FrontSide, depthWrite: true }), [sideTex]);
  const darkMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#5d4037', depthWrite: true }), []);
  const roofMat = useMemo(() => new THREE.MeshBasicMaterial({ color: variant === 'red' ? '#b71c1c' : '#0d47a1', side: THREE.DoubleSide, depthWrite: true }), [variant]);
  const roofLightMat = useMemo(() => new THREE.MeshBasicMaterial({ color: variant === 'red' ? '#c62828' : '#1565c0', side: THREE.DoubleSide, depthWrite: true }), [variant]);

  return (
    <group position={position}>
      <mesh position={[0, h / 2, d / 2]} material={frontMat} renderOrder={position[2] + d / 2}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]} rotation={[0, Math.PI, 0]} material={frontMat} renderOrder={position[2] - d / 2}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={sideMat} renderOrder={position[2]}>
        <planeGeometry args={[d, h]} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={sideMat} renderOrder={position[2]}>
        <planeGeometry args={[d, h]} />
      </mesh>

      <mesh position={[0, h + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} material={roofLightMat} renderOrder={position[2] + h}>
        <planeGeometry args={[w + 0.6, d + 0.6]} />
      </mesh>
      <mesh position={[0, h + 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} material={roofMat} renderOrder={position[2] + h + 0.1}>
        <planeGeometry args={[w + 0.3, d + 0.3]} />
      </mesh>

      <mesh position={[0, h, d / 2 + 0.16]} material={darkMat} renderOrder={position[2] + d / 2 + 0.16}>
        <planeGeometry args={[w + 0.3, 0.2]} />
      </mesh>
      <mesh position={[0, h, -d / 2 - 0.16]} rotation={[0, Math.PI, 0]} material={darkMat} renderOrder={position[2] - d / 2 - 0.16}>
        <planeGeometry args={[w + 0.3, 0.2]} />
      </mesh>

      <mesh position={[-w / 2 - 0.16, h, 0]} rotation={[0, -Math.PI / 2, 0]} material={darkMat} renderOrder={position[2]}>
        <planeGeometry args={[d + 0.3, 0.2]} />
      </mesh>
      <mesh position={[w / 2 + 0.16, h, 0]} rotation={[0, Math.PI / 2, 0]} material={darkMat} renderOrder={position[2]}>
        <planeGeometry args={[d + 0.3, 0.2]} />
      </mesh>
    </group>
  );
}
