import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { BattleSnapshot, CombatantId, NonVolatileStatus } from '../engine/battleTypes';
import { getMove } from '../engine/moveRegistry';
import { advanceClock, battleClock } from './battleClock';
import { advanceCamera } from './battleCamera';
import { CombatantRig } from './CombatantRig';
import { MoveFxDirector } from './fx/MoveFxDirector';
import { guardProfile, resolveProfile } from './fx/profileResolver';
import { StatusOverlay } from '../../game/effects/status/StatusOverlay';
import { STATUS_PRESETS } from '../../game/effects/presets/statusPresets';
import type { Beat } from './useEventPlayer';
import type { PokemonType } from '../../data/pokemon/schemas/index';

export const PLAYER_POS: [number, number, number] = [-2.35, 0, 0.75];
export const ENEMY_POS: [number, number, number] = [2.35, 0, -0.55];

const CAMERA_BASE = new THREE.Vector3(0, 2.45, 6.5);
const CAMERA_TARGET = new THREE.Vector3(0, 1.02, 0);

const STATUS_PRESET_KEY: Record<NonVolatileStatus, string> = {
  brn: 'burn',
  psn: 'poison',
  tox: 'poison',
  par: 'paralysis',
  slp: 'sleep',
  frz: 'freeze',
};

/**
 * Drives the shared battle clock. Mounted first and given the highest useFrame
 * priority so timeScale is correct before any consumer reads it this frame.
 */
function BattleClockDriver() {
  useFrame((_, rawDelta) => {
    advanceClock(rawDelta);
  }, -100);
  return null;
}

/**
 * The ONLY writer of the camera transform.
 *
 * FIXES B15: BattleScreen previously mounted OrbitControls (writing every frame)
 * alongside CameraFeedback (also writing absolute positions from a cached origin). The
 * two fought, and directed combat camera work was impossible. There is no OrbitControls
 * in battle, and shake deliberately ignores hit-stop so impacts jolt.
 */
function BattleCameraRig() {
  const { camera } = useThree();
  const dir = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    camera.position.copy(CAMERA_BASE);
    camera.lookAt(CAMERA_TARGET);
  }, [camera]);

  useFrame((_, rawDelta) => {
    const { offset, dolly } = advanceCamera(rawDelta);
    dir.copy(CAMERA_TARGET).sub(CAMERA_BASE).normalize();
    camera.position.copy(CAMERA_BASE).add(offset).addScaledVector(dir, dolly);
    camera.lookAt(CAMERA_TARGET);
  }, -90);

  return null;
}

/** Lit stage: floor, per-combatant platforms and a soft backdrop. */
function Arena() {
  const platform = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(150,170,196,0.55)');
    g.addColorStop(0.62, 'rgba(96,116,144,0.32)');
    g.addColorStop(1, 'rgba(60,74,96,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#242f42" roughness={0.95} metalness={0} />
      </mesh>

      {[PLAYER_POS, ENEMY_POS].map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p[0], 0.004, p[2]]} renderOrder={1}>
          <planeGeometry args={[3.1, 2.1]} />
          <meshBasicMaterial map={platform} transparent depthWrite={false} />
        </mesh>
      ))}

      {/* Backdrop: keeps the silhouettes readable without competing for attention. */}
      <mesh position={[0, 6, -11]}>
        <planeGeometry args={[46, 24]} />
        <meshBasicMaterial color="#141c2b" />
      </mesh>

      <ambientLight intensity={0.72} />
      <hemisphereLight args={['#9db4d4', '#2b3548', 0.5]} />
      <directionalLight position={[3.5, 8, 5]} intensity={1.15} castShadow />
      <directionalLight position={[-4, 3, -4]} intensity={0.35} color="#8fa8d0" />
    </>
  );
}

export interface BattleStageProps {
  display: BattleSnapshot;
  beat: Beat | null;
  /** Called at the exact impact instant of hit `index` in an action beat. */
  onActionHit: (index: number) => void;
  /** Called when the current FX beat finishes. */
  onFxComplete: () => void;
}

