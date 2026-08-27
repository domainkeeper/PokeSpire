import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { BattleState, Combatant, BattleMove } from './types';
import { getMoveExtension } from './moveExtensions';
import { calculateDamage, resolveAim, resolveBrace, aiDecideMove } from './combatEngine';
import { useSpeedGauge } from './useSpeedGauge';
import { MoveEffect } from '../game/effects/MoveEffect';
import { CameraFeedback } from '../game/effects/camera/CameraFeedback';
import { MoveSelectMenu } from './MoveSelectMenu';
import { AimReticle } from './AimReticle';
import { BraceMeter } from './BraceMeter';

interface BattleScreenProps {
  playerPokemon: Combatant;
  enemyPokemon: Combatant;
  onBattleEnd: (victory: boolean) => void;
}

const PLAYER_POS: [number, number, number] = [-2, 0, 0];
const ENEMY_POS: [number, number, number] = [2, 0, 0];

function BattleArena({
  activeEffect,
}: {
  activeEffect: { type: any; category: any; origin: [number, number, number]; target: [number, number, number]; moveName: string } | null;
}) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} />
      </mesh>

      <mesh position={PLAYER_POS} castShadow>
        <boxGeometry args={[0.8, 1.2, 0.8]} />
        <meshStandardMaterial color="#3182ce" />
      </mesh>

      <mesh position={ENEMY_POS} castShadow>
        <boxGeometry args={[0.8, 1.2, 0.8]} />
        <meshStandardMaterial color="#e53e3e" />
      </mesh>

      {activeEffect && (
        <MoveEffect
          type={activeEffect.type}
          category={activeEffect.category}
          moveName={activeEffect.moveName}
          origin={activeEffect.origin}
          target={activeEffect.target}
          scale={1.2}
        />
      )}

      <CameraFeedback />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
    </>
  );
}

