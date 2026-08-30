import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { BattleAction, BattleEvent, BattleSnapshot, IntentCategory } from './engine/battleTypes';
import { chooseAction, updateAiMemory, EMPTY_AI_MEMORY, type AiMemory } from './engine/ai';
import { intentOf, resolveForcedSwitch, resolveTurn } from './engine/resolveTurn';
import { predictOrder } from './engine/actionOrder';
import { getMove } from './engine/moveRegistry';
import { STATUS_LABELS } from './engine/statusEngine';
import { BattleStage, ENEMY_POS, PLAYER_POS } from './presentation/BattleStage';
import { useEventPlayer } from './presentation/useEventPlayer';
import { battleClock, requestHitStop, resetClock, setPlaybackRate } from './presentation/battleClock';
import {
  IMPACT_FEEDBACK,
  cameraCue,
  floatingNumber,
  resetCamera,
  screenFx,
} from './presentation/battleCamera';
import { rigCue, rigState } from './presentation/fx/rigBus';
import { CombatantPlate } from './presentation/ui/CombatantPlate';
import { CommandPanel } from './presentation/ui/CommandPanel';
import {
  BATTLE_KEYFRAMES,
  EventBanner,
  FloatingNumbers,
  ScreenFxOverlay,
  type BannerMessage,
} from './presentation/ui/Overlays';
import { INTENT_COLOR, INTENT_LABEL, UI } from './presentation/ui/theme';
import { useDeviceInfo } from '../game/hooks/useDevice';

/**
 * BattleRuntime — the only component that talks to the engine.
 *
 * Flow: COMMAND -> INTENT -> resolveTurn() -> replay BattleEvent[] -> COMMAND
 *
 * The engine resolves the entire turn synchronously before any animation starts, so
 * this component's job is purely to pace the presentation of an already-decided
 * outcome. That is what makes desync structurally impossible, and what makes
 * fast-forward, skip and "battle ended mid-animation" safe rather than races.
 *
 * Per-hit impact feedback (hit-stop, shake, flash, damage numbers, defender reactions)
 * lives HERE, because it is derived from engine events. Move identity (sprite motion,
 * particles, beams, projectiles) lives in MoveFxDirector. Neither crosses over.
 */

export interface BattleRuntimeProps {
  initial: BattleSnapshot;
  onBattleEnd: (victory: boolean) => void;
}

/** Presentation dwell times, ms. Nothing here is on the logic path. */
const DWELL = {
  intro: 1900,
  turnStart: 140,
  intent: 560,
  cannotAct: 820,
  charge: 760,
  notice: 720,
  switchIn: 900,
  endOfTurnStep: 320,
  faint: 2200,
  battleEnd: 1600,
} as const;

let bannerId = 0;

