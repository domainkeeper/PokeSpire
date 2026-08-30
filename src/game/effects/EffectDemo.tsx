import { Suspense, useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { CombatantRig } from '../../battle/presentation/CombatantRig';
import { MoveFxDirector } from '../../battle/presentation/fx/MoveFxDirector';
import { buildProfile } from '../../battle/presentation/fx/profileCatalog';
import { resolveProfile, resolvedCategoryOf } from '../../battle/presentation/fx/profileResolver';
import { getMove } from '../../battle/engine/moveRegistry';
import { advanceClock, requestHitStop } from '../../battle/presentation/battleClock';
import {
  advanceCamera,
  cameraCue,
  floatingNumber,
  screenFx,
  IMPACT_FEEDBACK,
} from '../../battle/presentation/battleCamera';
import { rigCue, rigState } from '../../battle/presentation/fx/rigBus';
import { ScreenFxOverlay, FloatingNumbers, BATTLE_KEYFRAMES } from '../../battle/presentation/ui/Overlays';
import { useQualityStore } from './quality/qualityStore';
import { TYPE_COLORS } from './types';
import { POKEMON_TYPES, type PokemonType } from '../../data/pokemon/schemas/index';
import type { AnimCategory } from '../../battle/presentation/fx/animationTypes';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Battle FX preview harness (#effects).
 *
 * Repointed at the real animation system so there is exactly ONE effect architecture in
 * the project. Previously this drove the parallel MoveEffect/recipes/presets stack that
 * nothing else used.
 *
 * Exercises all 11 animation categories against all 18 type palettes, plus the impact
 * tier table, so a regression in either is visible without launching a battle.
 */

const CATEGORIES: AnimCategory[] = [
  'CONTACT_STRIKE',
  'SLASH',
  'MULTI_HIT',
  'PROJECTILE',
  'BEAM',
  'AREA_GROUND',
  'AREA_WAVE',
  'STATUS_APPLY',
  'SELF_BUFF',
  'HEAL',
  'GUARD',
];

/** A few real moves, so the derived-profile path is exercised too. */
const SAMPLE_MOVES = [
  'quickattack', 'closecombat', 'slash', 'doubleslap', 'shadowball',
  'flamethrower', 'icebeam', 'earthquake', 'surf', 'thunderwave',
  'swordsdance', 'recover', 'thunderbolt', 'hyperbeam', 'rockslide',
];

const ATTACKER: [number, number, number] = [-2.35, 0, 0.75];
const DEFENDER: [number, number, number] = [2.35, 0, -0.55];
const CAM_BASE = new THREE.Vector3(0, 2.45, 6.5);
const CAM_TARGET = new THREE.Vector3(0, 1.02, 0);

function Clock() {
  useFrame((_, d) => advanceClock(d), -100);
  return null;
}

function CameraRig() {
  const { camera } = useThree();
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, rawDelta) => {
    const { offset, dolly } = advanceCamera(rawDelta);
    dir.copy(CAM_TARGET).sub(CAM_BASE).normalize();
    camera.position.copy(CAM_BASE).add(offset).addScaledVector(dir, dolly);
    camera.lookAt(CAM_TARGET);
  }, -90);
  return null;
}

function Stage({
  shot,
  onHit,
  onDone,
}: {
  shot: { key: number; category: AnimCategory; type: PokemonType; hits: number } | null;
  onHit: (i: number) => void;
  onDone: () => void;
}) {
  return (
    <>
      <Clock />
      <CameraRig />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#242f42" roughness={0.95} />
      </mesh>
      <mesh position={[0, 6, -11]}>
        <planeGeometry args={[46, 24]} />
        <meshBasicMaterial color="#141c2b" />
      </mesh>
      <ambientLight intensity={0.72} />
      <directionalLight position={[3.5, 8, 5]} intensity={1.1} />

      <CombatantRig
        combatantId="demo-attacker"
        speciesId={25}
        position={ATTACKER}
        facing={1}
        hpFraction={1}
      />
      <CombatantRig
        combatantId="demo-defender"
        speciesId={6}
        position={DEFENDER}
        facing={-1}
        hpFraction={1}
        phase={Math.PI}
      />

      {shot && (
        <MoveFxDirector
          key={shot.key}
          profile={buildProfile(shot.category)}
          moveType={shot.type}
          attackerId="demo-attacker"
          targetId={shot.category === 'GUARD' || shot.category === 'HEAL' || shot.category === 'SELF_BUFF' ? 'demo-attacker' : 'demo-defender'}
          attackerPos={ATTACKER}
          targetPos={shot.category === 'GUARD' || shot.category === 'HEAL' || shot.category === 'SELF_BUFF' ? ATTACKER : DEFENDER}
          attackerHeight={1.4}
          targetHeight={2.2}
          hitCount={shot.hits}
          whiffed={false}
          onHit={onHit}
          onComplete={onDone}
        />
      )}
    </>
  );
}

