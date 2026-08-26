import { FENCE_GRADIENT } from '../../utils/toonMaterials';

interface FenceProps {
  position: [number, number, number];
}

export function Fence({ position }: FenceProps) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.08, 0.08]} />
        <meshToonMaterial color="#a1887f" gradientMap={FENCE_GRADIENT} />
      </mesh>
      <mesh position={[-0.35, 0.2, 0]} castShadow>
        <boxGeometry args={[0.06, 0.4, 0.06]} />
        <meshToonMaterial color="#8d6e63" gradientMap={FENCE_GRADIENT} />
      </mesh>
      <mesh position={[0.35, 0.2, 0]} castShadow>
        <boxGeometry args={[0.06, 0.4, 0.06]} />
        <meshToonMaterial color="#8d6e63" gradientMap={FENCE_GRADIENT} />
      </mesh>
    </group>
  );
}

export function FenceRow({ positions }: { positions: [number, number, number][] }) {
  return (
    <>
      {positions.map((pos, i) => (
        <Fence key={i} position={pos} />
      ))}
    </>
  );
}
