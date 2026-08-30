import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BeamEffect,
  DecalEffect,
  FlipbookEffect,
  ParticleEffect,
  ProjectileEffect,
  RingEffect,
  ShieldEffect,
  ShockwaveEffect,
  WaveEffect,
} from '../../../game/effects';
import { createEffectContext, type EffectContext } from '../../../game/effects/types';
import { getTypePalette } from '../../../game/effects/presets/typePalettes';
import type { PokemonType } from '../../../data/pokemon/schemas/index';
import { battleClock } from '../battleClock';
import { cameraCue } from '../battleCamera';
import { rigCue } from './rigBus';
import { buildFxTimeline } from './profileCatalog';
import { STAGE_TIMEOUT_SLACK_MS, type AnimationProfile, type FxAnchor, type FxSpawn } from './animationTypes';

/**
 * MoveFxDirector — turns an AnimationProfile into a live, timed layer stack.
 *
 * Responsibilities, and only these:
 *   - sprite motion cues, VFX layers, release dolly  (move identity)
 * It does NOT decide outcomes, damage, or per-hit impact feedback. The event player
 * owns those, because they are derived from engine events, not from the move.
 *
 * Two invariants that the legacy EffectTimelinePlayer violated:
 *   - the clock is integer MILLISECONDS (its `phase.at` was seconds compared to ms, so
 *     every layer spawned on frame 1)
 *   - every spawn is REAPED at atMs + durationMs, so completion is reachable (it only
 *     ever appended, so `activeLayers.length === 0` was never true and onComplete
 *     never fired)
 */

export interface MoveFxDirectorProps {
  profile: AnimationProfile;
  moveType: PokemonType;
  attackerId: string;
  targetId: string;
  attackerPos: [number, number, number];
  targetPos: [number, number, number];
  /** Sprite heights, used to place the muzzle and body-centre anchors. */
  attackerHeight: number;
  targetHeight: number;
  hitCount: number;
  /** Miss / immune: suppress all contact FX but still play the full swing. */
  whiffed: boolean;
  /** Fired at each hit's exact impact instant. */
  onHit?: (hitIndex: number) => void;
  onComplete: () => void;
}

interface LiveLayer {
  spawn: FxSpawn;
  key: string;
  rotation: number;
}

