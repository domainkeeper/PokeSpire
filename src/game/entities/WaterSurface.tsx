import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeCanvas, createPixelTexture } from '../pixel/PixelCanvas';

function makeWaterFrame(frame: number, w: number, h: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(16, 16);
  ctx.imageSmoothingEnabled = false;

  // Water colors — muted slate-blue
  const deep = '#2a5868';
  const mid = '#3a6878';
  const light = '#4a7888';
  const highlight = '#5a8898';
  const sparkle = '#6a98a8';

  // Simple wave hash for organic pattern
  const wave = (x: number, y: number, t: number) => {
    return ((x * 7 + y * 13 + t * 5) % 11) / 11;
  };

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const t = frame * 3;
      const wx = x + t;
      const wy = y + Math.floor(Math.sin((wx * 0.4 + y * 0.2) * 0.5) * 1.5);
      const n = wave(wx, wy, frame);

      let color: string;
      if (n < 0.25) color = deep;
      else if (n < 0.50) color = mid;
      else if (n < 0.70) color = light;
      else if (n < 0.88) color = highlight;
      else color = sparkle;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Wave crests — curved highlights that move across the surface
  for (let row = 0; row < 4; row++) {
    const baseY = (row * 4 + frame * 2) % 16;
    for (let x = 0; x < 16; x++) {
      const wy = baseY + Math.round(Math.sin((x + frame * 3) * 0.6) * 1.2);
      if (wy >= 0 && wy < 16) {
        ctx.fillStyle = sparkle;
        ctx.fillRect(x, wy, 1, 1);
      }
    }
  }

  // Sparkle dots
  if (frame % 2 === 0) {
    const sx = (frame * 7 + 3) % 14 + 1;
    const sy = (frame * 11 + 5) % 14 + 1;
    ctx.fillStyle = '#8ab8c8';
    ctx.fillRect(sx, sy, 1, 1);
  }

  const tex = createPixelTexture(c, `water-${frame}`);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 1.5, h / 1.5);
  return tex;
}

function makeShoreWetTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 8);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const r = ((x * 7 + y * 13) % 5);
      if (r < 1) {
        ctx.fillStyle = '#7a8a6a';
      } else if (r < 3) {
        ctx.fillStyle = '#8a9a7a';
      } else {
        ctx.fillStyle = '#6a7a5a';
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return createPixelTexture(c, 'shore-wet-tex');
}

function makeShoreSandTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 8);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const r = ((x * 7 + y * 13) % 5);
      if (r < 1) {
        ctx.fillStyle = '#a09070';
      } else if (r < 3) {
        ctx.fillStyle = '#b0a080';
      } else {
        ctx.fillStyle = '#908060';
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return createPixelTexture(c, 'shore-sand-tex');
}

function makeDeepWaterTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 8);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const n = (x * 3 + y * 7) % 6;
      if (n < 2) {
        ctx.fillStyle = '#2a5868';
      } else if (n < 4) {
        ctx.fillStyle = '#306070';
      } else {
        ctx.fillStyle = '#356575';
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return createPixelTexture(c, 'deep-water-tex');
}

function makeShoreEdgeTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(8, 8);
  ctx.imageSmoothingEnabled = false;

  // Transition from green grass to brown sand
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const r = ((x * 5 + y * 11) % 7);
      if (r < 2) {
        ctx.fillStyle = '#5a7a4a';
      } else if (r < 4) {
        ctx.fillStyle = '#8a8a6a';
      } else {
        ctx.fillStyle = '#a09070';
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return createPixelTexture(c, 'shore-edge-tex');
}

