import { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MoveEffect } from './MoveEffect';
import { CameraFeedback } from './camera/CameraFeedback';
import { StatusOverlay } from './status/StatusOverlay';
import { STATUS_PRESETS } from './presets/statusPresets';
import { useQualityStore } from './quality/qualityStore';
import { TYPE_COLORS } from './types';
import type { PokemonType } from '../../data/pokemon/schemas/index';
import { POKEMON_TYPES } from '../../data/pokemon/schemas/index';

const ORIGIN: [number, number, number] = [-2, 1, 0];
const TARGET: [number, number, number] = [2, 1, 0];

function EffectScene({ activeType, category, activeStatus }: { activeType: PokemonType | null; category: 'physical' | 'special'; activeStatus: string | null }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#445566" roughness={0.9} />
      </mesh>

      <mesh position={ORIGIN}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>

      <mesh position={TARGET}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#4444ff" />
        {activeStatus && STATUS_PRESETS[activeStatus] && (
          <StatusOverlay preset={STATUS_PRESETS[activeStatus]} />
        )}
      </mesh>

      {activeType && (
        <MoveEffect
          key={`${activeType}-${category}-${Date.now()}`}
          type={activeType}
          category={category}
          origin={ORIGIN}
          target={TARGET}
          scale={1.2}
        />
      )}

      <CameraFeedback />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
    </>
  );
}

export function EffectDemo() {
  const [activeType, setActiveType] = useState<PokemonType | null>(null);
  const [category, setCategory] = useState<'physical' | 'special'>('special');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const { tier, setTier } = useQualityStore();

  const triggerEffect = useCallback((type: PokemonType) => {
    setActiveType(null);
    setTimeout(() => {
      setActiveType(type);
      setKey((k) => k + 1);
    }, 50);
  }, []);

  const containerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: 'monospace',
  };

  const buttonGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    padding: '10px',
    justifyContent: 'center',
    zIndex: 10,
  };

  const canvasStyle: React.CSSProperties = {
    flex: 1,
    imageRendering: 'pixelated',
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', padding: '6px', fontSize: '14px', color: '#aaa' }}>
        Battle VFX Demo — Tier: {tier} | Category: {category}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '4px' }}>
        <button onClick={() => setCategory('special')} style={{ padding: '4px 10px', background: category === 'special' ? '#4a90e2' : '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Special</button>
        <button onClick={() => setCategory('physical')} style={{ padding: '4px 10px', background: category === 'physical' ? '#e24a4a' : '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Physical</button>
        <span style={{ borderLeft: '1px solid #555', margin: '0 4px' }} />
        <button onClick={() => setTier('LOW')} style={{ padding: '4px 8px', background: tier === 'LOW' ? '#555' : '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>LOW</button>
        <button onClick={() => setTier('MED')} style={{ padding: '4px 8px', background: tier === 'MED' ? '#555' : '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>MED</button>
        <button onClick={() => setTier('HIGH')} style={{ padding: '4px 8px', background: tier === 'HIGH' ? '#555' : '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>HIGH</button>
        <span style={{ borderLeft: '1px solid #555', margin: '0 4px' }} />
        {Object.keys(STATUS_PRESETS).map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(activeStatus === s ? null : s)}
            style={{ padding: '4px 8px', background: activeStatus === s ? '#8b5cf6' : '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', textTransform: 'capitalize' }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={buttonGridStyle}>
        {POKEMON_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => triggerEffect(t)}
            style={{
              padding: '6px 14px',
              border: `2px solid ${TYPE_COLORS[t].primary}`,
              background: TYPE_COLORS[t].primary,
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 4, 6], fov: 50 }}
          style={canvasStyle}
          gl={{ antialias: false }}
        >
          <Suspense fallback={null}>
            <EffectScene key={key} activeType={activeType} category={category} activeStatus={activeStatus} />
          </Suspense>
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
