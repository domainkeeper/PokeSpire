import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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

  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const band = Math.floor(y / 8) % 4;
        const colors = ['#1976d2', '#2196f3', '#1976d2', '#1565c0'];
        ctx.fillStyle = colors[band];
        ctx.fillRect(x, y, 1, 1);

        if (band === 1 || band === 3) {
          const px = (x + band * 7) % 16;
          if (px < 8) {
            ctx.fillStyle = '#42a5f5';
            ctx.fillRect(x, y, 1, 1);
          }
        }

        const sparkle = ((x * 13 + y * 7) % 37);
        if (sparkle === 0) {
          ctx.fillStyle = '#bbdefb';
          ctx.fillRect(x, y, 1, 1);
        }
        if (sparkle === 1) {
          ctx.fillStyle = '#e3f2fd';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(width / 2, height / 2);
    return t;
  }, [width, height]);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.offset.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.05;
        mat.map.offset.y = state.clock.elapsedTime * 0.03;
        mat.map.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[position[0], position[1] - 0.08, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={position[2] - 0.1}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} transparent opacity={0.85} />
      </mesh>

      {[-0.04, -0.02].map((dy, i) => (
        <mesh
          key={i}
          position={[position[0], position[1] + dy, position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={position[2] + dy}
        >
          <planeGeometry args={[width + 0.1, height + 0.1]} />
          <meshBasicMaterial
            color={i === 0 ? '#8d6e4c' : '#a1887f'}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      <mesh
        position={[position[0], position[1] - 0.06, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={position[2] - 0.05}
      >
        <planeGeometry args={[width + 0.3, height + 0.3]} />
        <meshBasicMaterial color="#c4b088" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
