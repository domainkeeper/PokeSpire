import { useState, useCallback } from 'react';
import { useGameStore } from '../../state/gameStore';
import { getMap } from '../../data/maps';
import { MapRenderer } from './MapRenderer';
import { Player } from '../entities/Player';
import { FollowCamera } from '../entities/FollowCamera';
import { SkyBackground } from '../pixel/SkyBackground';
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
      <color attach="background" args={['#87ceeb']} />
      <ambientLight intensity={1} />
      <fog attach="fog" args={['#c8e6ff', FOG_NEAR, FOG_FAR]} />

      <SkyBackground type={mapData.backgroundType} />
      <MapRenderer mapData={mapData} />
      <Player mapData={mapData} onExitCheck={handleExitCheck} />
      <FollowCamera />
    </>
  );
}
