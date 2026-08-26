import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getToonMat } from '../fx/ToonMaterial';

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
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const band = Math.floor(y / 4) % 4;
        const colors = ['#1565c0', '#1976d2', '#1e88e5', '#1976d2'];
        ctx.fillStyle = colors[band];
        ctx.fillRect(x, y, 1, 1);

        if (band === 1 && (x + 2) % 8 < 3) {
          ctx.fillStyle = '#42a5f5';
          ctx.fillRect(x, y, 1, 1);
        }
        if (band === 3 && (x + 6) % 8 < 2) {
          ctx.fillStyle = '#64b5f6';
          ctx.fillRect(x, y, 1, 1);
        }

        if ((x * 7 + y * 13) % 31 === 0) {
          ctx.fillStyle = '#bbdefb';
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
    t.repeat.set(width / 1.5, height / 1.5);
    return t;
  }, [width, height]);

  const shoreMat = useMemo(() => getToonMat('#8d6e4c', { transparent: true, opacity: 0.5 }), []);
  const sandMat = useMemo(() => getToonMat('#a1887f', { transparent: true, opacity: 0.3 }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.offset.x = Math.sin(timeRef.current * 0.15) * 0.05;
        mat.map.offset.y = timeRef.current * 0.03;
      }
    }
  });

  const cx = position[0];
  const cz = position[2];
  const y = position[1] - 0.08;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[cx, y, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={cz - 0.3}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} transparent opacity={0.88} />
      </mesh>
      {/* Shore ring */}
      <mesh position={[cx, y + 0.03, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={cz - 0.2}>
        <planeGeometry args={[width + 0.25, height + 0.25]} />
        <primitive object={shoreMat} attach="material" />
      </mesh>
      <mesh position={[cx, y + 0.05, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={cz - 0.15}>
        <planeGeometry args={[width + 0.5, height + 0.5]} />
        <primitive object={sandMat} attach="material" />
      </mesh>
    </group>
  );
}
