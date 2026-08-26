# Architecture — PokéSpire

## Overview

PokéSpire is a retro-inspired monster-catching RPG with a stylized, chunky, semi-3D "diorama" visual style. The game combines real 3D geometry, toon/cel shading, tilted-down camera, depth-of-field, and bloom to create a miniature-diorama feel.

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **UI Shell** | React 18 + TypeScript | Menus, HUD, dialogue, Pokédex, trainer card, battle commands |
| **3D Renderer** | Three.js via react-three-fiber (R3F) | World rendering, creatures, camera, animation, postprocessing |
| **Helpers** | @react-three/drei | Camera controls, environment, model loaders |
| **Postprocessing** | @react-three/postprocessing | DepthOfField, Bloom, Vignette |
| **State** | Zustand | Shared game state between React UI and R3F 3D scenes |
| **Persistence** | localStorage | Save/load game state |
| **Build** | Vite | Dev server + production bundle |
| **Android** | Capacitor | Web → Native wrapper (Day 5) |

## Rendering Architecture

```
┌─────────────────────────────────────────────┐
│                 React (TS)                    │
│  Application shell, screen routing:           │
│   - TitleScreen                               │
│   - OverworldHud                              │
│   - BattleHud                                 │
│   - PokedexScreen                             │
│   - TrainerCardScreen                         │
│   - PartyMenu, Inventory                      │
│   - DialogueBox                               │
│   - Settings, Save UI                         │
│                                                │
│  All UI is DOM/CSS, absolutely positioned     │
│  over the 3D canvas.                          │
└───────────────┬───────────────────────────────┘
                │ Zustand store + EventBus
                ▼
┌─────────────────────────────────────────────┐
│   <Canvas> (react-three-fiber / Three.js)     │
│  3D world and battle rendering:               │
│   - OverworldScene (ground, props, player)    │
│   - BattleScene (arena, creatures, fx)        │
│   - Toon-shaded materials (MeshToonMaterial)  │
│   - Angled follow-camera (drei)               │
│   - Procedural animation (useFrame)           │
│   - Postprocessing: DoF, Bloom, Vignette      │
│   - Particle effects                          │
└─────────────────────────────────────────────┘
```

## File Structure

```
src/
  main.tsx                          React root
  App.tsx                           Top-level screen router

  game/
    GameCanvas.tsx                  <Canvas> wrapper (R3F)
    eventBus.ts                     Typed event emitter (renderer-agnostic)
    scenes/
      OverworldScene.tsx            3D world scene
      BattleScene.tsx               3D battle scene (Day 3)
    entities/
      Player.tsx                    Player 3D model + movement
      CreatureModel.tsx             Generic creature model wrapper
    systems/
      movement.ts                   Grid-based movement (pure logic)
      encounter.ts                  Random encounter logic (pure logic)
      damage.ts                     Damage formula (pure function)
      capture.ts                    Catch chance formula (pure function)
    fx/
      Postprocessing.tsx            DepthOfField + Bloom + Vignette

  state/
    gameStore.ts                    Zustand store (SaveGame shape)
    persistence.ts                  localStorage save/load

  data/
    species.json                    Static Pokémon species data
    moves.json                      Static move definitions
    types.json                      Type effectiveness chart
    trainers.json                   Trainer party definitions
    maps/
      town.json                     Town grid data
      route1.json                   Route 1 grid data

  ui/
    components/
      Panel.tsx                     Reusable panel component
      HpBar.tsx                     HP bar component
      DialogueBox.tsx               Typewriter dialogue
      Button.tsx                    Styled button
    screens/
      TitleScreen.tsx               Title/menu screen
      OverworldHud.tsx              Overworld HUD overlay
      BattleHud.tsx                 Battle command UI
      PokedexScreen.tsx             Pokédex screen
      TrainerCardScreen.tsx         Trainer card
      PartyMenu.tsx                 Party management

  types/
    game.ts                         TypeScript interfaces

  utils/
    random.ts                       Random number utilities
    typeChart.ts                    Type effectiveness lookup
    constants.ts                    Game constants

public/
  assets/
    characters/                     Kenney character models (GLB)
    creatures/                      Primitive creature models
    environment/                    Kenney nature kit models (GLB)
    ui/                             UI assets
    audio/                          SFX (Kenney CC0)
    fonts/                          Press Start 2P
```

## Key Design Principles

### Renderer-Agnostic Game Logic

All gameplay systems (movement, encounter, damage, capture) are pure functions that do not depend on React, Three.js, or R3F. The rendering layer consumes the results of these systems. This separation means:

- Game logic is testable independently
- The rendering engine can be swapped without changing gameplay
- State flows through Zustand, accessible from both React and R3F

### Grid Logic in 3D

Internal world logic uses a simple 2D grid:
- Logical: `x = 5, y = 8`
- Rendered: Three.js X = 5, Z = 8, Y = ground height

This preserves simple RPG logic while providing 3D presentation.

### Procedural Animation

All creature and environment animation is procedural, using `useFrame` for:
- Idle breathing/bobbing
- Walk cycle (simple bob + tilt)
- Attack lunge
- Hit flash + camera shake
- Faint (move down + fade)
- Catch arc + particle burst

No hand-authored animation clips are required for the MVP.

### Toon Shading

Uses Three.js built-in `MeshToonMaterial` with small gradient-map textures (4x1px canvas-generated) for cel-shaded color bands. No custom shaders.

### Postprocessing Stack

- **DepthOfField**: Tilt-shift blur creating miniature diorama feel
- **Bloom**: Bright highlight glow for candy-colored feel
- **Vignette**: Subtle edge darkening for focus

All effects are from `@react-three/postprocessing` with no custom GLSL.

## State Architecture

### Static Data (never mutated)
- `species.json` — Pokémon species definitions
- `moves.json` — Move definitions
- `types.json` — Type chart
- `trainers.json` — Trainer parties

### Mutable State (Zustand store)
- Player position, facing, current map
- Party (species, level, HP, moves)
- Pokédex (seen/caught status)
- Inventory
- Money, badges, progress flags

### Persistence
- Single JSON blob to `localStorage`
- Versioned for migration safety
- Save/load on explicit action and map transitions

## Event Bus

A simple typed event emitter bridges React and R3F without direct imports:
- `battle:start`, `battle:end`
- `encounter:triggered`
- `dialogue:show`, `dialogue:hide`
- `map:transition`
- `player:moved`

## Asset Strategy

### CC0 / Open Source
- **Kenney Character Assets** — Player + NPC models (CC0)
- **Kenney Nature Kit** — Trees, rocks, fences, environment (CC0)
- **Press Start 2P** — Display font (OFL 1.1)
- **Kenney Audio** — SFX (CC0)

### Private Prototype Only
- **PokéAPI data** — Species/move/type data (BSD-3-Clause for compilation; Nintendo IP for characters)
- **Creature models** — Original primitive-based compositions (not ripped models)

### Legal
- Keep private/portfolio, not published commercially
- Species names/stats from PokéAPI data
- Creature visuals are original primitive compositions
- If ever open-sourced, swap creature data for original designs

## Android Packaging (Day 5)

```
Vite build → dist/ → Capacitor → Android project → Android Studio → APK
```

Capacitor wraps the web build regardless of WebGL canvas. No change to rendering architecture.

## Performance Considerations

- Keep polygon counts low (primitive-composed models)
- Keep textures small
- Keep scene sizes small (2 maps only)
- Postprocessing limited to 3 effects
- Particle counts low
- Model complexity low

### Low-Power Mode (future)
Postprocessing (DepthOfField, Bloom) can be disabled behind a toggle without rewriting the renderer.
