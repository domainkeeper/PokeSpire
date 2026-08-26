import { Canvas } from '@react-three/fiber';
import { OverworldScene } from './scenes/OverworldScene';
import { Postprocessing } from './fx/Postprocessing';
import { TransitionOverlay } from './fx/TransitionOverlay';

export function GameCanvas() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 10, 10], fov: 50 }}
        gl={{ antialias: true, toneMapping: 3 }}
        style={{ background: '#87ceeb' }}
      >
        <OverworldScene />
        <Postprocessing />
      </Canvas>
      <TransitionOverlay />
    </div>
  );
}
