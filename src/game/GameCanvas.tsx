import { Canvas } from '@react-three/fiber';
import { OverworldScene } from './scenes/OverworldScene';
import { TransitionOverlay } from './fx/TransitionOverlay';

export function GameCanvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        orthographic
        camera={{
          zoom: 80,
          position: [0, 10, 7],
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: false, alpha: false }}
        style={{ background: '#87ceeb', imageRendering: 'pixelated' }}
      >
        <OverworldScene />
      </Canvas>
      <TransitionOverlay />
    </div>
  );
}
