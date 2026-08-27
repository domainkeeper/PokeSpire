# solution.md — Elevation Glitch + Water Visual Fix

## 1. Overview

Two independent issues in the PokeSpire overworld (React Three Fiber / Three.js 0.185):

1. **Elevation areas are glitchy** — terrace/cliff edges show thin pale-teal
   "see-through" seams where the camera-facing cliff wall is missing, exposing
   the fog/background (or terrain behind). Confirmed as see-through gaps at
   cliff edges.
2. **Water looks bad** — the animated water surface renders as a heavy dark-teal
   checkerboard of blocky pixels instead of calm coastal water.

Intended outcome: cliff/bank walls render solid from the play camera (no
seams), and water reads as gentle coastal water in the same palette — both with
the smallest, least invasive change and **no gameplay/behavior change**.

---

## 2. Elevation Area Investigation

### Current Implementation
- `src/game/terrain/heightfield.ts` `buildTerrain()` builds a terraced
  heightfield. Elevation is authored per micro-tile (`mapData.elevation`) and
  downsampled to `TERRAIN_CELL = 2` cells: elevation uses MAX, water uses OR
  (heightfield.ts:70-88).
- Each cell emits its own flat **top** quad (heightfield.ts:166-185).
- Where a neighbouring cell is lower, a vertical **skirt** quad is emitted to
  close the gap — "those skirts ARE the cliff/bank faces" (heightfield.ts:187-223).
- Skirts are tagged `faceKind = 1`; `terrainMaterial.ts` injects a shader that
  tints `faceKind > 0.5` fragments with the theme cliff ramp (terrainMaterial.ts:45-65).
- Terrain material: `new THREE.MeshStandardMaterial({ map, roughness: 0.92,
  metalness: 0 })` — default `side: THREE.FrontSide` (terrainMaterial.ts:16-21).
- Camera: `FollowCamera` sits at `(x, CAMERA_HEIGHT, z + CAMERA_DISTANCE)` and
  looks at `(x, 0, z − CAMERA_DISTANCE)` → **view direction is −z**
  (FollowCamera.tsx:20,34).

### Observed Problem
At the camera-facing edges of terraces/cliffs (and water banks), the vertical
wall is not drawn. The viewer sees through the terrace edge to the fog/background
(`fog #a8ccc4`, `background #6ea8a8`) or the terrain behind it, appearing as thin
pale-teal seams that trace elevation boundaries with right-angle steps.

### Root Cause
The skirt quads are wound with the **opposite orientation to their outward
normal**. In `buildTerrain`, each skirt pushes vertices in the order
`[topA, bottomA, bottomB, topB]` (heightfield.ts:208-220) through `pushQuad`,
whose index pattern is `(0,1,2, 0,2,3)` (heightfield.ts:152-157).

Computing the geometric (winding) normal for each edge direction shows it points
**inward** — opposite the outward `normal` attribute stored on the vertices:
- +z ("south") skirt: winding normal = −z, attribute normal = +z
- −z, +x, −x skirts: same inversion
- **Top** quads are wound correctly (winding normal = +y), which is why tops and
  the ground texture look fine.

With the material's default `THREE.FrontSide` culling and a **−z** camera view
direction, the cliff faces that point toward the camera (the +z / +x-facing
walls) are exactly the ones that get **back-face culled** → not rasterized → the
viewer sees straight through the terrace edge. That is the glitch.

Relevant references:
- `src/game/terrain/heightfield.ts:196-223` (skirt edges + emission)
- `src/game/terrain/heightfield.ts:133-158` (`pushQuad` vertex/index order)
- `src/game/terrain/terrainMaterial.ts:16-21` (material `side`)
- `src/game/entities/FollowCamera.tsx:20,34` (−z view direction)

### Minimal Solution (recommended)
In `createTerrainMaterial` (terrainMaterial.ts), add `side: THREE.DoubleSide` to
the `MeshStandardMaterial` options:

```ts
const mat = new THREE.MeshStandardMaterial({
  map,
  roughness: 0.92,
  metalness: 0,
  side: THREE.DoubleSide,
});
```

Why this is the smallest safe change:
- Both faces of every terrain triangle now rasterize, so the inward-wound skirts
  are no longer culled and cliff/bank walls render solid from the play camera.
- Lighting/shading is unchanged: Three uses the (already outward-correct)
  `normal` attribute for lighting; the cliff-ramp shader keys off `faceKind` and
  `vWorldY`, neither affected by `side`.
- Terrain is a single static mesh; the extra back-face overdraw is negligible.

**Alternative (only if preserving back-face culling is preferred):** reverse the
skirt winding in `heightfield.ts` so front faces point outward — emit skirt
vertices as `[topA, topB, bottomB, bottomA]` (or reverse the two skirt triangles'
index order) **for skirts only**; leave the top-quad winding untouched. This
avoids double-sided overdraw but touches geometry code.

### Edge Cases
- Map-edge skirts (`nyRaw === -Infinity`, bottom = `minY − ELEVATION_STEP*4`,
  heightfield.ts:207): rendering both sides is harmless — they sit below the
  world and stay hidden.
- Water-basin walls are also skirts; DoubleSide makes them solid from all angles
  too (improves shoreline banks — desirable).
- Terrain mesh has `receiveShadow` only (no `castShadow`), so DoubleSide
  introduces no shadow-acne concern here.

### Things NOT to Change
- Do not change `TERRAIN_CELL`, elevation authoring/`makeElevationLayer`,
  `MAX_CLIMB_STEPS`, or collision in `gridUtils.ts`.
- Do not change `WATER_DEPTH` / `WATER_SURFACE_DEPTH` or `heightAt` (props, NPCs,
  Pokémon are grounded via it).
- Do not alter the cliff shader injection, `faceKind`, or top-quad generation.
- Do not edit map data.

---

## 3. Water Investigation

### Current Implementation
- `src/game/entities/WaterPlane.tsx`: one animated plane for the whole map at
  `y = −WATER_SURFACE_DEPTH`, shaped by a per-tile 0/1 alpha mask
  (`buildWaterMask`, groundTexture.ts:249-280). Four frames from
  `makeWaterFrame` swap at `FPS = 2.5`.
- Material: `MeshStandardMaterial` with `map` = frame, `alphaMap` = mask,
  `transparent`, `alphaTest 0.5`, `opacity = theme.water.opacity` (coastalDay
  0.9), `depthWrite = false`, `roughness 0.22`, `metalness 0.14`,
  `color = theme.water.tint` (coastalDay `#ffffff`) — WaterPlane.tsx:110-135.
- `makeWaterFrame` (WaterPlane.tsx:20-56): a 16×16 canvas using 5 discrete
  palette bands (`theme.palette.waterSurface`), band index chosen by a coarse
  hash `wave()`, plus drifting crest rows and one sparkle. `toPixelTexture`
  applies NearestFilter. Tiled with `repeat = worldSize / WATER_TEX_SCALE`,
  `WATER_TEX_SCALE = 1.5` (WaterPlane.tsx:11, 94).

### Current Visual Problem
The surface reads as a heavy dark-teal checkerboard:
- Only 5 discrete bands selected by a low-frequency hash create large uniform
  blobs.
- The 16px pattern is stretched over ~1.5 world units (~12 micro-tiles) per
  repeat, so each blob is large on screen.
- The two darkest bands dominate wide areas → chunky, high-contrast "pixel soup"
  rather than calm coastal water.

### Desired Visual Direction
Keep the existing coastal-teal palette (`theme.palette.waterSurface`) and the
pixel-art aesthetic, but make the surface read as gentle, cohesive water: finer
directional ripple lines, a lighter overall bias (dark bands used sparingly as
shadow accents, not fields), and soft moving highlights. Same water, cleaner —
**not** a new art direction.

