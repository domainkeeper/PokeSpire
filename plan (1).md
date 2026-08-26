# PLAN.md — Retro Pokémon-Style RPG Vertical Slice
**Status:** Planning document only. No application code has been written yet.
**Time budget:** 3–5 days.
**Audience:** This document is the implementation spec for an AI coding agent (and human supervisor). It contains verified research (marked `[VERIFIED]` with source URLs) and architectural recommendations (marked `[RECOMMENDATION]`). Do not treat recommendations as facts; treat verified items as facts as of the research date (Aug 2026).

---

## 0. EXECUTIVE SUMMARY

**Recommended stack:** Phaser 3 (game world/battle rendering) + React + TypeScript (UI shell: menus, HUD, Pokédex, trainer card, dialogue) + Vite (build) + Zustand (state bridge) + localStorage/IndexedDB (save) + Capacitor (Android packaging). **No backend for the MVP.** Pokémon data comes from a locally-cached, trimmed subset of PokéAPI data (10 species) bundled as static JSON — not a live API call at runtime. Sprites come from the PokeAPI/sprites CC0-licensed mirror of community-compiled sprite sheets (see legal caveat in §2). World/character/tile art comes from Kenney.nl CC0 packs, NOT from actual Pokémon-game tile rippers, to keep the *original IP* (world, town, characters) clean, while accepting that Pokémon *character sprites themselves* are unavoidably Nintendo/Game Freak IP no matter the source, and this project is a private/portfolio prototype, not a redistributable open-source product built on that IP (see §2 for the exact legal line).

The single biggest risk is not technology — it's scope. This plan is built around a deliberately tiny, brutally-cut vertical slice: **1 town + 1 route + 1 grass patch, 6 catchable species, 8 moves, 1 rival/NPC battle, catch-or-faint loop, Pokédex, trainer card, save/load, web + Android build.**

---

## 1. VERIFIED RESEARCH FINDINGS

### 1.1 Pokémon data

- **PokéAPI** (`https://pokeapi.co/`, repo `https://github.com/pokeapi/pokeapi`) — `[VERIFIED]` Free, open-source RESTful API for Pokémon species/moves/types/abilities/evolution data. License: **BSD-3-Clause** (`https://github.com/PokeAPI/pokeapi/blob/master/LICENSE.md`). This license covers the **code and data compilation**, not Nintendo's underlying IP in names/character designs (see §2).
- **PokeAPI/api-data** (`https://github.com/PokeAPI/api-data`) — `[VERIFIED]` Static JSON dump of the entire API + JSON Schema, license BSD-3-Clause. This is directly usable without running a server — clone/download the JSON for the ~10 species we need and bundle it in the repo. This avoids any runtime network dependency and rate-limit risk.
- **pokeapi-js-wrapper** (`https://github.com/PokeAPI/pokeapi-js-wrapper`) — `[VERIFIED]` official async JS wrapper with built-in caching, MPL-2.0 license. Optional; not needed if we bundle static JSON.

### 1.2 Sprites

- **PokeAPI/sprites** (`https://github.com/PokeAPI/sprites`) — `[VERIFIED]` Contains front/back/shiny/animated (Gen II "Crystal" animated GIFs) sprites for every generation, plus Pokémon Showdown-style animated GIFs, official artwork PNGs, and Dream World SVGs. The repo's own `LICENCE.txt` is a **CC0 1.0 public domain dedication** (`https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt`). The README credits dozens of community spriters (leParagon, Blaquaza, etc.) who originally compiled/ripped these from the games via Smogon community efforts.
- **`[LEGAL NOTE]`** CC0 here applies to *the compilation/redistribution effort* by the PokeAPI maintainers and contributing spriters, not to Nintendo/Game Freak/Creatures Inc.'s underlying copyright and trademark in the character designs themselves. These are still, factually, ripped/traced sprites of copyrighted characters. Practically: this is the de facto standard resource the entire fan-game/hobbyist ecosystem uses, it's what a PokéAPI-based hobby project is "supposed" to use, and it is appropriate for a **private prototype / portfolio piece that is not sold, not publicly distributed as a product, and not claiming Nintendo affiliation.** It is **not safe** to publish this as a monetized app, submit to app stores under a Pokémon-adjacent name, or claim redistribution rights to others. This entire category falls in **Legal Category D** (see §2).
- **npm mirror**: `pokeapi-sprites` (unpkg CDN, e.g. `https://unpkg.com/pokeapi-sprites@2.0.4/...`) — `[VERIFIED]` exists as a fork publishing the same sprites to npm/unpkg for direct CDN use.

### 1.3 Non-Pokémon art assets (tiles, UI, characters, audio) — CC0, safe for any use including commercial

- **Kenney.nl** (`https://kenney.nl/assets`) — `[VERIFIED]` All assets CC0 1.0 Universal, explicitly confirmed at `https://kenney.nl/support`: *"Yes, all game assets... are public domain licensed (CC0). You're free to use them, even in commercial projects."* No attribution required (but appreciated).
  - **RPG Urban Pack** — `https://kenney.nl/assets/rpg-urban-pack` — 480 tiles: buildings, vehicles, road tiles, 6 walking characters (4-directional). CC0. Directly usable for the town map.
  - **Roguelike/RPG Pack** — `https://kenney.nl/assets/roguelike-rpg-pack` — 1700 tiles, top-down 16×16-ish icons/tiles (terrain, objects, characters). CC0. Good for route/grass/tree/rock tiles.
  - **Map Pack** — `https://kenney.nl/assets/map-pack` — 180 assets, simple overworld-style tiles. CC0.
  - **RPG Audio** — `https://kenney.nl/assets/rpg-audio` — 50 RPG SFX (also mirrored on OpenGameArt: `https://opengameart.org/content/50-rpg-sound-effects`). CC0.
  - **Interface Sounds** (`https://kenney.nl/assets/interface-sounds`, 100 SFX) and **Impact Sounds** (`https://kenney.nl/assets/impact-sounds`, 130 SFX) — CC0. Good for battle hit/menu-blip SFX.
  - **Digital Audio** — `https://kenney.nl/assets/digital-audio` (60 assets) — CC0, retro bleep/bloop SFX, great for menu/UI blips and battle cues.
- **OpenGameArt "All CC0 – Uploader: Kenney"** collection page — `https://opengameart.org/content/all-cc0-uploader-kenney` — `[VERIFIED]` aggregates the above plus UI packs, particle packs, fonts.
- **itch.io CC0 tag pages** — `[VERIFIED]` exist and are actively curated:
  - `https://itch.io/game-assets/assets-cc0/tag-tileset`
  - `https://itch.io/game-assets/assets-cc0/tag-pixel-art`
  - Individual notable pack: **"RPG Asset Pack" by MurphysDad** (`https://murphysdad.itch.io/rpg-asset-pack`) — CC0, wooded interior tileset, building tileset, player spritesheet, "blob monster" spritesheet (usable as a generic wild-creature placeholder), static NPCs, trees. Small (61 KB), good supplemental pack.
- **`[CAUTION]`** Very popular top-down RPG packs like "Sprout Lands," "Cute Fantasy," and "Tiny Farm RPG" that show up in searches are **NOT CC0** — most are itch.io "pay-what-you-want" packs under custom licenses that typically permit use in commercial games but *forbid redistribution of the raw asset files* and sometimes restrict re-selling asset packs. Do not assume itch.io "free" tag == redistribution-safe; always check the specific license tab on the asset's page before use. For this project, default to **Kenney (unambiguous CC0)** as the primary tile/character source and only reach for other itch.io packs if their license page is explicitly checked and confirmed compatible.

### 1.4 Fonts

- **Press Start 2P** — `[VERIFIED]` Google Fonts (`https://fonts.google.com/specimen/Press+Start+2P`), designed by CodeMan38, released 2012. License: **SIL Open Font License 1.1 (OFL)**. Free for personal and commercial use, may be modified and redistributed/bundled, no fee. This is the standard "retro pixel font" and is legally clean. Available via `npm i @expo-google-fonts/press-start-2p` (for Expo/React Native context) or simply self-hosted `.ttf`/`.woff2` from Google Fonts CDN (`https://fonts.googleapis.com/css2?family=Press+Start+2P`) for the web build.
- **`[RECOMMENDATION]`** Use Press Start 2P sparingly (titles, HUD numbers, short labels) — it is a display face, not meant for paragraphs of dialogue text (readability is poor at length). Pair with a more readable pixel-style body font (e.g., "Silkscreen" or a monospace fallback) for dialogue boxes if time allows; otherwise a clean sans-serif with pixel-art image-rendering CSS trick is an acceptable fallback for dialogue.

### 1.5 Engine comparison (verified via multiple 2025/2026 sources)

`[VERIFIED via generalistprogrammer.com, codersera.com, openreplay.com, Shirajuki/js-game-rendering-benchmark, saashub.com]`

