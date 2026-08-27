import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../state/gameStore';
import { getMap } from '../../data/maps';
import { getWorldBitmap } from './worldBitmapCache';

interface MinimapProps {
  onClick?: () => void;
}

const MINIMAP_SIZE = 180;
const MINIMAP_PADDING = 8;

export function Minimap({ onClick }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useGameStore((s) => s.player);
  const mapData = getMap(player.mapId);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = MINIMAP_SIZE;
    canvas.height = MINIMAP_SIZE;
    ctx.imageSmoothingEnabled = false;

    const bitmap = getWorldBitmap(mapData);

    // Show ~40% of map width in the minimap
    const srcTiles = mapData.width * 0.4;
    const srcW = srcTiles * 2; // bitmap is 2x tile size
    const srcH = srcW; // square crop

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

    ctx.drawImage(tmp, srcX, srcY, srcW, srcH, 0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Player marker
    const mx = MINIMAP_SIZE / 2;
    const my = MINIMAP_SIZE / 2;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.stroke();
  }, [mapData, player.x, player.y]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const displayName = mapData?.name === 'world' ? 'POKESPIRE' : mapData?.name?.toUpperCase() ?? 'MAP';

  return (
    <div style={{ position: 'absolute', top: MINIMAP_PADDING, right: MINIMAP_PADDING, zIndex: 50 }}>
      <div style={{ position: 'relative', width: MINIMAP_SIZE, height: MINIMAP_SIZE }}>
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{
            width: MINIMAP_SIZE, height: MINIMAP_SIZE,
            border: '2px solid #2a2a2a', borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            imageRendering: 'pixelated', cursor: 'zoom-in',
          }}
          aria-label="Open map"
        />
      </div>
      <div style={{
        position: 'absolute', bottom: -20, right: 0,
        fontSize: '8px', fontFamily: '"Press Start 2P", monospace',
        color: '#888', whiteSpace: 'nowrap',
      }}>
        {displayName}
      </div>
    </div>
  );
}
