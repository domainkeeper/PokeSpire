import { useRef, useCallback, useEffect } from 'react';
import { useDeviceInfo } from '../hooks/useDevice';

/**
 * Virtual joystick for mobile touch controls.
 * Visible only on mobile devices. Provides 8-directional continuous input
 * via a custom event that Player.tsx listens to.
 */
export function VirtualJoystick() {
  const { isMobile } = useDeviceInfo();
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const currentDir = useRef({ dx: 0, dz: 0 });
  const rafId = useRef<number>(0);

  const JOYSTICK_SIZE = 100;
  const KNOB_SIZE = 44;
  const MAX_RADIUS = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

  const emitDirection = useCallback((dx: number, dz: number) => {
    // Dispatch a custom event that Player.tsx can consume.
    window.dispatchEvent(
      new CustomEvent('joystick-move', {
        detail: { dx, dz },
      }),
    );
  }, []);

  const updateKnob = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      const knob = knobRef.current;
      if (!container || !knob) return;

      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > MAX_RADIUS) {
        dx = (dx / dist) * MAX_RADIUS;
        dy = (dy / dist) * MAX_RADIUS;
      }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;

      // Normalize to -1..1
      const ndx = dx / MAX_RADIUS;
      const ndy = dy / MAX_RADIUS;

      // Threshold to avoid drift
      const DEADZONE = 0.2;
      const finalDx = Math.abs(ndx) < DEADZONE ? 0 : ndx;
      const finalDz = Math.abs(ndy) < DEADZONE ? 0 : ndy;

      currentDir.current = { dx: finalDx, dz: finalDz };
    },
    [MAX_RADIUS],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (touchId.current !== null) return;
      const touch = e.changedTouches[0];
      touchId.current = touch.identifier;
      origin.current = { x: touch.clientX, y: touch.clientY };
      updateKnob(touch.clientX, touch.clientY);
    },
    [updateKnob],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        if (touch.identifier === touchId.current) {
          updateKnob(touch.clientX, touch.clientY);
          return;
        }
      }
    },
    [updateKnob],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        if (touch.identifier === touchId.current) {
          touchId.current = null;
          currentDir.current = { dx: 0, dz: 0 };
          emitDirection(0, 0);
          const knob = knobRef.current;
          if (knob) knob.style.transform = 'translate(0, 0)';
          return;
        }
      }
    },
    [emitDirection],
  );

  // Emit direction at 60fps while touching
  useEffect(() => {
    const tick = () => {
      const { dx, dz } = currentDir.current;
      if (dx !== 0 || dz !== 0) {
        emitDirection(dx, dz);
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [emitDirection]);

  if (!isMobile) return null;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        width: JOYSTICK_SIZE,
        height: JOYSTICK_SIZE,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        zIndex: 100,
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          border: '2px solid rgba(255, 255, 255, 0.7)',
          transition: 'none',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