| Engine | What it is | Bundle size | Tilemap/Tiled support | Learning curve | Verdict for us |
|---|---|---|---|---|---|
| **Phaser 3/4** | Full 2D game framework (its own renderer + physics + audio + input + tweens + camera fx + tilemaps) | ~400–500KB | First-class Tiled JSON integration, multi-layer, collision | Moderate — but huge docs/examples/community, "the default for 2D games" | **Chosen.** Ships everything we need out of the box: camera shake/flash/fade, tweens, sprite-sheet animation, particle emitters, Arcade physics for collision — precisely the "convincing without hand-animating everything" toolkit the brief calls for. |
| **PixiJS** | Pure rendering library, no game concepts (no physics, no scenes, no tilemap, no audio) | ~1/3 of Phaser | None built-in — must hand-roll or add a 3rd-party tilemap lib | Low-to-moderate for rendering, but **high overall** because you build the game layer yourself | Rejected as primary: would require reinventing scene mgmt, collision, tilemaps — too slow for 3–5 days. |
| **Kaboom/Kaplay** | Declarative, beginner-friendly, "few lines to get a character moving" | ~100KB | Basic, less mature than Phaser's Tiled pipeline | **Lowest** learning curve, but weakest raw performance in the linked benchmark (`Shirajuki/js-game-rendering-benchmark`, notably worst FPS in stress test — acceptable for a small game though) | Reasonable fallback if Phaser proves too fiddly on Day 1, but Phaser's asset/animation/camera-fx toolkit is more directly reusable for a Pokémon-style game (battle transitions, camera shake, particle hit-fx). |
| **melonJS** | Lightweight engine, bundles physics + Tiled tilemaps + ECS | Small | Good, Tiled-native | Moderate | Viable alternative; smaller community/less AI-agent training data than Phaser, so **higher risk that an AI coding agent writes subtly wrong code** due to less exposure in training corpora. |
| **Excalibur.js** | TypeScript-first actor/scene engine | Moderate | Present | Moderate, but strongly typed, less "magic" | Good but smaller ecosystem than Phaser; less battle-tested tutorials for Pokémon-style tile RPGs specifically. |
| **React + DOM/CSS only** | No canvas engine at all | N/A | Manual (CSS grid/absolute positioning) | Low for basic movement, **very high** for camera, animation timing, and pixel-perfect collision at any real map size | Rejected as primary renderer — fine for menus/HUD (see architecture), bad for a scrolling tile world with 60fps movement and hit-flash/shake effects. |

**`[RECOMMENDATION]` Final choice: Phaser 3 (via the official `phaser` npm package) for the game world and battle scene rendering, wrapped by a React shell for everything else.** Reasoning: Phaser is explicitly the framework most training data and tutorials exist for (meaning an AI coding agent is statistically most likely to produce correct code on the first pass), it has first-class Tiled tilemap support (we need exactly one small hand-made or Tiled-exported map), and it ships camera shake/flash, tweens, and particle emitters natively — which is exactly the "lively without hand-animating everything" toolkit called for. The "developer has little Phaser knowledge" concern is mitigated because (a) the AI coding agent — not the human — writes the Phaser code, and (b) we constrain Phaser usage to a narrow, well-documented subset: `Scene`, `Tilemap`, `Sprite`, `Arcade Physics` (AABB only, no complex physics), `Tweens`, `Cameras.main.shake/flash/fade`, `Particles`. We do **not** touch Phaser's Matter physics, plugins system, or 3D.

### 1.6 Mobile / Android packaging

`[VERIFIED via scanbot.io, mobiloud.com, nextnative.dev, moldstud.com]`

- **Capacitor** (Ionic team, successor to Cordova) — modern, gives native project access (Android Studio project you can open directly), full WebView API access (IndexedDB, WebAssembly), directly wraps a static web build (Vite's `dist/` output) into a native Android shell that produces a real installable APK/AAB. Actively maintained, ~70% of new cross-platform web-to-native projects in 2024–25 per Ionic's own reporting (cited via moldstud.com), integrates cleanly with React projects.
- **Cordova** — older, plugin-bridge architecture, worse WebView performance, larger memory footprint, still viable but has no advantage over Capacitor for a fresh project.
- **Bubblewrap / Trusted Web Activity (TWA)** — Google's tool, wraps a PWA into a thin APK using the installed Chrome; smallest APK size (~5MB vs Capacitor's 15–20MB) but Android-only and requires the PWA to be hosted and reachable (a TWA is a shell around a live URL, not a fully bundled offline app) — less appropriate if we want the game fully offline-capable and store-submittable without depending on a hosted URL surviving.
- **`[RECOMMENDATION]`** Use **Capacitor**: `npm install @capacitor/core @capacitor/cli`, `npx cap init`, `npx cap add android`, then `npx cap copy` after each `vite build`, open in Android Studio to produce a signed APK. This is a **Day 5, few-hours task**, not a parallel workstream — do not let it touch Days 1–4.

### 1.7 Existing open-source reference projects (for architectural patterns, NOT for asset harvesting)

