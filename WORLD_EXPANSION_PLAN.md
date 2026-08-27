# WORLD_EXPANSION_PLAN.md

> **PokeSpire — 10× World Expansion.**
> This document is an **executable playbook**. It is written to be followed **literally, top to bottom**, by a coding agent. Do not improvise. Do not skip steps. Do not "optimize" or "refactor while you're there." Do exactly what each step says, then run the verification for that step before moving on.

---

## 0. READ THIS FIRST — RULES FOR THE IMPLEMENTING AGENT

You are implementing a large game-world expansion in an existing, **working** React-Three-Fiber game. The existing game must keep working after **every** phase.

**Hard rules (violating any of these is a failure):**

1. **Work phase by phase, in order.** Phases are numbered `PHASE 0` … `PHASE 11`. Finish and verify a phase before starting the next.
2. **After every phase, run BOTH commands and they MUST pass:**
   ```
   npx tsc --noEmit
   npm run build
   ```
   If either fails, **fix it before continuing**. Never leave a phase red.
3. **Never delete or rewrite a file unless a step explicitly says "DELETE" or "REPLACE ENTIRE FILE".** Prefer small, surgical edits.
4. **Do not change these constants** in `src/utils/constants.ts`: `TILE_SIZE`, `ELEVATION_STEP`, `WATER_DEPTH`, `TERRAIN_CELL`, `MAX_CLIMB_STEPS`. Other systems depend on their exact values.
5. **Do not touch the battle system, quests, interiors, gyms, or visual style.** This task is overworld data + world architecture only.
6. **Every map's ground texture must satisfy `width * pixelsPerTile <= 4096` AND `height * pixelsPerTile <= 4096`.** This is a hardware limit. There is an assert for it; do not remove the assert.
7. **Map data files must NOT build their big arrays at module top-level.** All array construction (ground, elevation, objects) goes **inside a `build()` function** so it stays lazy. (The old `worldMap.ts` built arrays at top level — do NOT copy that pattern.)
8. **Determinism:** any randomness must use the existing seeded `hash`-based helpers (`scatter`, `line`, etc.). Never call `Math.random()` in map data.
9. **When a step gives you code, type it exactly.** When it gives you a table, follow the numbers exactly. When unsure, re-read the step; do not guess.
10. **Keep commits/edits small and labeled by phase** (e.g. "PHASE 2: authoring utilities").

**If a step cannot be completed as written** (e.g. an import path differs), STOP, report exactly what differs, and do not hack around it.

---

## 1. Executive Summary

The current world is a **single map** `src/data/worldMap.ts` at **1200 × 800 micro-tiles**. It is unmaintainable at that size and, more importantly, its ground texture renders at **9600 × 6400 px**, which **exceeds the maximum texture size on mobile GPUs (4096) and the canvas limit on iOS**. A 10× single map is therefore impossible on target hardware.

We will replace it with a **connected multi-map region** (~30 maps in 3 themed regions), summing to **≈9.57 million micro-tiles (≈10× the current 960,000)**. The engine already:

- caches terrain geometry, ground texture, water mask and minimap bitmap **per `mapData.name`**, and
- supports **map-to-map transitions** via `MapExit` + a fade in `OverworldScene.tsx`.

So multi-map is the natural grain of the code. We add: a **lazy map registry** (build map arrays on first entry, dispose when far away), a **connection graph** (one entry links two maps both ways), a per-map **`pixelsPerTile`** knob (keeps every ground texture ≤ 4096 px), **theme overrides** (avoid theme explosion), **prefab composition helpers** (city block, house row, forest cluster, dock), **encounter zones** (data only), and a **progressive region map** (fills in as you explore; no giant hand-drawn image).

---

## 2. Current Architecture Analysis

You must understand these before editing. File → responsibility → the fact that matters:

| File | Responsibility | Fact that constrains the design |
|---|---|---|
| `src/data/mapTypes.ts` | `GameMap`, `MapObject`, `MapExit`, `NpcSpawn`, `PokemonEncounter`, `ThemeRegion`, `resolveThemeId()` | `GameMap` is one self-contained object per map. We extend it. |
| `src/data/maps.ts` | `getMap(name)`, `getMapNames()` via a static `Record` | We replace the internals with a registry but **keep `getMap` synchronous**. |
| `src/data/worldMap.ts` | Current world (1200×800). **Builds arrays at top level.** | Will be **retired** (unregistered, then deleted) at the end. |
| `src/data/maps/authoring.ts` | `place, line, border, treeWall, scatter, makeElevation, elevateRect, elevateEllipse, terraceEllipse, carveRamp, flattenRect` | We reuse and extend these. Deterministic (seeded). |
| `src/data/props/propRegistry.ts` | Prop **definitions** (footprint, solid, height, variants, build) | Placement is separate (map data). We add **prefabs** that emit `MapObject[]`. |
| `src/utils/gridUtils.ts` | `buildBlockedGrid`, `canMoveTo`, `findNearestWalkable`, `objectFootprint` | Collision is **per map**, rebuilt via `useMemo`. Keep per-map. |
| `src/utils/constants.ts` | `TILE_SIZE=0.125`, `ELEVATION_STEP=0.19`, `WATER_DEPTH=0.14`, `TERRAIN_CELL=2`, `MAX_CLIMB_STEPS=1` | Do not change. |
| `src/game/terrain/heightfield.ts` | `buildTerrain(mapData)` → geometry + `heightAt`. **Cache keyed by `mapData.name`.** | Add `disposeTerrain(name)`. |
| `src/game/terrain/groundTexture.ts` | `makeGroundTexture`, `buildWaterMask`, `hasWater`. **`PPT = 8` hardcoded**, exports `GROUND_PIXEL_SIZE`. Cache key `theme.id\|name`. | Make PPT per-map; export `groundPixelSize(mapData)`; add dispose fns. |
| `src/game/terrain/terrainMaterial.ts` | `createTerrainMaterial(map, theme, groundPixelSize)`; `customProgramCacheKey = terrain-${theme.id}` | Merged themes must have **unique ids** or cliff shaders collide. |
| `src/game/entities/WaterPlane.tsx` | One masked plane per map. | Fine as-is. |
| `src/game/entities/InstancedProps.tsx` | N copies of a prop = 1 draw call per part. `frustumCulled=false`. | Efficient. Only current map renders. |
| `src/game/scenes/MapRenderer.tsx` | Renders terrain, water, prop groups, NPCs (1 `SpriteActor` each), Pokémon (1 each). | Uses `GROUND_PIXEL_SIZE` → change to `groundPixelSize(mapData)`. |
| `src/game/scenes/OverworldScene.tsx` | Picks theme via `resolveThemeId(mapData, playerX)`; lights/sky; **transition fade** (400 ms) then `setPlayerPosition`. | The fade is where we could load, but we keep loading **synchronous-lazy** so no async needed. |
| `src/game/entities/Player.tsx` | Movement/collision; **re-places player when `placedForMap.current !== mapData.name`** using `findNearestWalkable`. | Cross-map spawns already handled. |
| `src/game/entities/FollowCamera.tsx`, `src/game/playerTransform.ts` | Camera follows continuous pos; **snaps on `mapId` change**. | Works across maps already. |
| `src/game/ui/worldBitmapCache.ts` | 2× bitmap of current map, cache by name; `invalidateWorldBitmap(name)`. | Reuse for region atlas thumbnails. |
| `src/game/ui/Minimap.tsx`, `ExpandedMap.tsx` | Player-centered crop of current-map bitmap. | Minimap unchanged; ExpandedMap becomes region atlas. |
| `src/state/gameStore.ts` | `player {x,y,mapId,facing}`; `START_MAP_ID='world'`; spawn read from `getMap(START_MAP_ID).spawn`. | Change `START_MAP_ID`; start map must be loadable synchronously. |

