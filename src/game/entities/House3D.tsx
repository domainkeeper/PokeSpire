import { useMemo } from 'react';
import * as THREE from 'three';
import { makeCanvas, createPixelTexture } from '../pixel/PixelCanvas';

interface HouseProps {
  position: [number, number, number];
  variant?: 'red' | 'blue';
  scale?: number;
}

function makeWallTexture(baseColor: string, sideColor: string): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 16);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 16, 16);

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const noise = (x * 5 + y * 11) % 7;
      if (noise < 1) {
        ctx.fillStyle = sideColor;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  ctx.fillStyle = sideColor;
  ctx.fillRect(0, 0, 16, 1);
  ctx.fillRect(0, 0, 1, 16);

  return createPixelTexture(c, `wall-${baseColor}`);
}

function makeRoofTexture(color: string, darkColor: string): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 16);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const tileRow = Math.floor(y / 4);
      const isOffset = tileRow % 2 === 1;
      const localX = isOffset ? (x + 2) % 4 : x % 4;
      const localY = y % 4;

      if (localX === 0 || localY === 0) {
        ctx.fillStyle = darkColor;
      } else {
        ctx.fillStyle = color;
      }
      ctx.fillRect(x, y, 1, 1);

      if (localX === 1 && localY === 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return createPixelTexture(c, `roof-${color}`);
}

function makeWindowTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 8);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#1a2040';
  ctx.fillRect(0, 0, 8, 8);

  ctx.fillStyle = '#406080';
  ctx.fillRect(1, 1, 6, 6);

  ctx.fillStyle = '#6080a0';
  ctx.fillRect(2, 2, 4, 4);

  ctx.fillStyle = '#80a0c0';
  ctx.fillRect(2, 2, 2, 2);

  ctx.fillStyle = '#7090b0';
  ctx.fillRect(0, 0, 8, 1);
  ctx.fillRect(0, 0, 1, 8);

  return createPixelTexture(c, 'window-v2');
}

function makeDoorTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 12);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, 8, 12);

  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 8; x++) {
      const noise = (x * 3 + y * 7) % 5;
      if (noise < 1) {
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  ctx.fillStyle = '#5d4037';
  ctx.fillRect(0, 0, 8, 1);
  ctx.fillRect(0, 0, 1, 12);
  ctx.fillRect(7, 0, 1, 12);
  ctx.fillRect(0, 11, 8, 1);

  ctx.fillStyle = '#c8a040';
  ctx.fillRect(6, 6, 1, 2);

  return createPixelTexture(c, 'door-v2');
}

export function House({ position, variant = 'red', scale = 1 }: HouseProps) {
  const s = scale;
  const wallColor = variant === 'red' ? '#fff8e1' : '#e8f4fd';
  const wallSide = variant === 'red' ? '#f5e6c8' : '#d4e8f7';
  const roofColor = variant === 'red' ? '#a04040' : '#406080';
  const roofDark = variant === 'red' ? '#803030' : '#304868';

  const wallTex = useMemo(() => makeWallTexture(wallColor, wallSide), [wallColor, wallSide]);
  const roofTex = useMemo(() => makeRoofTexture(roofColor, roofDark), [roofColor, roofDark]);
  const windowTex = useMemo(() => makeWindowTexture(), []);
  const doorTex = useMemo(() => makeDoorTexture(), []);

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0 }), [wallTex]);
  const wallSideMat = useMemo(() => {
    const t = makeWallTexture(wallSide, wallColor);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, metalness: 0 });
  }, [wallSide, wallColor]);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.8, metalness: 0 }), [roofTex]);
  const windowMat = useMemo(() => new THREE.MeshStandardMaterial({ map: windowTex, transparent: true, alphaTest: 0.1, roughness: 0.5, metalness: 0.1 }), [windowTex]);
  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: doorTex, transparent: true, alphaTest: 0.1, roughness: 0.9, metalness: 0 }), [doorTex]);

  const w = 3.0 * s;
  const h = 2.8 * s;
  const d = 2.4 * s;
  const roofH = 1.2 * s;

  return (
    <group position={position}>
      <mesh position={[0, 0.08 * s, 0]} receiveShadow>
        <boxGeometry args={[w + 0.15, 0.16 * s, d + 0.15]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.9} metalness={0} />
      </mesh>

      <mesh position={[0, h / 2 + 0.16 * s, d / 2]} material={wallMat} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.12]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.16 * s, -d / 2]} material={wallSideMat} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.12]} />
      </mesh>
      <mesh position={[-w / 2, h / 2 + 0.16 * s, 0]} material={wallSideMat} castShadow receiveShadow>
        <boxGeometry args={[0.12, h, d]} />
      </mesh>
      <mesh position={[w / 2, h / 2 + 0.16 * s, 0]} material={wallSideMat} castShadow receiveShadow>
        <boxGeometry args={[0.12, h, d]} />
      </mesh>

      <mesh position={[0, 0.55 * s, d / 2 + 0.07]} material={doorMat}>
        <planeGeometry args={[0.5 * s, 1.0 * s]} />
      </mesh>

      <mesh position={[-0.85 * s, 1.4 * s, d / 2 + 0.065]} material={windowMat}>
        <planeGeometry args={[0.55 * s, 0.45 * s]} />
      </mesh>
      <mesh position={[0.85 * s, 1.4 * s, d / 2 + 0.065]} material={windowMat}>
        <planeGeometry args={[0.55 * s, 0.45 * s]} />
      </mesh>

      <group position={[0, h + 0.16 * s, 0]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[w + 0.5, 0.12, d + 0.5]} />
          <meshStandardMaterial color={roofDark} roughness={0.8} metalness={0} />
        </mesh>

        <mesh position={[0, roofH * 0.35, d * 0.28]} rotation={[0.55, 0, 0]} material={roofMat}>
          <planeGeometry args={[w + 0.3, roofH * 0.8]} />
        </mesh>
        <mesh position={[0, roofH * 0.35, -d * 0.28]} rotation={[-0.55, Math.PI, 0]} material={roofMat}>
          <planeGeometry args={[w + 0.3, roofH * 0.8]} />
        </mesh>
        <mesh position={[-w * 0.28, roofH * 0.35, 0]} rotation={[0, Math.PI / 2, 0.55]} material={roofMat}>
          <planeGeometry args={[d + 0.3, roofH * 0.8]} />
        </mesh>
        <mesh position={[w * 0.28, roofH * 0.35, 0]} rotation={[0, -Math.PI / 2, 0.55]} material={roofMat}>
          <planeGeometry args={[d + 0.3, roofH * 0.8]} />
        </mesh>

        <mesh position={[0, roofH * 0.65, 0]}>
          <boxGeometry args={[0.15, 0.1, d * 0.6]} />
          <meshBasicMaterial color={roofDark} />
        </mesh>
      </group>

      {variant === 'red' && (
        <group position={[w * 0.3, h + roofH * 0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.35 * s, 0.8 * s, 0.35 * s]} />
            <meshStandardMaterial color="#5d4037" roughness={0.9} metalness={0} />
          </mesh>
          <mesh position={[0, 0.45 * s, 0]} castShadow>
            <boxGeometry args={[0.42 * s, 0.1 * s, 0.42 * s]} />
            <meshStandardMaterial color="#4e342e" roughness={0.9} metalness={0} />
          </mesh>
        </group>
      )}
    </group>
  );
}