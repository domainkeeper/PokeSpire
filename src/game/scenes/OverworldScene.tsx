import { useState, useCallback } from 'react';
import { useGameStore } from '../../state/gameStore';
import { getMap } from '../../data/maps';
import { MapRenderer } from './MapRenderer';
import { Player } from '../entities/Player';
import { FollowCamera } from '../entities/FollowCamera';
import { SkyBackground } from '../pixel/SkyBackground';
import { eventBus, GameEvents } from '../eventBus';

export function OverworldScene() {
  const currentMapId = useGameStore((s) => s.player.mapId);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const [transitioning, setTransitioning] = useState(false);

  const mapData = getMap(currentMapId);

  const handleExitCheck = useCallback(
    (_gx: number, _gy: number) => {
      if (!mapData || transitioning) return;
      const playerState = useGameStore.getState().player;
      const exit = mapData.exits.find(
        (e) =>
          playerState.x >= e.x &&
          playerState.x < e.x + e.w &&
          playerState.y >= e.y &&
          playerState.y < e.y + e.h,
      );
      if (!exit) return;

      setTransitioning(true);
      eventBus.emit(GameEvents.MAP_TRANSITION, { from: currentMapId, to: exit.toMap });

      setTimeout(() => {
        setPlayerPosition(exit.spawnX, exit.spawnY, exit.facing, exit.toMap);
        setTimeout(() => setTransitioning(false), 300);
      }, 400);
    },
    [mapData, currentMapId, setPlayerPosition, transitioning],
  );

  if (!mapData) return null;

  return (
    <>
      <color attach="background" args={['#a0bcd0']} />
      <ambientLight intensity={0.5} color="#d8d0c0" />
      <hemisphereLight args={['#90b8d0', '#4a7a42', 0.5]} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.2}
        color="#f0e8d8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.001}
      />

      <SkyBackground type={mapData.backgroundType} />
      <MapRenderer mapData={mapData} />
      <Player mapData={mapData} onExitCheck={handleExitCheck} />
      <FollowCamera />
    </>
  );
}