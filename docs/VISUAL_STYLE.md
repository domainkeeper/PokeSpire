# Visual Style Guide — PokéSpire

## Aesthetic Target

90s/early-2000s JRPG + Pokémon-inspired pixel-art + anime aesthetic + vibrant colors + 3D diorama depth.

## Color Palette

### Grass
- Primary: `#4caf50` (Material Green 500)
- Secondary: `#66bb6a` (Material Green 400)
- Subtle per-tile variation for texture

### Paths
- Primary: `#d7ccc8` (Material Brown 100)
- Secondary: `#bcaaa4` (Material Brown 200)

### Water
- Primary: `#039be5` (Material Light Blue 600)
- Animation: gentle vertical bob

### Dirt
- Primary: `#bcaaa4` (Material Brown 200)

### Sky
- Gradient: `#87ceeb` (top) to `#e8f5e9` (bottom)
- Clouds: white with soft edges

## Sprite Scale

| Asset | Sprite Size (WU) | Grid Cells Spanned |
|-------|------------------|--------------------|
| Player | 0.7 × 1.1 | ~6 × 9 |
| Trees | 2.0 × 3.0 | ~16 × 24 |
| Small Trees | 1.2 × 2.0 | ~10 × 16 |
| Buildings | 4.0 × 4.5 | ~32 × 36 |
| Bushes | 0.8 × 0.6 | ~6 × 5 |
| Flowers | 0.4 × 0.5 | ~3 × 4 |
| Rocks | 1.0 × 0.7 | ~8 × 6 |
| Pokémon | 0.7–1.0 × 0.6–1.0 | varies |

## World Scale

- **Micro-grid resolution**: TILE_SIZE = 0.125 world units
- **Town**: 120 × 120 micro-cells (15 × 15 WU)
- **Route 1**: 160 × 120 micro-cells (20 × 15 WU)
- Sprites are sized in world units, NOT grid cells

## Camera

- **Type**: Perspective (FOV 35°)
- **Position**: Behind and above player
- **Follow**: Smooth lerp (CAMERA_LERP = 3)
- **Height**: CAMERA_HEIGHT = 10
- **Distance**: CAMERA_DISTANCE = 7

## Movement

- **Model**: Continuous 8-directional with acceleration
- **Max Speed**: 2.0 WU/sec
- **Acceleration**: 12 (start moving)
- **Deceleration**: 18 (stop moving)
- **Diagonal**: Normalized for consistent speed
- **Collision**: Grid-based with sliding

## Animations

### Player Walk
- 4 frames: idle, walk-left, idle, walk-right
- Arms and legs swing
- Vertical bob while moving
- Idle: subtle breathing bob

### Environment
- **Trees**: Gentle rotation sway (`animSway`)
- **Flowers**: Scale pulse (`animScale`)
- **Water**: Vertical bob (`animWater`)
- **Bushes**: Gentle rotation sway (`animSway`)

## Rendering

- **Engine**: Three.js + React Three Fiber
- **Sprites**: 2D billboards in 3D space (THREE.DoubleSide)
- **Textures**: CanvasTexture with NearestFilter (pixel-art crisp)
- **Alpha**: transparent: true, alphaTest: 0.1
- **Depth**: depthWrite: false for proper sprite layering
- **Ground**: Batched BufferGeometry with vertex colors

## Asset Rules

1. Sprites must use NearestFilter for pixel-art look
2. No anti-aliasing on sprite textures
3. All assets cached locally for offline play
4. Only use CC0 or properly licensed assets
5. Document all asset sources in `docs/ASSET_SOURCES.md`

## Licensing Rules

- **Pokémon sprites**: PokéAPI (public domain hosting, fair use)
- **Tilesets**: CC0 only (OpenGameArt.org)
- **Characters**: Procedural (no license needed)
- **Font**: OFL 1.1 (Google Fonts)
