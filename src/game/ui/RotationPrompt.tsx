import { useEffect, useState, useRef } from 'react';
import { useLandscapeLock } from '../hooks/useDevice';

const STYLE_ID = 'rotation-prompt-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes rotate-prompt {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(90deg); }
      50% { transform: rotate(180deg); }
      75% { transform: rotate(270deg); }
    }
  `;
  document.head.appendChild(style);
}

function removeStyles() {
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
}

export function RotationPrompt() {
  const { needsRotation, requestLandscape } = useLandscapeLock();
  const [hasInteracted, setHasInteracted] = useState(false);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (needsRotation && !hasInteracted) {
      if (!injectedRef.current) {
        injectStyles();
        injectedRef.current = true;
      }

      const handleInteraction = () => {
        setHasInteracted(true);
        requestLandscape();
      };

      document.addEventListener('click', handleInteraction, { once: true });
      document.addEventListener('touchstart', handleInteraction, { once: true, passive: true });

      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, [needsRotation, requestLandscape, hasInteracted]);

  useEffect(() => {
    if (!needsRotation) {
      removeStyles();
      injectedRef.current = false;
    }
  }, [needsRotation]);

  if (!needsRotation) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a0a',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"Press Start 2P", monospace',
        color: '#ffffff',
        textAlign: 'center',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          border: '4px solid #444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          animation: 'rotate-prompt 2s ease-in-out infinite',
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '12px', textShadow: '2px 2px 0 #000' }}>
        PLEASE ROTATE YOUR DEVICE
      </h2>

      <p style={{ fontSize: '10px', color: '#888', maxWidth: '280px', lineHeight: 1.6 }}>
        This game is designed for landscape orientation. Please rotate your device to play.
      </p>

      <button
        onClick={() => {
          setHasInteracted(true);
          requestLandscape();
        }}
        style={{
          marginTop: '24px',
          padding: '12px 32px',
          fontSize: '12px',
          fontFamily: '"Press Start 2P", monospace',
          backgroundColor: '#2a2a2a',
          color: '#fff',
          border: '2px solid #444',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        I'VE ROTATED
      </button>
    </div>
  );
}