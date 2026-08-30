import { useMemo, useState } from 'react';
import type { BattleAction, BattleCombatant } from '../../engine/battleTypes';
import { getMove } from '../../engine/moveRegistry';
import { effectiveness, classifyEffectiveness } from '../../engine/typeChart';
import { TYPE_COLORS } from '../../../game/effects/types';
import type { PokemonType } from '../../../data/pokemon/schemas/index';
import { CATEGORY_LABEL, UI } from './theme';

/**
 * Command UI: FIGHT / GUARD / SWITCH, the move grid, and the switch tray.
 *
 * FIXES B19/B3 - the legacy UI offered exactly one decision (a flat row of move
 * buttons) plus two unpressured, exploitable sliders. Here every action is a real
 * choice and each move surfaces its full strategic profile: damage, Impact (Poise
 * damage), accuracy, priority, PP and the consequence of using it now.
 *
 * The consequence tags are the important part - they let the player reason about the
 * Break clock without doing arithmetic.
 */

interface CommandPanelProps {
  actor: BattleCombatant;
  target: BattleCombatant;
  party: BattleCombatant[];
  disabled: boolean;
  forcedSwitch: boolean;
  onCommit: (action: BattleAction) => void;
}

type Screen = 'root' | 'fight' | 'switch';

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: 0.5,
        padding: '1px 4px',
        borderRadius: 3,
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function ActionButton({
  label,
  hint,
  color,
  disabled,
  onClick,
}: {
  label: string;
  hint?: string;
  color: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        padding: '11px 14px',
        background: disabled ? 'rgba(30,38,52,0.7)' : hover ? `${color}26` : 'rgba(22,29,42,0.9)',
        border: `1.5px solid ${disabled ? 'rgba(120,135,160,0.16)' : color}`,
        borderRadius: 9,
        color: disabled ? 'rgba(200,212,230,0.35)' : UI.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: UI.font,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: 0.6,
        transition: 'background 110ms ease, transform 110ms ease',
        transform: hover && !disabled ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {label}
      {hint && (
        <span style={{ fontSize: 9, fontWeight: 500, color: UI.textDim, letterSpacing: 0.2 }}>{hint}</span>
      )}
    </button>
  );
}

