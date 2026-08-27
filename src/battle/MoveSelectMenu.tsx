import React from 'react';
import type { BattleMove } from './types';
import { TYPE_COLORS } from '../game/effects/types';
import type { PokemonType } from '../data/pokemon/schemas/index';

interface MoveSelectMenuProps {
  moves: BattleMove[];
  onSelectMove: (move: BattleMove) => void;
}

export const MoveSelectMenu: React.FC<MoveSelectMenuProps> = ({ moves, onSelectMove }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 50,
        fontFamily: 'monospace',
      }}
    >
      {moves.map((move, i) => {
        const typeKey = (move.type as string).toLowerCase() as PokemonType;
        const typeColor = TYPE_COLORS[typeKey]?.primary ?? '#888';
        return (
          <button
            key={move.id || i}
            onClick={() => onSelectMove(move)}
            style={{
              padding: '12px 20px',
              background: 'rgba(20, 20, 35, 0.85)',
              border: `2px solid ${typeColor}`,
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '120px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              transition: 'transform 0.1s ease, background 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'capitalize' }}>
              {move.name}
            </span>
            <span style={{ fontSize: '10px', color: typeColor, marginTop: '4px', textTransform: 'uppercase' }}>
              {move.type} | {move.category}
            </span>
            <span style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
              PWR: {move.basePower || '-'}
            </span>
          </button>
        );
      })}
    </div>
  );
};
