import { useEffect, useRef, useState } from 'react';
import type { BattleCombatant } from '../../engine/battleTypes';
import { STATUS_SHORT, VOLATILE_LABELS } from '../../engine/statusEngine';
import { TYPE_COLORS } from '../../../game/effects/types';
import type { PokemonType } from '../../../data/pokemon/schemas/index';
import { UI, hpColor } from './theme';

/**
 * Combatant plate: identity, HP, Poise, status and matchup state.
 *
 * FIXES B7 - the legacy plate showed HP as text only; its single bar was bound to the
 * ATB gauge, so there was no visual representation of health at all.
 *
 * HP uses two stacked fills. The leading edge snaps at contact and the ghost fill
 * drains behind it over 350ms, so the GAP communicates the size of the hit. Poise sits
 * directly beneath, because the two resources are read together.
 */

interface PlateProps {
  combatant: BattleCombatant;
  side: 'player' | 'enemy';
  /** FIRST / SECOND prediction pip. Player side only. */
  order?: 'FIRST' | 'SECOND' | 'UNKNOWN' | null;
  /** Party dots. */
  party?: { alive: boolean; active: boolean }[];
}

function useGhost(value: number): number {
  const [ghost, setGhost] = useState(value);
  const raf = useRef(0);
  const from = useRef(value);
  const start = useRef(0);

  useEffect(() => {
    if (value === ghost) return;
    if (value > ghost) {
      // Healing: the ghost should lead, not trail.
      setGhost(value);
      return;
    }
    from.current = ghost;
    start.current = performance.now();
    cancelAnimationFrame(raf.current);

    const tick = () => {
      const t = Math.min(1, (performance.now() - start.current) / 350);
      const eased = 1 - (1 - t) * (1 - t);
      setGhost(from.current + (value - from.current) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return ghost;
}

function TypeChip({ type }: { type: PokemonType }) {
  const c = TYPE_COLORS[type]?.primary ?? '#888';
  return (
    <span
      style={{
        background: c,
        color: '#0d1220',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 0.6,
        padding: '1px 5px',
        borderRadius: 3,
        textTransform: 'uppercase',
      }}
    >
      {type}
    </span>
  );
}

function BoostChevrons({ boosts }: { boosts: BattleCombatant['boosts'] }) {
  const active = Object.entries(boosts).filter(([, v]) => v !== 0);
  if (active.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {active.map(([k, v]) => (
        <span
          key={k}
          style={{
            fontSize: 9,
            fontWeight: 700,
            fontFamily: UI.mono,
            color: v > 0 ? '#7de3b8' : '#ff8a8a',
            background: 'rgba(255,255,255,0.06)',
            padding: '1px 4px',
            borderRadius: 3,
          }}
        >
          {k.toUpperCase()} {v > 0 ? '+' : ''}{v}
        </span>
      ))}
    </div>
  );
}

export function CombatantPlate({ combatant: c, side, order, party }: PlateProps) {
  const hpFraction = Math.max(0, c.hp / c.stats.hp);
  const ghost = useGhost(hpFraction);
  const poiseFraction = Math.max(0, c.poise / c.maxPoise);
  const broken = c.staggeredTurns > 0;
  const critical = hpFraction > 0 && hpFraction < 0.2;

  const alignEnd = side === 'enemy';

  return (
    <div
      style={{
        background: UI.panel,
        border: `1px solid ${broken ? UI.poise.broken : UI.border}`,
        borderRadius: 10,
        padding: '9px 12px 10px',
        minWidth: 254,
        maxWidth: 300,
        backdropFilter: 'blur(6px)',
        boxShadow: broken
          ? `0 0 0 1px ${UI.poise.broken}55, 0 6px 20px rgba(0,0,0,0.45)`
          : '0 6px 20px rgba(0,0,0,0.45)',
        fontFamily: UI.font,
        color: UI.text,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        transition: 'border-color 160ms ease',
      }}
    >
      {/* Identity */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 7,
          flexDirection: alignEnd ? 'row-reverse' : 'row',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.2 }}>{c.name}</span>
        <span style={{ fontSize: 11, color: UI.textDim, fontFamily: UI.mono }}>Lv{c.level}</span>
        <div style={{ display: 'flex', gap: 3, marginLeft: alignEnd ? 0 : 'auto', marginRight: alignEnd ? 'auto' : 0 }}>
          {c.types.map((t) => (
            <TypeChip key={t} type={t} />
          ))}
        </div>
      </div>

      {/* HP: ghost fill behind, leading fill in front */}
      <div style={{ position: 'relative', height: 9, background: UI.hp.track, borderRadius: 5, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${ghost * 100}%`,
            background: UI.hp.ghost,
            borderRadius: 5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${hpFraction * 100}%`,
            background: hpColor(hpFraction),
            borderRadius: 5,
            transition: 'width 90ms linear, background 200ms ease',
            animation: critical ? 'pokespire-hp-pulse 0.83s ease-in-out infinite' : undefined,
          }}
        />
      </div>

      {/* Poise */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexDirection: alignEnd ? 'row-reverse' : 'row',
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: 0.8,
            color: broken ? UI.poise.broken : UI.textDim,
            width: 34,
            textAlign: alignEnd ? 'right' : 'left',
          }}
        >
          {broken ? 'BREAK' : 'POISE'}
        </span>
        <div style={{ flex: 1, height: 5, background: UI.poise.track, borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              width: `${broken ? 100 : poiseFraction * 100}%`,
              height: '100%',
              background: broken
                ? UI.poise.broken
                : poiseFraction > 0.99
                  ? UI.poise.full
                  : UI.poise.fill,
              borderRadius: 3,
              transition: 'width 140ms ease-out, background 200ms ease',
              animation: broken ? 'pokespire-break-pulse 0.6s ease-in-out infinite' : undefined,
            }}
          />
        </div>
      </div>

      {/* Numbers + status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexDirection: alignEnd ? 'row-reverse' : 'row',
          minHeight: 15,
        }}
      >
        <span style={{ fontSize: 10, fontFamily: UI.mono, color: UI.textDim }}>
          {Math.max(0, c.hp)}/{c.stats.hp}
        </span>
        {c.status && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.5,
              padding: '1px 5px',
              borderRadius: 3,
              background: '#3b2a12',
              color: '#ffce6b',
              border: '1px solid #6b4c1c',
            }}
          >
            {STATUS_SHORT[c.status.id]}
          </span>
        )}
        {c.volatiles.map((v) => (
          <span
            key={v.id}
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 3,
              background: 'rgba(197,138,255,0.16)',
              color: '#c58aff',
            }}
          >
            {VOLATILE_LABELS[v.id]}
          </span>
        ))}
        {broken && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.5,
              padding: '1px 5px',
              borderRadius: 3,
              background: 'rgba(255,159,67,0.18)',
              color: UI.poise.broken,
              border: `1px solid ${UI.poise.broken}66`,
            }}
          >
            STAGGERED
          </span>
        )}
        {order && order !== 'UNKNOWN' && (
          <span
            style={{
              marginLeft: alignEnd ? 0 : 'auto',
              marginRight: alignEnd ? 'auto' : 0,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.6,
              color: order === 'FIRST' ? '#7de3b8' : '#ffb066',
            }}
          >
            {order}
          </span>
        )}
      </div>

      <BoostChevrons boosts={c.boosts} />

      {party && party.length > 1 && (
        <div style={{ display: 'flex', gap: 4, justifyContent: alignEnd ? 'flex-end' : 'flex-start' }}>
          {party.map((p, i) => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: p.alive ? (p.active ? UI.accent : '#5c6b82') : '#39404d',
                outline: p.active ? `1px solid ${UI.accent}` : 'none',
                outlineOffset: 1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
