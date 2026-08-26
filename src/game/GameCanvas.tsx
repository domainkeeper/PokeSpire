import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OverworldScene } from './scenes/OverworldScene';
import { Postprocessing } from './fx/Postprocessing';

export function GameCanvas() {
  return (
    <div
      id="game-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.2,
        }}
        camera={{
          position: [0, 12, 12],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
      >
        <Suspense fallback={null}>
          <OverworldScene />
          <Postprocessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
