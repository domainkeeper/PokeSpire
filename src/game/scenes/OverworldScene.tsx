import { useState, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import { getMap } from '../../data/maps';
import { MapRenderer } from './MapRenderer';
import { Player } from '../entities/Player';
import { FollowCamera } from '../entities/FollowCamera';
import { SkyDome } from '../pixel/SkyDome';
import { eventBus, GameEvents } from '../eventBus';
import { playerTransform } from '../playerTransform';
import { getTheme } from '../../theme';
import type { Theme } from '../../theme/types';

/** Half-extent of the shadow frustum, world units, centred on the player. */
const SHADOW_EXTENT = 7;

/**
 * Sun rig.
 *
 * Direction comes from the theme (azimuth/elevation), so dusk themes get long
 * raking shadows and midday themes get short ones - a data change, not code.
 *
 * The frustum tracks the player. Previously it was a fixed +/-15 WU box centred
 * on the world origin, which both spawn points sit outside (town 18.75 WU,
 * route1 25 WU), so no shadow was ever visible while a 2048px shadow pass still
 * ran over every caster in the map.
 */
function SunLight({ theme }: { theme: Theme }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  const { azimuth, elevation } = theme.lighting.sun;
  const dist = 12;
  const offX = Math.cos(azimuth) * Math.cos(elevation) * dist;
  const offZ = Math.sin(azimuth) * Math.cos(elevation) * dist;
  const offY = Math.max(2.5, Math.sin(elevation) * dist);

  useFrame(() => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (!light || !target || !playerTransform.ready) return;

    const { x, z } = playerTransform;
    target.position.set(x, 0, z);
    target.updateMatrixWorld();
    light.position.set(x + offX, offY, z + offZ);
  });

  return (
    <>
      <object3D ref={targetRef} />
      <directionalLight
        ref={lightRef}
        intensity={theme.lighting.sun.intensity}
        color={theme.lighting.sun.color}
        castShadow
        target={targetRef.current ?? undefined}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
      />
    </>
  );
}

export function OverworldScene() {
  const currentMapId = useGameStore((s) => s.player.mapId);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const [transitioning, setTransitioning] = useState(false);

  const mapData = getMap(currentMapId);
  // Each map declares its own theme; unknown/absent falls back to the default.
  const theme = getTheme(mapData?.themeId);

  const handleExitCheck = useCallback(
    (gx: number, gy: number) => {
      if (!mapData || transitioning) return;
      const exit = mapData.exits.find(
        (e) => gx >= e.x && gx < e.x + e.w && gy >= e.y && gy < e.y + e.h,
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
      <color attach="background" args={[theme.background]} />
      {theme.fog.enabled && (
        <fog attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />
      )}

      <ambientLight
        intensity={theme.lighting.ambient.intensity}
        color={theme.lighting.ambient.color}
      />
      <hemisphereLight
        args={[
          theme.lighting.hemisphere.sky,
          theme.lighting.hemisphere.ground,
          theme.lighting.hemisphere.intensity,
        ]}
      />
      <SunLight theme={theme} />

      <SkyDome theme={theme} />
      <MapRenderer mapData={mapData} theme={theme} />
      <Player mapData={mapData} theme={theme} onExitCheck={handleExitCheck} />
      <FollowCamera />
    </>
  );
}
