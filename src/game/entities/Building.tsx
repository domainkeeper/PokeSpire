import * as THREE from 'three';
import { BUILDING2_GRADIENT } from '../../utils/toonMaterials';

interface BuildingProps {
  position: [number, number, number];
  color?: 'red' | 'blue';
}

function makeGradientMap(color1: string, color2: string, color3: string, color4: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  [color1, color2, color3, color4].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i, 0, 1, 1);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

const ROOF = makeGradientMap('#ef5350', '#c62828', '#b71c1c', '#880e0e');
const WALL = makeGradientMap('#efebe9', '#d7ccc8', '#bcaaa4', '#a1887f');
const DOOR = makeGradientMap('#6d4c41', '#5d4037', '#4e342e', '#3e2723');
const WINDOW = makeGradientMap('#4fc3f7', '#29b6f6', '#0288d1', '#01579b');

export function Building({ position, color = 'red' }: BuildingProps) {
  const roofGrad = color === 'red' ? ROOF : BUILDING2_GRADIENT;

  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.6, 1, 1.4]} />
        <meshToonMaterial color="#efebe9" gradientMap={WALL} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[1.2, 0.7, 4]} />
        <meshToonMaterial color={color === 'red' ? '#c62828' : '#1565c0'} gradientMap={roofGrad} />
      </mesh>
      <mesh position={[0, 0.3, 0.71]} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.02]} />
        <meshToonMaterial color="#5d4037" gradientMap={DOOR} />
      </mesh>
      <mesh position={[-0.4, 0.55, 0.71]}>
        <boxGeometry args={[0.2, 0.2, 0.02]} />
        <meshToonMaterial color="#4fc3f7" gradientMap={WINDOW} />
      </mesh>
      <mesh position={[0.4, 0.55, 0.71]}>
        <boxGeometry args={[0.2, 0.2, 0.02]} />
        <meshToonMaterial color="#4fc3f7" gradientMap={WINDOW} />
      </mesh>
    </group>
  );
}