export function CommandPanel({
  actor,
  target,
  party,
  disabled,
  forcedSwitch,
  onCommit,
}: CommandPanelProps) {
  const [screen, setScreen] = useState<Screen>(forcedSwitch ? 'switch' : 'root');
  const [hovered, setHovered] = useState<string | null>(null);

  // Reset to the right screen when the phase changes.
  const effectiveScreen: Screen = forcedSwitch ? 'switch' : screen;

  const reserves = useMemo(
    () => party.filter((p) => p.id !== actor.id && !p.fainted),
    [party, actor.id],
  );

  const moves = useMemo(
    () =>
      actor.moves.map((slot) => {
        const move = getMove(slot.moveId);
        if (!move) return null;
        const mult = move.basePower > 0 ? effectiveness(move.type, target.types) : 1;
        const eff = classifyEffectiveness(mult);
        const breaksNow =
          move.impact > 0 && target.staggeredTurns === 0 && move.impact >= target.poise;
        const cashesIn = target.staggeredTurns > 0 && move.basePower > 0;
        return { slot, move, mult, eff, breaksNow, cashesIn };
      }),
    [actor.moves, target.types, target.poise, target.staggeredTurns],
  );

  const detail = useMemo(() => {
    if (!hovered) return null;
    return moves.find((m) => m && m.move.id === hovered) ?? null;
  }, [hovered, moves]);

  if (effectiveScreen === 'root') {
    return (
      <div style={{ display: 'flex', gap: 9, width: 'min(560px, 92vw)' }}>
        <ActionButton
          label="FIGHT"
          hint="choose a move"
          color={UI.accent}
          disabled={disabled}
          onClick={() => setScreen('fight')}
        />
        <ActionButton
          label="GUARD"
          hint={actor.guardLocked ? 'unavailable' : 'halve damage, restore Poise'}
          color="#7de3b8"
          disabled={disabled || actor.guardLocked}
          onClick={() => onCommit({ kind: 'GUARD', actorId: actor.id })}
        />
        <ActionButton
          label="SWITCH"
          hint={reserves.length === 0 ? 'no reserves' : `${reserves.length} available`}
          color="#f5c542"
          disabled={disabled || reserves.length === 0}
          onClick={() => setScreen('switch')}
        />
      </div>
    );
  }

  if (effectiveScreen === 'switch') {
    return (
      <div
        style={{
          background: UI.panel,
          border: `1px solid ${UI.border}`,
          borderRadius: 11,
          padding: 11,
          width: 'min(560px, 92vw)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: UI.textDim, fontFamily: UI.font }}>
          {forcedSwitch ? 'CHOOSE A REPLACEMENT' : 'SWITCH — COSTS YOUR TURN'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {reserves.map((p) => {
            const frac = p.hp / p.stats.hp;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onCommit({ kind: 'SWITCH', actorId: actor.id, targetSlot: p.slot });
                  setScreen('root');
                }}
                disabled={disabled && !forcedSwitch}
                style={{
                  padding: '9px 11px',
                  background: 'rgba(22,29,42,0.9)',
                  border: `1px solid ${UI.border}`,
                  borderRadius: 8,
                  color: UI.text,
                  cursor: 'pointer',
                  fontFamily: UI.font,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: UI.textDim, fontFamily: UI.mono }}>Lv{p.level}</span>
                </div>
                <div style={{ height: 5, background: UI.hp.track, borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${frac * 100}%`,
                      height: '100%',
                      background: frac > 0.5 ? UI.hp.high : frac > 0.2 ? UI.hp.mid : UI.hp.low,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {p.types.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: TYPE_COLORS[t as PokemonType]?.primary ?? '#888',
                        color: '#0d1220',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        {!forcedSwitch && (
          <button
            onClick={() => setScreen('root')}
            style={{
              alignSelf: 'flex-start',
              padding: '5px 11px',
              background: 'transparent',
              border: `1px solid ${UI.border}`,
              borderRadius: 6,
              color: UI.textDim,
              cursor: 'pointer',
              fontSize: 10,
              fontFamily: UI.font,
              letterSpacing: 0.5,
            }}
          >
            BACK
          </button>
        )}
      </div>
    );
  }

  // ── FIGHT: 2x2 move grid ──
  return (
    <div
      style={{
        background: UI.panel,
        border: `1px solid ${UI.border}`,
        borderRadius: 11,
        padding: 11,
        width: 'min(620px, 94vw)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {moves.map((entry, i) => {
          if (!entry) return <div key={i} />;
          const { slot, move, eff, breaksNow, cashesIn } = entry;
          const color = TYPE_COLORS[move.type as PokemonType]?.primary ?? '#888';
          const noPp = slot.pp <= 0;

          return (
            <button
              key={move.id}
              onClick={() => {
                if (noPp) return;
                onCommit({ kind: 'MOVE', actorId: actor.id, moveId: move.id });
                setScreen('root');
              }}
              onMouseEnter={() => setHovered(move.id)}
              onMouseLeave={() => setHovered(null)}
              disabled={disabled || noPp}
              style={{
                padding: '9px 11px',
                background: noPp ? 'rgba(30,38,52,0.6)' : 'rgba(22,29,42,0.92)',
                border: `1.5px solid ${noPp ? 'rgba(120,135,160,0.18)' : color}`,
                borderRadius: 8,
                color: noPp ? 'rgba(200,212,230,0.4)' : UI.text,
                cursor: noPp || disabled ? 'not-allowed' : 'pointer',
                fontFamily: UI.font,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                transition: 'background 110ms ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: 0.1 }}>{move.name}</span>
                <span style={{ fontSize: 9.5, color: UI.textDim, fontFamily: UI.mono }}>
                  {slot.pp}/{slot.maxPp}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '1px 4px',
                    borderRadius: 3,
                    background: color,
                    color: '#0d1220',
                    textTransform: 'uppercase',
                  }}
                >
                  {move.type}
                </span>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: UI.textDim, fontFamily: UI.mono }}>
                  {CATEGORY_LABEL[move.category]}
                </span>
                {move.basePower > 0 && (
                  <span style={{ fontSize: 9, color: UI.textDim, fontFamily: UI.mono }}>
                    PWR {move.basePower}
                  </span>
                )}
                <span style={{ fontSize: 9, color: UI.poise.fill, fontFamily: UI.mono }}>
                  IMP {move.impact}
                </span>
                <span style={{ fontSize: 9, color: UI.textDim, fontFamily: UI.mono }}>
                  {move.accuracy === null ? '—' : `${move.accuracy}%`}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minHeight: 13 }}>
                {eff === 'super' && <Tag text="SUPER EFFECTIVE" color="#7de3b8" />}
                {eff === 'resisted' && <Tag text="RESISTED" color="#8b98ad" />}
                {eff === 'immune' && <Tag text="NO EFFECT" color={UI.danger} />}
                {breaksNow && <Tag text="BREAKS POISE" color={UI.poise.broken} />}
                {cashesIn && <Tag text="+40% STAGGER" color="#ffb066" />}
                {move.priority > 0 && <Tag text={`PRIORITY +${move.priority}`} color="#f5c542" />}
                {move.hits && <Tag text={`${move.hits[0]}-${move.hits[1]} HITS`} color="#c58aff" />}
                {move.recoil ? <Tag text="RECOIL" color="#ff8a5c" /> : null}
                {move.drain ? <Tag text="DRAIN" color="#7de3b8" /> : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail rail */}
      <div
        style={{
          minHeight: 26,
          fontSize: 10.5,
          color: UI.textDim,
          fontFamily: UI.font,
          lineHeight: 1.45,
          borderTop: `1px solid ${UI.border}`,
          paddingTop: 6,
        }}
      >
        {detail ? detail.move.shortDesc || 'No additional effect.' : 'Hover a move for details.'}
      </div>

      <button
        onClick={() => setScreen('root')}
        style={{
          alignSelf: 'flex-start',
          padding: '5px 11px',
          background: 'transparent',
          border: `1px solid ${UI.border}`,
          borderRadius: 6,
          color: UI.textDim,
          cursor: 'pointer',
          fontSize: 10,
          fontFamily: UI.font,
          letterSpacing: 0.5,
        }}
      >
        BACK
      </button>
    </div>
  );
}
