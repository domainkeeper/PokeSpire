import { useMemo } from 'react';
import { getToonMat } from '../fx/ToonMaterial';

interface PropProps {
  position: [number, number, number];
  scale?: number;
}

export function Bush3D({ position, scale = 1 }: PropProps) {
  const mats = useMemo(() => ({
    dark: getToonMat('#2e7d32'),
    mid: getToonMat('#43a047'),
    light: getToonMat('#66bb6a'),
    highlight: getToonMat('#a5d6a7'),
  }), []);
  const s = scale;
  return (
    <group position={position}>
      <mesh position={[0, 0.35 * s, 0]} material={mats.dark}>
        <sphereGeometry args={[0.45 * s, 8, 6]} />
      </mesh>
      <mesh position={[0.15 * s, 0.4 * s, 0.1 * s]} material={mats.mid}>
        <sphereGeometry args={[0.35 * s, 8, 6]} />
      </mesh>
      <mesh position={[-0.1 * s, 0.45 * s, -0.05 * s]} material={mats.light}>
        <sphereGeometry args={[0.25 * s, 8, 6]} />
      </mesh>
      <mesh position={[0.05 * s, 0.55 * s, 0.05 * s]} material={mats.highlight}>
        <sphereGeometry args={[0.15 * s, 8, 6]} />
      </mesh>
    </group>
  );
}

export function Rock3D({ position, scale = 1 }: PropProps) {
  const mats = useMemo(() => ({
    dark: getToonMat('#546e7a'),
    mid: getToonMat('#78909c'),
    light: getToonMat('#b0bec5'),
    highlight: getToonMat('#eceff1'),
  }), []);
  const s = scale;
  return (
    <group position={position}>
      <mesh position={[0, 0.2 * s, 0]} material={mats.mid}>
        <dodecahedronGeometry args={[0.3 * s, 0]} />
      </mesh>
      <mesh position={[0.05 * s, 0.3 * s, 0.05 * s]} material={mats.light}>
        <dodecahedronGeometry args={[0.18 * s, 0]} />
      </mesh>
      <mesh position={[-0.05 * s, 0.35 * s, 0.02 * s]} material={mats.highlight}>
        <dodecahedronGeometry args={[0.08 * s, 0]} />
      </mesh>
    </group>
  );
}

export function Flower3D({ position, scale = 1, color = '#f48fb1' }: PropProps & { color?: string }) {
  const mats = useMemo(() => ({
    stem: getToonMat('#388e3c'),
    petal: getToonMat(color),
    center: getToonMat('#fff176'),
    leaf: getToonMat('#2e7d32'),
  }), [color]);
  const s = scale;
  return (
    <group position={position}>
      <mesh position={[0, 0.3 * s, 0]} material={mats.stem}>
        <cylinderGeometry args={[0.02 * s, 0.03 * s, 0.6 * s, 4]} />
      </mesh>
      <mesh position={[0, 0.65 * s, 0]} material={mats.petal}>
        <sphereGeometry args={[0.12 * s, 6, 6]} />
      </mesh>
      <mesh position={[0, 0.68 * s, 0]} material={mats.center}>
        <sphereGeometry args={[0.05 * s, 6, 6]} />
      </mesh>
      <mesh position={[0.08 * s, 0.2 * s, 0]} rotation={[0, 0, 0.4]} material={mats.leaf}>
        <boxGeometry args={[0.12 * s, 0.04 * s, 0.08 * s]} />
      </mesh>
    </group>
  );
}

export function Fence3D({ position, scale = 1 }: PropProps) {
  const mats = useMemo(() => ({
    post: getToonMat('#8d6e63'),
    rail: getToonMat('#a1887f'),
    railDark: getToonMat('#6d4c41'),
  }), []);
  const s = scale;
  return (
    <group position={position}>
      {/* Posts */}
      <mesh position={[-0.4 * s, 0.35 * s, 0]} material={mats.post}>
        <boxGeometry args={[0.08 * s, 0.7 * s, 0.08 * s]} />
      </mesh>
      <mesh position={[0, 0.35 * s, 0]} material={mats.post}>
        <boxGeometry args={[0.08 * s, 0.7 * s, 0.08 * s]} />
      </mesh>
      <mesh position={[0.4 * s, 0.35 * s, 0]} material={mats.post}>
        <boxGeometry args={[0.08 * s, 0.7 * s, 0.08 * s]} />
      </mesh>
      {/* Rails */}
      <mesh position={[0, 0.35 * s, 0]} material={mats.rail}>
        <boxGeometry args={[0.9 * s, 0.06 * s, 0.05 * s]} />
      </mesh>
      <mesh position={[0, 0.2 * s, 0]} material={mats.railDark}>
        <boxGeometry args={[0.9 * s, 0.06 * s, 0.05 * s]} />
      </mesh>
    </group>
  );
}

export function Sign3D({ position, scale = 1 }: PropProps) {
  const mats = useMemo(() => ({
    post: getToonMat('#6d4c41'),
    board: getToonMat('#ffc107'),
    boardLight: getToonMat('#ffe082'),
    text: getToonMat('#ff8f00'),
    border: getToonMat('#f9a825'),
  }), []);
  const s = scale;
  return (
    <group position={position}>
      <mesh position={[0, 0.3 * s, 0]} material={mats.post}>
        <cylinderGeometry args={[0.03 * s, 0.04 * s, 0.6 * s, 6]} />
      </mesh>
      <mesh position={[0, 0.75 * s, 0.02]} material={mats.board}>
        <boxGeometry args={[0.5 * s, 0.45 * s, 0.05 * s]} />
      </mesh>
      <mesh position={[0, 0.75 * s, 0.03]} material={mats.boardLight}>
        <boxGeometry args={[0.4 * s, 0.35 * s, 0.03]} />
      </mesh>
      {/* Text lines */}
      <mesh position={[0, 0.78 * s, 0.05]} material={mats.text}>
        <boxGeometry args={[0.3 * s, 0.03 * s, 0.01]} />
      </mesh>
      <mesh position={[0, 0.72 * s, 0.05]} material={mats.text}>
        <boxGeometry args={[0.25 * s, 0.03 * s, 0.01]} />
      </mesh>
    </group>
  );
}