**Decision — what happens to `worldMap.ts`:** it is **decomposed and retired**. Its "Greenvale" half is the design seed for the Coastal maps; its "Dusk City" half seeds the Dusk maps. It stays registered as a fallback until Phase 4 puts a real start map in place, then is unregistered and finally deleted in Phase 11. Reason: (a) its texture already breaks mobile; (b) a 10× monolith is unmaintainable; (c) per-map caching + transitions already exist.

---

## 3. Current World-Size Calculation

- `worldMap`: **1200 × 800 = 960,000 micro-tiles** = 150 × 100 world units (WU) = **15,000 WU²**. This is the **baseline**.
- One micro-tile = `TILE_SIZE` = 0.125 WU.
- Ground texture today: `1200*8 × 800*8 = 9600 × 6400 = 61.44 MP` → **over the 4096 mobile limit** (latent bug).
- Cross time at full speed (0.6 WU/s): 150 / 0.6 = **250 s**.

Legacy maps (not part of baseline): `town` 300×300 = 90,000; `route1` 400×300 = 120,000.

---

## 4. Target World-Size Calculation

- **Target = 10 × 960,000 = ~9,600,000 micro-tiles (~150,000 WU²).**
- **Per-map hard cap:** `side_tiles * pixelsPerTile <= 4096`.
  - `pixelsPerTile = 8` → max **512** tiles/side (crisp; use for cities).
  - `pixelsPerTile = 6` → max **682** tiles/side.
  - `pixelsPerTile = 4` → max **1024** tiles/side (use for big wilderness).
- Size tiers used below: **S** connector ~80k, **M** ~130k, **L** city (PPT 8) ~225k, **XL** wilderness (PPT 4–6) ~450–560k, **XXL** major (PPT 4) ~640k.
- The **30-map table in §5 sums to ≈9,570,880 tiles ≈ 9.97× ≈ 10×.** Largest texture is `verdant-forest`: 840 × 4 = 3360 px ✅ (< 4096).

---

## 5. Proposed World Topology + Full Map Table

### 5.1 Topology diagram

```
                          CORAL COAST  (theme: coastal-day)
  [lighthouse-point]──[harbor-district]──[COASTAL-CITY]──[route-1-coast-road]──[seabreeze-cove]
                                              │                  │                    │
                                     [coastal-wetlands]   [gull-rock-isle]      [tidepool-flats]
                                              │
                                     ─────────┴──────────  HEARTLAND WILDS  (theme: natural)  ─────────
                                              │
  [route-2-meadowway]──[whisperwind-meadow]──[VERDANT-FOREST]──[forest-hollow*]
            │                                        │
  [route-3-riverside]──[old-stone-bridge]──[mistmere-lake]──[sunken-grotto*]
            │
  [route-4-foothill]──[craggy-highlands]──[echo-cave-entrance*]──[route-4b-switchback]
            │
  ──────────┴─────────────────  DUSK METRO  (theme: dusk-city)  ─────────────────
            │
  [route-5-dusk-approach]──[dusk-outskirts]──[windmill-farms]
            │                     │
  [dusk-west-gate]──[dusk-residential]──[DUSK-DOWNTOWN]──[dusk-night-market]
            │                                  │                │
     [dusk-depot]                       [dusk-industrial]  [dusk-riverside-park]──[dusk-heights]
                                                                 │
                                                        [route-6-metro-fringe]
  (* = optional / hidden side areas)
```

### 5.2 Full map table (authoritative — use these exact ids and sizes)

| # | Map id | W×H | PPT | Base theme | Override | Tiles |
|---|---|---|---|---|---|---|
| A1 | `coastal-city` | 504×456 | 8 | coastal-day | — | 229,824 |
| A2 | `harbor-district` | 432×360 | 8 | coastal-day | — | 155,520 |
| A3 | `lighthouse-point` | 300×300 | 8 | coastal-day | — | 90,000 |
| A4 | `route-1-coast-road` | 512×760 | 4 | coastal-day | — | 389,120 |
| A5 | `seabreeze-cove` | 672×520 | 6 | coastal-day | beach | 349,440 |
| A6 | `coastal-wetlands` | 640×560 | 6 | coastal-day | marsh | 358,400 |
| A7 | `tidepool-flats` | 600×520 | 6 | coastal-day | beach | 312,000 |
| A8 | `gull-rock-isle` | 360×300 | 8 | coastal-day | — | 108,000 |
| B1 | `route-2-meadowway` | 760×600 | 4 | coastal-day | meadow | 456,000 |
| B2 | `whisperwind-meadow` | 800×640 | 4 | coastal-day | meadow | 512,000 |
| B3 | `verdant-forest` | 840×760 | 4 | forest-day | — | 638,400 |
| B4 | `forest-hollow` | 480×480 | 6 | forest-day | — | 230,400 |
| B5 | `route-3-riverside` | 720×640 | 4 | coastal-day | river | 460,800 |
| B6 | `old-stone-bridge` | 240×420 | 8 | coastal-day | river | 100,800 |
| B7 | `mistmere-lake` | 720×620 | 4 | coastal-day | river | 446,400 |
| B8 | `route-4-foothill` | 720×660 | 4 | coastal-day | highland | 475,200 |
| B9 | `craggy-highlands` | 780×720 | 4 | coastal-day | highland | 561,600 |
| B10 | `echo-cave-entrance` | 360×340 | 8 | coastal-day | highland | 122,400 |
| B11 | `sunken-grotto` | 440×420 | 6 | forest-day | — | 184,800 |
| B12 | `route-4b-switchback` | 560×620 | 4 | coastal-day | highland | 347,200 |
| C1 | `route-5-dusk-approach` | 720×620 | 4 | dusk-outskirts | — | 446,400 |
| C2 | `dusk-outskirts` | 700×580 | 4 | dusk-outskirts | — | 406,000 |
| C3 | `windmill-farms` | 680×560 | 6 | dusk-outskirts | — | 380,800 |
| C4 | `dusk-west-gate` | 472×432 | 8 | dusk-city | — | 203,904 |
| C5 | `dusk-residential` | 504×448 | 8 | dusk-city | — | 225,792 |
| C6 | `dusk-downtown` | 512×472 | 8 | dusk-city | — | 241,664 |
| C7 | `dusk-night-market` | 360×340 | 8 | dusk-city | — | 122,400 |
| C8 | `dusk-industrial` | 488×432 | 8 | dusk-city | — | 210,816 |
| C9 | `dusk-riverside-park` | 360×320 | 8 | dusk-city | — | 115,200 |
| C10 | `dusk-heights` | 440×400 | 6 | dusk-city | — | 176,000 |
| C11 | `route-6-metro-fringe` | 700×600 | 4 | dusk-outskirts | — | 420,000 |
| C12 | `dusk-depot` | 260×360 | 8 | dusk-city | — | 93,600 |

**Total ≈ 9,570,880 micro-tiles ≈ 9.97× baseline.** Verify each row: `W*PPT ≤ 4096` and `H*PPT ≤ 4096`.

---

## 6. Coastal City Design (`coastal-city`, A1, hub)