export function BattleRuntime({ initial, onBattleEnd }: BattleRuntimeProps) {
  const [snapshot, setSnapshot] = useState<BattleSnapshot>(initial);
  const player = useEventPlayer(initial);
  const [banner, setBanner] = useState<BannerMessage | null>(null);
  const [telegraph, setTelegraph] = useState<IntentCategory | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [fastForward, setFastForward] = useState(false);
  const [ended, setEnded] = useState(false);

  const aiMemory = useRef<AiMemory>(EMPTY_AI_MEMORY);
  const endedRef = useRef(false);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isMobile } = useDeviceInfo();

  const { beat, busy, advance, commit, commitRest, enqueue, display, skipAll } = player;

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    resetClock();
    resetCamera();
    const p = initial.combatants[initial.activePlayerId];
    const e = initial.combatants[initial.activeEnemyId];
    enqueue([{ type: 'BATTLE_INTRO', playerId: p.id, enemyId: e.id }], initial);
    pushLog(`A wild ${e.name} appeared!`);
    return () => {
      resetClock();
      resetCamera();
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPlaybackRate(fastForward ? 3 : 1);
  }, [fastForward]);

  const pushLog = useCallback((text: string) => {
    if (!text) return;
    setLog((l) => [text, ...l].slice(0, 40));
  }, []);

  const showBanner = useCallback(
    (text: string, tone: BannerMessage['tone'] = 'neutral', ms = 900) => {
      setBanner({ id: ++bannerId, text, tone });
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => setBanner(null), ms / (fastForward ? 3 : 1));
    },
    [fastForward],
  );

  // ─── Committing a player action ───────────────────────────────────────────
  const submitAction = useCallback(
    (action: BattleAction) => {
      if (busy || snapshot.outcome !== 'ongoing') return;

      if (snapshot.phase === 'FORCED_SWITCH') {
        if (action.kind !== 'SWITCH') return;
        const result = resolveForcedSwitch(snapshot, 'player', action.targetSlot);
        setSnapshot(result.snapshot);
        enqueue(result.events, result.snapshot);
        return;
      }

      const enemyAction = chooseAction(snapshot, 'enemy', aiMemory.current);
      const playerIntent = intentOf(action);
      aiMemory.current = updateAiMemory(aiMemory.current, playerIntent);

      const result = resolveTurn(snapshot, action, enemyAction);
      setSnapshot(result.snapshot);

      // Telegraph the opponent's CATEGORY, never the move: that is the mind game.
      const intentEvent: BattleEvent = {
        type: 'INTENT_REVEALED',
        side: 'enemy',
        category: intentOf(enemyAction),
      };
      enqueue([intentEvent, ...result.events], result.snapshot);
    },
    [busy, snapshot, enqueue],
  );

  // ─── Impact feedback (event-derived) ──────────────────────────────────────
  const applyHit = useCallback(
    (hitIndex: number) => {
      if (!beat || beat.kind !== 'action') return;

      const damageEvents = beat.events.filter((e) => e.type === 'DAMAGE') as Extract<
        BattleEvent,
        { type: 'DAMAGE' }
      >[];

      // ── Whiff: full swing, zero impact feedback. No shake, flash or hit-stop. ──
      if (damageEvents.length === 0) {
        if (hitIndex > 0) return;
        const missed = beat.events.find((e) => e.type === 'MOVE_MISSED');
        const immune = beat.events.find((e) => e.type === 'NO_EFFECT');
        if (missed) {
          rigCue(beat.targetId, { motion: 'flinch', amount: 0.3, durationMs: 320 });
          showBanner(`${display.combatants[beat.actorId]?.name}'s attack missed!`, 'neutral');
          pushLog(`${display.combatants[beat.actorId]?.name}'s ${beat.moveName} missed!`);
        } else if (immune) {
          rigState(beat.targetId, { flash: 0.25 });
          showBanner("It had no effect...", 'neutral');
          pushLog(`It doesn't affect ${display.combatants[beat.targetId]?.name}...`);
        }
        return;
      }

      const d = damageEvents[Math.min(hitIndex, damageEvents.length - 1)];
      if (!d) return;

      // Commit this hit and the Poise/Break events that belong to it: everything from
      // the hit up to (but not including) the next DAMAGE event.
      const start = beat.events.indexOf(d);
      commit(d);
      let broke = false;
      for (let i = start + 1; i < beat.events.length; i++) {
        const e = beat.events[i];
        if (e.type === 'DAMAGE') break;
        if (e.type === 'POISE_CHANGE') {
          commit(e);
        } else if (e.type === 'BREAK') {
          commit(e);
          broke = true;
        } else {
          break;
        }
      }

      const fb = IMPACT_FEEDBACK[d.tier];
      const critMul = d.critical ? 1.25 : 1;

      // Hit-stop and shake: contrast, not volume. T0 gets nothing at all.
      if (fb.hitStop > 0) requestHitStop(fb.hitStop * critMul);
      if (fb.shake > 0) {
        cameraCue({
          shake: fb.shake + (d.critical ? 0.02 : 0) + (broke ? 0.015 : 0),
          punch: fb.punch + (d.critical ? 0.015 : 0),
        });
      }
      if (fb.flash > 0) {
        screenFx({
          kind: 'flash',
          color: broke ? '#ffcf8a' : '#ffffff',
          intensity: fb.flash,
          durationMs: 210,
        });
      }

      // Defender reaction: every result gets a distinct silhouette.
      const target = display.combatants[d.targetId];
      const isPlayerTarget = target?.side === 'player';
      const world = isPlayerTarget ? PLAYER_POS : ENEMY_POS;

      let knockback = 0.18;
      if (d.critical) knockback = 0.3;
      else if (d.effectiveness === 'super') knockback = 0.26;
      else if (d.effectiveness === 'resisted') knockback = 0.06;
      if (broke) knockback = 0.42;
      if (beat.hitCount > 1) knockback = 0.1 + hitIndex * 0.04;

      rigState(d.targetId, { flash: d.critical ? 1 : d.effectiveness === 'resisted' ? 0.35 : 0.8 });
      rigCue(d.targetId, {
        motion: broke ? 'staggerDrop' : 'recoil',
        amount: knockback,
        durationMs: broke ? 1400 : 340,
      });
      if (broke) rigCue(d.targetId, { motion: 'flinch', amount: 0.22, durationMs: 300 });

      // Attacker recoil for contact moves reads as a shared impact.
      const move = getMove(beat.moveId);
      if (move?.flags.contact) {
        rigCue(beat.actorId, { motion: 'recoil', amount: 0.07, durationMs: 260 });
      }

      floatingNumber({
        text: String(d.amount),
        world,
        variant: broke ? 'break' : d.critical ? 'critical' : d.effectiveness === 'resisted' ? 'resisted' : 'normal',
        scale: fb.numberScale * (d.critical ? 1.2 : 1) * (broke ? 1.15 : 1),
      });

      // At most one banner, priority ordered.
      if (broke) showBanner('POISE BREAK!', 'break', 1100);
      else if (d.critical) showBanner('CRITICAL HIT!', 'critical');
      else if (d.effectiveness === 'super') showBanner('SUPER EFFECTIVE', 'good');
      else if (d.effectiveness === 'resisted' && hitIndex === 0) showBanner('Not very effective...', 'neutral', 700);

      if (hitIndex === 0) {
        pushLog(`${display.combatants[beat.actorId]?.name} used ${beat.moveName}!`);
      }
      if (broke) pushLog(`${target?.name}'s poise broke — Staggered!`);
    },
    [beat, commit, display.combatants, pushLog, showBanner],
  );

  // ─── Beat driver ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!beat) return;
    const rate = fastForward ? 3 : 1;
    const wait = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, Math.max(16, ms / rate));
      return () => clearTimeout(t);
    };

    switch (beat.kind) {
      case 'intro': {
        cameraCue({ dolly: 0.35, dollyMs: 1500 });
        return wait(DWELL.intro, () => {
          // BATTLE_START -> COMMAND. Without this the player could never act, because
          // the factory's initial phase is BATTLE_START and only resolveTurn sets COMMAND.
          setSnapshot((s) => (s.phase === 'BATTLE_START' ? { ...s, phase: 'COMMAND' } : s));
          advance();
        });
      }

      case 'turnStart':
        return wait(DWELL.turnStart, advance);

      case 'intent': {
        setTelegraph(beat.category);
        return wait(DWELL.intent, () => {
          setTelegraph(null);
          advance();
        });
      }

      case 'action':
      case 'guard':
        // Driven by MoveFxDirector via onFxComplete. Nothing to time here.
        return;

      case 'switch': {
        rigCue(beat.inId, { motion: 'hop', amount: 0.22, durationMs: 420 });
        commitRest();
        const name = display.combatants[beat.inId]?.name ?? '';
        const isPlayer = display.combatants[beat.inId]?.side === 'player';
        showBanner(isPlayer ? `Go! ${name}!` : `${name} was sent out!`, 'neutral');
        pushLog(isPlayer ? `Go! ${name}!` : `Opponent sent out ${name}!`);
        return wait(DWELL.switchIn, advance);
      }

      case 'cannotAct': {
        const name = display.combatants[beat.actorId]?.name ?? '';
        const text =
          beat.reason === 'slp' ? `${name} is fast asleep!`
          : beat.reason === 'frz' ? `${name} is frozen solid!`
          : beat.reason === 'par' ? `${name} is paralysed and can't move!`
          : beat.reason === 'flinch' ? `${name} flinched!`
          : `${name} is confused and hurt itself!`;
        rigCue(beat.actorId, { motion: 'shudder', amount: 0.07, durationMs: 520 });
        commitRest();
        showBanner(text, 'bad');
        pushLog(text);
        return wait(DWELL.cannotAct, advance);
      }

      case 'charge': {
        const name = display.combatants[beat.actorId]?.name ?? '';
        rigCue(beat.actorId, { motion: 'rise', amount: 0.1, durationMs: 600 });
        commitRest();
        showBanner(`${name} is charging ${beat.moveName}!`, 'neutral');
        pushLog(`${name} began charging ${beat.moveName}!`);
        return wait(DWELL.charge, advance);
      }

      case 'notice': {
        commitRest();
        if (beat.text) {
          showBanner(beat.text, 'neutral');
          pushLog(beat.text);
        }
        return wait(DWELL.notice, advance);
      }

      case 'endOfTurn': {
        // Residual ticks, Poise regen and Stagger expiry. Never any shake or flash.
        let announced = false;
        for (const e of beat.events) {
          if (e.type === 'STATUS_TICK') {
            const name = display.combatants[e.targetId]?.name ?? '';
            const world = display.combatants[e.targetId]?.side === 'player' ? PLAYER_POS : ENEMY_POS;
            floatingNumber({ text: String(e.amount), world, variant: 'status', scale: 0.85 });
            rigCue(e.targetId, { motion: 'shudder', amount: 0.05, durationMs: 300 });
            if (!announced) {
              showBanner(`${name} is hurt by ${STATUS_LABELS[e.status].toLowerCase()}!`, 'bad', 700);
              pushLog(`${name} is hurt by ${STATUS_LABELS[e.status].toLowerCase()}!`);
              announced = true;
            }
          }
          if (e.type === 'HEAL') {
            const world = display.combatants[e.targetId]?.side === 'player' ? PLAYER_POS : ENEMY_POS;
            floatingNumber({ text: `+${e.amount}`, world, variant: 'heal', scale: 0.9 });
          }
          if (e.type === 'STAGGER_EXPIRED') {
            rigState(e.targetId, { staggered: false });
            const name = display.combatants[e.targetId]?.name ?? '';
            pushLog(`${name} recovered its poise.`);
          }
        }
        commitRest();
        const hasVisible = beat.events.some(
          (e) => e.type === 'STATUS_TICK' || e.type === 'HEAL' || e.type === 'STAGGER_EXPIRED',
        );
        return wait(hasVisible ? DWELL.endOfTurnStep * 2 : DWELL.endOfTurnStep, advance);
      }

      case 'faint': {
        const name = display.combatants[beat.targetId]?.name ?? '';
        rigState(beat.targetId, { fainted: true, staggered: false });
        requestHitStop(130);
        showBanner(`${name} fainted!`, 'bad', 1400);
        pushLog(`${name} fainted!`);
        return wait(DWELL.faint, advance);
      }

      case 'forcedSwitch': {
        if (beat.side === 'enemy') {
          // AI replaces immediately; the player is prompted instead of auto-switched.
          const party = snapshot.enemyParty;
          const replacement = party.find(
            (id) => id !== snapshot.activeEnemyId && !snapshot.combatants[id].fainted,
          );
          if (replacement) {
            const result = resolveForcedSwitch(snapshot, 'enemy', snapshot.combatants[replacement].slot);
            setSnapshot(result.snapshot);
            advance();
            enqueue(result.events, result.snapshot);
          } else {
            advance();
          }
          return;
        }
        // Player must choose; CommandPanel renders in forced mode. No timer.
        return;
      }

      case 'battleEnd': {
        const victory = beat.outcome === 'victory';
        if (victory) {
          rigCue(display.activePlayerId, { motion: 'hop', amount: 0.3, durationMs: 700 });
        } else {
          screenFx({ kind: 'desaturate', intensity: 1, durationMs: DWELL.battleEnd });
        }
        screenFx({ kind: 'vignette', color: victory ? '#0b2a1c' : '#2a0b0b', intensity: 0.55, durationMs: DWELL.battleEnd });
        showBanner(victory ? 'VICTORY!' : 'DEFEAT...', victory ? 'good' : 'bad', DWELL.battleEnd);
        pushLog(victory ? 'You won the battle!' : 'You were defeated...');
        setEnded(true);
        return wait(DWELL.battleEnd, () => {
          advance();
          if (!endedRef.current) {
            endedRef.current = true;
            onBattleEnd(victory);
          }
        });
      }

      default:
        return wait(200, advance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, fastForward]);

  // ─── FX completion for action/guard beats ─────────────────────────────────
  const handleFxComplete = useCallback(() => {
    if (!beat) return;
    if (beat.kind === 'guard') {
      const name = display.combatants[beat.actorId]?.name ?? '';
      pushLog(`${name} braced itself!`);
    }
    // Any state the animation did not explicitly commit is applied on the way out.
    advance();
  }, [beat, advance, display.combatants, pushLog]);

  // ─── Derived UI state ─────────────────────────────────────────────────────
  const activePlayer = display.combatants[display.activePlayerId];
  const activeEnemy = display.combatants[display.activeEnemyId];

  const playerParty = useMemo(
    () => display.playerParty.map((id) => display.combatants[id]),
    [display],
  );
  const enemyPartyDots = useMemo(
    () =>
      display.enemyParty.map((id) => ({
        alive: !display.combatants[id].fainted,
        active: id === display.activeEnemyId,
      })),
    [display],
  );
  const playerPartyDots = useMemo(
    () =>
      display.playerParty.map((id) => ({
        alive: !display.combatants[id].fainted,
        active: id === display.activePlayerId,
      })),
    [display],
  );

  const forcedSwitch =
    snapshot.phase === 'FORCED_SWITCH' &&
    snapshot.pendingForcedSwitch.includes('player') &&
    beat?.kind === 'forcedSwitch';

  const canCommand = !busy && snapshot.phase === 'COMMAND' && snapshot.outcome === 'ongoing' && !ended;
  const showCommand = (canCommand || forcedSwitch) && activePlayer && !activePlayer.fainted;

  const order = useMemo(
    () => (activePlayer && activeEnemy ? predictOrder(activePlayer, activeEnemy, null) : null),
    [activePlayer, activeEnemy],
  );

  // Interactive UI is dimmed and disabled outside COMMAND / FORCED_SWITCH.
  const uiDim = busy && !forcedSwitch;

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0a0f18 0%, #131c2b 60%, #0c1220 100%)',
        userSelect: 'none',
      }}
    >
      <style>{BATTLE_KEYFRAMES}</style>

      <Canvas
        camera={{ position: [0, 2.45, 6.5], fov: 42, near: 0.1, far: 100 }}
        gl={{ antialias: !isMobile, alpha: true }}
        dpr={isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2)}
        shadows={false}
        style={{ position: 'absolute', inset: 0 }}
      >
        <BattleStage
          display={display}
          beat={beat}
          onActionHit={applyHit}
          onFxComplete={handleFxComplete}
        />
      </Canvas>

      <ScreenFxOverlay />
      <FloatingNumbers />
      <EventBanner message={banner} />

      {/* Plates */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        {activeEnemy && (
          <CombatantPlate combatant={activeEnemy} side="enemy" party={enemyPartyDots} />
        )}
        <div style={{ flex: 1 }} />
        {activePlayer && (
          <CombatantPlate
            combatant={activePlayer}
            side="player"
            order={canCommand ? order : null}
            party={playerPartyDots}
          />
        )}
      </div>

      {/* Intent telegraph */}
      {telegraph && (
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10,15,26,0.9)',
            border: `1.5px solid ${INTENT_COLOR[telegraph]}`,
            borderRadius: 9,
            padding: '8px 16px',
            zIndex: 36,
            fontFamily: UI.font,
            textAlign: 'center',
            animation: 'pokespire-telegraph 140ms ease-out',
            pointerEvents: 'none',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ fontSize: 9, letterSpacing: 1.2, color: UI.textDim, fontWeight: 700 }}>
            OPPONENT IS PREPARING
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: 1.4,
              color: INTENT_COLOR[telegraph],
              marginTop: 2,
            }}
          >
            {INTENT_LABEL[telegraph]}
          </div>
        </div>
      )}

      {/* Combat log — collapsed, two lines, never auto-expands */}
      <div
        style={{
          position: 'absolute',
          left: 14,
          bottom: 14,
          maxWidth: 300,
          zIndex: 28,
          pointerEvents: 'none',
          fontFamily: UI.font,
          fontSize: 11,
          lineHeight: 1.5,
          color: UI.textDim,
          background: 'rgba(10,15,26,0.6)',
          border: `1px solid ${UI.border}`,
          borderRadius: 7,
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {log.slice(0, 2).map((line, i) => (
          <span key={i} style={{ opacity: i === 0 ? 0.95 : 0.55 }}>
            {line}
          </span>
        ))}
        {log.length === 0 && <span style={{ opacity: 0.4 }}>—</span>}
      </div>

      {/* Fast forward */}
      <button
        onClick={() => setFastForward((f) => !f)}
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          zIndex: 32,
          padding: '6px 12px',
          background: fastForward ? 'rgba(90,169,255,0.22)' : 'rgba(10,15,26,0.7)',
          border: `1px solid ${fastForward ? UI.accent : UI.border}`,
          borderRadius: 7,
          color: fastForward ? UI.accent : UI.textDim,
          cursor: 'pointer',
          fontFamily: UI.mono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
        }}
      >
        {fastForward ? '3x FAST' : '1x SPEED'}
      </button>

      {/* Command UI */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 34,
          opacity: uiDim ? 0.6 : 1,
          pointerEvents: showCommand ? 'auto' : 'none',
          transition: 'opacity 160ms ease',
        }}
      >
        {showCommand && activePlayer && activeEnemy && (
          <CommandPanel
            key={`${snapshot.turn}-${snapshot.phase}-${activePlayer.id}`}
            actor={activePlayer}
            target={activeEnemy}
            party={playerParty}
            disabled={!canCommand && !forcedSwitch}
            forcedSwitch={Boolean(forcedSwitch)}
            onCommit={submitAction}
          />
        )}
      </div>

      {/* Skip: safe at any time, because the outcome is already decided */}
      {busy && !ended && (
        <button
          onClick={skipAll}
          style={{
            position: 'absolute',
            right: 14,
            top: 108,
            zIndex: 32,
            padding: '5px 11px',
            background: 'rgba(10,15,26,0.7)',
            border: `1px solid ${UI.border}`,
            borderRadius: 7,
            color: UI.textDim,
            cursor: 'pointer',
            fontFamily: UI.mono,
            fontSize: 10,
            letterSpacing: 0.6,
          }}
        >
          SKIP
        </button>
      )}
    </div>
  );
}

export { battleClock };
