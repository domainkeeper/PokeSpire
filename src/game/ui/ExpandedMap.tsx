import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { getMap } from '../../data/maps';
import { getWorldBitmap } from './worldBitmapCache';

interface ExpandedMapProps {
  onClose: () => void;
  isOpen: boolean;
}

export function ExpandedMap({ onClose, isOpen }: ExpandedMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useGameStore((s) => s.player);
  const mapData = getMap(player.mapId);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setTick((t) => t + 1));
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bitmap = getWorldBitmap(mapData);
    const maxW = window.innerWidth * 0.92;
    const maxH = window.innerHeight * 0.82;
    canvas.width = maxW;
    canvas.height = maxH;
    canvas.style.width = `${maxW}px`;
    canvas.style.height = `${maxH}px`;
    ctx.imageSmoothingEnabled = false;

    // Show ~70% of map
    const srcTiles = mapData.width * 0.7;
    const aspect = maxW / maxH;
    const srcW = srcTiles * 2;
    const srcH = srcW / aspect;

    let srcX = (player.x * 2) - srcW / 2;
    let srcY = (player.y * 2) - srcH / 2;
    srcX = Math.max(0, Math.min(bitmap.width - srcW, srcX));
    srcY = Math.max(0, Math.min(bitmap.height - srcH, srcY));

    const tmp = document.createElement('canvas');
    tmp.width = bitmap.width;
    tmp.height = bitmap.height;
    const tmpCtx = tmp.getContext('2d');
    if (!tmpCtx) return;
    tmpCtx.putImageData(bitmap.imageData, 0, 0);

    ctx.drawImage(tmp, srcX, srcY, srcW, srcH, 0, 0, maxW, maxH);

    // Player marker
    const mx = maxW / 2;
    const my = maxH / 2;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Region labels
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const aX = (0 - srcX) / srcW * maxW + 100;
    if (aX > 0 && aX < maxW) ctx.fillText('~ GREENVALE ~', aX, 30);
    const bX = (540 * 2 - srcX) / srcW * maxW + 80;
    if (bX > 0 && bX < maxW) ctx.fillText('~ DUSK CITY ~', bX, 30);
  }, [mapData, player.x, player.y, isOpen, tick]);

  useEffect(() => {
    if (isOpen) {
      drawMap();
      window.addEventListener('resize', drawMap);
    }
    return () => window.removeEventListener('resize', drawMap);
  }, [drawMap, isOpen]);

  if (!isOpen) return null;

  const displayName = mapData?.name === 'world' ? 'POKESPIRE' : mapData?.name?.toUpperCase() ?? 'MAP';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '12px',
        fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
      }}
      onClick={onClose} role="dialog" aria-modal="true" aria-label="Map view"
    >
      <div
        style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.8)', border: '2px solid #444',
          borderRadius: '4px', padding: '8px 16px', cursor: 'pointer',
          fontSize: '12px', color: '#fff', zIndex: 1001,
        }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        CLOSE (ESC)
      </div>

      <h2 style={{ marginBottom: '8px', fontSize: '18px', textShadow: '2px 2px 0 #000' }}>
        {displayName}
      </h2>

      <div
        style={{
          border: '3px solid #444', borderRadius: '8px',
          backgroundColor: '#1a1a1a',
          boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
          maxWidth: '95vw', maxHeight: '85vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <canvas ref={canvasRef} style={{ display: 'block', imageRendering: 'pixelated' }} />
      </div>

      <p style={{ marginTop: '8px', fontSize: '10px', color: '#888', textAlign: 'center' }}>
        Click anywhere or press ESC to close
      </p>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        background: 'rgba(0,0,0,0.8)', border: '1px solid #444',
        borderRadius: '4px', padding: '8px 12px', fontSize: '7px',
        fontFamily: '"Press Start 2P", monospace', color: '#aaa',
        lineHeight: '14px', zIndex: 1001,
      }}>
        <div><span style={{ color: '#dc4a4a' }}>&#9679;</span> You</div>
        <div><span style={{ color: '#225022' }}>&#9632;</span> Trees</div>
        <div><span style={{ color: '#dcc8aa' }}>&#9632;</span> Houses</div>
        <div><span style={{ color: '#8c8c8c' }}>&#9632;</span> Rocks</div>
        <div><span style={{ color: '#3a8f9e' }}>&#9632;</span> Water</div>
        <div><span style={{ color: '#ffff64' }}>&#9679;</span> NPC</div>
        <div><span style={{ color: '#ffa0c8' }}>&#9679;</span> Pokemon</div>
      </div>
    </div>
  );
}