- **Size** 504×456, PPT 8, theme `coastal-day`. **Spawn** near center-south (in front of the Pokémon facility). **Encounter-free** interior (no `encounterZones`); tall-grass fringe only at the map edges.
- **Districts:**
  - **Central Plaza** (center): open `path`/`dirt`, `well`, benches, lamp posts, a `sign`.
  - **Facility block** (north of plaza): 2 `shop` props = "Pokémon Center" + "Mart" (visual only).
  - **Residential** (west): 2 rows of `house_small`/`house_large` via `houseRow` prefab, `fence_wood` yards, gardens (`flowerField`).
  - **Waterfront promenade** (south): `sand` band → `water` (sea); `boardwalk` + `dock` prefabs; palms.
  - **Park** (east): trees, benches, pond (`pond` prefab), flowers.
- **Elevation:** flat (0) everywhere except a 1-step rise for the park (optional), with a `carveRamp`.
- **Exits / connections:** N → `harbor-district`; E → `route-1-coast-road`; S → `coastal-wetlands`. (Harbor also links to `lighthouse-point`.)
- **NPC density:** high (~18): Professor (gives direction text), Nurse, Merchant, residents, a Gym-Leader-flavored trainer (dialogue only).
- **Landmarks:** central `well`, facility, dock.

---

## 7. Coastal Routes & Natural Regions (A2–A8, B1–B2)

For each area: size/PPT/theme are in the §5 table. Design intent:

- **`harbor-district` (A2):** piers, warehouses (`shop`/`crate`/`barrel`), boardwalk, moored-boat feel; connects City↔Lighthouse. Water on south edge.
- **`lighthouse-point` (A3):** small headland; a tall landmark built from stacked `well`/`boulder`/`lamp_post` (no new prop needed); 1-step terrace to the light; sea on 3 edges. Dead-end (single connection) is OK here (it's a landmark).
- **`route-1-coast-road` (A4):** long N–S road; **cliff wall** (elevation 2–3 with `treeWall`) on the inland side, **beach + sea** on the seaward side; ledges (1-step) with ramps; tall-grass encounter patches. Connects City↔Cove.
- **`seabreeze-cove` (A5) / `tidepool-flats` (A7):** `sand` dominant, tidepools (small `water` ellipses), palms, rocks; beach override. Water encounter zone (data only).
- **`coastal-wetlands` (A6):** marsh = many small `water` patches + `reed`/`grass_tuft`; boardwalk paths over water; marsh override.
- **`gull-rock-isle` (A8):** small offshore island reached via a bridge from Cove; rocks, few trees; hidden item feel (landmark).
- **`route-2-meadowway` (B1) / `whisperwind-meadow` (B2):** rolling meadow, `flowerField` prefab, low `fence_wood`, gentle 1-step hills; grass encounters. Connects Coast↔Forest.

---

## 8. Water / River / Coast Architecture

- **Water is a ground tile** (`'water'`). The heightfield sinks water cells by `WATER_DEPTH`, so **banks form automatically**; add a `'sand'` ring for shoreline.
- **Sea:** large `water` fill along a map edge, with a `sand` band between land and sea.
- **River:** a width-N (`N` = 12–20) `water` stripe carved across a map with the `river()` authoring helper; **cross it only via a `bridge()`** (a `path` strip laid over the water; keep those tiles `path`, not `water`, so they're walkable and flat).
- **Lake/pond:** filled ellipse of `water` with a `sand`/`dirt` ring (`pond()` helper).
- **Rule:** never place a river/sea so it fully blocks a route with **no bridge**. Every water body that lies on the main path must have a bridge or a way around.
- Rendering cost is one masked plane per map regardless of water shape — no extra cost for complex coastlines.

---

## 9. Forest / Wilderness Regions (B3, B4, B11)

- **`verdant-forest` (B3):** the largest map. Dense `tree_oak`/`tree_pine` **walls** (via `forestCluster`/`treeWall`) forming **corridors and clearings** — the player threads a path, not an open field. Theme `forest-day` (darker canopy, dimmer sun, denser fog). 2–3 clearings with NPCs/items. Hidden gap → `forest-hollow`.
- **`forest-hollow` (B4) / `sunken-grotto` (B11):** small hidden side rooms (1-step sunken basin via `terraceEllipse(..., 0, -1)` + `carveRamp`), rare encounter zone. Single connection (hidden entrance) is fine.
- **Rule:** forests must be **navigable** — always leave ≥ 6-tile-wide walkable corridors between tree walls (player+camera need room). Never seal an exit corridor with trees (use the `gate` param of `treeWall`).

---

## 10. Dusk Outskirts (C1–C3)

- Transitional zone between the natural world and the city. Theme **`dusk-outskirts`** (a new full theme: dawn/dusk palette between coastal-day and dusk-city).
- **`route-5-dusk-approach` (C1):** the road that visually shifts from countryside to city fringe; roadside lamp rows begin here; some `dirt` lots.
- **`dusk-outskirts` (C2):** run-down farmland, dirt fields, sparse rundown houses, fences.
- **`windmill-farms` (C3):** `windmill` prefab (built from existing props), crop rows (`flowerField` recolored via override is NOT needed — just use `dirt` rows + `grass_tuft`).
- Connects Highlands↔Dusk City West Gate.

---

## 11. Dusk City Design (C4–C12)

- Theme `dusk-city`. **Geography is a GRID, not organic paths** — this is the key contrast with Coastal City.
- **`dusk-west-gate` (C4):** entry plaza + gate; lamp rows; first city blocks.
- **`dusk-residential` (C5):** regular grid of `cityBlock`s filled with `house_small`/`house_large`.
- **`dusk-downtown` (C6):** dense downtown; central plaza; tall building clusters (`shop`/`house_large` packed); heavy lamp posts + signs.
- **`dusk-night-market` (C7):** narrow lanes, `marketStalls` prefab (crates/barrels/awnings), dense lamps.
- **`dusk-industrial` (C8):** warehouses, crates, barrels, wide `dirt` lots, fences.
- **`dusk-riverside-park` (C9):** a green pocket (trees, benches, pond) beside a river; humanizes the city.
- **`dusk-heights` (C10):** elevated overlook (terraces + ramps) with a view; benches, lamps.
- **`dusk-depot` (C12):** small transit connector (a station-yard feel); short map.
- **NPC density:** very high in downtown/market (~25–30 across those maps).

---

## 12. Theme Architecture

**Keep only 4 full `Theme` objects.** Everything else is a per-map **override patch**.

- Existing: `coastal-day`, `dusk-city`.
- **Add two full themes** (Phase 3): `forest-day`, `dusk-outskirts` (copy an existing theme file and adjust palette/lighting/sky/fog).
- **Overrides** (`beach`, `marsh`, `meadow`, `river`, `highland`) are **partial patches** declared per map via `GameMap.themeOverride`, deep-merged onto the base theme at render time.

**Theme resolution order** (implemented in `resolveMapTheme`, Phase 0):
1. `resolveThemeId(map, playerX)` (supports `regionThemes` by X for straddle maps, else `map.themeId`, else default) → base theme by id.
2. If `map.themeOverride` is set, **deep-merge** it onto a copy of the base theme (arrays are replaced wholesale) and **assign a unique `id`** = `${baseId}#${map.name}` so id-keyed caches (`terrainMaterial.customProgramCacheKey`, prop material caches) don't collide.

Renderer, ground texture, water and prop factory already take a `Theme` and read colors fresh, so overrides "just work" once resolution returns the merged theme.

---

## 13. Map / Chunk Architecture

**Decision: medium, discrete, connected maps. NOT streamed chunks.** Rationale: transitions already exist; discrete maps match the Pokémon genre; stitching a heightfield + instanced props across borders is high-risk and unnecessary.

Each map is a **`MapModule`**:

```ts
export interface MapMeta {
  id: string;
  name: string;              // MUST equal id (caches key on GameMap.name)
  regionId: string;         // 'coral-coast' | 'heartland-wilds' | 'dusk-metro'
  width: number;
  height: number;
  pixelsPerTile: number;    // 8 | 6 | 4  (must satisfy side*ppt <= 4096)
  themeId: string;
  layout: { worldX: number; worldY: number }; // tile offset for region atlas (§24-25)
}

export interface MapModule {
  meta: MapMeta;
  build: () => GameMap;      // constructs arrays LAZILY (never at top level)
}
```

**Lazy building, synchronous access.** All map modules are statically imported into the registry, but they only define `meta` + a `build` function — **no big arrays until `build()` is called**. `getMap(id)` builds on first call and caches the result, so it stays **synchronous** (no async plumbing, no Suspense). Dynamic `import()` code-splitting is a **future** optimization (§26), not part of this task.

---

## 14. World Registry (regions)

`src/data/world/regions.ts`:

```ts
export interface Region {
  id: string;
  name: string;
  themeId: string;          // default theme for maps in this region
  mapIds: string[];
}

export const REGIONS: Region[] = [
  { id: 'coral-coast',    name: 'Coral Coast',    themeId: 'coastal-day',    mapIds: [/* A1..A8 */] },
  { id: 'heartland-wilds',name: 'Heartland Wilds',themeId: 'coastal-day',    mapIds: [/* B1..B12 */] },
  { id: 'dusk-metro',     name: 'Dusk Metro',     themeId: 'dusk-city',      mapIds: [/* C1..C12 */] },
];

export function regionOf(mapId: string): Region | undefined {
  return REGIONS.find((r) => r.mapIds.includes(mapId));
}
```

---

## 15. Map Registry (lazy build + dispose)

`src/data/world/mapRegistry.ts` — the new engine of map loading. `src/data/maps.ts` will delegate to it.

```ts
import type { GameMap } from '../mapTypes';
import type { MapModule } from './worldTypes';
import { disposeTerrain } from '../../game/terrain/heightfield';
import { disposeGroundTexture, disposeWaterMask } from '../../game/terrain/groundTexture';
import { invalidateWorldBitmap } from '../../game/ui/worldBitmapCache';
import { compileExitsFor } from './connections';

const modules = new Map<string, MapModule>();
const loaded = new Map<string, GameMap>();

export function registerMapModule(mod: MapModule): void {
  if (mod.meta.name !== mod.meta.id) {
    throw new Error(`[mapRegistry] meta.name must equal meta.id for "${mod.meta.id}"`);
  }
  const px = mod.meta.width * mod.meta.pixelsPerTile;
  const py = mod.meta.height * mod.meta.pixelsPerTile;
  if (px > 4096 || py > 4096) {
    throw new Error(`[mapRegistry] "${mod.meta.id}" ground texture ${px}x${py} exceeds 4096`);
  }
  modules.set(mod.meta.id, mod);
}

/** Synchronous: builds arrays on first call, then caches. */
export function loadMap(id: string): GameMap | undefined {
  const hit = loaded.get(id);
  if (hit) return hit;
  const mod = modules.get(id);
  if (!mod) return undefined;
  const map = mod.build();
  // Inject exits derived from the connection graph (both directions).
  map.exits = [...map.exits, ...compileExitsFor(id)];
  loaded.set(id, map);
  return map;
}

export function getMapMeta(id: string) { return modules.get(id)?.meta; }
export function allMapIds(): string[] { return [...modules.keys()]; }
export function isLoaded(id: string): boolean { return loaded.has(id); }

/** Free CPU + GPU memory for a map we walked away from. */
export function disposeMap(id: string): void {
  loaded.delete(id);
  disposeTerrain(id);
  disposeGroundTexture(id);
  disposeWaterMask(id);
  invalidateWorldBitmap(id);
}
```

`src/data/maps.ts` becomes a thin adapter (keeps the old signature so nothing else breaks):

```ts
import type { GameMap } from './mapTypes';
import { loadMap, allMapIds } from './world/mapRegistry';
import './world/registerAll'; // side-effect: registers every MapModule

export function getMap(name: string): GameMap | undefined {
  return loadMap(name);
}
export function getMapNames(): string[] {
  return allMapIds();
}
```

`src/data/world/registerAll.ts` imports every map module and calls `registerMapModule(...)`. During migration it ALSO registers the legacy `world`/`town`/`route1` (wrapped as modules) so the game keeps working.

---

## 16. Connection / Exit Architecture

One connection entry produces **both** `MapExit`s. Adding a link = one line.

`src/data/world/connections.ts`:

```ts
import type { MapExit } from '../mapTypes';
import type { Direction } from '../../types/game';

export interface ConnectionEnd {
  map: string;
  /** Which edge the exit trigger sits on. */
  edge: 'N' | 'E' | 'S' | 'W';
  /** Along-edge span of the trigger, in tiles [from,to]. */
  from: number;
  to: number;
  /** Spawn cell + facing when ARRIVING onto this map from the other side. */
  spawnX: number;
  spawnY: number;
  facing: Direction;
}

export interface MapConnection { a: ConnectionEnd; b: ConnectionEnd; }

export const CONNECTIONS: MapConnection[] = [
  // Example (fill real coords per map in the relevant phase):
  // {
  //   a: { map: 'coastal-city', edge: 'E', from: 220, to: 240, spawnX: 496, spawnY: 228, facing: 'left' },
  //   b: { map: 'route-1-coast-road', edge: 'W', from: 360, to: 380, spawnX: 8, spawnY: 370, facing: 'right' },
  // },
];

/** Turn a ConnectionEnd's edge+span into an exit rectangle on ITS map,
 *  whose destination is the OTHER end's map + spawn. */
function endToExit(here: ConnectionEnd, there: ConnectionEnd, hereW: number, hereH: number): MapExit {
  const THICK = 2; // trigger depth in tiles
  let x = 0, y = 0, w = 0, h = 0;
  const len = here.to - here.from;
  if (here.edge === 'N') { x = here.from; y = 0;            w = len; h = THICK; }
  if (here.edge === 'S') { x = here.from; y = hereH - THICK; w = len; h = THICK; }
  if (here.edge === 'W') { x = 0;            y = here.from; w = THICK; h = len; }
  if (here.edge === 'E') { x = hereW - THICK; y = here.from; w = THICK; h = len; }
  return { x, y, w, h, toMap: there.map, spawnX: there.spawnX, spawnY: there.spawnY, facing: there.facing };
}

// Needs map sizes; import metas lazily to avoid cycles.
import { getMapMeta } from './mapRegistry';

export function compileExitsFor(mapId: string): MapExit[] {
  const out: MapExit[] = [];
  for (const c of CONNECTIONS) {
    if (c.a.map === mapId) {
      const m = getMapMeta(mapId)!; out.push(endToExit(c.a, c.b, m.width, m.height));
    }
    if (c.b.map === mapId) {
      const m = getMapMeta(mapId)!; out.push(endToExit(c.b, c.a, m.width, m.height));
    }
  }
  return out;
}
```

**Rules for authoring connections:**
- The `from/to` span on one side and the arriving `spawnX/spawnY` on the other must be **walkable and flat** (elevation 0) on both maps.
- Facing points **into** the arrival map (e.g., arriving on a W edge → `facing: 'right'`).
- Opposite edges must correspond geographically to the §5.1 topology (City E ↔ Route W, etc.).

---

## 17. Terrain Architecture

Unchanged algorithm (`heightfield.ts`). Only two changes total across the project:
1. `pixelsPerTile` flows into `groundTexture.ts` (Phase 0).
2. `disposeTerrain(name)` added (Phase 10).

Authoring keeps using micro-tile `ground[][]` + `elevation[][]`. `TERRAIN_CELL=2` downsampling and skirt/cliff generation are untouched.

---

## 18. Elevation Architecture

- Authored as **integer steps** per micro-tile via helpers (`terraceEllipse`, `carveRamp`, `flattenRect`, `elevateRect/Ellipse`).
- Conventions:
  - **Cities & connectors:** flat (0).
  - **Routes:** mostly 0, occasional 1-step ledges with `carveRamp` access.
  - **Highlands:** 0–4 with **switchback ramps** (`carveRamp`), cliffs elsewhere.
  - **Water:** auto-sunk; don't author elevation under water.
- **`MAX_CLIMB_STEPS = 1`** (unchanged): a jump > 1 step is a cliff (blocked). Always provide a ramp to any raised area the player must reach, or it will be sealed.
- **Seam rule:** at every connection trigger and the matching arrival cells, elevation MUST be `0` on both maps.

---

## 19. Collision Architecture

- Unchanged `buildBlockedGrid(mapData)` — per map, `useMemo` in `Player.tsx`. Water tiles + solid props + bounds → blocked; elevation steps → cliffs.
- **Do not build a global collision grid.** Each map has its own; only the current map's grid exists at a time.
- **Verification step per map:** every connection spawn cell resolves to itself via `findNearestWalkable` (i.e., is already walkable). Author spawns on `path`/`grass`, never on water/props/cliffs.
- **Future** (design only, do NOT build): a `tileTags` layer for surf/cut/doors/interaction. Leave `GameMap` open to it; add nothing now.

---

## 20. Prop Architecture (definition vs placement + prefabs)

- **Definitions** stay in `propRegistry.ts` (do not edit unless adding a genuinely new prop — not needed for this task).
- **Placement** is produced by **prefab functions** returning `MapObject[]`, in `src/data/world/prefabs/`:
  - `buildings.ts`: `houseRow`, `cityBlock`, `plaza`, `shopFront`, `marketStalls`
  - `nature.ts`: `forestCluster`, `grove`, `pond`, `flowerField`, `rockFormation`
  - `coast.ts`: `dock`, `boardwalk`, `shorelineDetail`
  - `urban.ts`: `streetCorner`, `lampRow`, `fenceYard`, `windmill`
- All prefabs must be **deterministic** (accept a `seed`, use the seeded `hash` in `authoring.ts`). Prefabs return `MapObject[]` that the map spreads into its `objects` array.

Prefab signature pattern (example):

```ts
import type { MapObject } from '../../mapTypes';
import { place, line, border } from '../../maps/authoring';

export function houseRow(opts: {
  x: number; y: number; count: number; gap: number;
  size?: 'small' | 'large'; seed?: number;
}): MapObject[] { /* deterministic placement */ return []; }
```

---

## 21. NPC Architecture

- `GameMap.npcPositions: NpcSpawn[]` unchanged. Author inline for small maps; for big cities put rosters in `src/data/world/npcs/<mapId>.ts` and import into the map's `build()`.
- Role tint is derived from the `name` string (see `MapRenderer.npcRole`). Use names containing keywords: `Professor`, `Nurse`, `Merchant`, `Ranger`, `Hiker`, `Scientist`, `Sailor`/`Fisher`, `Elder`, `Trainer`/`Leader`, else "resident".
- Keep dialogue short. One NPC on the start map must give **direction guidance** ("Route 1 is east…").

---

## 22. Pokémon Encounter Architecture (data only — no battle logic)

Add to `GameMap` (Phase 0) and populate per map (Phase 7):

```ts
export interface EncounterEntry {
  species: PokemonSpeciesKey;
  weight: number;   // relative probability within the zone
  min: number;      // level range (data only for now)
  max: number;
}
export interface EncounterZone {
  id: string;
  biome: 'grass' | 'water' | 'cave' | 'sand';
  rects: { x: number; y: number; w: number; h: number }[];
  table: EncounterEntry[];
  rarity?: 'common' | 'uncommon' | 'rare';
  requiresTag?: string; // e.g. 'tallgrass' | 'surf' (future gating)
}
```

- Reusable tables live in `src/data/world/encounters/tables.ts` (e.g. `COAST_GRASS`, `MEADOW_GRASS`, `FOREST`, `CAVE`, `WATER_SURF`, `CITY_NIGHT`) using only the 8 registered species (`pikachu, eevee, bulbasaur, charmander, squirtle, pidgey, rattata, caterpie`).
- **Do NOT** add battle triggering, RNG rolls, or UI. This is inert data that a future system will read.
- Overworld ambient Pokémon (`pokemon: PokemonEncounter[]`) stay separate and are still used for visible wandering sprites.

---

## 23. Authoring / Generation Utilities

Create `src/data/world/authoring/` and **re-export** the existing helpers plus new ones. Do not remove `src/data/maps/authoring.ts`; import from it.

New terrain helpers (`terrain.ts`) — all operate on a `TileType[][]` grid and are deterministic:

```ts
fillRect(grid, x, y, w, h, tile)
paintPath(grid, x, y, w, h)                 // path rect
curvePath(grid, x0,y0, x1,y1, width, amp, freq, tile)  // promoted from old worldMap
river(grid, x0,y0, x1,y1, width)            // water stripe
pond(grid, cx,cy, rx,ry, ring: TileType)    // water ellipse + shore ring
coastline(grid, edge, depth, sandBand)      // sea along an edge + sand band
bridge(grid, x, y, w, h)                    // path over water (walkable)
dirtBorder(grid, tile, radius)              // promoted from old worldMap 'dirtEdge'
```

City helpers (`city.ts`): `streetGrid(grid, ...)`, `block(grid, ...)`, `plaza(grid, ...)`.
Nature helpers (`nature.ts`): thin wrappers that pick sensible `scatter` tables for `meadow`, `forestFloor`, `wetland`.

**Every generator is pure + seeded.** Same inputs ⇒ identical output.

---

## 24. Minimap Architecture

- **No change to `Minimap.tsx`.** It already calls `getWorldBitmap(getMap(player.mapId))`, which is cached per map name and player-centered. When the player enters a new map, `getMap` returns the new map and the bitmap regenerates (and caches). It "just works" for the multi-map world.

---

## 25. Expanded (Region) Map Architecture — Progressive Atlas

Replace the single-map expanded view with a **progressive region atlas** that fills in as you explore. No giant hand-drawn image; no loading all maps.

`src/data/world/regionAtlas.ts`:

- On entering a map, generate its **downscaled thumbnail** from the existing 2× bitmap (`getWorldBitmap`), and blit it onto a per-region canvas at `meta.layout.{worldX,worldY} * scale`.
- **Persist** which maps are "discovered" to `localStorage` (fog-of-war). Undiscovered maps render as blank/greyed.
- The player marker = `regionAtlasPos = layout offset + local player position`.
- `ExpandedMap.tsx` draws the current region's atlas centered on the player and lists the region name.

This reuses per-map bitmaps (already cheap and cached) and only ever builds the maps you've actually visited.

---

## 26. Performance Strategy

- **Texture cap** enforced at registration (`registerMapModule` throws if `side*ppt > 4096`). Never bypass.
- **Only the current map renders** (OverworldScene renders one `MapRenderer`). Neighbors are not drawn.
- **LRU disposal (Phase 10):** keep the current map + its direct neighbors (from `CONNECTIONS`) loaded; call `disposeMap(id)` on everything else after each transition. Bounds resident ground textures to a handful.
- **Instancing:** props already batch to 1 draw call/part. Keep prop-type diversity per map moderate.
- **NPC/Pokémon:** each is currently its own `SpriteActor` (3 layers). For dense city maps, cap total NPCs (~30) or (optional, later) batch them; this is a recommendation, not required for correctness.
- **Bundle:** synchronous-lazy build keeps all map code in the main bundle. If bundle size becomes a problem, convert `registerAll.ts` to dynamic `import()` per region — but only after everything works.
- **Mobile dpr** and shadow settings stay as-is (already clamped in `GameCanvas.tsx`).

Rough per-map memory: ground texture ≤ 64 MB worst-case (usually far less), geometry ~10 MB, collision ~0.75 MB, bitmap ~4 MB. With LRU to ~4 maps, VRAM stays bounded.

---

## 27. File / Folder Structure (create exactly this)

```
src/data/world/
  worldTypes.ts          # MapMeta, MapModule, EncounterZone/Entry, DeepPartial<Theme>
  regions.ts             # REGIONS + regionOf()
  mapRegistry.ts         # registerMapModule, loadMap, disposeMap, metas
  connections.ts         # CONNECTIONS + compileExitsFor()
  registerAll.ts         # imports & registers every MapModule (+ legacy during migration)
  regionAtlas.ts         # progressive expanded-map atlas (+ localStorage)
  authoring/
    index.ts             # re-export ../maps/authoring + new helpers
    terrain.ts           # fillRect, curvePath, river, pond, coastline, bridge, dirtBorder
    city.ts              # streetGrid, block, plaza
    nature.ts            # meadow/forestFloor/wetland scatter wrappers
  prefabs/
    buildings.ts         # houseRow, cityBlock, plaza, shopFront, marketStalls
    nature.ts            # forestCluster, grove, pond, flowerField, rockFormation
    coast.ts             # dock, boardwalk, shorelineDetail
    urban.ts             # streetCorner, lampRow, fenceYard, windmill
  encounters/
    tables.ts            # COAST_GRASS, MEADOW_GRASS, FOREST, CAVE, WATER_SURF, CITY_NIGHT
  npcs/                  # optional per-city rosters
  maps/
    coastal/  coastalCity.ts harborDistrict.ts lighthousePoint.ts route1CoastRoad.ts
              seabreezeCove.ts coastalWetlands.ts tidepoolFlats.ts gullRockIsle.ts
    heartland/ route2Meadowway.ts whisperwindMeadow.ts verdantForest.ts forestHollow.ts
               route3Riverside.ts oldStoneBridge.ts mistmereLake.ts route4Foothill.ts
               craggyHighlands.ts echoCaveEntrance.ts sunkenGrotto.ts route4bSwitchback.ts
    dusk/      route5DuskApproach.ts duskOutskirts.ts windmillFarms.ts duskWestGate.ts
               duskResidential.ts duskDowntown.ts duskNightMarket.ts duskIndustrial.ts
               duskRiversidePark.ts duskHeights.ts route6MetroFringe.ts duskDepot.ts

src/theme/themes/
  forestDay.ts           # new full theme
  duskOutskirts.ts       # new full theme
```

Each `maps/**/x.ts` exports `default` a `MapModule`. Consumers: `mapRegistry` (build), `MapRenderer`/`OverworldScene` (render), `regionAtlas` (thumbnails).

---

## 28. Migration Plan (game stays playable after every phase)

The order is chosen so the game never breaks:

1. **PHASE 0** adds optional fields + `pixelsPerTile` plumbing + theme-override resolution. Existing `world` map still runs, visuals identical.
2. **PHASE 1** adds the registry and makes `maps.ts` delegate to it, registering legacy `world`/`town`/`route1` as modules. Game still boots on `world`.
3. **PHASE 2–3** add authoring/prefabs and 2 new themes (no gameplay change).
4. **PHASE 4** builds the **playable spine** and flips `START_MAP_ID` to `coastal-city`; `world` stays registered as a safety net.
5. **PHASE 5–7** fill the remaining maps + connections + encounter data.
6. **PHASE 8–10** region atlas, seam verification, disposal/perf.
7. **PHASE 11** removes legacy `world`/`town`/`route1`.

---

## 29. Step-by-Step Implementation Phases

> After EVERY phase: `npx tsc --noEmit` and `npm run build` must both pass. Then do the phase's manual check.

### PHASE 0 — Non-breaking primitives

**Files to edit:** `src/data/mapTypes.ts`, `src/game/terrain/groundTexture.ts`, `src/game/scenes/MapRenderer.tsx`, `src/theme/index.ts`.
**Files to create:** `src/data/world/worldTypes.ts`.

**0.1** In `src/data/mapTypes.ts`, add a type-only import and new optional fields to `GameMap` (do NOT remove existing fields):

```ts
import type { Theme } from '../theme/types';
import type { EncounterZone } from './world/worldTypes';

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
```
Add inside `GameMap`:
```ts
  /** Ground texture pixels per micro-tile. Default 8. Must keep width*ppt<=4096. */
  pixelsPerTile?: number;
  /** Per-map partial theme patch, deep-merged onto the base theme at render. */
  themeOverride?: DeepPartial<Theme>;
  /** Inert encounter data (no battle logic yet). */
  encounterZones?: EncounterZone[];
  /** Region id, for the region atlas. */
  regionId?: string;
  /** Tile offset of this map within its region atlas. */
  layout?: { worldX: number; worldY: number };
```

**0.2** Create `src/data/world/worldTypes.ts` with `MapMeta`, `MapModule`, `EncounterEntry`, `EncounterZone` (copy from §13 and §22). Import `GameMap` and `PokemonSpeciesKey` as types.

**0.3** In `src/game/terrain/groundTexture.ts`:
- Add `import { TILE_SIZE } from '../../utils/constants';`
- Change `const PPT = 8;` to `let PPT = 8;`
- As the FIRST line inside `makeGroundTexture(mapData, theme)`, add: `PPT = mapData.pixelsPerTile ?? 8;`
- Replace `export const GROUND_PIXEL_SIZE = 0.125 / 8;` with:
  ```ts
  export function groundPixelSize(mapData: GameMap): number {
    return TILE_SIZE / (mapData.pixelsPerTile ?? 8);
  }
  ```
- Add dispose helpers at the end:
  ```ts
  export function disposeGroundTexture(name: string): void {
    for (const [k, v] of cache) if (k.endsWith('|' + name)) { v.dispose(); cache.delete(k); }
  }
  export function disposeWaterMask(name: string): void {
    const t = maskCache.get(name); if (t) { t.dispose(); maskCache.delete(name); }
  }
  ```

**0.4** In `src/game/scenes/MapRenderer.tsx`, change the import `GROUND_PIXEL_SIZE` → `groundPixelSize`, and the call `createTerrainMaterial(tex, theme, GROUND_PIXEL_SIZE)` → `createTerrainMaterial(tex, theme, groundPixelSize(mapData))`.

**0.5** In `src/game/terrain/heightfield.ts`, add:
```ts
export function disposeTerrain(name: string): void {
  const t = cache.get(name); if (t) { t.geometry.dispose(); cache.delete(name); }
}
```

**0.6** In `src/theme/index.ts`, add theme-override resolution:
```ts
import type { GameMap } from '../data/mapTypes';
import { resolveThemeId } from '../data/mapTypes';

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(patch)) return base;
  const out: Record<string, unknown> = Array.isArray(base) ? [...(base as unknown[])] as never : { ...(base as object) } as never;
  for (const k of Object.keys(patch)) {
    const bv = (out as Record<string, unknown>)[k];
    const pv = (patch as Record<string, unknown>)[k];
    out[k] = isObj(bv) && isObj(pv) ? deepMerge(bv, pv) : pv;   // arrays replaced wholesale
  }
  return out as T;
}

/** Full theme for a map: base (by id/region) + optional deep-merged override. */
export function resolveMapTheme(map: GameMap, playerX?: number): Theme {
  const base = getTheme(resolveThemeId(map, playerX));
  if (!map.themeOverride) return base;
  const merged = deepMerge(base, map.themeOverride);
  merged.id = `${base.id}#${map.name}`; // unique id so id-keyed caches don't collide
  return merged;
}
```

**0.7** In `src/game/scenes/OverworldScene.tsx`, replace:
```ts
const theme = getTheme(mapData ? resolveThemeId(mapData, playerX) : undefined);
```
with:
```ts
const theme = mapData ? resolveMapTheme(mapData, playerX) : getTheme(undefined);
```
and update the import to include `resolveMapTheme` from `../../theme` (remove now-unused `resolveThemeId` import if TS complains).

**PHASE 0 verification:** tsc + build pass. Launch the game: the existing `world` map looks **identical** to before (you changed no data yet).

---

### PHASE 1 — Registry + delegating `maps.ts`

**Create:** `src/data/world/worldTypes.ts` (done), `regions.ts` (§14), `connections.ts` (§16, with empty `CONNECTIONS = []`), `mapRegistry.ts` (§15), `registerAll.ts`.

**1.1** Wrap the legacy maps as modules in `registerAll.ts` so nothing breaks:
```ts
import { registerMapModule } from './mapRegistry';
import { worldMap } from '../worldMap';
import { townMap } from '../townMap';
import { route1Map } from '../route1Map';

function legacy(map: typeof worldMap): void {
  registerMapModule({
    meta: {
      id: map.name, name: map.name, regionId: 'legacy',
      width: map.width, height: map.height,
      pixelsPerTile: map.pixelsPerTile ?? 8,
      themeId: map.themeId ?? 'coastal-day',
      layout: { worldX: 0, worldY: 0 },
    },
    build: () => map,
  });
}
legacy(worldMap); legacy(townMap); legacy(route1Map);
// New map modules get registered here as they are created in later phases.
```
> Note: the legacy `worldMap` is 1200×800 → `1200*8=9600 > 4096` and `registerMapModule` will throw. To keep the game running this ONE phase, temporarily set `worldMap.pixelsPerTile = 3` (1200*3=3600 ≤ 4096) by adding `pixelsPerTile: 3` to the `worldMap` object in `src/data/worldMap.ts`. This is a stopgap; `world` is deleted in Phase 11.

**1.2** Replace the body of `src/data/maps.ts` with the delegating adapter from §15.

**PHASE 1 verification:** tsc + build pass. Game boots on `world` (now at ppt 3 — slightly blurrier ground, acceptable stopgap). Transitions to `town`/`route1` still work.

---

### PHASE 2 — Authoring utilities + prefabs

**Create** everything under `src/data/world/authoring/` and `src/data/world/prefabs/` (§23, §20). Implement each helper deterministically using the seeded `hash` pattern already in `src/data/maps/authoring.ts`.

**PHASE 2 verification:** tsc + build pass. (No runtime change yet — nothing imports these.) Add a temporary throwaway test import in `registerAll.ts` if you want to confirm they compile, then remove it.

---

### PHASE 3 — Two new themes

**Create** `src/theme/themes/forestDay.ts` and `src/theme/themes/duskOutskirts.ts` by copying `coastalDay.ts` / `duskCity.ts` and adjusting palette/lighting/sky/fog (forest = deeper desaturated greens, lower sun intensity ~1.2, denser fog; dusk-outskirts = dawn/dusk transitional between coastal-day and dusk-city). Register both in `src/theme/index.ts` with `registerTheme(...)`.

**PHASE 3 verification:** tsc + build pass. `listThemes()` returns 4 themes (temporarily log it, then remove the log).

---

### PHASE 4 — Playable spine (vertical slice) + flip start map

Build these **6 maps** as real `MapModule`s and connect them:
`coastal-city` → `route-1-coast-road` → `verdant-forest` → `old-stone-bridge` → `dusk-outskirts` → `dusk-downtown`.

**4.1** For each, create the file under `src/data/world/maps/...` using the **Map Module Template** (Appendix A). Use the exact size/ppt/theme from §5.2. Keep it modest but complete (terrain, a few prefabs, spawn, a few NPCs).
**4.2** Register each in `registerAll.ts`.
**4.3** Add the 5 `CONNECTIONS` entries linking them in order (§16 rules). For the spine, straight E↔W links are fine.
**4.4** In `src/state/gameStore.ts`, change `const START_MAP_ID = 'world';` → `'coastal-city'`.

**PHASE 4 verification:** tsc + build pass. Start game → you spawn in Coastal City. Walk east through all 6 maps and back. Each transition: correct spawn, walkable, correct theme, no cliff-drop, minimap renders.

---

### PHASE 5 — Fill Coral Coast (A2, A3, A5–A8) + connections

Build remaining coastal maps; connect per topology. Verify each.

### PHASE 6 — Fill Heartland (B1, B2, B4, B5, B7, B8, B9, B10, B11, B12) + connections

Build remaining natural maps (meadows, riverside, lake, foothills, highlands, hidden areas). Verify each.

### PHASE 7 — Fill Dusk Metro (C1, C3–C12) + connections + ALL encounter zones

Build remaining dusk maps; then add `encounterZones` to every wilderness map using tables from `encounters/tables.ts`. Cities get none.

**PHASE 5–7 verification (each):** tsc + build pass; walk every new connection both ways; confirm walkable spawns, correct themes/overrides, navigable corridors, bridges over all path-crossing water.

---

### PHASE 8 — Region atlas expanded map

Implement `regionAtlas.ts` (§25) and rewrite `ExpandedMap.tsx` to draw the current region's progressive atlas with the player marker. Populate `meta.layout` for every map so relative positions match §5.1.

**PHASE 8 verification:** open the map (click minimap / press M) in several maps; visited maps appear at correct relative positions; player marker correct; unvisited maps blank.

---

### PHASE 9 — Seam / collision verification pass

For every connection: confirm elevation 0 on both trigger + arrival cells; confirm arrival cell walkable; fix any spawn that lands on water/prop/cliff. Add a dev-only assertion helper that logs any connection whose arrival cell is blocked (remove before finishing).

**PHASE 9 verification:** no soft-locks; you can traverse the entire graph City↔Downtown and to every side area and back.

---

### PHASE 10 — Disposal + performance

**10.1** In `OverworldScene.tsx`, after a transition completes, compute the keep-set = current map + neighbors (maps referenced by `CONNECTIONS` touching current). Call `disposeMap(id)` for every loaded id not in the keep-set. (Add a `keepSetFor(mapId)` helper in `mapRegistry.ts`.)
**10.2** Confirm `disposeMap` frees terrain geometry, ground textures, water mask, and bitmap (it calls the Phase-0 dispose fns).
**10.3** Test on a mobile-sized viewport / throttled device: dense city stays ≥ 30 fps; memory doesn't grow unbounded as you traverse many maps.

**PHASE 10 verification:** tsc + build pass; traverse 10+ maps, confirm (via devtools memory) resident textures stay bounded.

---

### PHASE 11 — Retire legacy

**11.1** Remove `world`, `town`, `route1` registrations from `registerAll.ts`.
**11.2** Remove the temporary `pixelsPerTile: 3` stopgap.
**11.3** DELETE `src/data/worldMap.ts`, `src/data/townMap.ts`, `src/data/route1Map.ts`.
**11.4** Remove now-unused `MAP_TOWN`/`MAP_ROUTE1` from `constants.ts` if nothing references them (grep first).
**11.5** Ensure no import references the deleted files.

**PHASE 11 verification:** tsc + build pass; full playthrough of the region; no references to deleted maps.

---

## 30. Acceptance Criteria (all must be true at the end)

- [ ] ~30 maps registered; total tiles ≈ 9.57M (±5%).
- [ ] **No map violates `side * pixelsPerTile <= 4096`** (registry asserts this).
- [ ] Player walks the full spine `coastal-city ↔ dusk-downtown` through connected maps, both directions, no soft-locks.
- [ ] Every connection: arrival cell walkable, facing correct, elevation seam flat (0/0).
- [ ] Only current map renders; non-neighbor maps are disposed after travel (bounded memory).
- [ ] Minimap follows player; expanded region map shows visited maps at correct relative positions and fills in as you explore.
- [ ] 4 base themes total (`coastal-day`, `dusk-city`, `forest-day`, `dusk-outskirts`); overrides (beach/marsh/meadow/river/highland) apply per §5.2.
- [ ] `encounterZones` present on wilderness maps (inert; no battle logic added).
- [ ] Legacy `worldMap.ts` / `townMap.ts` / `route1Map.ts` deleted; no dangling imports.
- [ ] `npx tsc --noEmit` and `npm run build` both pass.
- [ ] Desktop 60 fps; mobile playable (≥ 30 fps) in dense city.

---

## 31. Future Extensibility (design only — do NOT build now)

- **Interiors:** door props → interior maps via the same `CONNECTIONS` system.
- **Day/night & weather:** swap or merge the theme by an in-game clock (theme system already supports it).
- **Surf / Cut / gates:** add a `tileTags` layer + interaction check; `EncounterZone.requiresTag` already anticipates it.
- **Quests/flags:** already available via `gameStore` (`flags`, `badges`, `inventory`).
- **More regions:** add a folder under `maps/`, a `Region` entry, map modules, and connections. No engine change.
- **Code-splitting:** convert `registerAll.ts` to dynamic `import()` per region if bundle size grows.

---

## 32. World Topology Diagram

(See §5.1 for the full ASCII graph.) Traversal spine for the vertical slice:

```
coastal-city --E--> route-1-coast-road --E--> verdant-forest --E-->
old-stone-bridge --E--> dusk-outskirts --E--> dusk-downtown
```

Region grouping: **Coral Coast (A*)** west, **Heartland Wilds (B*)** center, **Dusk Metro (C*)** east — themes shift coastal-day → forest-day/overrides → dusk-outskirts → dusk-city as you travel east, matching the world's dawn-to-dusk narrative.

---

## APPENDIX A — Map Module Template (COPY THIS for every new map)

Create `src/data/world/maps/<region>/<name>.ts`. Replace ALL-CAPS placeholders. **Never build arrays at top level — only inside `build()`.**

```ts
import type { GameMap, TileType, MapObject } from '../../../mapTypes';
import type { MapModule } from '../../worldTypes';
import { makeElevation, scatter, treeWall } from '../../../maps/authoring';
import { fillRect, curvePath, coastline } from '../../authoring/terrain';
// import prefabs as needed:
import { houseRow, plaza } from '../../prefabs/buildings';

const ID = 'MAP_ID';          // MUST match §5.2 exactly, e.g. 'coastal-city'
const W = 504;                 // §5.2 width
const H = 456;                 // §5.2 height
const PPT = 8;                 // §5.2 pixelsPerTile (W*PPT<=4096 and H*PPT<=4096)
const G: TileType = 'grass', P: TileType = 'path', Wt: TileType = 'water',
      D: TileType = 'dirt', S: TileType = 'sand';

function build(): GameMap {
  // 1) ground
  const ground: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => G));
  // ... use fillRect/curvePath/coastline/river/pond to author terrain ...

  // 2) elevation (optional; flat if omitted)
  const elevation = makeElevation(W, H, 0);
  // ... terraceEllipse / carveRamp / flattenRect as needed; keep connection seams flat ...

  // 3) objects (props) — prefer prefabs; keep deterministic seeds
  const objects: MapObject[] = [
    ...houseRow({ x: 40, y: 60, count: 3, gap: 60, size: 'small', seed: 11 }),
    // ...scatter({ table: ..., area: {...}, pitch: 7, density: 0.3, seed: 21, allow: (x,y)=>ground[y]?.[x]==='grass' }),
  ];

  // 4) npcs
  const npcPositions = [
    { x: 250, y: 300, name: 'Professor', dialogue: 'Route 1 is to the EAST!' },
  ];

  // 5) ambient overworld pokemon (optional)
  const pokemon = [{ species: 'pidgey' as const, gx: 120, gy: 90 }];

  return {
    name: ID, width: W, height: H, pixelsPerTile: PPT,
    themeId: 'coastal-day',            // §5.2 base theme
    // themeOverride: { palette: { sand: { base: '#...' } }, fog: { far: 28 } }, // if §5.2 lists an override
    regionId: 'coral-coast',           // §14
    layout: { worldX: 0, worldY: 0 },  // §25 (fill in Phase 8)
    ground, elevation, objects,
    spawn: { x: 250, y: 300, facing: 'down' },  // walkable + flat
    exits: [],                          // leave empty — connections.ts injects exits
    npcPositions, pokemon,
    // encounterZones: [...],           // Phase 7, wilderness only
  };
}