export function BattleScreen({ playerPokemon, enemyPokemon, onBattleEnd }: BattleScreenProps) {
  const [state, setState] = useState<BattleState>({
    phase: 'INTRO',
    playerTeam: [playerPokemon],
    enemyTeam: [enemyPokemon],
    activeCombatantId: null,
    pendingMove: null,
    aimPosition: null,
    braceInput: null,
    combatLog: ['Wild encounter started!'],
    turnCount: 1,
  });

  const [activeEffect, setActiveEffect] = useState<{
    type: any;
    category: any;
    origin: [number, number, number];
    target: [number, number, number];
    moveName: string;
  } | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const t = setTimeout(() => {
      setState((s) => ({ ...s, phase: 'GAUGE_TICK' }));
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const handleGaugeFull = useCallback((combatantId: string) => {
    const s = stateRef.current;
    if (s.phase !== 'GAUGE_TICK') return;

    const isPlayer = s.playerTeam.some((c) => c.id === combatantId);
    setState((prev) => ({
      ...prev,
      phase: isPlayer ? 'MOVE_SELECT' : 'AI_DECIDE',
      activeCombatantId: combatantId,
    }));
  }, []);

  const allCombatants = [...state.playerTeam, ...state.enemyTeam];
  useSpeedGauge(allCombatants, state.phase === 'GAUGE_TICK', handleGaugeFull);

  useEffect(() => {
    if (state.phase === 'AI_DECIDE') {
      const enemy = state.enemyTeam[0];
      const player = state.playerTeam[0];
      const decision = aiDecideMove(enemy, player);

      const moveWithExt: BattleMove = {
        ...decision.move,
        ...getMoveExtension(decision.move.id),
      } as BattleMove;

      setState((s) => ({
        ...s,
        pendingMove: moveWithExt,
        aimPosition: decision.aimPosition,
        phase: 'DEFENDER_BRACE',
      }));
    }
  }, [state.phase]);

  const handlePlayerSelectMove = (move: BattleMove) => {
    const ext = getMoveExtension(move.id);
    const fullMove: BattleMove = { ...move, ...ext } as BattleMove;

    setState((s) => ({
      ...s,
      pendingMove: fullMove,
      phase: fullMove.aimed ? 'AIMING' : 'DEFENDER_BRACE',
      aimPosition: fullMove.aimed ? null : 50,
    }));
  };

  const handleAimComplete = (pos: number) => {
    setState((s) => ({
      ...s,
      aimPosition: pos,
      phase: 'DEFENDER_BRACE',
    }));
  };

  const handleBraceComplete = (pos: number) => {
    setState((s) => ({
      ...s,
      braceInput: pos,
      phase: 'RESOLVE',
    }));
  };

  useEffect(() => {
    if (state.phase === 'RESOLVE') {
      const s = stateRef.current;
      const isPlayerTurn = s.playerTeam.some((c) => c.id === s.activeCombatantId);
      const attacker = isPlayerTurn ? s.playerTeam[0] : s.enemyTeam[0];
      const defender = isPlayerTurn ? s.enemyTeam[0] : s.playerTeam[0];
      const move = s.pendingMove;

      if (!move) return;

      let precisionBonus = false;
      if (move.aimed && s.aimPosition !== null) {
        const aimRes = resolveAim(s.aimPosition, defender.arenaPosition, move);
        precisionBonus = aimRes.precisionBonus;
      }

      const braceRes = resolveBrace(s.braceInput ?? 50, 50, 30);
      const damage = calculateDamage(attacker, defender, move, precisionBonus, braceRes, {
        powerMultiplier: 1,
        atkMultiplier: 1,
        defMultiplier: 1,
        typeEffectivenessOverride: null,
        finalDamageMultiplier: 1,
      });

      defender.currentHp = Math.max(0, defender.currentHp - damage);

      const logMsg = `${attacker.species.name} used ${move.name}! Dealt ${damage} damage.`;

      setActiveEffect({
        type: move.type,
        category: move.category,
        moveName: move.name,
        origin: isPlayerTurn ? PLAYER_POS : ENEMY_POS,
        target: isPlayerTurn ? ENEMY_POS : PLAYER_POS,
      });

      setState((prev) => ({
        ...prev,
        combatLog: [logMsg, ...prev.combatLog.slice(0, 5)],
        phase: 'IMPACT',
      }));

      setTimeout(() => {
        setActiveEffect(null);
        if (defender.currentHp <= 0) {
          setState((prev) => ({
            ...prev,
            combatLog: [`${defender.species.name} fainted!`, ...prev.combatLog],
            phase: 'BATTLE_END',
          }));
          setTimeout(() => onBattleEnd(isPlayerTurn), 1500);
        } else {
          attacker.gauge = 0;
          setState((prev) => ({
            ...prev,
            activeCombatantId: null,
            pendingMove: null,
            aimPosition: null,
            braceInput: null,
            phase: 'GAUGE_TICK',
          }));
        }
      }, 1200);
    }
  }, [state.phase, onBattleEnd]);

  const player = state.playerTeam[0];
  const enemy = state.enemyTeam[0];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0f172a', fontFamily: 'monospace' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 10, color: '#fff' }}>
        <div style={{ background: 'rgba(0,0,0,0.6)', padding: '12px 20px', borderRadius: '8px', minWidth: '220px' }}>
          <div style={{ fontWeight: 'bold' }}>{player.species.name} (Lv. {player.level})</div>
          <div style={{ fontSize: '12px', color: '#60a5fa', margin: '4px 0' }}>HP: {player.currentHp} / {player.maxHp}</div>
          <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(player.gauge)}%`, height: '100%', background: '#3b82f6', transition: 'width 0.1s linear' }} />
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.6)', padding: '12px 20px', borderRadius: '8px', minWidth: '220px', textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold' }}>{enemy.species.name} (Lv. {enemy.level})</div>
          <div style={{ fontSize: '12px', color: '#f87171', margin: '4px 0' }}>HP: {enemy.currentHp} / {enemy.maxHp}</div>
          <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(enemy.gauge)}%`, height: '100%', background: '#ef4444', transition: 'width 0.1s linear' }} />
          </div>
        </div>
      </div>

      <Canvas camera={{ position: [0, 3, 7], fov: 45 }} style={{ width: '100%', height: '100%' }}>
        <Suspense fallback={null}>
          <BattleArena activeEffect={activeEffect} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      <div style={{ position: 'absolute', bottom: 120, left: 20, background: 'rgba(0,0,0,0.7)', padding: '10px 16px', borderRadius: '6px', color: '#cbd5e1', fontSize: '12px', maxWidth: '300px', pointerEvents: 'none' }}>
        {state.combatLog[0]}
      </div>

      {state.phase === 'MOVE_SELECT' && (
        <MoveSelectMenu moves={player.moves} onSelectMove={handlePlayerSelectMove} />
      )}

      {state.phase === 'AIMING' && (
        <AimReticle onAimComplete={handleAimComplete} />
      )}

      {state.phase === 'DEFENDER_BRACE' && state.activeCombatantId === player.id && (
        <BraceMeter onBraceComplete={handleBraceComplete} />
      )}
    </div>
  );
}
