import { useEffect, useRef, useState } from 'react';
import { onFloatingNumber, onScreenFx, type FloatingNumberCue, type ScreenFxCue } from '../battleCamera';
import { SCREEN_ANCHOR, UI } from './theme';

/**
 * DOM overlays for screen FX, damage numbers and the event banner.
 *
 * FIXES B14 - the old FlashEffect was a 50x50 world plane at z = -5 while the camera sat
 * at z ~ 7, so it rendered BEHIND the combatants and could never work as a hit flash.
 * Screen-space effects belong in screen space.
 */

// ─── Screen flash / vignette / desaturate ───────────────────────────────────
interface ActiveFx extends ScreenFxCue {
  id: number;
  born: number;
}

let fxId = 0;

export function ScreenFxOverlay() {
  const [active, setActive] = useState<ActiveFx[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const off = onScreenFx((cue) => {
      setActive((a) => [...a.slice(-3), { ...cue, id: ++fxId, born: performance.now() }]);
    });
    return off;
  }, []);

  useEffect(() => {
    if (active.length === 0) return;
    const tick = () => {
      const now = performance.now();
      setActive((a) => a.filter((f) => now - f.born < f.durationMs));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active.length]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
      {active.map((f) => {
        const t = Math.min(1, (performance.now() - f.born) / f.durationMs);
        // Snap on, ease off: a flash must never linger.
        const alpha = f.intensity * (t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88);

        if (f.kind === 'vignette') {
          return (
            <div
              key={f.id}
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse at center, transparent 42%, ${f.color ?? '#000'} 130%)`,
                opacity: Math.max(0, alpha),
              }}
            />
          );
        }
        if (f.kind === 'desaturate') {
          return (
            <div
              key={f.id}
              style={{
                position: 'absolute',
                inset: 0,
                backdropFilter: `saturate(${1 - Math.max(0, alpha) * 0.9})`,
              }}
            />
          );
        }
        if (f.kind === 'speedlines') {
          return (
            <div
              key={f.id}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: Math.max(0, alpha),
                background:
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 26px)',
                maskImage: 'radial-gradient(ellipse at center, transparent 34%, black 92%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 34%, black 92%)',
              }}
            />
          );
        }
        return (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              inset: 0,
              background: f.color ?? '#ffffff',
              opacity: Math.max(0, alpha),
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Damage numbers ─────────────────────────────────────────────────────────
interface ActiveNumber extends FloatingNumberCue {
  born: number;
  jitterX: number;
}

const VARIANT_COLOR: Record<FloatingNumberCue['variant'], string> = {
  normal: '#ffffff',
  critical: '#ffd257',
  break: '#ff9f43',
  resisted: '#9aa7ba',
  heal: '#5ff2a0',
  status: '#c58aff',
};

const MAX_NUMBERS = 6;
const NUMBER_MS = 760;

export function FloatingNumbers() {
  const [items, setItems] = useState<ActiveNumber[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const off = onFloatingNumber((cue) => {
      setItems((prev) => {
        const next = [
          ...prev,
          { ...cue, born: performance.now(), jitterX: (Math.random() - 0.5) * 5 },
        ];
        return next.length > MAX_NUMBERS ? next.slice(next.length - MAX_NUMBERS) : next;
      });
    });
    return off;
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const tick = () => {
      const now = performance.now();
      setItems((a) => a.filter((n) => now - n.born < NUMBER_MS));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [items.length]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 35 }}>
      {items.map((n) => {
        const t = Math.min(1, (performance.now() - n.born) / NUMBER_MS);
        const eased = 1 - (1 - t) * (1 - t);
        const anchor = n.world[0] < 0 ? SCREEN_ANCHOR.player : SCREEN_ANCHOR.enemy;
        // Rise and drift, holding full opacity for the first half.
        const opacity = t < 0.52 ? 1 : 1 - (t - 0.52) / 0.48;
        return (
          <div
            key={n.id}
            style={{
              position: 'absolute',
              left: `calc(${anchor.x}% + ${n.jitterX + eased * 1.6}%)`,
              top: `calc(${anchor.y}% - ${eased * 7}%)`,
              transform: `translate(-50%, -50%) scale(${n.scale * (t < 0.16 ? 0.7 + (t / 0.16) * 0.42 : 1.05)})`,
              color: VARIANT_COLOR[n.variant],
              fontFamily: UI.font,
              fontWeight: 900,
              fontSize: 27,
              letterSpacing: -0.5,
              opacity: Math.max(0, opacity),
              textShadow: '0 2px 0 rgba(0,0,0,0.55), 0 0 14px rgba(0,0,0,0.6)',
              WebkitTextStroke: '1px rgba(0,0,0,0.45)',
              whiteSpace: 'nowrap',
            }}
          >
            {n.text}
          </div>
        );
      })}
    </div>
  );
}

// ─── Event banner ───────────────────────────────────────────────────────────
export interface BannerMessage {
  id: number;
  text: string;
  tone: 'neutral' | 'good' | 'bad' | 'break' | 'critical';
}

const TONE: Record<BannerMessage['tone'], { bg: string; fg: string; border: string }> = {
  neutral: { bg: 'rgba(14,20,32,0.9)', fg: '#e8eef7', border: 'rgba(150,175,210,0.28)' },
  good: { bg: 'rgba(16,42,32,0.92)', fg: '#7de3b8', border: 'rgba(125,227,184,0.45)' },
  bad: { bg: 'rgba(44,18,18,0.92)', fg: '#ff8a8a', border: 'rgba(255,138,138,0.45)' },
  break: { bg: 'rgba(48,28,10,0.94)', fg: '#ff9f43', border: 'rgba(255,159,67,0.6)' },
  critical: { bg: 'rgba(46,36,8,0.94)', fg: '#ffd257', border: 'rgba(255,210,87,0.6)' },
};

export function EventBanner({ message }: { message: BannerMessage | null }) {
  if (!message) return null;
  const tone = TONE[message.tone];
  return (
    <div
      key={message.id}
      style={{
        position: 'absolute',
        top: '17%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.border}`,
        borderRadius: 8,
        padding: '7px 18px',
        fontFamily: UI.font,
        fontWeight: 800,
        fontSize: 14,
        letterSpacing: 0.7,
        zIndex: 38,
        pointerEvents: 'none',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
        animation: 'pokespire-banner 160ms ease-out',
        whiteSpace: 'nowrap',
        maxWidth: '90vw',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {message.text}
    </div>
  );
}

// ─── Keyframes ──────────────────────────────────────────────────────────────
export const BATTLE_KEYFRAMES = `
@keyframes pokespire-hp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}
@keyframes pokespire-break-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
@keyframes pokespire-banner {
  from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes pokespire-telegraph {
  from { opacity: 0; transform: translateX(-50%) scale(0.94); }
  to { opacity: 1; transform: translateX(-50%) scale(1); }
}
`;