### Minimal Visual Solution
Edit **only** `src/game/entities/WaterPlane.tsx`:

1. Rework the pattern in `makeWaterFrame`:
   - Bias band selection toward `base`/`light`; use `darkest`/`dark` only for
     thin ripple shadows so dark blocks stop dominating.
   - Replace the blocky modulo hash with a smoother, higher-frequency ripple
     (e.g. sum of two sine waves along a diagonal) so ripples read as water
     lines, not random blocks. Keep it deterministic per (x, y, frame).
   - Keep drifting crest highlights but thinner/softer.
   - Optionally raise the internal canvas to 32×32 for finer detail while
     keeping NearestFilter (preserves the pixel look).
2. Reduce texel stretch by lowering `WATER_TEX_SCALE` (WaterPlane.tsx:11) from
   `1.5` toward ~`0.7` so each repeat covers fewer world units (smaller ripples
   on screen). Tune to taste.

Leave unchanged: `FRAME_COUNT`/`FPS`, plane geometry/position, `buildWaterMask`,
`alphaTest`, `transparent`, `depthWrite = false`, `opacity`, `color`/tint,
`roughness`/`metalness`, and per-theme frame caching. (Opacity/tint may be
nudged only if strictly needed for the look; default is to leave them.)

### Things NOT to Change
This is a **visual-only** change. Do not alter collision (water still blocks via
`BLOCKING_TILES` in gridUtils.ts), player/water physics, the heightfield water
sinking (`WATER_DEPTH`), the surface height (`WATER_SURFACE_DEPTH`), map
generation, elevation, or any interaction/gameplay logic.

---

## 4. Files to Modify

1. **`src/game/terrain/terrainMaterial.ts`** — add `side: THREE.DoubleSide` to
   the terrain `MeshStandardMaterial`. Fixes the culled camera-facing cliff walls
   (the elevation seams).
   - *Alternative path only if choosing winding-reversal:*
     `src/game/terrain/heightfield.ts` skirt loop (reverse skirt vertex order).
2. **`src/game/entities/WaterPlane.tsx`** — rework `makeWaterFrame` pattern and
   optionally lower `WATER_TEX_SCALE`. Fixes the blocky checkerboard water.

No other files (no map, config, collision, or constants changes required).

---

## 5. Implementation Order
1. Fix elevation: add `side: THREE.DoubleSide` in `terrainMaterial.ts`.
2. Verify elevation (see §6).
3. Implement water visual rework in `WaterPlane.tsx`.
4. Verify water (see §6).
5. Stop.

---

## 6. Validation Plan

### Elevation
- Run `npm run dev`. Walk to terraced hills: Route 1 west highland (~gx 42,
  gy 90), east plateau (~356, 190); Town commercial rise (~248, 58).
- Confirm camera-facing terrace/cliff walls are **opaque** — no fog/background
  bleed, no see-through seams — including step-down edges and water-basin banks.
- Confirm tops, ground texture, cliff-ramp tint, and climbable ramps look the
  same as before.

### Water
- View Route 1 lakes and the SE stream; Town river and ponds.
- Confirm no large dark checkerboard blocks; ripples read as water; animation
  cycles smoothly; edges stay crisp (alphaTest); water stays semi-transparent
  over the bed.

### Regression (must remain unchanged)
- Player movement, wall sliding, water blocking, and cliff blocking
  (`MAX_CLIMB_STEPS`) unchanged.
- Map transitions (town ↔ route1) still work.
- Props/NPCs/Pokémon still sit correctly on terraces (`terrain.heightAt`).
- `npm run typecheck` and `npm run build` pass.

---

## 7. Scope Boundary

**This task has exactly two objectives:**
1. Fix the elevation-area glitch (culled cliff walls).
2. Improve the visual appearance of water.

The implementation agent must not fix unrelated bugs, refactor unrelated code,
redesign existing systems, modify gameplay, or make additional visual
improvements.