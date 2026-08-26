# Development State

## Current Phase
Day 2 — Visual Rework + Micro-Grid Movement (COMPLETE)

## Completed
- **Day 0**: Full architecture pivot from Phaser to Three.js/R3F
- **Day 1**: Playable town with player movement, collision, two maps, map transitions
- **Day 2**: Micro-grid movement system + pixel-art visual foundation

## Day 2 Details

### Micro-Grid Movement System
- **TILE_SIZE**: 0.25 world units per cell
- **Town**: 60×60 micro-cells (15×15 world units)
- **Route 1**: 80×60 micro-cells (20×15 world units)
- **Player**: Hold WASD/arrows for continuous movement
- **Speed**: 6 units/sec with smooth interpolation
- **Collision**: Built from multi-cell object footprints
- **Grid vs Movement**: Grid is for logic, movement is for humans

### Multi-Cell Objects
- Trees: 2×2 collision footprint, 2×3 sprite
- Buildings: 12×10 collision footprint, 6×5 sprite
- Rocks: 2×2 collision footprint, 2×1 sprite
- Fences: variable width, 1-cell height collision
- Flowers: 1×1 collision-free, animated scale
- Bushes: 1×1 collision, animated sway
- Water: multi-cell collision, 4×4 sprite
- Signs: 1×1 collision, 1×2 sprite

### Pixel-Art Rendering
- CanvasTexture sprites with NearestFilter (no smoothing)
- Procedurally generated pixel-art sprites (16×24 characters, 16×24 trees, 20×24 buildings)
- Sprite-based world: 2D art in 3D space
- Orthographic camera for pixel-perfect rendering
- Vertex-colored ground mesh (batched, efficient)

### Sprite System
- `PixelSprite`: Reusable billboard sprite with animation support
- `PixelCanvas`: Canvas texture generation utilities
- `characterSprites`: Player + NPC sprite generators
- `envSprites`: Tree, bush, rock, flower, fence, sign, water, building sprites
- Animation: `animScale` (flowers), `animSway` (trees/bushes)

### Camera
- Orthographic camera with zoom 60
- Smooth follow using player's continuous world position
- No OrbitControls

### Visual Style
- Bright, saturated color palette
- Pixel-art sprites with visible pixel edges
- Billboard sprites in 3D space
- No postprocessing (removed DoF/Bloom/Vignette for pixel clarity)
- Clean, crisp pixel rendering

## Files Created / Modified

### Day 2 New Files
- `src/utils/gridUtils.ts` — Added `buildBlockedGrid()` for multi-cell collision
- `src/data/mapTypes.ts` — New types: `MapObject`, `ObjectType`, multi-cell footprints
- `src/data/townMap.ts` — Rewritten: 60×60 micro-grid, object-based layout
- `src/data/route1Map.ts` — Rewritten: 80×60 micro-grid, object-based layout
- `src/game/pixel/PixelCanvas.ts` — Canvas texture utilities
- `src/game/pixel/PixelSprite.tsx` — Reusable billboard sprite component
- `src/game/pixel/sprites/characterSprites.ts` — Player + NPC sprite generators
- `src/game/pixel/sprites/envSprites.ts` — Environment sprite generators

### Day 2 Modified Files
- `src/utils/constants.ts` — TILE_SIZE=0.25, camera constants
- `src/game/entities/Player.tsx` — Complete rewrite: continuous hold-to-move, multi-cell collision
- `src/game/entities/FollowCamera.tsx` — Smooth follow using continuous position
- `src/game/scenes/MapRenderer.tsx` — Rewritten: batched ground mesh + sprite objects
- `src/game/scenes/OverworldScene.tsx` — Updated for new map types
- `src/game/GameCanvas.tsx` — Orthographic camera, removed Postprocessing

### Day 2 Deleted Files
- `src/game/entities/Tree.tsx` — Replaced by envSprites
- `src/game/entities/Rock.tsx` — Replaced by envSprites
- `src/game/entities/Building.tsx` — Replaced by envSprites
- `src/game/entities/Flower.tsx` — Replaced by envSprites
- `src/game/entities/Fence.tsx` — Replaced by envSprites
- `src/game/entities/Sign.tsx` — Replaced by envSprites
- `src/game/entities/Water.tsx` — Replaced by envSprites
- `src/game/entities/NPC.tsx` — Replaced by PixelSprite in MapRenderer
- `src/game/fx/Postprocessing.tsx` — Removed for pixel clarity
- `src/game/pixel/PixelCharacter.tsx` — Superseded by Player.tsx

## Architecture
React + TypeScript + Vite + Three.js/R3F + Zustand + CanvasTexture sprites

## Build Status
- TypeScript: PASS (zero errors)
- Vite build: PASS (1,038 KB bundle)

## Known Issues
- Chunk size warning (Three.js ~1MB) — expected
- No audio yet
- No save/load UI yet
- Placeholder sprites (procedural, not hand-drawn)

## Movement Test Checklist
1. Hold RIGHT → smooth continuous movement ✓
2. Hold LEFT → smooth continuous movement ✓
3. Hold UP/DOWN → smooth continuous movement ✓
4. Walk around tree → natural collision ✓
5. Walk alongside building → reasonable collision ✓
6. Stop moving → immediate idle ✓
7. Camera follows smoothly ✓
8. No visible cell-to-cell teleportation ✓

## Next Task
Day 3: Battle system, creature encounters, catching mechanics
