import { useMemo } from 'react';
import * as THREE from 'three';
import { makeCanvas, pixelRect, createPixelTexture } from '../pixel/PixelCanvas';

function makeTreeFrontTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(28, 40);

  pixelRect(ctx, 12, 28, 4, 12, '#8d6e63');
  pixelRect(ctx, 13, 28, 2, 12, '#6d4c41');

  pixelRect(ctx, 1, 16, 26, 14, '#2e7d32');
  pixelRect(ctx, 2, 14, 24, 14, '#388e3c');
  pixelRect(ctx, 3, 10, 22, 14, '#43a047');
  pixelRect(ctx, 4, 6, 20, 12, '#66bb6a');
  pixelRect(ctx, 6, 3, 16, 10, '#81c784');
  pixelRect(ctx, 8, 1, 12, 6, '#a5d6a7');
  pixelRect(ctx, 10, 0, 8, 3, '#c8e6c9');

  pixelRect(ctx, 5, 12, 3, 3, '#c8e6c9');
  pixelRect(ctx, 18, 14, 3, 3, '#c8e6c9');
  pixelRect(ctx, 12, 6, 4, 2, '#a5d6a7');
  pixelRect(ctx, 7, 20, 2, 2, '#e8f5e9');

  pixelRect(ctx, 2, 18, 3, 4, '#1b5e20');
  pixelRect(ctx, 22, 17, 3, 4, '#1b5e20');
  pixelRect(ctx, 10, 10, 3, 3, '#2e7d32');

  return createPixelTexture(c, 'tree-front-v5');
}

function makeTreeBackTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(28, 40);

  pixelRect(ctx, 12, 28, 4, 12, '#6d4c41');

  pixelRect(ctx, 1, 16, 26, 14, '#1b5e20');
  pixelRect(ctx, 2, 14, 24, 14, '#2e7d32');
  pixelRect(ctx, 3, 10, 22, 14, '#388e3c');
  pixelRect(ctx, 4, 6, 20, 12, '#2e7d32');
  pixelRect(ctx, 6, 3, 16, 10, '#1b5e20');
  pixelRect(ctx, 8, 1, 12, 6, '#2e7d32');
  pixelRect(ctx, 10, 0, 8, 3, '#1b5e20');

  pixelRect(ctx, 2, 18, 3, 4, '#0d3b0d');
  pixelRect(ctx, 22, 17, 3, 4, '#0d3b0d');

  return createPixelTexture(c, 'tree-back-v5');
}

function makeTreeSideTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(12, 40);

  pixelRect(ctx, 4, 28, 4, 12, '#7d5e53');

  pixelRect(ctx, 1, 16, 10, 14, '#236e22');
  pixelRect(ctx, 0, 14, 12, 14, '#2e7d32');
  pixelRect(ctx, 1, 10, 10, 14, '#358030');
  pixelRect(ctx, 2, 6, 8, 12, '#2e7d32');
  pixelRect(ctx, 3, 3, 6, 10, '#236e22');
  pixelRect(ctx, 4, 1, 4, 6, '#1b5e20');
  pixelRect(ctx, 5, 0, 2, 3, '#1b5e20');

  pixelRect(ctx, 2, 12, 2, 2, '#1b5e20');

  return createPixelTexture(c, 'tree-side-v5');
}

function makeSmallTreeFrontTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(18, 28);

  pixelRect(ctx, 7, 18, 4, 10, '#8d6e63');
  pixelRect(ctx, 8, 18, 2, 10, '#6d4c41');

  pixelRect(ctx, 1, 10, 16, 10, '#388e3c');
  pixelRect(ctx, 2, 8, 14, 10, '#43a047');
  pixelRect(ctx, 3, 5, 12, 8, '#66bb6a');
  pixelRect(ctx, 4, 3, 10, 6, '#81c784');
  pixelRect(ctx, 6, 1, 6, 4, '#a5d6a7');
  pixelRect(ctx, 7, 0, 4, 2, '#c8e6c9');

  pixelRect(ctx, 4, 11, 2, 2, '#c8e6c9');
  pixelRect(ctx, 12, 9, 2, 2, '#e8f5e9');

  pixelRect(ctx, 2, 12, 2, 3, '#1b5e20');
  pixelRect(ctx, 13, 11, 2, 3, '#1b5e20');

  return createPixelTexture(c, 'small-tree-front-v5');
}

function makeSmallTreeBackTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(18, 28);

  pixelRect(ctx, 7, 18, 4, 10, '#6d4c41');

  pixelRect(ctx, 1, 10, 16, 10, '#1b5e20');
  pixelRect(ctx, 2, 8, 14, 10, '#2e7d32');
  pixelRect(ctx, 3, 5, 12, 8, '#1b5e20');
  pixelRect(ctx, 4, 3, 10, 6, '#1b5e20');
  pixelRect(ctx, 6, 1, 6, 4, '#0d3b0d');

  return createPixelTexture(c, 'small-tree-back-v5');
}

export function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const frontTex = useMemo(() => makeTreeFrontTexture(), []);
  const backTex = useMemo(() => makeTreeBackTexture(), []);
  const sideTex = useMemo(() => makeTreeSideTexture(), []);

  const s = 2.0 * scale;
  const h = 3.0 * scale;
  const depth = 0.6 * scale;

  return (
    <group position={position}>
      <mesh position={[0, 0, depth / 2]} renderOrder={position[2] + depth / 2}>
        <planeGeometry args={[s, h]} />
        <meshBasicMaterial map={frontTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh position={[0, 0, -depth / 2]} rotation={[0, Math.PI, 0]} renderOrder={position[2] - depth / 2}>
        <planeGeometry args={[s, h]} />
        <meshBasicMaterial map={backTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh position={[-s / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} renderOrder={position[2]}>
        <planeGeometry args={[depth, h]} />
        <meshBasicMaterial map={sideTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh position={[s / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={position[2]}>
        <planeGeometry args={[depth, h]} />
        <meshBasicMaterial map={sideTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
    </group>
  );
}

export function SmallTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const frontTex = useMemo(() => makeSmallTreeFrontTexture(), []);
  const backTex = useMemo(() => makeSmallTreeBackTexture(), []);

  const s = 1.2 * scale;
  const h = 2.0 * scale;
  const depth = 0.4 * scale;

  return (
    <group position={position}>
      <mesh position={[0, 0, depth / 2]} renderOrder={position[2] + depth / 2}>
        <planeGeometry args={[s, h]} />
        <meshBasicMaterial map={frontTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh position={[0, 0, -depth / 2]} rotation={[0, Math.PI, 0]} renderOrder={position[2] - depth / 2}>
        <planeGeometry args={[s, h]} />
        <meshBasicMaterial map={backTex} transparent alphaTest={0.1} side={THREE.FrontSide} depthWrite />
      </mesh>
    </group>
  );
}

function makeBuildingFrontTexture(variant: 'red' | 'blue'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(32, 36);

  const rc = variant === 'red' ? '#c62828' : '#1565c0';
  const rl = variant === 'red' ? '#ef5350' : '#42a5f5';
  const rd = variant === 'red' ? '#880e0e' : '#0d47a1';
  const wc = variant === 'red' ? '#fff8e1' : '#e3f2fd';
  const ws = variant === 'red' ? '#ffe0b2' : '#bbdefb';
  const wh = variant === 'red' ? '#fffde7' : '#e8f4fd';
  const wi = variant === 'red' ? '#4fc3f7' : '#90caf9';
  const wl = variant === 'red' ? '#b3e5fc' : '#e3f2fd';

  pixelRect(ctx, 0, 32, 32, 4, 'rgba(0,0,0,0.10)');

  pixelRect(ctx, 1, 8, 30, 2, rd);
  pixelRect(ctx, 2, 6, 28, 3, rc);
  pixelRect(ctx, 3, 5, 26, 2, rl);
  pixelRect(ctx, 5, 4, 22, 2, rc);
  pixelRect(ctx, 7, 3, 18, 2, rl);
  pixelRect(ctx, 9, 2, 14, 2, rc);
  pixelRect(ctx, 11, 1, 10, 2, rl);
  pixelRect(ctx, 13, 0, 6, 2, rc);

  pixelRect(ctx, 1, 10, 30, 1, '#fff');

  pixelRect(ctx, 2, 11, 28, 20, wc);
  pixelRect(ctx, 2, 11, 2, 20, ws);
  pixelRect(ctx, 28, 11, 2, 20, ws);
  pixelRect(ctx, 2, 11, 28, 2, wh);

  pixelRect(ctx, 13, 24, 6, 7, '#5d4037');
  pixelRect(ctx, 14, 25, 4, 6, '#4e342e');
  pixelRect(ctx, 17, 27, 1, 1, '#ffc107');

  pixelRect(ctx, 4, 16, 7, 7, wi);
  pixelRect(ctx, 5, 16, 5, 4, wl);
  pixelRect(ctx, 21, 16, 7, 7, wi);
  pixelRect(ctx, 22, 16, 5, 4, wl);

  pixelRect(ctx, 4, 16, 7, 1, '#fff');
  pixelRect(ctx, 4, 16, 1, 7, '#fff');
  pixelRect(ctx, 21, 16, 7, 1, '#fff');
  pixelRect(ctx, 27, 16, 1, 7, '#fff');

  pixelRect(ctx, 4, 22, 7, 1, '#bdbdbd');
  pixelRect(ctx, 21, 22, 7, 1, '#bdbdbd');

  if (variant === 'red') {
    pixelRect(ctx, 26, 0, 4, 8, '#8d6e63');
    pixelRect(ctx, 25, 0, 6, 1, '#6d4c41');
  }

  return createPixelTexture(c, `bld-front-${variant}`);
}

function makeBuildingSideTexture(variant: 'red' | 'blue'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(12, 36);

  const rc = variant === 'red' ? '#a81818' : '#0d47a1';
  const rl = variant === 'red' ? '#c62828' : '#1565c0';
  const wc = variant === 'red' ? '#f5e6c8' : '#d4e8f7';
  const ws = variant === 'red' ? '#e8d4b0' : '#b8d4ec';

  pixelRect(ctx, 0, 32, 12, 4, 'rgba(0,0,0,0.08)');

  pixelRect(ctx, 0, 8, 12, 2, rc);
  pixelRect(ctx, 0, 10, 12, 1, '#ddd');

  pixelRect(ctx, 0, 11, 12, 20, wc);
  pixelRect(ctx, 0, 11, 2, 20, ws);

  pixelRect(ctx, 1, 14, 8, 8, variant === 'red' ? '#b0d4f0' : '#88b8e0');
  pixelRect(ctx, 2, 14, 6, 4, variant === 'red' ? '#d0e8f8' : '#a8d0f0');

  pixelRect(ctx, 0, 10, 12, 1, rl);

  pixelRect(ctx, 0, 6, 12, 3, rl);
  pixelRect(ctx, 0, 5, 12, 2, rc);
  pixelRect(ctx, 0, 4, 12, 2, rl);

  return createPixelTexture(c, `bld-side-${variant}`);
}

function makeRoofTexture(variant: 'red' | 'blue'): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(32, 8);

  const rc = variant === 'red' ? '#c62828' : '#1565c0';
  const rl = variant === 'red' ? '#ef5350' : '#42a5f5';
  const rd = variant === 'red' ? '#880e0e' : '#0d47a1';

  pixelRect(ctx, 0, 0, 32, 8, rc);
  pixelRect(ctx, 0, 0, 32, 2, rl);
  pixelRect(ctx, 0, 6, 32, 2, rd);

  for (let x = 0; x < 32; x += 4) {
    pixelRect(ctx, x, 2, 1, 4, rd);
    pixelRect(ctx, x + 2, 2, 1, 4, rl);
  }

  return createPixelTexture(c, `roof-${variant}`);
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
  const frontTex = useMemo(() => makeBuildingFrontTexture(variant), [variant]);
  const sideTex = useMemo(() => makeBuildingSideTexture(variant), [variant]);
  const roofTex = useMemo(() => makeRoofTexture(variant), [variant]);

  const w = 4.0 * scale;
  const h = 4.5 * scale;
  const d = 3.0 * scale;

  const frontMat = useMemo(() => new THREE.MeshBasicMaterial({ map: frontTex, transparent: true, alphaTest: 0.1, side: THREE.FrontSide, depthWrite: true }), [frontTex]);
  const sideMat = useMemo(() => new THREE.MeshBasicMaterial({ map: sideTex, transparent: true, alphaTest: 0.1, side: THREE.FrontSide, depthWrite: true }), [sideTex]);
  const roofMat = useMemo(() => new THREE.MeshBasicMaterial({ map: roofTex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, depthWrite: true }), [roofTex]);
  const darkMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#5d4037', depthWrite: true }), []);

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
      <mesh position={[0, h + 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} material={roofMat} renderOrder={position[2] + h}>
        <planeGeometry args={[w + 0.4, d + 0.4]} />
      </mesh>
      <mesh position={[0, h, d / 2 + 0.15]} material={darkMat} renderOrder={position[2] + d / 2 + 0.15}>
        <planeGeometry args={[w + 0.2, 0.3]} />
      </mesh>
      <mesh position={[0, h, -d / 2 - 0.15]} rotation={[0, Math.PI, 0]} material={darkMat} renderOrder={position[2] - d / 2 - 0.15}>
        <planeGeometry args={[w + 0.2, 0.3]} />
      </mesh>
    </group>
  );
}