export function WaterSurface({
  position,
  width,
  height,
}: {
  position: [number, number, number];
  width: number;
  height: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const frames = useMemo(() => {
    return [0, 1, 2, 3].map(f => makeWaterFrame(f, width, height));
  }, [width, height]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: frames[0],
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      roughness: 0.15,
      metalness: 0.2,
      color: '#6a9aaa',
      side: THREE.DoubleSide,
    });
  }, [frames]);

  const wetTex = useMemo(() => makeShoreWetTexture(), []);
  const wetMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: wetTex,
    roughness: 0.85,
    metalness: 0,
  }), [wetTex]);

  const sandTex = useMemo(() => makeShoreSandTexture(), []);
  const sandMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: sandTex,
    roughness: 0.9,
    metalness: 0,
  }), [sandTex]);

  const deepTex = useMemo(() => makeDeepWaterTexture(), []);
  const deepMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: deepTex,
    roughness: 0.3,
    metalness: 0.1,
    color: '#4a7888',
  }), [deepTex]);

  const edgeTex = useMemo(() => makeShoreEdgeTexture(), []);
  const edgeMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: edgeTex,
    roughness: 0.9,
    metalness: 0,
  }), [edgeTex]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const frameIdx = Math.floor(timeRef.current * 2) % 4;
    if (material.map !== frames[frameIdx]) {
      material.map = frames[frameIdx];
      material.needsUpdate = true;
    }
    if (meshRef.current) {
      meshRef.current.position.y = position[1] - 0.18 + Math.sin(timeRef.current * 0.4) * 0.002;
    }
  });

  const cx = position[0];
  const cz = position[2];
  const y = position[1] - 0.18;

  // Multi-stage shoreline: grass→edge→sand→wet→deep→water
  const edgeW = 0.12;
  const sandW = 0.10;
  const wetW = 0.08;
  const deepW = 0.14;

  return (
    <group>
      {/* Bottom layer: brown earth visible below water */}
      <mesh
        position={[cx, y - 0.04, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width + (edgeW + sandW + wetW + deepW) * 2 + 0.08, height + (edgeW + sandW + wetW + deepW) * 2 + 0.08]} />
        <meshStandardMaterial color="#6a5a40" roughness={0.9} metalness={0} />
      </mesh>

      {/* Deep water underlay (slightly wider than main water) */}
      <mesh
        position={[cx, y - 0.025, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width + (wetW + deepW) * 2 + 0.04, height + (wetW + deepW) * 2 + 0.04]} />
        <primitive object={deepMat} attach="material" />
      </mesh>

      {/* Main animated water surface */}
      <mesh
        ref={meshRef}
        position={[cx, y, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, height]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Wet shore border (dark green-brown) */}
      <mesh position={[cx - width / 2 - wetW / 2, y + 0.003, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[wetW, height]} />
        <primitive object={wetMat} attach="material" />
      </mesh>
      <mesh position={[cx + width / 2 + wetW / 2, y + 0.003, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[wetW, height]} />
        <primitive object={wetMat} attach="material" />
      </mesh>
      <mesh position={[cx, y + 0.003, cz - height / 2 - wetW / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + wetW * 2, wetW]} />
        <primitive object={wetMat} attach="material" />
      </mesh>
      <mesh position={[cx, y + 0.003, cz + height / 2 + wetW / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + wetW * 2, wetW]} />
        <primitive object={wetMat} attach="material" />
      </mesh>

      {/* Sand shore border */}
      <mesh position={[cx - width / 2 - wetW - sandW / 2, y + 0.006, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[sandW, height + wetW * 2]} />
        <primitive object={sandMat} attach="material" />
      </mesh>
      <mesh position={[cx + width / 2 + wetW + sandW / 2, y + 0.006, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[sandW, height + wetW * 2]} />
        <primitive object={sandMat} attach="material" />
      </mesh>
      <mesh position={[cx, y + 0.006, cz - height / 2 - wetW - sandW / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + (wetW + sandW) * 2, sandW]} />
        <primitive object={sandMat} attach="material" />
      </mesh>
      <mesh position={[cx, y + 0.006, cz + height / 2 + wetW + sandW / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + (wetW + sandW) * 2, sandW]} />
        <primitive object={sandMat} attach="material" />
      </mesh>

      {/* Grass-to-sand transition edge border */}
      <mesh position={[cx - width / 2 - wetW - sandW - edgeW / 2, y + 0.009, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[edgeW, height + (wetW + sandW) * 2]} />
        <primitive object={edgeMat} attach="material" />
      </mesh>
      <mesh position={[cx + width / 2 + wetW + sandW + edgeW / 2, y + 0.009, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[edgeW, height + (wetW + sandW) * 2]} />
        <primitive object={edgeMat} attach="material" />
      </mesh>
      <mesh position={[cx, y + 0.009, cz - height / 2 - wetW - sandW - edgeW / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + (wetW + sandW + edgeW) * 2, edgeW]} />
        <primitive object={edgeMat} attach="material" />
      </mesh>
      <mesh position={[cx, y + 0.009, cz + height / 2 + wetW + sandW + edgeW / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + (wetW + sandW + edgeW) * 2, edgeW]} />
        <primitive object={edgeMat} attach="material" />
      </mesh>
    </group>
  );
}
