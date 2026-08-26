# Development State

## Current Phase
Day 1 — Overworld Movement + Map Transitions (COMPLETE)

## Completed
- **Day 0**: Full architecture pivot from Phaser to Three.js/R3F
- **Day 1**: Playable town with player movement, collision, two maps, map transitions

## Day 1 Details
### Core Systems
- Grid-based movement with WASD/arrows + smooth interpolation
- Collision detection against blocked tiles
- Map transition system (fade out → switch map → fade in)
- Follow camera (no OrbitControls)
- Event bus for map transition signals

### Map Data
- **Town** (15×15): Buildings, trees, fences, flowers, signs, path network
- **Route 1** (20×20): Grass, water, rocks, trees, flowers
- Both maps have spawn points, exits, and NPC placeholders

### Environment Components
- Tree (procedural sway animation)
- SmallTree (scaled variant)
- Rock / SmallRock
- Building (red/blue variants, toon-shaded)
- Flower (animated sway)
- GrassTuft (animated sway)
- Fence / FenceRow
- Sign
- Water (animated waves)

### Entities
- Player (capsule body, sphere head, walk bob animation)
- NPC (capsule body, sphere head, hat, idle bob)
- FollowCamera (lerp smooth follow)

### Effects
- TransitionOverlay (black fade for map transitions)
- Postprocessing (DepthOfField + Bloom + Vignette)
- Fog for atmosphere

## Files Created / Modified
### Day 1 New Files
- `src/utils/constants.ts` — Tile size, speed, camera offsets, fog distances
- `src/utils/toonMaterials.ts` — Gradient textures + MeshToonMaterial helpers
- `src/utils/gridUtils.ts` — Grid/world coordinate conversion, walkability check
- `src/data/mapTypes.ts` — MapDef, TileType, MapExit types
- `src/data/townMap.ts` — Town map data (15×15)
- `src/data/route1Map.ts` — Route 1 map data (20×20)
- `src/data/maps.ts` — Map registry + lookup
- `src/game/entities/Player.tsx` — Grid movement + smooth interpolation
- `src/game/entities/Tree.tsx` — Animated tree props
- `src/game/entities/Rock.tsx` — Rock props
- `src/game/entities/Building.tsx` — Toon-shaded buildings
- `src/game/entities/Flower.tsx` — Animated flowers + grass tufts
- `src/game/entities/Fence.tsx` — Fence props
- `src/game/entities/Sign.tsx` — Sign props
- `src/game/entities/Water.tsx` — Animated water plane
- `src/game/entities/NPC.tsx` — NPC placeholder
- `src/game/entities/FollowCamera.tsx` — Smooth follow camera
- `src/game/scenes/MapRenderer.tsx` — Renders tile grid + objects from map data
- `src/game/fx/TransitionOverlay.tsx` — Black fade overlay for transitions

### Day 1 Modified Files
- `src/game/scenes/OverworldScene.tsx` — Full rewrite: map loading + player + camera + transitions
- `src/game/GameCanvas.tsx` — Added TransitionOverlay

## Installed Dependencies
### Core
- react@18.3.1
- react-dom@18.3.1
- three@0.185.1
- @react-three/fiber@8.18.0
- @react-three/drei@9.122.0
- @react-three/postprocessing@2.19.1
- zustand@4.5.5

### Development
- typescript@5.6.3
- vite@5.4.8
- @vitejs/plugin-react@4.3.2
- @types/react@18.3.11
- @types/react-dom@18.3.1
- @types/three@0.185.4

## Architecture
React + TypeScript + Vite + Three.js/R3F + Zustand + localStorage

## Build Status
- TypeScript: PASS (zero errors)
- Vite build: PASS (1,119 KB bundle)

## Known Issues
- Chunk size warning (Three.js is ~1MB) — expected, optimize later

## Next Task
Day 2: Battle system, creature encounters, catching mechanics, UI overlays
