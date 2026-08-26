import { ROCK_GRADIENT } from '../../utils/toonMaterials';

interface RockProps {
  position: [number, number, number];
  scale?: number;
}

export function Rock({ position, scale = 1 }: RockProps) {
  return (
    <mesh position={[position[0], position[1] + 0.2, position[2]]} castShadow scale={scale}>
      <dodecahedronGeometry args={[0.35, 0]} />
      <meshToonMaterial color="#9e9e9e" gradientMap={ROCK_GRADIENT} />
    </mesh>
  );
}

export function SmallRock({ position }: { position: [number, number, number] }) {
  return <Rock position={position} scale={0.5} />;
}