export function EffectDemo() {
  const [type, setType] = useState<PokemonType>('fire');
  const [shot, setShot] = useState<{ key: number; category: AnimCategory; type: PokemonType; hits: number } | null>(null);
  const [label, setLabel] = useState('');
  const { tier, setTier } = useQualityStore();
  const keyRef = useMemo(() => ({ current: 0 }), []);

  const fire = useCallback(
    (category: AnimCategory, hits = 1, name?: string) => {
      keyRef.current += 1;
      setShot({ key: keyRef.current, category, type, hits });
      setLabel(name ? `${name} — ${category}` : category);
    },
    [type, keyRef],
  );

  const fireMove = useCallback(
    (moveId: string) => {
      const move = getMove(moveId);
      if (!move) return;
      setType(move.type as PokemonType);
      keyRef.current += 1;
      setShot({
        key: keyRef.current,
        category: resolvedCategoryOf(move),
        type: move.type as PokemonType,
        hits: move.hits ? 3 : 1,
      });
      setLabel(`${move.name} — ${resolvedCategoryOf(move)} (impact ${move.impact}, pwr ${move.basePower})`);
      // Keep the resolver warm so cache regressions surface here.
      resolveProfile(move);
    },
    [keyRef],
  );

  // Simulate the impact-tier feedback the runtime would apply.
  const onHit = useCallback(
    (i: number) => {
      if (!shot) return;
      const supportive = shot.category === 'HEAL' || shot.category === 'SELF_BUFF' || shot.category === 'GUARD' || shot.category === 'STATUS_APPLY';
      const targetId = supportive ? 'demo-attacker' : 'demo-defender';
      if (supportive) {
        rigState(targetId, { flash: 0.2 });
        floatingNumber({ text: shot.category === 'HEAL' ? '+24' : '\u2191', world: ATTACKER, variant: shot.category === 'HEAL' ? 'heal' : 'status', scale: 0.95 });
        return;
      }
      const fb = IMPACT_FEEDBACK[shot.hits > 1 ? 'T1' : 'T3'];
      requestHitStop(fb.hitStop);
      cameraCue({ shake: fb.shake, punch: fb.punch });
      if (fb.flash > 0) screenFx({ kind: 'flash', color: '#ffffff', intensity: fb.flash, durationMs: 210 });
      rigState(targetId, { flash: 0.8 });
      rigCue(targetId, { motion: 'recoil', amount: shot.hits > 1 ? 0.12 : 0.26, durationMs: 340 });
      floatingNumber({ text: String(38 - i * 4), world: DEFENDER, variant: 'normal', scale: fb.numberScale });
    },
    [shot],
  );

  const btn = (active: boolean, color: string): React.CSSProperties => ({
    padding: '5px 10px',
    background: active ? color : 'rgba(24,32,46,0.9)',
    border: `1px solid ${active ? color : 'rgba(150,175,210,0.22)'}`,
    borderRadius: 6,
    color: active ? '#0d1220' : '#cbd6e6',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    letterSpacing: 0.3,
  });

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0f18',
        color: '#e8eef7',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      <style>{BATTLE_KEYFRAMES}</style>

      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 13 }}>Battle FX Preview</strong>
          <span style={{ fontSize: 11, color: '#93a4bd' }}>{label || 'pick a category or move'}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
            {(['LOW', 'MED', 'HIGH'] as const).map((t) => (
              <button key={t} onClick={() => setTier(t)} style={btn(tier === t, '#5aa9ff')}>
                {t}
              </button>
            ))}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {POKEMON_TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} style={btn(type === t, TYPE_COLORS[t].primary)}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => fire(c, c === 'MULTI_HIT' ? 4 : 1)}
              style={btn(shot?.category === c, '#7de3b8')}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {SAMPLE_MOVES.map((m) => {
            const move = getMove(m);
            if (!move) return null;
            return (
              <button
                key={m}
                onClick={() => fireMove(m)}
                style={btn(false, TYPE_COLORS[move.type as PokemonType].primary)}
              >
                {move.name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, 2.45, 6.5], fov: 42 }} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <Stage shot={shot} onHit={onHit} onDone={() => setShot(null)} />
          </Suspense>
        </Canvas>
        <ScreenFxOverlay />
        <FloatingNumbers />
      </div>
    </div>
  );
}
