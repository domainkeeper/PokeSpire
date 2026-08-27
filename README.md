# PokéSpire 🎮⚡

PokéSpire is a modern, high-performance Pokémon-style RPG built with **React**, **Three.js / React Three Fiber (R3F)**, **TypeScript**, **Vite**, and **Zustand**. It features an immersive pseudo-3D pixel-art overworld, an advanced data ingestion pipeline powered by `@pkmn/dex` and PokeAPI, a custom particle/VFX shader system, and an innovative **"Momentum Clash"** action-tactical battle system.

---

## ✨ Key Features

- **Pseudo-3D Pixel-Art Overworld:** Multi-tiered terrain heights, dynamic lighting/shadows, custom dithered pixel shaders, animated environmental props, and smooth continuous 8-directional player movement.
- **Robust Pokémon Data Pipeline:** Complete ingestion facade (`PokemonDatabase`) covering 1025 species, 892 moves, 311 abilities, 533 items, 68 berries, and 48 mega evolutions via `@pkmn/dex` and PokeAPI CSVs.
- **Momentum Clash Battle Engine:** Modern action-tactical combat system combining:
  - **Speed Gauges (ATB 2.0):** Active-time meter filling based on effective Speed stats.
  - **Skillshot Aiming:** Precision bonus reticle aiming for active moves (`aimed: true`).
  - **Reactive Brace & Dodge:** Defensive timing window to mitigate or evade incoming attacks.
- **Advanced VFX & Camera Feedback System:** Instanced mesh particle swarms, proceduralNearestFilter textures (11 shapes), flipbook sprite atlases, shader beams, velocity-aligned trails, and camera micro-shakes/hit-stops.

---

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Interactive Demos & Routes
- **Overworld Game:** `http://localhost:5173/`
- **Battle VFX Demo:** `http://localhost:5173/#effects`
- **Momentum Clash Battle Demo:** `http://localhost:5173/#battle`

---

## 🛠️ Data Pipeline Commands

- `npm run data:sync` — Generate structured data and download missing sprites/cries.
- `npm run data:validate` — Validate 100% data integrity and asset completeness.
- `npm run vfx:sheets` — Procedurally generate pixel-art flipbook animation atlases.
- `npm run typecheck` — Run TypeScript type checking.
- `npm run build` — Compile TypeScript and bundle production build via Vite.

---

## 🏗️ Architecture & Tech Stack

- **Framework:** React 18 + TypeScript
- **3D Graphics:** Three.js & `@react-three/fiber` / `@react-three/drei` / `@react-three/postprocessing`
- **State Management:** Zustand
- **Data Layer:** `@pkmn/dex`, `@pkmn/data`, PokeAPI assets
- **Styling:** CSS-in-JS / inline styles with nearest-neighbor retro pixel fidelity
