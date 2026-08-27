import React, { useState } from 'react';

interface BraceMeterProps {
  onBraceComplete: (position: number) => void;
}

export const BraceMeter: React.FC<BraceMeterProps> = ({ onBraceComplete }) => {
  const [position, setPosition] = useState(50);

  return (
    <div
      style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '16px 24px',
        borderRadius: '8px',
        color: '#fff',
        fontFamily: 'monospace',
        textAlign: 'center',
        zIndex: 50,
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '14px', color: '#ff5722' }}>
        INCOMING ATTACK! Brace & Dodge!
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        style={{ width: '250px', cursor: 'pointer', accentColor: '#ff5722' }}
      />
      <div style={{ marginTop: '12px' }}>
        <button
          onClick={() => onBraceComplete(position)}
          style={{
            padding: '6px 16px',
            background: '#ff5722',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          BRACE
        </button>
      </div>
    </div>
  );
};