export function MoveFxDirector({
  profile,
  moveType,
  attackerId,
  targetId,
  attackerPos,
  targetPos,
  attackerHeight,
  targetHeight,
  hitCount,
  whiffed,
  onHit,
  onComplete,
}: MoveFxDirectorProps) {
  const palette = useMemo(() => getTypePalette(moveType), [moveType]);

  const distance = useMemo(
    () => Math.hypot(targetPos[0] - attackerPos[0], targetPos[2] - attackerPos[2]),
    [attackerPos, targetPos],
  );

  const timeline = useMemo(
    () =>
      buildFxTimeline(
        profile,
        palette,
        createEffectContext(attackerPos, targetPos),
        { hitCount, whiffed, distance },
      ),
    [profile, palette, attackerPos, targetPos, hitCount, whiffed, distance],
  );

  const [live, setLive] = useState<LiveLayer[]>([]);
  const elapsed = useRef(0);
  const elapsedRaw = useRef(0);
  const spawnedRef = useRef<Set<string>>(new Set());
  const firedRigRef = useRef<Set<number>>(new Set());
  const firedCamRef = useRef<Set<number>>(new Set());
  const firedHitsRef = useRef<Set<number>>(new Set());
  const doneRef = useRef(false);

  // Reset when the action changes.
  useEffect(() => {
    elapsed.current = 0;
    elapsedRaw.current = 0;
    spawnedRef.current = new Set();
    firedRigRef.current = new Set();
    firedCamRef.current = new Set();
    firedHitsRef.current = new Set();
    doneRef.current = false;
    setLive([]);
  }, [timeline]);

  // ── Anchors ──
  const anchorOf = (anchor: FxAnchor): [number, number, number] => {
    const aMid = attackerHeight * 0.52;
    const tMid = targetHeight * 0.52;
    switch (anchor) {
      case 'attacker':
        return [attackerPos[0], attackerPos[1] + aMid, attackerPos[2]];
      case 'attackerMuzzle': {
        // Just in front of the attacker, at chest height.
        const dir = Math.sign(targetPos[0] - attackerPos[0]) || 1;
        return [attackerPos[0] + dir * 0.46, attackerPos[1] + aMid * 1.05, attackerPos[2]];
      }
      case 'attackerGround':
        return [attackerPos[0], attackerPos[1] + 0.02, attackerPos[2]];
      case 'target':
        return [targetPos[0], targetPos[1] + tMid, targetPos[2]];
      case 'targetCore': {
        const dir = Math.sign(attackerPos[0] - targetPos[0]) || -1;
        return [targetPos[0] + dir * 0.16, targetPos[1] + tMid, targetPos[2]];
      }
      case 'targetGround':
        return [targetPos[0], targetPos[1] + 0.02, targetPos[2]];
      case 'midpoint':
        return [
          (attackerPos[0] + targetPos[0]) / 2,
          (attackerPos[1] + targetPos[1] + aMid + tMid) / 2,
          (attackerPos[2] + targetPos[2]) / 2,
        ];
    }
  };

  useFrame((_, rawDelta) => {
    if (doneRef.current) return;

    // Stage progression obeys hit-stop; the safety timeout uses raw time so a stalled
    // layer can never block battle progression.
    elapsed.current += rawDelta * battleClock.timeScale * 1000;
    elapsedRaw.current += rawDelta * 1000;
    const now = elapsed.current;

    // ── Rig cues ──
    timeline.rigCues.forEach((cue, i) => {
      if (firedRigRef.current.has(i) || cue.atMs > now) return;
      firedRigRef.current.add(i);
      rigCue(cue.who === 'attacker' ? attackerId : targetId, {
        motion: cue.motion,
        amount: cue.amount,
        durationMs: cue.durationMs,
      });
    });

    // ── Camera cues (move identity only: the release dolly) ──
    timeline.cameraCues.forEach((cue, i) => {
      if (firedCamRef.current.has(i) || cue.atMs > now) return;
      firedCamRef.current.add(i);
      cameraCue({ dolly: cue.dolly, dollyMs: cue.dollyMs });
    });

    // ── Hit instants ──
    timeline.impactTimesMs.forEach((at, i) => {
      if (firedHitsRef.current.has(i) || at > now) return;
      firedHitsRef.current.add(i);
      onHit?.(i);
    });

    // ── Spawn / reap layers ──
    const shouldBeLive: LiveLayer[] = [];
    let changed = false;

    for (const spawn of timeline.spawns) {
      const active = spawn.atMs <= now && now < spawn.atMs + spawn.durationMs;
      const wasLive = spawnedRef.current.has(spawn.id);

      if (active) {
        if (!wasLive) {
          spawnedRef.current.add(spawn.id);
          changed = true;
        }
        shouldBeLive.push({
          spawn,
          key: spawn.id,
          rotation:
            spawn.layer.kind === 'flipbook' && spawn.layer.randomRotate
              ? (spawn.id.length * 1.7) % (Math.PI * 2)
              : 0,
        });
      } else if (wasLive && now >= spawn.atMs + spawn.durationMs) {
        // Expired: reap.
        changed = true;
      }
    }

    if (changed || shouldBeLive.length !== live.length) {
      setLive(shouldBeLive);
    }

    // ── Completion ──
    const plannedDone = now >= timeline.totalMs;
    const hardTimeout = elapsedRaw.current >= timeline.totalMs + STAGE_TIMEOUT_SLACK_MS;
    if (plannedDone || hardTimeout) {
      doneRef.current = true;
      // Guarantee every hit fired even if the clock jumped.
      timeline.impactTimesMs.forEach((_, i) => {
        if (!firedHitsRef.current.has(i)) {
          firedHitsRef.current.add(i);
          onHit?.(i);
        }
      });
      setLive([]);
      onComplete();
    }
  });

  return (
    <group>
      {live.map(({ spawn, key, rotation }) => {
        const pos = anchorOf(spawn.anchor);
        const layer = spawn.layer;

        switch (layer.kind) {
          case 'particles':
            return (
              <group key={key} position={pos}>
                <ParticleEffect
                  config={layer.config}
                  context={contextFor(attackerPos, targetPos)}
                />
              </group>
            );
          case 'ring':
            return (
              <group key={key} position={pos}>
                <RingEffect config={layer.config} />
              </group>
            );
          case 'shockwave':
            return (
              <group key={key} position={pos}>
                <ShockwaveEffect config={layer.config} />
              </group>
            );
          case 'shield':
            return (
              <group key={key} position={pos}>
                <ShieldEffect config={layer.config} />
              </group>
            );
          case 'decal':
            return (
              <group key={key} position={pos}>
                <DecalEffect config={layer.config} rotation={rotation} />
              </group>
            );
          case 'flipbook':
            return (
              <group key={key} position={pos}>
                <FlipbookEffect
                  sheet={layer.sheet}
                  config={layer.config}
                  rotation={rotation}
                  flat={layer.flat}
                />
              </group>
            );
          case 'beam':
            return (
              <BeamEffect
                key={key}
                config={layer.config}
                context={createEffectContext(pos, anchorOf('targetCore'))}
              />
            );
          case 'projectile':
            return (
              <ProjectileEffect
                key={key}
                config={layer.config}
                context={createEffectContext(pos, anchorOf('targetCore'))}
              />
            );
          case 'wave':
            return (
              <WaveEffect
                key={key}
                config={layer.config}
                context={createEffectContext(pos, anchorOf('targetGround'))}
              />
            );
          default:
            return null;
        }
      })}
    </group>
  );
}

const contextCache = new Map<string, EffectContext>();
function contextFor(
  origin: [number, number, number],
  target: [number, number, number],
): EffectContext {
  const key = `${origin.join()}|${target.join()}`;
  let hit = contextCache.get(key);
  if (!hit) {
    hit = createEffectContext(origin, target);
    if (contextCache.size > 64) contextCache.clear();
    contextCache.set(key, hit);
  }
  return hit;
}
