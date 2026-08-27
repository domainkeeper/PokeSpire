import React, { useState } from 'react';

interface AimReticleProps {
  onAimComplete: (position: number) => void;
}

export const AimReticle: React.FC<AimReticleProps> = ({ onAimComplete }) => {
  const [position, setPosition] = useState(50);

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPosition(Number(e.target.value));
  };

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
      <div style={{ marginBottom: '8px', fontSize: '14px', color: '#ffeb3b' }}>
        AIM SKILLSHOT — Align with target!
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={handleDrag}
        style={{ width: '250px', cursor: 'pointer', accentColor: '#ffeb3b' }}
      />
      <div style={{ marginTop: '12px' }}>
        <button
          onClick={() => onAimComplete(position)}
          style={{
            padding: '6px 16px',
            background: '#ffeb3b',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          CONFIRM AIM
        </button>
      </div>
    </div>
  );
};