const mod: MapModule = {
  meta: { id: ID, name: ID, regionId: 'coral-coast', width: W, height: H,
          pixelsPerTile: PPT, themeId: 'coastal-day', layout: { worldX: 0, worldY: 0 } },
  build,
};
export default mod;
```

Register it in `src/data/world/registerAll.ts`:
```ts
import coastalCity from './maps/coastal/coastalCity';
registerMapModule(coastalCity);
```

---

## APPENDIX B — Per-Phase Command Checklist

Run after EVERY phase; both must exit 0:
```
npx tsc --noEmit
npm run build
```
Then the phase's manual walk-through. If red: fix before proceeding. Never advance on a broken build.

---

## APPENDIX C — Common Mistakes (do NOT do these)

- ❌ Building `ground`/`elevation`/`objects` at module top level. ✅ Only inside `build()`.
- ❌ `meta.name !== meta.id`. ✅ They must be identical (caches key on `GameMap.name`).
- ❌ A map where `width*pixelsPerTile > 4096` or `height*pixelsPerTile > 4096`. ✅ Respect §5.2.
- ❌ Authoring `exits` by hand in a map file. ✅ Use `CONNECTIONS`; exits are injected.
- ❌ Spawning on water/props/cliff. ✅ Spawn on flat, walkable `path`/`grass`.
- ❌ Sealing an exit corridor with a `treeWall` (no gate). ✅ Use the `gate` parameter.
- ❌ River/sea crossing a required path with no `bridge`. ✅ Always provide a bridge or detour.
- ❌ `Math.random()` in map data. ✅ Seeded helpers only.
- ❌ Creating a new full `Theme` for minor variation. ✅ Use `themeOverride`.
- ❌ Changing `TILE_SIZE`/`ELEVATION_STEP`/`WATER_DEPTH`/`TERRAIN_CELL`/`MAX_CLIMB_STEPS`.
