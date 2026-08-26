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
  const timeRef = useRef(0);

  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const band = Math.floor(y / 8) % 4;
        const colors = ['#1565c0', '#1976d2', '#1e88e5', '#1976d2'];
        ctx.fillStyle = colors[band];
        ctx.fillRect(x, y, 1, 1);

        if (band === 1) {
          const px = (x + 3) % 16;
          if (px < 6) {
            ctx.fillStyle = '#42a5f5';
            ctx.fillRect(x, y, 1, 1);
          }
        }
        if (band === 3) {
          const px = (x + 11) % 16;
          if (px < 4) {
            ctx.fillStyle = '#64b5f6';
            ctx.fillRect(x, y, 1, 1);
          }
        }

        const sparkle = ((x * 13 + y * 7) % 41);
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

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.offset.x = Math.sin(timeRef.current * 0.2) * 0.06;
        mat.map.offset.y = timeRef.current * 0.04;
        mat.map.needsUpdate = false;
      }
    }
  });

  return (
    <group>
      <mesh
        position={[position[0], -0.1, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={position[2] - 0.2}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} transparent opacity={0.9} />
      </mesh>

      <mesh
        position={[position[0], -0.06, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={position[2] - 0.15}
      >
        <planeGeometry args={[width + 0.2, height + 0.2]} />
        <meshBasicMaterial color="#8d6e4c" transparent opacity={0.5} />
      </mesh>

      <mesh
        position={[position[0], -0.04, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={position[2] - 0.1}
      >
        <planeGeometry args={[width + 0.4, height + 0.4]} />
        <meshBasicMaterial color="#a1887f" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
