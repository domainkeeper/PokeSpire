import { useState, useCallback } from 'react';
import { useGameStore } from '../../state/gameStore';
import { getMap } from '../../data/maps';
import { MapRenderer } from './MapRenderer';
import { Player } from '../entities/Player';
import { FollowCamera } from '../entities/FollowCamera';
import { eventBus, GameEvents } from '../eventBus';
import { FOG_NEAR, FOG_FAR } from '../../utils/constants';

export function OverworldScene() {
  const currentMapId = useGameStore((s) => s.player.mapId);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const [transitioning, setTransitioning] = useState(false);

  const mapData = getMap(currentMapId);

  const handleExitCheck = useCallback(
    (_gx: number, _gy: number) => {
      if (!mapData || transitioning) return;
      const playerState = useGameStore.getState().player;
      const exit = mapData.exits.find((e) => e.x === playerState.x && e.y === playerState.y);
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
      <ambientLight intensity={0.6} color="#b3e5fc" />
      <directionalLight
        position={[8, 15, 8]}
        intensity={1.8}
        color="#fff8e1"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <hemisphereLight args={['#87ceeb', '#4caf50', 0.4]} />

      <MapRenderer mapData={mapData} />
      <Player mapData={mapData} onExitCheck={handleExitCheck} />
      <FollowCamera />

      <fog attach="fog" args={['#87ceeb', FOG_NEAR, FOG_FAR]} />
    </>
  );
}
