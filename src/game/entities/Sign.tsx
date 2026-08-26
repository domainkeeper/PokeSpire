import { SIGN_GRADIENT } from '../../utils/toonMaterials';

interface SignProps {
  position: [number, number, number];
}

export function Sign({ position }: SignProps) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
        <meshToonMaterial color="#6d4c41" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.04]} />
        <meshToonMaterial color="#ffc107" gradientMap={SIGN_GRADIENT} />
      </mesh>
    </group>
  );
}
