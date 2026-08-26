# Development State

## Current Phase
Day 3 — Visual + Movement Rework (IN PROGRESS)

## Completed
- **Day 0**: Full architecture pivot from Phaser to Three.js/R3F
- **Day 1**: Playable town with player movement, collision, two maps, map transitions
- **Day 2**: Micro-grid movement system + pixel-art visual foundation
- **Day 3**: Real Pokémon sprites, continuous movement, walk animations

## Day 3 Progress

### Real Pokémon Sprites
- Downloaded Gen 5 animated sprites from PokéAPI for 8 species
- Pikachu, Eevee, Bulbasaur, Charmander, Squirtle, Pidgey, Rattata, Caterpie
- Sprites cached locally in `public/assets/pokemon/`
- Fallback to front sprites if animated fails
- PokéAPI credit documented in `docs/ASSET_SOURCES.md`

### Continuous 8-Directional Movement
- **Max Speed**: 2.0 WU/sec (configurable)
- **Acceleration**: 12 (smooth start)
- **Deceleration**: 18 (smooth stop)
- **Diagonal**: Normalized for consistent speed
- **Collision**: Grid-based with wall sliding
- **No grid snapping**: Purely continuous movement

### Walk Animation
- 4-frame walk cycle: idle, left-step, idle, right-step
- Arm swing animation
- Leg movement animation
- Vertical bob while walking
- Idle breathing bob when stationary

### Route 1 Pokémon Encounters
- 8 Pokémon placed in Route 1
- Pikachu near entrance
- Eevee in clearing
- Pidgey scattered (2)
- Rattata in grass (2)
- Caterpie in grass (2)

### Environment Animations
- Trees: gentle rotation sway
- Flowers: scale pulse
- Water: vertical bob
- Bushes: gentle rotation sway

### Visual Improvements
- Grass tile variation (subtle color noise)
- Perspective camera FOV 35 (diorama feel)
- Sky backdrop with clouds/hills

## Day 3 Documentation
- `docs/VISUAL_STYLE.md` — Visual style guide, palette, scale, animations
- `docs/ASSET_SOURCES.md` — Asset sources, licenses, attribution

## Files Created / Modified

### Day 3 New Files
- `docs/VISUAL_STYLE.md` — Visual style guide
- `docs/ASSET_SOURCES.md` — Asset documentation
- `src/data/pokemon/pokemonSprites.ts` — Pokémon sprite data and loader
- `public/assets/pokemon/` — PokéAPI sprite files (8 species × 2 variants)

### Day 3 Modified Files
- `src/data/mapTypes.ts` — Added `PokemonEncounter` type, optional `pokemon` field
- `src/data/route1Map.ts` — Added 8 Pokémon encounters
- `src/utils/constants.ts` — Added PLAYER_ACCELERATION, PLAYER_DECELERATION
- `src/game/entities/Player.tsx` — Complete rewrite: continuous movement, walk animation
- `src/game/pixel/sprites/characterSprites.ts` — Added walk frame parameter
- `src/game/scenes/MapRenderer.tsx` — Added Pokémon sprite rendering, `animWater`
- `src/game/pixel/PixelSprite.tsx` — Added `animWater` animation type

## Architecture
React + TypeScript + Vite + Three.js/R3F + Zustand + CanvasTexture sprites + PokéAPI

## Build Status
- TypeScript: PASS (zero errors)
- Vite build: PASS (1,043 KB bundle)

## Known Issues
- Chunk size warning (Three.js ~1MB) — expected
- No audio yet
- No save/load UI yet
- No battle system yet
- No NPC interaction yet

## Movement Test Checklist
1. Hold WASD → smooth continuous diagonal movement ✓
2. Hold arrows → smooth continuous diagonal movement ✓
3. Acceleration/deceleration feels smooth ✓
4. Wall sliding on collision ✓
5. Walk animation plays while moving ✓
6. Idle bob when stationary ✓
7. Camera follows smoothly ✓
8. Pokémon sprites visible in Route 1 ✓
9. Map transitions still work ✓

## Next Steps
- Complete remaining Day 3 items (NPC interaction, more world density)
- Day 4: Battle system foundation
- Day 5: Polish and testing