export function BattleStage({ display, beat, onActionHit, onFxComplete }: BattleStageProps) {
  const player = display.combatants[display.activePlayerId];
  const enemy = display.combatants[display.activeEnemyId];

  // Sprite heights arrive asynchronously with the atlas metadata and must feed the FX
  // anchor positions, so they live in state rather than a ref (a ref would leave large
  // species using the default height for their first action).
  const [heights, setHeights] = useState<Record<CombatantId, number>>({});
  const heightOf = (id: CombatantId) => heights[id] ?? 1.55;
  const reportHeight = useCallback((id: CombatantId, h: number) => {
    setHeights((prev) => (Math.abs((prev[id] ?? 0) - h) < 0.001 ? prev : { ...prev, [id]: h }));
  }, []);

  const posOf = (id: CombatantId): [number, number, number] =>
    display.combatants[id]?.side === 'player' ? PLAYER_POS : ENEMY_POS;

  // ── FX for the current beat ──
  const fx = useMemo(() => {
    if (!beat) return null;

    if (beat.kind === 'action') {
      const move = getMove(beat.moveId);
      if (!move) return null;
      return {
        key: `${beat.actorId}-${beat.moveId}-${beat.events.length}`,
        profile: resolveProfile(move),
        type: move.type as PokemonType,
        attackerId: beat.actorId,
        targetId: beat.targetId,
        hitCount: beat.hitCount,
        whiffed: beat.whiffed,
      };
    }

    if (beat.kind === 'guard') {
      return {
        key: `guard-${beat.actorId}-${beat.events.length}`,
        profile: guardProfile(),
        type: 'normal' as PokemonType,
        attackerId: beat.actorId,
        // Guard's shield anchors on the guarding combatant itself.
        targetId: beat.actorId,
        hitCount: 1,
        whiffed: true,
      };
    }

    return null;
  }, [beat]);

  return (
    <>
      <BattleClockDriver />
      <BattleCameraRig />
      <Arena />

      {player && (
        <group>
          <CombatantRig
            key={player.id}
            combatantId={player.id}
            speciesId={player.speciesId}
            position={PLAYER_POS}
            facing={1}
            hpFraction={player.hp / player.stats.hp}
            phase={0}
            onSpriteReady={(h) => reportHeight(player.id, h)}
          />
          {player.status && STATUS_PRESETS[STATUS_PRESET_KEY[player.status.id]] && (
            <group position={[PLAYER_POS[0], PLAYER_POS[1] + heightOf(player.id) * 0.5, PLAYER_POS[2]]}>
              <StatusOverlay
                preset={STATUS_PRESETS[STATUS_PRESET_KEY[player.status.id]]}
                width={heightOf(player.id)}
                height={heightOf(player.id)}
              />
            </group>
          )}
        </group>
      )}

      {enemy && (
        <group>
          <CombatantRig
            key={enemy.id}
            combatantId={enemy.id}
            speciesId={enemy.speciesId}
            position={ENEMY_POS}
            facing={-1}
            hpFraction={enemy.hp / enemy.stats.hp}
            phase={Math.PI}
            onSpriteReady={(h) => reportHeight(enemy.id, h)}
          />
          {enemy.status && STATUS_PRESETS[STATUS_PRESET_KEY[enemy.status.id]] && (
            <group position={[ENEMY_POS[0], ENEMY_POS[1] + heightOf(enemy.id) * 0.5, ENEMY_POS[2]]}>
              <StatusOverlay
                preset={STATUS_PRESETS[STATUS_PRESET_KEY[enemy.status.id]]}
                width={heightOf(enemy.id)}
                height={heightOf(enemy.id)}
              />
            </group>
          )}
        </group>
      )}

      {fx && (
        <MoveFxDirector
          key={fx.key}
          profile={fx.profile}
          moveType={fx.type}
          attackerId={fx.attackerId}
          targetId={fx.targetId}
          attackerPos={posOf(fx.attackerId)}
          targetPos={posOf(fx.targetId)}
          attackerHeight={heightOf(fx.attackerId)}
          targetHeight={heightOf(fx.targetId)}
          hitCount={fx.hitCount}
          whiffed={fx.whiffed}
          onHit={onActionHit}
          onComplete={onFxComplete}
        />
      )}
    </>
  );
}

/** Project a world position to normalised screen coords, for DOM overlays. */
export function projectToScreen(
  world: [number, number, number],
  camera: THREE.Camera,
): { x: number; y: number } {
  const v = new THREE.Vector3(...world).project(camera);
  return { x: (v.x * 0.5 + 0.5) * 100, y: (-v.y * 0.5 + 0.5) * 100 };
}

export { battleClock };
