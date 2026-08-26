import { Canvas } from '@react-three/fiber';
import { OverworldScene } from './scenes/OverworldScene';
import { TransitionOverlay } from './fx/TransitionOverlay';

export function GameCanvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{
          position: [0, 4.5, 4.0],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: false, alpha: false }}
        shadows
        dpr={0.35}
        style={{ background: '#87ceeb', imageRendering: 'pixelated' }}
      >
        <OverworldScene />
      </Canvas>
      <TransitionOverlay />
    </div>
  );
}