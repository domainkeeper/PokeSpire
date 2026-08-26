import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

function ToonGround() {
  const gradientMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#4a8c3f';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#3d7a34';
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#2d6a24';
    ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = '#1d5a14';
    ctx.fillRect(3, 0, 1, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshToonMaterial color="#4caf50" gradientMap={gradientMap} />
    </mesh>
  );
}

function ToonTree({ position }: { position: [number, number, number] }) {
  const gradientMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#0d3d10';
    ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = '#0a2e0c';
    ctx.fillRect(3, 0, 1, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, []);

  const trunkGradient = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(3, 0, 1, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 6]} />
        <meshToonMaterial color="#8d6e63" gradientMap={trunkGradient} />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[1, 2, 6]} />
        <meshToonMaterial color="#2e7d32" gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.7, 1.5, 6]} />
        <meshToonMaterial color="#1b5e20" gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

function ToonRock({ position }: { position: [number, number, number] }) {
  const gradientMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#757575';
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#616161';
    ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = '#424242';
    ctx.fillRect(3, 0, 1, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, []);

  return (
    <mesh position={position} castShadow>
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshToonMaterial color="#9e9e9e" gradientMap={gradientMap} />
    </mesh>
  );
}

function PlayerCharacter() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyGradient = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#42a5f5';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#1e88e5';
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = '#0d47a1';
    ctx.fillRect(3, 0, 1, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.5, 8, 16]} />
        <meshToonMaterial color="#42a5f5" gradientMap={bodyGradient} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshToonMaterial color="#ffcc80" gradientMap={bodyGradient} />
      </mesh>
    </group>
  );
}

function SimpleCreature({ position, color }: { position: [number, number, number]; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const gradientMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(3, 0, 1, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, [color]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.08;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshToonMaterial color={color} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshToonMaterial color={color} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[-0.15, 0.85, 0]} castShadow>
        <coneGeometry args={[0.06, 0.15, 6]} />
        <meshToonMaterial color="#ffffff" gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.15, 0.85, 0]} castShadow>
        <coneGeometry args={[0.06, 0.15, 6]} />
        <meshToonMaterial color="#ffffff" gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#b3e5fc" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        color="#fff8e1"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <hemisphereLight
        args={['#87ceeb', '#4caf50', 0.3]}
      />
    </>
  );
}

export function OverworldScene() {
  return (
    <>
      <Lighting />
      <ToonGround />

      {/* Trees */}
      <ToonTree position={[-4, 0, -3]} />
      <ToonTree position={[-3, 0, -5]} />
      <ToonTree position={[4, 0, -4]} />
      <ToonTree position={[5, 0, -2]} />
      <ToonTree position={[-5, 0, 2]} />
      <ToonTree position={[3, 0, 4]} />

      {/* Rocks */}
      <ToonRock position={[2, 0.2, -2]} />
      <ToonRock position={[-2, 0.15, 3]} />
      <ToonRock position={[4, 0.1, 1]} />

      {/* Player */}
      <PlayerCharacter />

      {/* Wild creature placeholder */}
      <SimpleCreature position={[3, 0, -1]} color="#e53935" />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={8}
        maxDistance={20}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={Math.PI / 6}
        target={[0, 0, 0]}
      />

      <fog attach="fog" args={['#87ceeb', 15, 30]} />
    </>
  );
}