`[VERIFIED — exist on GitHub as of research date]`
- `https://github.com/boxerbomb/PokemonClone` — Phaser + Tiled JSON tilemaps, 3-layer map convention (objects/blocked/background), custom Tiled object properties for encounter zones (`type: encounterZone`, `zoneType: grass|water|cave`) and player-start markers — **directly reusable pattern** for our Tiled map setup.
- `https://github.com/konato-debug/pokemon-phaser` — simple Phaser 3 Pokémon-inspired game, playable reference for scope-sizing ("simple" is achievable).
- `https://github.com/khaifahmi99/pokemon-phaser` — Phaser + React combination, confirms the React+Phaser pairing is a known, working pattern (not a novel risky combination).
- `https://github.com/ariroffe/personal-website` — Phaser 3 Pokémon-*style* (not Pokémon-branded) game; explicitly documents sourcing "public domain" tiles from OpenGameArt/PokeFans and using the "Pixel Operator" pixel font — a good model of **exactly the legal hygiene we want**: original tile/world assets from open sources, credits file included, never claiming Nintendo affiliation.
- `https://github.com/yandeu/phaser-project-template-es6` and the TypeScript variant `https://github.com/ourcade/phaser3-typescript-parcel-template` — minimal Phaser+TS starter templates confirming a lightweight boilerplate pattern exists (we'll use Vite instead of Parcel/webpack, but the `src/scenes/` structure is the standard convention worth following).

---

## 2. LICENSE / LEGAL AUDIT

This is the single most important section for a project literally about "Pokémon." Read carefully.

### 2.A Clearly permissive / open-source (safe for any use, including commercial, without restriction)
- Kenney.nl asset packs (tiles, characters, UI, audio) — CC0.
- Press Start 2P font — OFL 1.1.
- PokéAPI code + bundled static JSON data (species names, stats, types, moves, flavor text) — BSD-3-Clause **for the data compilation**.
- `pokeapi-js-wrapper` — MPL-2.0.

### 2.B Resources with attribution requested (not required) but appreciated
- Kenney assets technically require no attribution, but a `CREDITS.md` crediting Kenney, PokéAPI, and any itch.io CC0 artists used is good practice and costs nothing.
- MurphysDad RPG Asset Pack (CC0, credit "appreciated but not necessary").

### 2.C Resources with unclear or non-CC0 licensing (verify before use — do NOT assume free-to-redistribute)
- Popular itch.io "cute" top-down RPG tilesets (Sprout Lands, Cute Fantasy, Tiny Farm RPG, etc.) — typically pay-what-you-want with custom terms; some prohibit redistributing the raw files or reselling asset packs. **Action: do not use these in this project unless someone manually opens the license tab and confirms terms.** We do not need them — Kenney's packs cover everything required.

### 2.D Pokémon/Nintendo/Game Freak copyrighted assets — the core legal reality
- **Every Pokémon species name, character design, and canonical sprite (front/back/animated, from any source, including PokeAPI/sprites) is derivative of copyrighted, trademarked IP owned by Nintendo/Game Freak/Creatures Inc.** This does not change because a GitHub repo licenses its own *compilation* as CC0 or BSD. The maintainers of PokeAPI and PokeAPI/sprites cannot grant rights they do not own; their CC0 license covers their own compilation/curation effort and the code, not Nintendo's copyright in the underlying character art and names.
- **This is "technically accessible" (freely downloadable, no API key, no paywall) but is NOT "legally safe to redistribute" as a commercial or even widely-public product under the Pokémon name.** Fan games and ROM-hack-adjacent Pokémon projects are widely tolerated in practice by Nintendo/The Pokémon Company as long as they are non-commercial, not distributed through official app stores under Pokémon branding, and taken down on request — but tolerance is not a license, and Nintendo has a well-documented history of issuing takedowns / cease-and-desists against fan Pokémon games (e.g., Pokémon Uranium, Pokémon Prism) as market visibility grows.
- **`[RECOMMENDATION]` for this project:** Treat the game as a **private prototype / personal portfolio project**, not a published commercial product:
  - Do not name it "Pokémon [anything]" — use a distinct, unbranded working title.
  - Do not publish the Android APK to the Google Play Store under this project as-is (installing directly via sideload / private testing is a very different risk profile than public store distribution).
  - Do not monetize it.
  - Keep the actual Pokémon-species sprites/names as an optional, swappable "content pack" layer (see §7 data model) so that, if ever needed, the game could be re-skinned with wholly original creature designs (from the Kenney/CC0 "blob monster"-style placeholders, or original art) with a data/config change rather than a code rewrite. This is cheap insurance and does not cost meaningful build time.
  - This falls in **Category D** and, practically, **Category F ("suitable only for experimentation/private prototypes")**.

### 2.E Resources that should NOT be redistributed
- Do not commit ripped Pokémon sprites into a public GitHub repo intended as a general open-source library/template for others; keep any actual Pokémon character art in a local `assets/` folder that is either `.gitignore`d from a public mirror or clearly documented as "third-party, non-redistributable, for private prototype only" if the repo is ever made public.

### 2.F Resources suitable only for experimentation/private prototypes
- All actual Pokémon sprites/names/species data (Category D above).

### 2.G Resources potentially suitable for a public/open-source project
- The engine, the React/TS shell code, the Kenney-sourced world/UI/audio assets, the Press Start 2P font, and the *architecture* itself are all fine to open-source. If the project is ever open-sourced, swap Category D content for original or CC0 creature art and rename species.

**Bottom line the agent must internalize:** "It's on GitHub" ≠ "it's clear to redistribute." The PokéAPI *data and code* are genuinely open (BSD). The Pokémon *characters* are not, regardless of which repository hosts a picture of them.

---

## 3. FRONTEND ARCHITECTURE

**`[RECOMMENDATION]`**

```
┌─────────────────────────────────────────────┐
│                 React (TS)                   │
│  App shell, routing between "screens":        │
│   - TitleScreen                               │
│   - OverworldScreen  <-- mounts <GameCanvas/> │
│   - BattleScreen     <-- mounts <GameCanvas/> │
│   - PokedexScreen (pure React/DOM)            │
│   - TrainerCardScreen (pure React/DOM)        │
│   - PartyMenu, Inventory (pure React/DOM,     │
│     overlaid on top of GameCanvas)            │
│                                                │
│  React owns: menus, HUD, dialogue box text,   │
│  Pokédex, trainer card, settings, save/load   │
│  UI, battle command menu (Fight/Bag/          │
│  Pokémon/Run buttons + move buttons)          │
└───────────────┬───────────────────────────────┘
                │ Zustand store (single source of
                │ truth for game state: party,
                │ position, inventory, pokedex,
                │ flags) + a typed EventBus
                ▼
┌─────────────────────────────────────────────┐
│              Phaser 3 (Canvas/WebGL)          │
│  Phaser owns: tile world rendering, player    │
│  sprite + movement + collision, camera,       │
│  battle-scene sprite animation (attack lunge, │
│  hit flash, faint, shake), particle FX,       │
│  screen transitions (fade to battle)          │
└─────────────────────────────────────────────┘
```

**Why this split and not "blindly follow the brief's suggested split":** The brief's suggested split (React=menus, Engine=world) is correct and we keep it, with one refinement: the **battle scene's sprite animation stays in Phaser** (not React), because sprite-sheet animation, tweened lunges, camera shake, and particle hit-effects are things Phaser does natively and well, while the **battle command UI (buttons: Fight/Bag/Pokémon/Run, move selection, HP bars text)** stays in React, absolutely-positioned over the Phaser canvas, because React is faster to build/iterate accessible, responsive UI in under time pressure than hand-rolling Phaser DOM/Text objects.

- **Communication:** a single Zustand store (`useGameStore`) holds canonical game state (party, position, flags, inventory, Pokédex-seen/caught, money). Both React components and Phaser scenes read/write this store directly (Phaser scenes are plain TS classes, so they can `import { useGameStore } from '...'` and call `.getState()` / `.setState()` — no context/hooks needed inside Phaser code). A small typed `EventBus` (a tiny `Phaser.Events.EventEmitter` instance exported as a singleton) is used for one-shot, one-directional signals like `battle:started`, `battle:ended`, `dialogue:show`, `encounter:triggered` — this avoids polling and avoids the Phaser scene and React tree needing to know about each other's internals.
- **Mounting:** `<GameCanvas/>` is a React component that, on mount, does `new Phaser.Game(config)` into a ref'd `<div>`, and on unmount calls `game.destroy(true)`. Only one `Phaser.Game` instance exists for the whole app; switching between "Overworld" and "Battle" is a **Phaser Scene transition** (`this.scene.start('BattleScene', {...})`), not a remount — remounting Phaser is slow and loses WebGL context unnecessarily.
- **TypeScript throughout.** Both React and Phaser code is TS. Phaser 3 ships its own types; no separate `@types/phaser` needed for modern versions — verify at setup time (`npm view phaser types` / package.json).

---

## 4. BACKEND DECISION

**`[RECOMMENDATION]` Option A — Fully client-side. No backend for the MVP.**

Reasoning: nothing in the MUST-HAVE feature list (movement, encounters, battle, catching, Pokédex, trainer card, save) requires server-side authority, multiplayer, or persistence beyond a single device. A backend would consume Day 1–2 on FastAPI/Postgres/asyncpg setup, auth, and API design for zero player-facing benefit in a 3–5 day slice. Every piece of "player previous experience" (Python/FastAPI/SQLAlchemy/asyncpg/Postgres) is explicitly a **Phase 2 (post-MVP)** concern, not part of this plan's execution window.

Explicitly deferred to a future phase (not built now):
- Cloud save / account system → would need FastAPI + Postgres + auth.
- Leaderboards / trading / multiplayer → out of scope entirely per brief.
- Server-side anti-cheat / validated battle resolution → unnecessary for single-player.

If, after the MVP, persistence needs to go beyond localStorage (e.g., cross-device saves), the natural next step is exactly the stack already known: FastAPI + SQLAlchemy(async) + asyncpg + Postgres, with a thin `/save` and `/load` REST endpoint keyed by a device/account id — but this is Phase 13+, not part of the 3–5 day plan.

---

## 5. POKÉMON DATA MODEL

**`[RECOMMENDATION]`** Separate **static Pokédex data** (ships with the game, never mutated at runtime) from **game/save state** (mutates as you play).

### 5.1 Static data (bundled JSON, derived from PokéAPI's `api-data` static dump, trimmed to ~10 species)

```
/src/data/
  species.json      // array of PokemonSpecies
  moves.json         // array of MoveDef
  types.json         // type chart (effectiveness matrix)
  trainers.json       // rival/NPC trainer defs (party makeup)
  maps/
    town.json         // Tiled export
    route1.json        // Tiled export
```

```ts
interface PokemonSpecies {
  id: number;              // dex number (use real PokéAPI ids for the chosen species so
                            // sprite filenames line up, e.g. 1=Bulbasaur, 4=Charmander, 7=Squirtle,
                            // 10=Caterpie, 16=Pidgey, 19=Rattata — cheap starters/early-route mons)
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: { hp: number; atk: number; def: number; spd: number };
  moves: string[];          // move ids learnable at low level, subset of moves.json
  spriteFront: string;      // path into /assets/sprites/pokemon/front/{id}.png
  spriteBack: string;
  spriteIcon: string;       // small icon for party/pokedex list
  catchRate: number;        // 0..255-style scalar, simplified
  evolvesInto?: number;     // OPTIONAL, likely cut — see §9 Battle System priorities
}

interface MoveDef {
  id: string;
  name: string;
  type: PokemonType;
  power: number;
  accuracy: number;     // 0-100
  category: 'physical' | 'special'; // simplify: pick ONE per move, no split-damage nuance
  pp: number;
}

type PokemonType = 'normal'|'fire'|'water'|'grass'|'electric'|'bug'|'flying'|'poison';
// Keep the type chart SMALL: only the types actually used by our 6-10 species + their moves.
```

### 5.2 Runtime/save state (mutable, persisted)

```ts
interface SaveGame {
  version: number;                 // for future migration safety
  player: { name: string; x: number; y: number; mapId: string; facing: Direction };
  party: PartyMember[];             // max 6
  pokedex: Record<number, 'unseen'|'seen'|'caught'>;
  inventory: { itemId: string; qty: number }[];
  money: number;
  badges: string[];                 // even 1 badge is enough for "progression"
  flags: Record<string, boolean>;   // e.g. "talkedToProfessor", "rivalBattleDone"
}

interface PartyMember {
  speciesId: number;
  nickname?: string;
  level: number;
  currentHp: number;
  moves: string[];   // 2-4 move ids, subset of species.moves
  xp?: number;        // OPTIONAL, see cut list
}
```

**Why this shape:** normalized species/move/type definitions are looked up by id, never duplicated; `PartyMember` stores only the mutable overlay (level, hp, moves-known) referencing `speciesId` into the static table — this is the standard "data vs. instance" separation used by every Pokémon-likes and is trivial for an agent to reason about and extend.

### 5.3 Data acquisition procedure (for the agent to execute in Phase 1)
1. Fetch (once, at build/dev time, not runtime) the JSON for the ~10 chosen species from `https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2/pokemon/{id}/index.json` (and the corresponding `pokemon-species/{id}` and `move/{name}` endpoints for flavor text/moves).
2. Hand-trim/reshape into the `species.json`/`moves.json` shape above (small script, one-time, throwaway — do not build a general PokéAPI importer, that's over-engineering for 10 species).
3. Download matching sprites from `PokeAPI/sprites` repo paths (e.g. `sprites/pokemon/{id}.png` for front, `sprites/pokemon/back/{id}.png` for back; check `sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif` if animated GB-style sprites are desired for extra liveliness) into `/src/assets/sprites/pokemon/`.

---

## 6. GAMEPLAY SCOPE — EXACT NUMBERS

**`[RECOMMENDATION]`, ruthlessly small:**

| Item | Count | Notes |
|---|---|---|
| Maps | **2** | Town (small, ~15×15 tiles) + Route1 (small, ~20×15 tiles, contains the grass patch) |
| Buildings (enterable) | **1** | "Lab"/starter-select building in town (interior is a single small room, optional — see cut list) |
| NPCs (dialogue-only) | **2** | 1 in town (flavor/hint), 1 on the route (flavor/hint) |
| Trainers (battle-triggering) | **1** | Rival, fixed encounter on the route, triggers one scripted battle |
| Wild species | **6** | e.g. Pidgey, Rattata, Caterpie, Bulbasaur/Charmander/Squirtle-as-starter-only (pick low-Dex-number, visually simple, small-file-size sprites) |
| Starter choice | **3 of the 6** | classic 3-starter picker in the lab building; the other species are wild-only |
| Moves | **8** | 2 per starter type family minimum, enough to matter for type effectiveness demo |
| Encounters | **1 grass zone** | single tagged region on Route1, PokeAPI/boxerbomb-style Tiled object property `zoneType: grass` |
| Battle mechanics | Turn-based, HP, 1v1 only (no double battles) | see §9 |

This is deliberately smaller than the brief's example "5–10 Pokémon" — we pick the **low end (6 wild + reuse as starters)** because every additional species costs sprite-sourcing + data-entry + balance time for zero structural learning.

---

## 7. WORLD DESIGN

```
Town (start map)
 ├── Player's house (facade only, non-enterable — cut interior for time)
 ├── Lab (enterable, 1 interior room: starter picker + Professor NPC)
 ├── NPC #1 (dialogue, stands near town center)
 └── Route1 entrance (map transition trigger tile)

Route1
 ├── Path (walkable, connects town exit to grass zone)
 ├── Trees (collision, decorative boundary)
 ├── Grass patch (encounter trigger zone, ~4x4 to 6x6 tiles)
 ├── NPC #2 (dialogue, flavor/hint)
 └── Rival trainer (positioned at the far end; battles once, then becomes a normal NPC)
```

**`[RECOMMENDATION]` minimum tilemap size:** 15×15 to 20×15 tiles at 16×16px tiles (Kenney's grid unit) — i.e., roughly 240×240px to 320×240px per map, which reads as "small but real" rather than a single-screen toy, while staying trivially paintable by hand in Tiled in under an hour per map. Two maps total. Do not build a third map even if time remains on Day 5 — extra polish on these two maps beats a third empty map.

---

## 8. ANIMATION STRATEGY

**`[RECOMMENDATION]`** — everything below is achievable with Phaser's built-in `Tweens`, `Cameras.main.shake/flash/fade`, `Particles`, and simple sprite-sheet frame animation. No custom per-Pokémon animation files needed.

| Moment | Technique | Phaser APIs |
|---|---|---|
| Overworld player walk | 4-directional sprite-sheet (idle + 2-frame walk cycle per direction) | `this.anims.create(...)`, `sprite.play(...)` |
| Battle transition (overworld → battle) | Fade to black, swap scene, fade in | `cameras.main.fadeOut(300)`, `scene.start(...)`, `cameras.main.fadeIn(300)` |
| Attack (physical move) | Attacker sprite tweens forward-and-back (lunge), then impact effect fires | `this.tweens.add({x: '+=20', yoyo:true, duration:150})` |
| Hit / damage taken | White/red flash on sprite + camera shake + floating damage number tween (rises + fades) | `sprite.setTintFill(0xffffff)` toggled over 2-3 frames; `cameras.main.shake(150, 0.005)`; a plain Phaser `Text` object tweened `y -= 20, alpha: 0` |
| Faint | Sprite tweens downward off-screen + fades alpha to 0 | `this.tweens.add({y:'+=40', alpha:0, duration:400})` |
| Catch attempt | Ball-throw arc tween (quadratic bezier or simple parabola via tween chain) + 3 "shake" wiggle tweens + particle burst on success | `this.tweens.chain(...)`, `this.add.particles(...)` |
| Idle "breathing" in battle | Subtle Y-scale oscillation loop, very small amplitude | `this.tweens.add({scaleY: 1.03, yoyo:true, repeat:-1, duration:800})` |
| Menu open/close | Slide/scale-in tween on the React overlay via CSS transition (translateY + opacity), NOT Phaser — this is DOM UI | CSS `transition: transform 150ms ease-out` |
| Grass rustle before encounter | Quick scale/rotate wiggle on a grass-tile sprite object, then screen flash white, then cut to battle | Tween + `cameras.main.flash(200)` |
| Type-effectiveness callout ("It's super effective!") | Text pop-in tween (scale from 0→1.1→1) | `this.tweens.add({scale:{from:0,to:1}, ease:'Back.Out'})` |

**What's procedurally generated vs. needs an asset:** all *motion* above is procedural (tweens/camera fx/particles) — it needs **zero unique animation files per Pokémon**. The only asset requirement per species is: 1 front sprite (static or ~2-4 frame GIF if using the animated Gen V set), 1 back sprite, 1 icon. This is exactly how the brief's "lively without hundreds of animations" goal gets satisfied.

---

## 9. BATTLE SYSTEM — PRIORITIZED

**Implement now (MUST HAVE):**
- Single wild/trainer Pokémon vs. single player Pokémon (no doubles).
- HP, level (level is mostly cosmetic/display in the MVP — see below), base stats (atk/def/spd used in damage formula).
- 2–4 known moves per Pokémon, chosen from `moves.json`.
- Turn order: compare `spd` stat (+ small random tiebreak), faster Pokémon acts first each round.
- Damage calculation: simplified formula, e.g.
  `damage = floor(((2*level/5 + 2) * movePower * (atk/def) / 50) + 2) * typeEffectivenessMultiplier * randomVariance(0.85–1.0)`
  (this is the real Gen-I-style formula, safe to use since it's a *mathematical formula*, not copyrightable expression, not an asset).
- Type effectiveness: small chart covering only the ~8 types actually in play (super/not-very/no-effect multipliers: 2x/0.5x/0x).
- Victory (enemy HP hits 0) / Defeat (player's whole party HP hits 0 → return to town, no permadeath, maybe lose some money as a light penalty).
- Basic battle UI: HP bars (React components, animated width-transition on change), move buttons, message box.
- Catching: a simplified capture-chance formula (e.g. based on target's remaining HP% and species catchRate, no status-condition bonus) with a single "ball" item type — no need for multiple ball tiers in MVP.

**Should have (if Day 3 goes well):**
- Simple status effect: **one** status only (e.g. "Sleep" or "Paralysis") to demonstrate the concept, not a full status system.
- Basic leveling: gain XP after a win, level up increases stats by a fixed formula, maybe unlocks a new move at a hardcoded level.

**Postpone/cut for MVP:**
- Full 18-type chart, all Gen-I status conditions, critical hit mechanics beyond a simple flat chance, held items, abilities, stat stages (X Attack/Defense boosts), multi-hit moves, weather, evolution animations, breeding, natures/IVs/EVs. None of these are visible to a player in a 5–10 minute demo session and all cost implementation + balancing time disproportionate to their payoff.

---

## 10. TRAINER / PLAYER CARD

**`[RECOMMENDATION]` Option B: existing sprites + HTML/CSS/SVG, deterministic — reject image-generation APIs entirely for this.**

Reasoning: an image-gen API call adds network latency, cost, non-determinism (different look every regenerate), and an extra failure mode, for a UI element that is fundamentally a **data display** (name, sprite thumbnails, level, badge icons, simple stat counters) — a solved problem for HTML/CSS. Build it as a plain React component: a pixel-bordered card (CSS `border-image` or `box-shadow` steps to fake a chunky retro frame), player name, a static "trainer" sprite from a Kenney character pack, a grid of the party's `spriteIcon`s with level badges, badge icons as small SVG/PNG chips, and simple counters (Pokémon seen/caught, battles won). This is a **1-2 hour task**, not a research problem.

---

## 11. UI / VISUAL STYLE

- **Pixel font:** Press Start 2P for headers/HUD numbers (OFL, see §1.4); a more readable secondary font for dialogue body text.
- **Dialogue box:** classic bottom-of-screen box, opaque or semi-transparent panel, text reveal with a typewriter effect (simple `setInterval`/`requestAnimationFrame` character-by-character reveal — cheap, high perceived-polish payoff), "▼" bounce indicator via CSS animation when waiting for input.
- **CRT/retro filter:** **optional, cut-first if time is short** — a CSS `::after` scanline overlay (repeating-linear-gradient) is cheap (~15 min) and reads as "retro" without a WebGL shader; skip any actual shader-based CRT curvature/bloom given time constraints.
- **Screen transitions:** fade-to-black between overworld/battle (Phaser camera fade, §8), and simple CSS opacity-transition between React "screens" (Pokédex/menu opening).
- **`[RECOMMENDATION]`** Do not build a custom in-house UI component kit; hand-roll a handful of styled React components (Panel, Button, HpBar, DialogueBox) once and reuse them everywhere — this is faster than integrating a third-party "Pokémon UI kit" (most such kits are themselves derivative Pokémon assets with the same Category D legal issue, or are Unity-specific and irrelevant here).

---

## 12. MOBILE / ANDROID

- **Web-first.** Desktop keyboard input (arrow keys/WASD + Z/X or Enter/Space for confirm/cancel) is the Day 1–4 target. Do not build touch controls until Day 5.
- **Day 5 packaging:** Capacitor (see §1.6). Concretely: `npm i -D @capacitor/cli @capacitor/core @capacitor/android`, `npx cap init "GameName" "com.yourname.gamename"`, `vite build`, `npx cap add android`, `npx cap copy android`, open `android/` in Android Studio, build a debug APK (`Build > Build APK(s)`), install via `adb install` or sideload for testing. No Play Store submission in this plan (see §2.D legal caveat).
- **Touch controls (Day 5, time-permitting only):** a simple on-screen D-pad (4 CSS-styled `<button>`s, absolute-positioned, calling the same movement handler as keyboard) + an "A"/"B"-style pair of action buttons. This is a **should-have**, not a must-have — if Day 5 runs short, ship the APK with "landscape recommended, use a Bluetooth/USB controller or emulator's keyboard passthrough" as a known limitation rather than delaying.
- Portrait vs. landscape: **`[RECOMMENDATION]` lock to landscape** — the tile-world camera and battle UI are horizontally composed (classic handheld aspect), and building a second portrait layout is pure scope creep. Set `<meta name="viewport">` and CSS to enforce landscape-oriented game canvas scaling regardless of device orientation (a simple "please rotate your device" overlay in portrait is an acceptable minimal handling).

---

## 13. SAVE / LOAD SYSTEM

**`[RECOMMENDATION]` localStorage, not IndexedDB, not a backend.**

Reasoning: the entire `SaveGame` object (§5.2) serializes to well under localStorage's ~5MB limit (it's a few KB of JSON — party of 6, inventory, flags, position). IndexedDB's async API and schema/versioning ceremony buys nothing at this data size and this time budget. A backend is explicitly rejected (§4).

Implementation: a tiny `saveGame()`/`loadGame()` pair that `JSON.stringify`/`JSON.parse`s the Zustand store's relevant slice to/from `localStorage.setItem('save-v1', ...)`, called (a) on an explicit "Save" menu action, and (b) optionally auto-save on map transitions. Include the `version` field from day one so a future format change can migrate old saves instead of corrupting them silently.

---

## 14. PROJECT STRUCTURE

**`[RECOMMENDATION]`**

```
/ (repo root)
  plan.md
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  /public
    /assets
      /tiles          (Kenney CC0 tile PNGs + Tiled .tsx/.json tileset defs)
      /characters      (Kenney CC0 character sprite sheets: player, NPCs)
      /pokemon
        /front /back /icon   (PokeAPI/sprites-sourced, per §5.3)
      /audio
        /sfx  /music
      /fonts
        press-start-2p.woff2
  /src
    main.tsx                    -- React root, mounts <App/>
    App.tsx                     -- top-level screen router (Title/Overworld/Battle/Pokedex/Card)
    /game                       -- ALL Phaser code lives here, isolated from React internals
      GameCanvas.tsx             -- React wrapper component; owns Phaser.Game lifecycle
      config.ts                  -- Phaser game config (size, physics, scale mode)
      eventBus.ts                 -- shared Phaser.Events.EventEmitter singleton
      /scenes
        BootScene.ts               -- preloads shared assets
        OverworldScene.ts           -- tilemap, player movement, collision, encounter trigger
        BattleScene.ts               -- battle rendering, sprite tweens, hit fx
      /entities
        Player.ts                   -- overworld player sprite/movement class
        BattleSprite.ts               -- wraps a Pokémon sprite + its battle animations
      /systems
        movement.ts                   -- grid-based movement + collision helper functions
        encounter.ts                    -- random-encounter roll logic
        damage.ts                        -- battle damage/type-effectiveness formula (pure functions, unit-testable)
        capture.ts                        -- catch-chance formula (pure function)
    /state
      gameStore.ts                -- Zustand store: SaveGame shape + actions
      persistence.ts               -- save/load to localStorage
    /data
      species.json / moves.json / types.json / trainers.json (see §5)
      /maps  town.json / route1.json  (Tiled exports)
    /ui                            -- pure React/DOM components, no Phaser imports
      /components  Panel.tsx HpBar.tsx DialogueBox.tsx Button.tsx
      /screens     TitleScreen.tsx OverworldHud.tsx BattleHud.tsx
                    PokedexScreen.tsx TrainerCardScreen.tsx PartyMenu.tsx
    /utils
      random.ts  typeChart.ts  constants.ts
  /android                     -- generated by `npx cap add android`, Day 5 only
```

**Why this structure:** it enforces the architectural boundary from §3 at the filesystem level — `/game` never imports React, `/ui` never imports Phaser, both only touch shared state via `/state`. This makes it trivial for an AI coding agent to work on one task (e.g., "implement damage.ts") without needing the entire codebase in context, and keeps files small (each scene/system/component is one focused responsibility, none should exceed ~150–250 lines; if a file grows past that, split it).

---

## 15. AI CODING AGENT TASK BREAKDOWN

Each task below is sized to be completable and verifiable independently. Format: **Objective / Files / Depends on / Result / Acceptance criteria / Failure modes.**

### Phase 1 — Project Setup
1. **Init repo & tooling**
   - Files: `package.json`, `vite.config.ts`, `tsconfig.json`, `.eslintrc`, `index.html`
   - Depends on: nothing
   - Result: `npm run dev` serves a blank white page with no console errors.
   - Acceptance: dev server starts, TypeScript strict mode compiles with zero errors on an empty `App.tsx`.
   - Failure modes: Vite/React/TS version mismatches; pin versions explicitly in `package.json` rather than using `latest`.

2. **Install Phaser, Zustand, React deps**
   - Files: `package.json`
   - Depends on: Task 1
   - Result: `phaser`, `react`, `react-dom`, `zustand`, `typescript`, `vite` all installed and importable.
   - Acceptance: a throwaway `console.log(Phaser.VERSION)` prints a version string in dev console.
   - Failure modes: Phaser's bundled TS types conflicting with a manually installed `@types/phaser` — install only one.

3. **Acquire and place assets**
   - Files: `/public/assets/**`
   - Depends on: nothing (can run in parallel with Task 1-2)
   - Result: Kenney RPG Urban Pack, Roguelike/RPG Pack, RPG Audio, Interface Sounds downloaded and unzipped into `/public/assets/tiles`, `/public/assets/characters`, `/public/assets/audio`; Press Start 2P `.woff2` in `/public/assets/fonts`; trimmed PokéAPI species/move JSON in `/src/data`; matching sprites in `/public/assets/pokemon`.
   - Acceptance: every file referenced by a later task's code actually exists on disk at the expected path (grep the codebase for asset path strings and `ls` each one).
   - Failure modes: license mismatch (double-check each pack's page per §2 before use); wrong tile pixel size mixed between packs (verify all tile packs used for one map share the same tile grid, e.g. 16×16, to avoid seams).

4. **Build the one/two Tiled maps**
   - Files: `/src/data/maps/town.json`, `/src/data/maps/route1.json`
   - Depends on: Task 3
   - Result: two small tilemaps built in the Tiled editor, exported as JSON, using the layer convention from `boxerbomb/PokemonClone` (background/blocked/objects layers) and custom object properties for `playerStart`, `mapTransition`, `encounterZone`.
   - Acceptance: both JSON files load without error in a throwaway Phaser scene (`this.make.tilemap(...)`), and the correct number of layers/tilesets are reported.
   - Failure modes: tileset image path in the JSON not matching the actual asset path after moving files — regenerate/fix paths after any asset reorganization.

### Phase 2 — World & Player
5. **Boot/Preload scene** — Files: `BootScene.ts`. Loads all assets, shows a simple loading bar. Acceptance: transitions to Overworld automatically once 100% loaded, no missing-texture console warnings.
6. **Render tilemap in OverworldScene** — Files: `OverworldScene.ts`. Depends on 4,5. Acceptance: town map visibly renders at correct scale with camera bounds clamped to map size.
7. **Player entity + 4-directional movement** — Files: `Player.ts`, `movement.ts`. Depends on 6. Grid-snapped movement (moves exactly one tile per keypress, or smooth-tweened between tiles — pick tweened-between-tiles for the "lively" feel) with idle/walk animation per direction. Acceptance: arrow keys/WASD move the player sprite smoothly, sprite faces correct direction, no clipping through collision tiles.
8. **Collision** — Files: `movement.ts`, tilemap "blocked" layer. Depends on 7. Acceptance: player cannot walk through trees/buildings/water tiles marked collidable in Tiled.
9. **Map transition (Town ↔ Route1)** — Files: `OverworldScene.ts`. Depends on 6,8. A transition trigger tile at the town edge loads Route1 at a corresponding entry point (and vice versa). Acceptance: walking off the correct edge tile fades out, swaps map data, fades in, player appears at the linked entry point facing the right direction.
10. **NPC dialogue** — Files: `DialogueBox.tsx` (React overlay), `eventBus.ts`, `OverworldScene.ts`. Depends on 6. Walking into/interacting-with (press confirm key while facing) an NPC sprite emits an event; React shows a dialogue box with typewriter text; pressing confirm advances/closes it. Acceptance: 2 NPCs each show distinct hardcoded text; game input (movement) is properly suspended while dialogue is open and resumed after.

### Phase 3 — Encounters & Pokédex
11. **Encounter trigger zone** — Files: `encounter.ts`, `OverworldScene.ts`. Depends on 9. Standing/moving inside the tagged grass-zone tiles has a per-step random chance (e.g. 10%) of firing an `encounter:triggered` event with a randomly chosen wild species from the zone's species pool.
12. **Species/move/type data loading** — Files: `/src/data/*.json`, a small typed loader in `/src/data/index.ts`. Depends on Task 3. Acceptance: `getSpecies(1)` returns a typed `PokemonSpecies` object with correct fields for all 6-10 bundled species.
13. **Pokédex screen (React)** — Files: `PokedexScreen.tsx`. Depends on 12, and on `gameStore.pokedex` existing (Task 18). Grid of all species, greyed-out silhouette if `unseen`, sprite + name if `seen`, full stat card if `caught`. Acceptance: newly-encountering a wild Pokémon flips it from unseen→seen automatically; catching flips seen→caught.

### Phase 4 — Battle System
14. **BattleScene skeleton + transition in/out** — Files: `BattleScene.ts`, `OverworldScene.ts`. Depends on 11. On `encounter:triggered` (or on walking into the rival trainer), fade out overworld, `scene.start('BattleScene', {enemySpeciesId, isTrainerBattle})`, render enemy sprite (front) top-right-ish, player's active party member (back sprite) bottom-left-ish, per classic layout. Acceptance: correct sprites render at correct facing (front vs back) for both combatants.
15. **Battle HUD (React overlay)** — Files: `BattleHud.tsx`, `HpBar.tsx`. Depends on 14. HP bars (animated width transition on change) + name/level for both combatants, message box, Fight/Bag/Pokémon/Run button row, then move-name button row when Fight is selected. Acceptance: buttons render, clicking Fight reveals the 2-4 known moves of the active party member with correct names/PP.
16. **Damage calculation (pure function, unit-testable)** — Files: `systems/damage.ts`. Depends on 12. Implement the formula from §9. Acceptance: given fixed inputs (level, stats, move power, type multiplier), output matches a hand-computed expected value — write 2-3 explicit test cases (even without a full test runner, a `console.assert` smoke-test script is acceptable given time constraints).
17. **Turn resolution loop** — Files: `BattleScene.ts`, `damage.ts`. Depends on 15,16. Player selects a move → determine turn order via speed stat → apply damage → update HP in store → check for faint → if not fainted, enemy AI picks a random valid move → repeat. Acceptance: a full battle can be played to either victory or defeat via the UI with correct HP updates and messages at each step.
18. **Battle animations** — Files: `BattleScene.ts`, per §8 table. Depends on 17. Lunge tween on attack, flash+shake+floating number on hit, fade-out-and-down on faint. Acceptance: visually confirmed in-browser, no reliance on unique per-Pokémon animation assets.
19. **Catching** — Files: `systems/capture.ts`, `BattleScene.ts`, `BattleHud.tsx` (Bag→Poké Ball option). Depends on 17. Acceptance: catch attempt has HP%-dependent success chance; on success, battle ends, species added to party (if room) or a message shown if party is full (simplify: if full, cut the "send to storage" system entirely and just say "Party is full!" and refuse the catch — no PC/storage box system in MVP).
20. **Victory/Defeat/Return-to-overworld flow** — Files: `BattleScene.ts`, `OverworldScene.ts`. Depends on 17,19. Acceptance: after any battle end state, fades back to the overworld scene at the player's pre-battle position; on defeat, a light penalty (return to town, lose some money) rather than a hard game-over screen (out of scope).

### Phase 5 — Progression, Save, Trainer Card
21. **Zustand game store** — Files: `state/gameStore.ts`. Depends on 5.2 shape. Should ideally exist earlier (many tasks above depend on it) — **do this task in parallel with/before Phase 2**, not literally after Phase 4; listed here for narrative order only.
22. **Save/Load (localStorage)** — Files: `state/persistence.ts`, a Save button in a pause menu. Depends on 21. Acceptance: saving, refreshing the browser tab, and loading restores party/position/pokedex/inventory exactly.
23. **Trainer card screen** — Files: `TrainerCardScreen.tsx`. Depends on 21. Per §10. Acceptance: displays player name, party icons+levels, badge count, seen/caught counters, all pulled live from the store.
24. **Rival trainer battle (the one scripted trainer fight)** — Files: `trainers.json`, `OverworldScene.ts`, `BattleScene.ts`. Depends on 14-20. A trainer NPC on Route1 that, once approached, triggers a mandatory (non-random) battle against a hardcoded party; winning sets a flag and grants a badge/money; the NPC becomes an idle "already battled" NPC afterward (no infinite rematching needed for MVP).

### Phase 6 — Polish & Sound
25. **SFX hookup** — Files: throughout `/game`, using Kenney Interface/Impact/RPG Audio packs. Menu blips, hit sounds, catch success chime, footstep (optional, cut-first if tight).
26. **Music** — **`[SHOULD HAVE, likely cut if short on time]`.** If pursued: one short looping town theme + one battle theme, sourced from a confirmed-CC0/CC-BY source (verify license per-track; do not use ripped Pokémon game music — that is squarely Category D/E and, unlike sprites, game music is much more actively enforced by Nintendo's audio-fingerprinting takedown systems on platforms like YouTube/itch — treat音 game-original music as **higher legal risk than sprites** and avoid entirely; use CC0 chiptune from OpenGameArt or a jsfxr/sfxr-generated procedural tune instead).
27. **CRT/scanline CSS filter** — optional, per §11.

### Phase 7 — Mobile & Deployment
28. **Web deployment** — Files: build config only. `vite build`, deploy `dist/` to a static host (Vercel/Netlify/GitHub Pages — pick whichever the developer already has an account on, no research needed, this is a solved commodity problem).
29. **Capacitor Android wrap** — per §12. Depends on 28 (needs a working `dist/` build first).
30. **Touch controls (should-have)** — per §12, cut-first if Day 5 is tight.

---

## 16. 3–5 DAY EXECUTION PLAN

### Day 0 (partial, this document) — Research & Planning
- Goals: this plan.md. Asset licenses checked. Architecture decided.
- MUST NOT: write application code.

### Day 1 — Engine + World + Movement
- Goals: Tasks 1-10 (project setup, assets in place, one map rendering, player moves and collides, map transition works, one NPC talks).
- Deliverable: a runnable build where you can walk around Town and Route1, bump into trees/buildings, and talk to 1 NPC.
- MUST NOT: touch battle system, Pokédex, save system, Android.
- Fallback if Phaser tilemap integration proves harder than expected: fall back to a hand-coded 2D array grid rendered as a Phaser `TilemapLayer` from a plain array (`this.make.tilemap({data: [[...]], tileWidth, tileHeight})`) instead of a full Tiled JSON pipeline — same visual result, less tooling dependency, usable within an hour.

### Day 2 — Pokémon Data + Encounters + Pokédex
- Goals: Tasks 3 (assets), 11-13.
- Deliverable: walking into the grass zone has a chance to trigger an encounter event (battle scene can be a placeholder/blank scene for now if Day 3 hasn't started); Pokédex screen shows correct seen/unseen state.
- MUST NOT: build the full turn-based battle loop yet (that's Day 3) — a stub "you encountered a Pidgey! [OK]" placeholder is fine as the Day 2 deliverable's battle-scene stand-in.
- Fallback if PokéAPI JSON trimming takes too long: hand-author the ~10 species/8 moves as plain hardcoded TS objects instead of deriving from PokéAPI JSON — same data shape, faster for a tiny dataset, and PokéAPI is only really valuable at larger scale anyway.

### Day 3 — Battle System
- Goals: Tasks 14-20.
- Deliverable: a fully playable single encounter from grass-trigger → battle → victory/defeat/catch → back to overworld, with basic HP bars and move selection, no animation polish yet.
- MUST NOT: work on sound, Android, or trainer card — pure battle-loop correctness is the entire day's focus.
- Fallback if the damage/type-effectiveness formula produces weird results: simplify further — drop type effectiveness entirely for a day-3-only build (flat damage = movePower * atk/def scalar) and re-add the type multiplier once the turn loop itself is solid; a working un-nuanced battle beats a half-working nuanced one.

### Day 4 — Polish: Animation, UI, Sound, Trainer Card, Save
- Goals: Tasks 18 (if not done Day 3), 21-27.
- Deliverable: battle feels alive (hit flash/shake/floating numbers/lunge/faint), trainer card screen exists, save/load works across a page refresh, basic SFX plays on hits/menu actions.
- MUST NOT: start Android packaging yet — a rock-solid, polished web build is more valuable than a half-working Android build; Android is a bounded few-hour task, don't let it eat into polish time.
- Fallback if time is short: cut music (Task 26) and CRT filter (Task 27) first — see MVP cut list §17, these are explicitly lowest-priority polish items.

### Day 5 — Mobile Packaging + Deployment + Bug Fixing
- Goals: Tasks 28-30, then a fixed final bug-bash pass (playtest the entire loop start-to-finish 3-5 times, fix anything broken, do not add new features).
- Deliverable: deployed web build (URL), a locally-buildable Android APK (sideload-installable, not published to Play Store), no known crash-level bugs in the core loop.
- MUST NOT: add new gameplay systems, new species, new maps — Day 5 is stabilization only.
- Fallback if Capacitor/Android Studio setup eats unexpected time (SDK installs, Gradle sync issues are the classic time-sink here): the web build alone, deployed and playable in a mobile browser (with basic responsive CSS, no need for true touch D-pad), is an acceptable fallback deliverable — Android APK becomes a "nice to have, attempted" note rather than a hard requirement if the environment fights back.

---

## 17. MVP / CUT LIST

### MUST HAVE
- Player movement + collision on a small tile world (2 maps).
- Grass encounter zone triggering random wild battles.
- Full turn-based 1v1 battle loop: moves, HP, type effectiveness (simplified chart), victory/defeat.
- Catching (simplified formula, single ball type).
- Party (up to 6).
- Pokédex (seen/caught tracking for the ~6-10 bundled species).
- Basic pixel-retro UI: dialogue box, HP bars, battle menu.
- At least 2 NPCs with dialogue + 1 scripted trainer battle (rival).
- Trainer/player card screen.
- Save/load via localStorage.
- Web deployment (public URL).
- Battle animation liveliness: hit flash, shake, floating damage numbers, attack lunge, faint fade.

### SHOULD HAVE
- Leveling/XP after battle wins.
- 1 status effect (e.g., paralysis) for texture.
- SFX (hit/menu/catch).
- Android APK build via Capacitor (sideload-only).
- Basic on-screen touch controls for the Android build.
- CRT/scanline visual filter.

### CUT (explicitly out of scope for this project entirely, not "later")
- Multiplayer/trading/online accounts of any kind.
- More than ~10 total species.
- Full 18-type effectiveness chart, abilities, held items, weather, stat-stage boosts, critical-hit nuance beyond a flat chance.
- Evolution (even if data model has an optional field for it, no evolution *gameplay* is implemented).
- PC storage box system (full party = catch refused, no boxes).
- Multiple towns/routes beyond the 2 maps.
- Backend/database/accounts (see §4).
- Original game music (legal risk + time cost — see §15 Task 26) beyond, at most, one CC0/procedurally-generated loop.
- Portrait mobile layout (§12 locks to landscape only).
- Any actual Pokémon-branded public distribution (app store listing, monetization, use of the name "Pokémon" in the shipped product) — see §2.D.

---

## 18. RISK ANALYSIS

| Risk | Probability | Impact | Mitigation | Fallback |
|---|---|---|---|---|
| Nintendo/Game Freak IP takedown or C&D if project gains visibility | Low for a private prototype, rises sharply if published/monetized | High (legal) | Keep private/unbranded, non-commercial, no store listing (§2.D) | Swap to original creature designs/names via the species.json content-pack layer (§5) — a data change, not a rewrite |
| Phaser+Tiled integration friction (agent unfamiliar with exact API surface) | Medium | Medium (Day 1 slip) | Constrain to a narrow, well-documented Phaser subset (§1.5); use the `boxerbomb/PokemonClone` layer-naming convention as a template | Hand-authored array-based tilemap instead of Tiled JSON (Day 1 fallback, §16) |
| Asset licensing mix-up (using a non-CC0 itch.io pack by mistake) | Medium | Medium (legal/rework) | Default exclusively to Kenney.nl (unambiguous CC0) for all non-Pokémon art; explicit rule in §2.C to verify any itch.io pack's license tab before use | Re-source the specific asset from Kenney's larger packs (they cover tiles/characters/UI/audio comprehensively) |
| Sprite/data mismatch (PokéAPI JSON id doesn't match the sprite filename after trimming) | Medium | Low-Medium (visual bug) | Always key both species.json entries and sprite filenames off the same canonical PokéAPI numeric id (§5.1 note) | Manual per-species spot check during Task 3/12 |
| Battle balance feels "off" (too easy/hard, unfun) given time-boxed formula | Medium | Low | Use the well-known simplified Gen-I-style formula (§9) which is already balance-tested by decades of the real games | Tune 1-2 scalar constants (variance range, catch-rate multiplier) rather than redesigning the formula |
| Scope creep from the very long brief (many "if feasible" items) | High | High | This document's explicit MUST/SHOULD/CUT list (§17) is the single source of truth; if a request during implementation isn't in "must have," it does not get built without revisiting this doc | Re-read §17 before starting any task not explicitly listed in §15 |
| Capacitor/Android Studio environment setup issues (SDK/Gradle) eating Day 5 | Medium | Medium | Attempt Android packaging only after web build is fully stable (Task 28 before 29); treat as time-boxed (~half a day) | Ship web-only if Android setup stalls (§16 Day 5 fallback) |
| Performance on low-end mobile browsers (WebGL context limits, large tile atlases) | Low-Medium | Medium | Keep maps small (§7), tile atlases small (only the tiles actually used, trimmed from Kenney's larger packs), avoid unnecessary particle-heavy effects running continuously | Reduce particle counts / disable camera-shake-heavy effects behind a low-power toggle if profiling shows jank |
| AI-agent-generated code quality drift on larger files (state sync bugs between Phaser and React) | Medium | Medium | Strict architectural boundary (§3, §14): Phaser never imports React; all cross-boundary communication via the typed Zustand store + EventBus only | Add small `console.assert`/manual smoke tests at each phase boundary (per Task 16) rather than a full test suite (time-boxed) |
| Tilemap/sprite pixel-scale mismatch between Kenney packs (different packs, different native tile sizes) | Medium | Low-Medium (visual seams) | Verify all packs used together share a common base unit (Kenney's packs are commonly 16×16, but confirm on each specific pack's page) before combining in one map (Task 3 acceptance criteria) | Scale/pad mismatched tiles in an image editor once, up front, rather than fighting it in-engine |

---

## 19. RESOURCE TABLE

### Game data
| Resource | URL | Type | Provides | License | Commercial | Redistribute | Modify | Attribution | Maintained | Difficulty | Recommended | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PokéAPI (code) | https://github.com/pokeapi/pokeapi | API/DB code | Species/move/type/ability/evolution data | BSD-3-Clause | Yes | Yes | Yes | No (but courteous) | Yes, active 2026 commits | Low (use static dump, not live server) | Yes | Data compilation only, not Nintendo IP (§2.D) |
| PokeAPI/api-data | https://github.com/PokeAPI/api-data | Static JSON | Same data, pre-baked JSON+schema | BSD-3-Clause | Yes | Yes | Yes | No | Yes | Very low | Yes | Use this over live API to avoid runtime dependency |
| pokeapi-js-wrapper | https://github.com/PokeAPI/pokeapi-js-wrapper | JS lib | Cached async API client | MPL-2.0 | Yes | Yes | Yes | Per MPL | Yes | Low | Optional (not needed if bundling JSON) | |

### Sprites
| Resource | URL | Type | Provides | License | Commercial | Redistribute | Modify | Attribution | Maintained | Difficulty | Recommended | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PokeAPI/sprites | https://github.com/PokeAPI/sprites | Image repo | Front/back/shiny/animated Pokémon sprites, all gens | Repo license: CC0 (LICENCE.txt) | See §2.D caveat | See §2.D caveat | See §2.D caveat | Not required by repo, but underlying IP is Nintendo's | Active (2026 commits) | Low (direct file paths) | Private-prototype only (Category D/F) | The compilation is CC0; the characters are Nintendo IP regardless |
| pokeapi-sprites (npm/unpkg mirror) | https://github.com/sashafirsov/pokeapi-sprites | CDN mirror | Same sprites via unpkg | Same origin as above | Same caveat | Same caveat | Same caveat | Same | Fork, less actively maintained than upstream | Very low (CDN URL) | Optional convenience only | |

### Tiles / Maps / Characters / UI / Fonts / Audio (all CC0, safe for any use)
| Resource | URL | Type | Provides | License | Commercial | Redistribute | Modify | Attribution | Maintained | Difficulty | Recommended | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kenney RPG Urban Pack | https://kenney.nl/assets/rpg-urban-pack | Tileset | 480 tiles: buildings/roads/vehicles + 6 walking characters | CC0 1.0 | Yes | Yes | Yes | No | Yes | Low | Yes — primary town tileset | |
| Kenney Roguelike/RPG Pack | https://kenney.nl/assets/roguelike-rpg-pack | Tileset | 1700 top-down tiles/objects | CC0 1.0 | Yes | Yes | Yes | No | Yes | Low | Yes — route/terrain/objects | |
| Kenney Map Pack | https://kenney.nl/assets/map-pack | Tileset | 180 overworld tiles | CC0 1.0 | Yes | Yes | Yes | No | Yes | Low | Optional supplement | |
| MurphysDad RPG Asset Pack | https://murphysdad.itch.io/rpg-asset-pack | Mixed pack | Interior tileset, buildings, player sheet, "blob monster" sheet, NPCs | CC0 | Yes | Yes | Yes | No | Occasional | Low | Optional — useful "blob monster" as generic creature placeholder | |
| Press Start 2P | https://fonts.google.com/specimen/Press+Start+2P | Font | Retro pixel display font | SIL OFL 1.1 | Yes | Yes | Yes | Not required (but keep license file) | Yes (Google Fonts) | Very low | Yes | Use for headers/HUD, not long dialogue |
| Kenney RPG Audio | https://kenney.nl/assets/rpg-audio | Audio | 50 RPG SFX | CC0 1.0 | Yes | Yes | Yes | No | Yes | Very low | Yes | |
| Kenney Interface Sounds | https://kenney.nl/assets/interface-sounds | Audio | 100 UI SFX | CC0 1.0 | Yes | Yes | Yes | No | Yes | Very low | Yes | |
| Kenney Impact Sounds | https://kenney.nl/assets/impact-sounds | Audio | 130 impact SFX | CC0 1.0 | Yes | Yes | Yes | No | Yes | Very low | Yes | For battle hits |
| Kenney Digital Audio | https://kenney.nl/assets/digital-audio | Audio | 60 retro bleeps | CC0 1.0 | Yes | Yes | Yes | No | Yes | Very low | Optional | Good for menu blips |

### Engine / Libraries
| Resource | URL | Type | Provides | License | Commercial | Redistribute | Modify | Attribution | Maintained | Difficulty | Recommended | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Phaser | https://github.com/phaserjs (main site phaser.io) | Game framework | Full 2D engine: renderer, physics, tilemaps, tweens, camera fx, particles | MIT | Yes | Yes | Yes | Notice required (MIT) | Yes, very active | Moderate | **Yes — chosen engine** | |
| Zustand | npm: `zustand` | State lib | Minimal React state store, also importable from non-React code | MIT | Yes | Yes | Yes | Notice required | Yes | Very low | Yes | Bridges React ⟷ Phaser |
| Vite | npm: `vite` | Build tool | Dev server + bundler | MIT | Yes | Yes | Yes | Notice required | Yes | Very low | Yes | |
| Capacitor | https://capacitorjs.com (Ionic) | Native wrapper | Wraps web build into Android/iOS project | MIT | Yes | Yes | Yes | Notice required | Yes | Low-Moderate (Android Studio/Gradle setup is the friction point) | Yes | §12 |

---

## 20. TECHNOLOGY DECISION MATRIX

| Technology | Learning curve | AI-agent friendliness | 2D support | Tilemaps | Animation | Mobile | React integration | TypeScript | Docs | Dev speed | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Phaser 3** | Moderate | **High** (most training data/tutorials of any option) | Excellent | Excellent (native Tiled JSON) | Excellent (tweens/sprite-sheets/particles built-in) | Good (touch input built-in, wraps via Capacitor) | Good, proven pattern (khaifahmi99/pokemon-phaser) | Good (ships own types) | Excellent, huge community | Fast for this exact genre | **CHOSEN** |
| PixiJS | Low-Moderate (rendering only) | Moderate (less "batteries included" so more custom code to review) | Excellent (rendering) | None built-in | Manual | Fine | Fine | Good | Good | Slow overall (must build game layer) | Rejected as primary |
| Kaboom/Kaplay | **Lowest** | Moderate (smaller/newer corpus than Phaser) | Good | Basic | Good, simpler API | Fine | Less common pairing | Good | Very good for basics | Fast for tiny games, weaker for camera-fx-heavy battle scenes | Fallback option only |
| melonJS | Moderate | Lower (smaller community/training corpus) | Good | Good (Tiled-native) | Good | Fine | Uncommon pairing | Good | Moderate | Moderate | Alternative, not chosen |
| Excalibur.js | Moderate | Lower (smaller corpus) | Good | Present | Good | Fine | Uncommon pairing | Excellent (TS-first) | Good | Moderate | Alternative, not chosen |
| React + Canvas (manual) | Low for basics, high at scale | High (plain code, easy to review) | Manual everything | Manual | Manual (must build tween/anim system) | Fine | Native (it *is* React) | Excellent | N/A (no framework docs, general Canvas API docs only) | Slow past trivial scope | Rejected as primary renderer |
| React + DOM/CSS | Low | High | Poor for scrolling tile worlds at 60fps | Very manual | CSS animations only | Fine | Native | Excellent | N/A | Slow/fragile for a real tile world | Used only for the UI shell layer, not the world renderer |

---

## 21. FINAL ARCHITECTURE

**RECOMMENDED STACK**

- **Frontend shell:** React 18 + TypeScript, Vite build.
- **Game engine:** Phaser 3 (MIT), mounted inside a single React component (`<GameCanvas/>`), one long-lived `Phaser.Game` instance, scene-switching (not remounting) between Overworld and Battle.
- **State bridge:** Zustand store as single source of truth for `SaveGame` shape; a `Phaser.Events.EventEmitter` singleton (`eventBus.ts`) for one-shot cross-boundary signals.
- **Game data:** Static JSON (`species.json`, `moves.json`, `types.json`, `trainers.json`), hand-trimmed once from PokéAPI's static `api-data` dump for ~10 species; no runtime API calls.
- **Sprites/art:** Kenney.nl CC0 packs for all original world/character/UI/audio content; PokeAPI/sprites (CC0 repo license, private-prototype-only usage per §2.D) for the actual Pokémon character sprites.
- **Persistence:** `localStorage`, single JSON blob keyed by a `version` field, no backend.
- **Backend:** **None** for this MVP (§4). Deferred future option: FastAPI + SQLAlchemy(async) + asyncpg + Postgres for cross-device cloud saves, using the team's existing expertise, only if/when needed.
- **Android:** Capacitor wrapping the Vite `dist/` build, sideload-only APK, no Play Store submission (legal caveat §2.D).
- **Build:** Vite (dev server + production bundle).
- **Deployment:** Static hosting (Vercel/Netlify/GitHub Pages) for the web build; locally-built APK for Android, distributed by direct install/testing only.

---

## 22. FINAL IMPLEMENTATION ROADMAP (PHASES)

**PHASE 1 — Resource acquisition:** Download/verify-license Kenney packs, Press Start 2P, trim PokéAPI data + sprites for ~10 species (Tasks 1-3).

**PHASE 2 — Project setup:** Vite+React+TS+Phaser scaffolding, Zustand store skeleton, folder structure per §14 (Tasks 1-2, 21-early).

**PHASE 3 — World:** Tiled maps (or array-fallback), BootScene, OverworldScene rendering (Tasks 4-6).

**PHASE 4 — Player:** Movement, collision, direction-facing animation, map transitions (Tasks 7-9).

**PHASE 5 — NPCs/Dialogue:** Dialogue box React overlay + eventBus wiring (Task 10).

**PHASE 6 — Encounters:** Grass-zone trigger + random species roll (Task 11).

**PHASE 7 — Pokédex:** Data loader + Pokédex screen (Tasks 12-13).

**PHASE 8 — Battle core:** BattleScene skeleton, HUD, damage formula, turn loop (Tasks 14-17).

**PHASE 9 — Battle polish:** Animations (lunge/flash/shake/float/faint), catching (Tasks 18-19).

**PHASE 10 — Progression & meta:** Victory/defeat flow, save/load, trainer card, rival battle (Tasks 20, 22-24).

**PHASE 11 — Audio & visual polish:** SFX, optional music, optional CRT filter (Tasks 25-27).

**PHASE 12 — Mobile & deployment:** Web deploy, Capacitor Android wrap, optional touch controls, final bug-bash (Tasks 28-30, Day 5 stabilization pass).

---

## 23. GUIDING PRINCIPLES (carried through every phase)

1. Speed over completeness.
2. Reuse (Kenney/PokéAPI/Phaser/Capacitor) over reinvention.
3. Open-source/CC0 non-Pokémon assets over custom art production; Pokémon-specific assets treated as private-prototype-only IP (§2.D), never as "ours to redistribute."
4. Simple over complex — one damage formula, one type chart subset, one save slot, two maps.
5. Vertical slice over huge scope — 6-10 species, 2 maps, 1 trainer battle is the whole game.
6. Gameplay over backend — no backend exists in this plan.
7. Polish a small area (one grass patch, one battle) rather than build a large world.
8. Automate everything possible — procedural tweens/camera-fx instead of hand-drawn animation frames (§8).
9. The AI coding agent implements from this document phase-by-phase and task-by-task; a human should only need to review/playtest, not make architectural decisions mid-build.
10. No infrastructure the MVP doesn't need — no backend, no database, no multiplayer, no CI/CD beyond a basic build script, no third-party UI kits, no image-generation APIs.
