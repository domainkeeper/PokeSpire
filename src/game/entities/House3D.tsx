import { useMemo } from 'react';
import { getToonMat } from '../fx/ToonMaterial';

interface HouseProps {
  position: [number, number, number];
  variant?: 'red' | 'blue';
  scale?: number;
}

export function House({ position, variant = 'red', scale = 1 }: HouseProps) {
  const s = scale;
  const wallColor = variant === 'red' ? '#fff8e1' : '#e8f4fd';
  const roofColor = variant === 'red' ? '#c62828' : '#1565c0';
  const roofDark = variant === 'red' ? '#8e0000' : '#0d47a1';
  const doorColor = '#5d4037';
  const windowColor = variant === 'red' ? '#4fc3f7' : '#90caf9';
  const windowFrame = variant === 'red' ? '#b3e5fc' : '#e3f2fd';

  const mats = useMemo(() => ({
    wall: getToonMat(wallColor),
    wallSide: getToonMat(variant === 'red' ? '#f5e6c8' : '#d4e8f7'),
    roof: getToonMat(roofColor),
    roofDark: getToonMat(roofDark),
    roofRim: getToonMat(variant === 'red' ? '#b71c1c' : '#0d47a1'),
    door: getToonMat(doorColor),
    doorKnob: getToonMat('#ffc107'),
    window: getToonMat(windowColor),
    windowFrame: getToonMat(windowFrame),
    foundation: getToonMat('#8d6e63'),
  }), [variant]);

  const w = 3.0 * s;
  const h = 2.8 * s;
  const d = 2.4 * s;
  const roofH = 1.2 * s;

  return (
    <group position={position}>
      {/* Foundation */}
      <mesh position={[0, 0.08 * s, 0]} material={mats.foundation}>
        <boxGeometry args={[w + 0.15, 0.16 * s, d + 0.15]} />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, h / 2 + 0.16 * s, d / 2]} material={mats.wall}>
        <boxGeometry args={[w, h, 0.12]} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, h / 2 + 0.16 * s, -d / 2]} material={mats.wallSide}>
        <boxGeometry args={[w, h, 0.12]} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-w / 2, h / 2 + 0.16 * s, 0]} material={mats.wallSide}>
        <boxGeometry args={[0.12, h, d]} />
      </mesh>
      {/* Right wall */}
      <mesh position={[w / 2, h / 2 + 0.16 * s, 0]} material={mats.wallSide}>
        <boxGeometry args={[0.12, h, d]} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.55 * s, d / 2 + 0.07]} material={mats.door}>
        <boxGeometry args={[0.5 * s, 1.0 * s, 0.08]} />
      </mesh>
      <mesh position={[0.15 * s, 0.55 * s, d / 2 + 0.12]} material={mats.doorKnob}>
        <sphereGeometry args={[0.03 * s, 6, 6]} />
      </mesh>

      {/* Front windows */}
      <mesh position={[-0.85 * s, 1.4 * s, d / 2 + 0.07]} material={mats.windowFrame}>
        <boxGeometry args={[0.65 * s, 0.55 * s, 0.06]} />
      </mesh>
      <mesh position={[-0.85 * s, 1.4 * s, d / 2 + 0.1]} material={mats.window}>
        <boxGeometry args={[0.5 * s, 0.4 * s, 0.04]} />
      </mesh>
      <mesh position={[0.85 * s, 1.4 * s, d / 2 + 0.07]} material={mats.windowFrame}>
        <boxGeometry args={[0.65 * s, 0.55 * s, 0.06]} />
      </mesh>
      <mesh position={[0.85 * s, 1.4 * s, d / 2 + 0.1]} material={mats.window}>
        <boxGeometry args={[0.5 * s, 0.4 * s, 0.04]} />
      </mesh>

      {/* Roof - pyramid using 4 rotated planes */}
      <group position={[0, h + 0.16 * s, 0]}>
        {/* Roof base rim */}
        <mesh position={[0, 0, 0]} material={mats.roofRim}>
          <boxGeometry args={[w + 0.5, 0.12, d + 0.5]} />
        </mesh>
        {/* Front slope */}
        <mesh position={[0, roofH * 0.35, d * 0.28]} rotation={[0.55, 0, 0]} material={mats.roof}>
          <boxGeometry args={[w + 0.3, roofH * 0.8, 0.1]} />
        </mesh>
        {/* Back slope */}
        <mesh position={[0, roofH * 0.35, -d * 0.28]} rotation={[-0.55, 0, 0]} material={mats.roof}>
          <boxGeometry args={[w + 0.3, roofH * 0.8, 0.1]} />
        </mesh>
        {/* Left slope */}
        <mesh position={[-w * 0.28, roofH * 0.35, 0]} rotation={[0, 0, 0.55]} material={mats.roof}>
          <boxGeometry args={[0.1, roofH * 0.8, d + 0.3]} />
        </mesh>
        {/* Right slope */}
        <mesh position={[w * 0.28, roofH * 0.35, 0]} rotation={[0, 0, -0.55]} material={mats.roof}>
          <boxGeometry args={[0.1, roofH * 0.8, d + 0.3]} />
        </mesh>
        {/* Roof top ridge */}
        <mesh position={[0, roofH * 0.65, 0]} material={mats.roofDark}>
          <boxGeometry args={[0.15, 0.1, d * 0.6]} />
        </mesh>
      </group>

      {/* Chimney for red variant */}
      {variant === 'red' && (
        <group position={[w * 0.3, h + roofH * 0.5, 0]}>
          <mesh material={mats.roofDark}>
            <boxGeometry args={[0.35 * s, 0.8 * s, 0.35 * s]} />
          </mesh>
          <mesh position={[0, 0.45 * s, 0]} material={mats.roofRim}>
            <boxGeometry args={[0.42 * s, 0.1 * s, 0.42 * s]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
