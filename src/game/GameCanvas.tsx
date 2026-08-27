import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OverworldScene } from './scenes/OverworldScene';
import { TransitionOverlay } from './fx/TransitionOverlay';
import { Minimap } from './ui/Minimap';
import { ExpandedMap } from './ui/ExpandedMap';
import { RotationPrompt } from './ui/RotationPrompt';
import { VirtualJoystick } from './ui/VirtualJoystick';
import { useDeviceInfo } from './hooks/useDevice';

export function GameCanvas() {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { isMobile, isLandscape, pixelRatio } = useDeviceInfo();

  const handleMinimapClick = useCallback(() => {
    setIsMapOpen((prev) => !prev);
  }, []);

  const handleMapClose = useCallback(() => {
    setIsMapOpen(false);
  }, []);

  const canvasStyle = {
    width: '100%',
    height: '100%',
    display: 'block',
    imageRendering: 'pixelated' as const,
  };

  const containerStyle = {
    width: '100vw',
    height: '100vh',
    position: 'relative' as const,
    overflow: 'hidden',
    touchAction: 'none' as const,
  };

  return (
    <div style={containerStyle}>
      <RotationPrompt />

      <Canvas
        camera={{
          position: [0, 4.5, 4.0],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: false,
          alpha: false,
          preserveDrawingBuffer: true,
        }}
        shadows
        dpr={isMobile ? Math.min(pixelRatio, 1.5) : 0.35}
        style={canvasStyle}
      >
        <OverworldScene />
      </Canvas>

      <TransitionOverlay />

      {!isMobile && (
        <Minimap onClick={handleMinimapClick} />
      )}

      {isMobile && isLandscape && (
        <Minimap onClick={handleMinimapClick} />
      )}

      <VirtualJoystick />

      <ExpandedMap onClose={handleMapClose} isOpen={isMapOpen} />
    </div>
  );
}
