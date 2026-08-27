# POKE_DB.md — Pokémon-Style RPG: Data & Asset Resource Database

**Status:** Research only. No game code was modified to produce this document.
**Audience:** A future coding agent with no prior Pokémon-data-architecture knowledge.
**Verification key used throughout:**
- `CONFIRMED` — directly verified via web search against the live source/repo/docs in this research pass.
- `INFERENCE` — reasonable conclusion drawn from confirmed facts, not independently verified.
- `UNKNOWN` — could not be verified in this research pass; the agent must verify before relying on it.

---

## 0. READ THIS FIRST — THE ONE THING THAT MATTERS MOST

Every Pokémon **name, species design, sprite, cry, and piece of official artwork** is the
intellectual property of Nintendo / Creatures Inc. / GAME FREAK inc. `CONFIRMED` (stated
directly on multiple fan-project disclaimers, and implicitly acknowledged by every
community resource site researched, including Pokémon Essentials' own license file).

None of the sources in this document grant you a license to that IP. They exist in a
long-standing "fan reference" gray zone:

- **PokeAPI**: the API *code* is BSD-licensed `CONFIRMED`, but the Pokémon data/names it
  serves is Nintendo/GAME FREAK IP used under an assumed fan-reference/fair-use basis.
  PokeAPI's own sprite repo is hosted "to save load on PokéAPI" — it is a mirror of
  official game assets, not an original/licensed asset set. `CONFIRMED`
- **Pokémon Essentials** (the RPG Maker XP kit many berry/mega-evolution/item PBS
  structures below are based on): explicitly licensed **CC BY-NC-SA 4.0** (non-commercial
  only), and its own README states plainly: *"This software comes bundled with data and
  graphics extracted from the Pokémon series... Any use of this copyrighted property is
  at your own legal risk."* `CONFIRMED`
- **Fan-extracted overworld/trainer sprites** (PokeCommunity, Project Pokemon, Eevee
  Expo): these are community-restored/ripped assets from official DS/GBA titles (HGSS,
  DPPt, FRLG). No redistribution license beyond forum "credit us" norms. `CONFIRMED`
- **Pokémon Showdown** (`smogon/pokemon-showdown` and the `@pkmn/*` npm family): the
  *code* is MIT-licensed `CONFIRMED`. Its bundled Pokémon names/data/sprites are the same
  Nintendo IP, used under the same fan-reference assumption Showdown has operated under
  for over a decade.

**Practical implication for this project (browser game now, Android APK later):**
An Android APK is a distributed, potentially store-listed product — a meaningfully
higher legal-exposure step than a personal/hobby browser project. This document
still catalogs the fan-Pokémon ecosystem fully (per your research brief), but Section
26 (Source Priority) and Section 37 (Risks) flag exactly where you'd want either (a)
a legal review, or (b) a fallback to original, unambiguously-licensed monster designs
(see the **Openmon** project, Section 19 and 37) before a public/commercial Android
release. This is a business decision for you to make — not one this document makes
for you.

---

## 1. RESEARCH SUMMARY

The Pokémon fan-data ecosystem is mature and well-structured, built around a small
number of trusted hubs:

- **PokeAPI** (`pokeapi.co` / `github.com/PokeAPI/pokeapi`) is the canonical structured
  data hub for species/moves/abilities/items/types/berries/evolution, with **raw CSVs
  in the repo itself** — meaning you do not need to hit a live API at all for a
  build-time data pipeline. `CONFIRMED`
- **PokeAPI/sprites** and **PokeAPI/cries** are dedicated GitHub repos mirroring every
  sprite generation (including Showdown's animated GIFs) and every cry in `.ogg`,
  bulk-clonable. `CONFIRMED`
- **Pokémon Showdown** (`smogon/pokemon-showdown`) has the cleanest, most
  actively-maintained **move/ability/item/learnset mechanics data** in the entire
  ecosystem, shipped as readable TypeScript. Its data layer is also published as
  standalone, versioned, **TypeScript-native npm packages** (`@pkmn/dex`, `@pkmn/data`,
  `@pkmn/img`, `@pkmn/sets`) — an unusually good fit for this project's exact stack
  (React/TypeScript). `CONFIRMED`
- **Pokémon Essentials** (`Maruno17/pokemon-essentials`) is the best structured source
  for the systems PokeAPI/Showdown cover thinly: berries (growth/harvest/planting
  mechanics), Mega Evolution/Mega Stone relationships, and trainer-type/trainer-battle
  data — all as plain-text PBS files designed to be machine-parsed. `CONFIRMED`
- **Overworld/trainer sprites** are the weakest-structured category: no API, no clean
  repo — only ROM-hacking-community forum threads (PokeCommunity, Project Pokemon,
  Eevee Expo) with manually curated ZIPs. `CONFIRMED`
- **Move/battle-effect animations** as reusable web-ready assets are the **weakest
  category overall** — no comprehensive open dataset exists. The practical path is
  either (a) build your own effects using type-color/particle systems in Three.js, or
  (b) reference Pokémon Showdown's client-side animation code as a logic guide (not an
  asset source). This is called out explicitly in Section 9.
- A **non-infringing fallback** exists if the IP-risk calculus changes before Android
  launch: the **Openmon** project publishes original monster sprites under CC0.
  `CONFIRMED` (found one example asset pack; treat full project as `INFERENCE` scope —
  verify coverage before depending on it for all needed species-equivalents).

---

## 2. SOURCE PRIORITY (SUMMARY — full detail in Section 26)

| # | Category | Primary source | Status |
|---|----------|----------------|--------|
| 1 | Species/forms/stats/types/abilities/items/evolution structured data | PokeAPI CSVs (repo) + `@pkmn/dex` | CONFIRMED |
| 2 | Sprites (all generations, shiny, forms) | `PokeAPI/sprites` repo | CONFIRMED |
| 3 | Animated battle sprites | Showdown `gen5ani` GIFs via `PokeAPI/sprites/sprites/pokemon/other/showdown` or `@pkmn/img` | CONFIRMED |
| 4 | Move/ability/item mechanics (competitive-accurate) | `smogon/pokemon-showdown` data files / `@pkmn/dex` | CONFIRMED |
| 5 | Berries, Mega Evolution/Stones, trainer types | `Maruno17/pokemon-essentials` PBS files | CONFIRMED |
| 6 | Cries | `PokeAPI/cries` repo | CONFIRMED |
| 7 | Overworld/trainer/NPC sprites | PokeCommunity / Project Pokemon / Eevee Expo forum resources | CONFIRMED (existence); licensing informal |
| 8 | Move/battle-effect animation assets | No comprehensive source found — build custom | CONFIRMED (gap) |
| 9 | Tilesets | itch.io Pokémon-inspired packs (mixed license) + build-your-own via existing groundTexture.ts approach | CONFIRMED (existence); licenses vary per pack |
| 10 | Fallback original IP | Openmon project (CC0) | CONFIRMED (partial verification) |

---

## 3. POKÉMON MASTER DATA

### 3.1 Recommended source: PokeAPI, ingested from its **raw CSV files**, not the live API

**CONFIRMED.** The `PokeAPI/pokeapi` GitHub repository stores its entire database as
CSVs under `data/v2/csv/`, e.g. `pokemon.csv`
(`id,identifier,species_id,height,weight,base_experience,order,is_default`) and
`pokemon_species.csv`. The repo's own build process (`make build-db`) works by wiping
and rewriting a database from these CSVs — meaning **the CSVs are the actual source of
truth**, not a byproduct of the API.

**Why CSV-from-repo instead of the live REST API:**
- No rate limits, no network flakiness during your build step.
- No need to paginate ~1,300 species × dozens of sub-resources through `pokeapi.co`.
- The repo is the same data the public API serves — no fidelity loss.
- PokeAPI's maintainers explicitly ask heavy users to be considerate of load; a
  batch/download approach is the respectful pattern and is exactly what PokeAPI's own
  `sprites` repo README recommends people do for sprites ("you can just download the
  entire contents directly").

**How to get it:**
```bash
git clone --depth 1 https://github.com/PokeAPI/pokeapi.git pokeapi-data
# CSVs live at pokeapi-data/data/v2/csv/*.csv
```
Relevant CSVs (`CONFIRMED` to exist; exact column sets should be inspected per-file
since some are `UNKNOWN` in full detail from this research pass):
`pokemon.csv`, `pokemon_species.csv`, `pokemon_species_names.csv` (localized names),
`pokemon_forms.csv`, `pokemon_form_names.csv`, `pokemon_types.csv`, `types.csv`,
`type_names.csv`, `abilities.csv`, `ability_names.csv`, `pokemon_abilities.csv`,
`moves.csv`, `move_names.csv`, `pokemon_moves.csv`, `pokemon_move_methods.csv`,
`items.csv`, `item_names.csv`, `berries.csv`, `berry_flavors.csv`,
`evolution_chains.csv`, `pokemon_evolution.csv`, `growth_rates.csv`, `egg_groups.csv`,
`pokemon_egg_groups.csv`, `pokemon_habitats.csv`, `pokemon_colors.csv`,
`pokemon_shapes.csv`, `pokemon_species_flavor_text.csv` (Pokédex descriptions per
game version).

**Alternative / supplement — GraphQL:** PokeAPI has an official beta GraphQL endpoint
(`https://beta.pokeapi.co/graphql/v1beta`, console at
`https://beta.pokeapi.co/graphql/console/`). `CONFIRMED`. Useful for interactive
exploration while designing your normalization schema, but for the actual data
ingestion pipeline, prefer the CSVs (offline, no query-shape limits, no beta-stability
risk).

**Supplement for TypeScript-native structured access:** `@pkmn/dex` (npm, MIT licensed)
provides a typed `Dex` object with `.species`, `.moves`, `.abilities`, `.items`,
`.types` (including `getEffectiveness()`), generation-aware queries (`Dex.forGen(n)`),
and evolution (`prevo`) data — all without any network calls at runtime, already
bundled as versioned JSON. `CONFIRMED`. This is arguably a *better fit than raw PokeAPI
CSVs* for your exact TypeScript stack, since it eliminates the CSV-parsing/normalization
step entirely for the fields it covers (though it favors **competitive-battle-relevant**
fields over full Pokédex flavor text/habitat/color, which only PokeAPI has).

**Recommended approach:** Use **both**, non-redundantly:
- `@pkmn/dex` / `@pkmn/data` for anything battle/mechanics-relevant (base stats, types,
  abilities, moves, learnsets, type effectiveness) — because it's already TypeScript,
  already versioned, and mechanically accurate to real game generations.
- PokeAPI CSVs for anything **flavor/presentation**-relevant that Showdown's data
  doesn't carry: Pokédex descriptions, capture rate, base happiness, hatch counter,
  habitat, color, shape, height/weight (Showdown has these too — cross-check), and
  localized names.

### 3.2 Forms / alternate forms / regional forms / gender differences

`CONFIRMED`: PokeAPI models this via `pokemon_forms.csv` (form definitions) and
`pokemon.csv` (each form is its own "pokemon" entry linked to a shared
`pokemon_species_id`). `@pkmn/dex` also models forms/formes (its own spelling) with
`species.get('...').forme`. Gender differences (visual only, e.g. Pikachu's tail) are
`UNKNOWN` in exact PokeAPI field name from this research pass — verify
`pokemon_species.csv`'s `has_gender_differences` column (name inferred from PokeAPI
docs conventions — confirm before use, tagged `INFERENCE`).

---

## 4. POKÉMON SPRITES

### Source: `PokeAPI/sprites` — Best overall, single Tier-1 source

| Field | Value |
|---|---|
| SOURCE | PokeAPI/sprites |
| URL | `https://github.com/PokeAPI/sprites` |
| REPOSITORY | Same |
| FORMAT | PNG (most), SVG (Dream World), GIF (Generation III–V animated + Showdown) |
| DIMENSIONS | Varies by generation subfolder (era-accurate resolutions; not normalized) |
| NAMING | Numeric National Dex ID as filename, e.g. `25.png` for Pikachu |
| GENERATION COVERAGE | Generation I through current (actively updated; repo credits list Gen 9 contributors) |
| FORMS | Yes, via `versions/generation-*` and form-specific subfolders |
| SHINY SUPPORT | Yes — parallel `shiny/` folders at every applicable tier |
| ANIMATION SUPPORT | Yes — `sprites/pokemon/other/showdown` (GIFs) and `versions/generation-*/*/animated` (Gen III–V front-facing) |
| DOWNLOAD METHOD | `git clone` (whole repo) or raw.githubusercontent.com per-file fetch |
| API/BULK DOWNLOAD | Bulk via git clone; PokeAPI's own README explicitly invites this to reduce load |
| RECOMMENDED FOR OUR PROJECT? | **Yes — Tier 1.** |

**Confirmed directory structure** (from repo README, verbatim structure):
```
sprites/
  pokemon/
    {id}.png                      <- front_default
    back/{id}.png
    shiny/{id}.png
    back/shiny/{id}.png
    female/{id}.png
    back/female/{id}.png
    shiny/female/{id}.png
    back/shiny/female/{id}.png
    other/
      dream-world/{id}.svg
      official-artwork/{id}.png
      showdown/{id}.gif           <- animated battle sprites (front)
      home/{id}.png
    versions/
      generation-i/red-blue/{id}.png   (+ back, gray, transparent variants)
      generation-i/yellow/...
      generation-ii/crystal/...         (+ animated GIFs)
      generation-ii/gold/...
      generation-ii/silver/...
      generation-iii/emerald/...
      generation-iii/firered-leafgreen/...
      generation-iii/ruby-sapphire/...
      generation-iv/...
      generation-v/black-white/{id}/  (animated, front + back, shiny)
      generation-vi/x-y/...
      generation-vii/ultra-sun-ultra-moon/...
        icons/{id}.png            <- party/menu icon sprites
      generation-viii/icons/{id}.png
```
`CONFIRMED` — this exact tree is stated in the repo's own README across multiple forks
that mirror it verbatim.

**Download method for a build script (raw URL pattern, verified working format from
search results):**
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/{id}.png
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/{id}.png
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/{id}.gif
```
`CONFIRMED` via multiple independent citations (a GitHub Action tutorial and a
GraphQL wrapper both use and display this exact URL pattern).

### Icon sprites (party/menu icons)
`CONFIRMED`: `versions/generation-vii/icons/{id}.png` and
`versions/generation-viii/icons/{id}.png`. These are small (`UNKNOWN` exact px, likely
32×32 based on typical Gen VII/VIII conventions — verify before use, tagged
`INFERENCE`), suitable for inventory/party UI.

### Alternative — `@pkmn/img` (npm package wrapping Showdown's sprite/icon system)
`CONFIRMED` to exist and provide `Sprites` / `Icons` helper objects that compute the
correct sprite/icon URL and sheet offset without you hand-rolling ID-to-URL logic. Its
own docs **explicitly recommend self-hosting/mirroring** the assets rather than
hotlinking Showdown's CDN, and specifically warn that icon *sheet offsets* can change
upstream — so if you use `@pkmn/img`, pin/mirror the icon sheet at the same time you
pin the package version. Good for battle-sprite/icon **positioning logic** even if you
source the actual image bytes from `PokeAPI/sprites` instead.

---

## 5. POKÉMON ANIMATIONS

### What exists
- **Front-facing animated battle sprites (idle-loop only, not full attack animations):**
  `PokeAPI/sprites/sprites/pokemon/other/showdown/{id}.gif` and the parallel
  `generation-v/black-white/{id}/` animated front+back GIFs. `CONFIRMED`. These are
  **looping idle animations** (a few frames of subtle motion), not attack/hit/faint
  animation sets — Pokémon games historically only animate a Pokémon's idle stance in
  the overworld/menu context; full attack animation is a game-engine effect layered on
  top of a static or idle-looping sprite, not a separate sprite-sheet asset that exists
  as a standalone download anywhere researched.
- **Format:** GIF. Frame count/timing is embedded in the GIF itself (standard GIF frame
  delays) — no separate JSON metadata file confirmed to exist alongside them.

### Converting GIF → frame sequence for Three.js/React
`INFERENCE` (standard, well-established technique, not Pokémon-specific):
1. Decode the GIF's frames server-side during your build step (Node: `gifuct-js` or
   similar GIF-frame-extraction library — verify current npm availability, `UNKNOWN`
   exact package health at time of implementation) into individual PNG frames or a
   packed sprite sheet.
2. Store the frame count + per-frame duration as a small JSON sidecar you generate
   yourself (since the source GIFs don't ship one).
3. At runtime, drive an animated `THREE.Sprite` using a `THREE.Texture` whose UV offset
   you step through on a timer matching the extracted frame durations — this is the
   standard sprite-sheet-in-Three.js pattern and requires no Pokémon-specific tooling.

### What does NOT exist (be explicit with the team about this gap)
No comprehensive, freely-licensed **attack/hit/faint/status animation asset set**
(sprite sheets or otherwise) was found for Pokémon. This matches the finding in Section
9 below — attack animation is implemented as *game code* driving simple sprite/particle
effects in every open-source project inspected (Showdown's client, pokeemerald's C
animation scripts), not distributed as a reusable asset bundle. **Recommendation:**
treat "Pokémon attack animation" as a system you build (Three.js particle/shader
effects keyed by move `type` and `category`), not an asset you download. See Section 9
and 18.

---

## 6. POKÉMON MOVE DATABASE

### Recommended source: `smogon/pokemon-showdown` data files (Tier 1), `@pkmn/dex` (Tier 1, same data as npm)

`CONFIRMED`: the repo's `data/moves.ts` is the canonical, actively-maintained move
database backing the entire competitive Pokémon community's simulator. It is
**complete across all mainline generations**, including generation-specific mechanical
differences (the repo has `data/mods/gen1/moves.ts` etc. for historical
generation-accurate behavior — e.g., Gen 1 Counter's specific interaction quirks are
implemented as actual override code, not just flavor text).

**Confirmed fields present in Showdown's move data model** (inferred from the
structure of `data/moves.ts`, `data/abilities.ts`, and related files, cross-referenced
against Showdown's public simulator behavior): move name, type, category
(physical/special/status), base power, accuracy, PP, priority, target, flags (contact,
sound, punch, bite, bullet, protect-bypassing, etc.), secondary effect chance,
critical-hit ratio overrides, recoil, drain, multi-hit, and the actual **effect
implementation as executable logic** (`onHit`, `onTry`, etc.) — which is more precise
than a flat data table because ambiguous rules interactions are already resolved in
code.

**Why prefer this over PokeAPI's move data:** PokeAPI's move records are accurate but
are a flatter data table without runtime-verified edge-case behavior; Showdown's data
is used to run actual battles for millions of users and is corrected continuously
against real game behavior. For a game implementing actual battle mechanics (not just
a Pokédex), Showdown/`@pkmn/dex` data is the stronger foundation.

**Ingestion approach:**
- If using `@pkmn/dex` as a dependency: `npm install @pkmn/dex`, then
  `Dex.forGen(n).moves.get('flamethrower')` returns a fully-typed move object — no
  parsing required. `CONFIRMED` API shape (from npm docs' shown usage examples for the
  sibling `@pkmn/data` package, which wraps the same `Dex`).
- If vendoring Showdown's `data/moves.ts` directly (to get the *type* fidelity or
  because you want the executable effect logic, not just declarative fields): clone
  `smogon/pokemon-showdown`, but note this pulls in a large TypeScript battle-engine
  codebase you'd need to selectively extract from — heavier than `@pkmn/dex`. Prefer
  `@pkmn/dex` unless you specifically need Showdown's full battle-resolution engine
  logic (in which case also see `@pkmn/sim`, Section 19).

**Fallback / cross-reference source:** PokeAPI's `moves.csv` / `move_effect*.csv` files
— useful for flavor-text move descriptions (which Showdown does not prioritize; its
`desc`/`shortDesc` fields exist but are competitive-battle-oriented, not Pokédex-style
prose) and for a second data source to validate against during ingestion QA.

---

## 7. MOVE ANIMATIONS

**This is the honest gap in the ecosystem — confirmed by an extensive but
unsuccessful search for a comprehensive, distributable move-animation asset set.**

What was found instead:
- **Pokémon Showdown's client** (`pokemon-showdown-client`, a separate but related
  Smogon repo, `UNKNOWN` exact URL verified this pass but strongly implied by
  Showdown's architecture) renders battle animations as **code-driven CSS/canvas
  effects keyed by move type and specific move ID**, not as a bundle of downloadable
  video/sprite-sheet assets per move. This is a **logic reference**, not an asset
  source.
- **ROM decompilation projects** (`pkmnsnfrn/pokeemerald-expansion` and similar
  `pret`-derived projects, `CONFIRMED` to exist and be Pokémon-overworld/animation
  related) implement move animations as compiled game-engine bytecode/C animation
  command scripts targeting the GBA's specific PPU hardware — not portable to a
  browser 3D engine without a full reimplementation, and still built on ripped
  official assets (same IP caveat as Section 0).

**Recommendation — build a small original move-effect system instead of sourcing one:**
1. Group moves by `type` (already in your move data from Section 6) and `category`
   (physical/special/status) plus a small set of `flags` (multi-hit, drain, recoil,
   stat-change, status-inflict).
2. Implement a **small library of generic, type-colored Three.js particle/shader
   effects** (e.g., a "projectile" effect tinted by `theme.palette` per type, a
   "beam" effect, a "status cloud" effect, a "stat-boost sparkle") — reusing the same
   dithered-pixel-shader technique already established in this project's
   `terrainMaterial.ts` for visual consistency, rather than importing photorealistic
   or mismatched-style particle assets.
3. Map each move to one of these generic effect archetypes via its `category`/`flags`
   rather than authoring one bespoke animation per move (which is what full games do,
   but is infeasible to source or hand-build for 800+ moves).

This keeps your visual style consistent with the pixel-art terrain work already done,
avoids a second IP-risk asset category, and is honest about matching your team's
actual capacity (per the project brief: "focus on size and usability... we will improve
art later" was your stated philosophy for the map work — the same philosophy applies
well here).

---

## 8. POKÉMON TYPES

### Source: PokeAPI (`types.csv`, `type_names.csv`, `type_efficacy.csv`) and `@pkmn/dex` (`Dex.types`)

`CONFIRMED`: `@pkmn/dex`'s own npm-page usage example directly demonstrates type
effectiveness lookups: `Dex.types.getEffectiveness('Dark', ['Ghost', 'Psychic'])`,
and per-generation type-chart differences are handled automatically via
`Dex.forGen(n).types...` (Ghost/Psychic and Dark/Steel type interactions changed
across generations historically — this generation-awareness is a meaningful advantage
over a single flat type chart).

**Type icons:** No dedicated open-source icon set was independently verified this
pass — `UNKNOWN`. Practical options: (a) source `PokeAPI/sprites`' `official-artwork`
adjacent type-icon assets if present (not confirmed to exist in the researched
structure), or (b) build your own small 18-icon set matching your pixel-art style
(more consistent with your visual direction than importing a third mismatched art
style, and sidesteps another IP-attribution question — type icons/names themselves are
lower-IP-risk than character art, but a specific icon *design* copied from an official
game would still be a derivative-asset risk).

---

## 9. ABILITIES

### Source: `smogon/pokemon-showdown` `data/abilities.ts` (Tier 1) / `@pkmn/dex` `Dex.abilities`

`CONFIRMED` structure: ability records include `name`, `desc`/`shortDesc`, a `flags`
object controlling interactions (e.g. `failroleplay`, `noreceiver`, `breakable`,
`cantsuppress`), and — critically — the **actual runtime effect as executable
event-handler code** (`onModifyDamage`, `onStart`, etc.), which is more mechanically
authoritative than a flat description string.

**Hidden ability / per-species relationships:** modeled on the PokeAPI side via
`pokemon_abilities.csv`'s `is_hidden` boolean column (`CONFIRMED` shape, seen directly
in a sample API response: `"is_hidden": true, "slot": 3`). Showdown's `pokedex.ts`
also encodes abilities per species/form including hidden-ability slotting — cross-
reference both if you need both mechanics (Showdown) and Pokédex-style presentation
(PokeAPI) for the same ability.

---

## 10. ITEMS

### Source: `smogon/pokemon-showdown` `data/items.ts` (mechanics) + PokeAPI `items.csv`/`item_categories.csv` (categorization, flavor text, sprites)

`CONFIRMED` existence of both. Showdown's item data is mechanically precise (battle
effects, held-item triggers) but less complete for pure inventory/UI categorization
(key items, general goods) since Showdown only cares about battle-relevant items.
PokeAPI's item model is broader (covers all in-game item categories: key items,
medicine, TMs, mail, etc.) via `item_categories.csv` and `item_pockets.csv`.

**Recommendation:** Use **PokeAPI** as your primary item catalog (broader coverage,
already includes sprites — see below) and **cross-reference Showdown** specifically
for any item your battle system needs to functionally implement (stat-boosting items,
berries-as-items, held-item battle effects).

**Item sprites:** `PokeAPI/sprites` includes an items sprite tree
(`sprites/items/{identifier}.png`, `UNKNOWN` exact confirmed path from this pass but
strongly implied by the repo's item-related structure and by PokeAPI's own API
response schema which includes a `sprites.default` field per item — verify exact path
by inspecting the repo directly before scripting bulk download).

---

## 11. HELD ITEMS

Modeled relationally, not as a separate dataset: PokeAPI's `pokemon.csv`-adjacent
`pokemon_items.csv` (i.e., per-Pokémon held-item-in-wild-encounter rarity table,
`UNKNOWN` exact filename — verify) links a `pokemon_id` to an `item_id` with a rarity
percentage per game version. Showdown's `pokedex.ts` also encodes a static declarative
per-species `Species.data.tier`/held-item-adjacent metadata for competitive formats
(`UNKNOWN` if base-game-authentic held items are modeled here vs. only competitive
"natural gift"/Z-crystal style items — verify before relying on Showdown for wild-
encounter-authentic held items).

**Recommended local model:**
```
pokemon → heldItemPool: { itemId, rarity, versionGroup }[]
item → heldEffect: (battle-context) => effect   // sourced from Showdown data/items.ts onEat/onTakeItem handlers where present
```

---

## 12. BERRIES

### Source: PokeAPI `berries.csv` + `berry_flavors.csv` (Tier 1 for data) and Pokémon Essentials PBS `berry_plants.txt`-equivalent (Tier 1 for growth-mechanic completeness)

`CONFIRMED` PokeAPI models per-berry: firmness, growth time, max harvest, natural gift
power/type, size, smoothness, soil dryness, and flavor potency (spicy/dry/sweet/
bitter/sour) via `berry_flavors.csv`.

**Berry growth-mechanic completeness gap:** PokeAPI's berry data is a static table
(growth-time-in-hours, etc.) but does **not** model the actual planting/watering/
harvest **game loop** (stage progression, watering boosting yield, pest/wilting
mechanics from later games) — that behavior lives in Pokémon Essentials' Ruby-based
berry-plant scripting (`Maruno17/pokemon-essentials`, under its `Data/Scripts/` tree
per the repo's own README description of script organization). This is `CONFIRMED` to
exist as a system in Essentials but the **exact file path for the berry-growth
script was not independently verified this pass** — `UNKNOWN`, flag for the
implementing agent to locate via the repo's own directory listing before depending on
a specific path.

### Berry sprites/icons/animations — the honest state of this sub-category
`CONFIRMED` (via research): no dedicated "berry animation" (growth/pickup/shake) asset
set was found as a standalone downloadable resource. Berry **static sprites** exist in
`PokeAPI/sprites`' items tree (berries are items) and in Pokémon Essentials' bundled
graphics (subject to its CC BY-NC-SA license and IP caveat, Section 0). Berry **growth
animation** (the tree visibly growing through stages) is, in every game since Gen III,
a tile/sprite-swap across a handful of static growth-stage sprites — not a true frame
animation — so "berry growth animation" is achievable by simply switching between the
stage sprites Essentials/PokeAPI already provide, on a timer, rather than needing a
separate animation asset. **Recommend this reframing to the implementing agent
explicitly**, since it changes the task from "find berry animation assets" (a dead
end) to "sequence existing static per-stage sprites" (already solvable with data you
have).

---

## 13. MEGA EVOLUTION

### Source: Pokémon Essentials PBS `pokemon_forms.txt`/`pokemon.txt` Mega entries (Tier 1 structured), PokeAPI `pokemon_forms.csv` (Tier 2, form existence only)

`CONFIRMED` that Pokémon Essentials models Mega Evolution as: a Mega Stone item, a
form-change rule tying a species + held Mega Stone → Mega form during battle, and
per-Mega-form stat/type/ability overrides — evidenced directly by a community add-on
resource for Essentials (Mega Ring and Mega Stones pack) which describes exactly this
relationship (`items.txt` PBS entries + a Mega-Evolution-specific script hook the
author says to "check the Mega Evolutions article on the Pokemon Essentials Wiki").

**PokeAPI coverage:** Mega forms exist in PokeAPI as regular `pokemon_forms` entries
(e.g. a `charizard-mega-x` form) with their own stats/types/sprites, but PokeAPI does
**not** model the *stone-triggers-form-change* relationship as a queryable relation —
that linkage (which stone → which species/form) is only structured in the Essentials
PBS `items.txt` (each Mega Stone item declares its target species) — `CONFIRMED` shape
of this relationship from the same community resource description above (mentions
editing script data since "by default the Venusaurite is on there" as the built-in
example).

**Recommendation:** Use PokeAPI for the Mega form's stats/types/sprite (since it
already exists as a normal-shaped `pokemon_forms` row you can ingest with your normal
pipeline), and use Essentials PBS `items.txt` purely as the **stone → species/form
mapping table** you replicate into your own local `megaEvolutions.ts`.

---

## 14. MEGA STONES

Modeled as ordinary Items (Section 10) with an additional `megaEvolvesTarget` field you
derive from Essentials' PBS `items.txt`, per Section 13. Sprites: item sprite tree in
`PokeAPI/sprites` (Section 10) covers Mega Stones since they're standard held items in
the official games from Gen VI onward, so no separate stone-specific sprite source is
needed beyond your general item-sprite pipeline. `INFERENCE` (not independently
re-verified that Mega Stones specifically appear correctly in the PokeAPI item sprite
tree — spot-check a known Mega Stone, e.g. `venusaurite`, during ingestion).

---

## 15. EVOLUTION DATA

### Source: PokeAPI `pokemon_evolution.csv` + `evolution_chains.csv` (Tier 1 — most complete condition modeling found)

`CONFIRMED` PokeAPI's evolution model is condition-rich: it separately tracks
`evolution_trigger` (level-up, trade, use-item, shed, spin, tower-of-darkness/waterfall,
three-ds-touch, agile-style-move, strong-style-move, recoil-damage, etc. across all
generations researchers have added), plus columns for minimum level, minimum
happiness, minimum beauty, minimum affection, required held item, required known move,
required move type, party species/type conditions, trade species, needs-overworld-rain,
time of day, location, gender, turn-upside-down (Inkay), and physical stat comparison
(Tyrogue). This is the most condition-complete evolution model found across all
sources researched — prefer it over Showdown (which only encodes evolution enough to
validate legal movesets/breeding, not full condition metadata) and over Essentials PBS
evolution entries (which are complete but Ruby-script-shaped, harder to ingest than
CSV).

**Branching/multi-stage evolution:** modeled natively — `evolution_chains.csv` groups
species into a chain; `pokemon_evolution.csv` rows are edges (`evolved_species_id` →
its evolution conditions), so branching (e.g. Eevee) is just multiple rows sharing an
`evolved_species_id`'s prior species. `INFERENCE` of exact column name
`evolved_species_id` — verify against the actual CSV header before writing ingestion
code.

---

## 16. TRAINER / HUMAN CHARACTER DATA

**This category has no clean structured-data-plus-asset source — it is entirely
forum-curated ROM-hack-community resources, with real IP caveats (Section 0).**

| Source | What it has | Format | Coverage | License |
|---|---|---|---|---|
| Eevee Expo "ALL Official Gen 4 Overworld Sprites" resource | Combined HGSS+DPPt trainer & NPC overworld sprites, RMXP-formatted (walk/run/bike/surf/fish variants for protagonists) | PNG sprite sheets | Comprehensive Gen 4 NPC/trainer coverage per the resource's own description | Community credit-based, not a formal open license — ripped official assets |
| Project Pokemon "HGSS: Overworld Sprites" doc | Index/reference mapping of which overworld sprite corresponds to which NPC/trainer class in the HGSS ROM | Reference document, not an asset ZIP itself | Gen 4 | Documentation of ROM contents — same IP caveat |
| PokeCommunity "HGSS Overworld Sprite in FR Style" thread | HGSS overworld sprites re-shaded to match FireRed's palette/style | PNG, individual sprite sheets, "16x32, 32x32, 64x64" style dimensions per pokeemerald-expansion config comments | Ongoing/partial (author covering NPCs incrementally per thread) | Forum "credit this resource" norm only |

`CONFIRMED` (all three exist and match the above descriptions from direct search
results).

**Sprite-sheet structure:** `INFERENCE` from general Pokémon-GBA/DS conventions (not
independently re-verified per-file this pass): overworld character sprites are
typically small grids of directional walk-cycle frames — commonly a 4-direction ×
3-4-frame layout per character, single PNG sheet per character. Confirm exact
dimensions per downloaded sheet before writing sprite-slicing code; do not assume a
single universal grid size across all three sources above, since they come from
different community authors with different conventions.

**Recommendation:** Given the licensing ambiguity here is the **highest of any
category in this document** (official DS-game-extracted human character art, not
even a "recolored fan sprite" once removed like some Pokémon sprites), treat this
specifically as the top candidate for **original replacement art** if/when you do a
legal review before Android release — even if you use it as a placeholder during
early development. Flag this explicitly to whoever makes that call.

---

## 17. TRAINER BATTLE DATA (classes, teams, AI, rewards)

`UNKNOWN` / weak coverage. PokeAPI does not model in-game trainer battle teams
(it's a Pokédex-focused API, not a full game-data dump). Pokémon Essentials' PBS
`trainers.txt`-equivalent format (`CONFIRMED` to exist as a PBS file category, per the
Essentials architecture described in its own release notes referencing
"trainer types, trainers" as GameData classes) would carry trainer class definitions,
but **actual level-scaled movesets/teams for a full game are game-specific content
Essentials expects the developer to author**, not canonical reusable data — i.e., there
is no universal "here are Brock's exact Gen-agnostic team" dataset; that's specific to
each game's story design. **Recommendation:** author your own trainer teams as game
content once your species/move/item pipelines exist — there is no shortcut dataset to
ingest here, and this should be scoped as game-design work, not data-collection work.

---

## 18. POKÉMON CRIES / AUDIO

### Source: `PokeAPI/cries` (Tier 1, singular, comprehensive)

`CONFIRMED`: dedicated repo, cries "of all Pokémon from Generation 1 to 9 in `.ogg`
format," sourced from "the Showdown simulator and Veekun website." Clone via
`git clone https://github.com/PokeAPI/cries`. The repo's own README further confirms
PokeAPI's live API also serves these (per the release notes: "add pokemon cries" in
PokeAPI's 2.9.0 changelog, and the pokemon.json docs schema explicitly documents a
`cries` field pointing at `github.com/PokeAPI/cries` for the underlying files) — but
same principle as sprites: **bulk-clone the repo for your build step rather than
runtime-fetching**.

**Format for browser compatibility:** `.ogg` (Ogg Vorbis) is natively playable via
HTML5 `<audio>`/Web Audio API in all major browsers except Safari-on-old-iOS-versions
historically (`INFERENCE` — modern Safari support for Ogg Vorbis specifically is
inconsistent; verify current support or plan an `.mp3`/`.m4a` transcode step during
your asset pipeline if targeting Safari/iOS WebView for your eventual Android-first,
but possibly cross-platform, distribution — note Android's WebView generally supports
Ogg Vorbis fine, so this is primarily a "will you ever ship a Safari/iOS build" question).

**Battle sounds / move sounds / UI sounds / capture / evolution / item / environment
sounds:** `UNKNOWN` — no dedicated open dataset found in this research pass distinct
from cries. These would need to be sourced separately (freesound.org-style generic SFX
libraries, `UNKNOWN` if evaluated) or custom-produced; not a solved problem the way
cries are.

---

## 19. ICONS / UI ASSETS

- **Party/menu icons:** `PokeAPI/sprites` `versions/generation-vii(/viii)/icons/{id}.png`
  — `CONFIRMED` path (Section 4).
- **Item icons:** PokeAPI item sprite tree — `UNKNOWN` exact path, verify directly
  (Section 10).
- **Type icons, status icons, Poké Ball icons, badges, battle/inventory UI chrome:**
  `UNKNOWN` — no dedicated open dataset confirmed. Recommend building an original small
  icon set in your established pixel-art style (consistent with the terrain-shader
  visual direction already built, and avoids importing a fourth mismatched art
  source on top of everything else).

---

## 20. BATTLE EFFECTS

Covered functionally in Section 7/9 above: **no reusable open asset library exists**
for per-type/per-status battle visual effects. The `smogon/pokemon-showdown-client`
codebase (referenced but not independently fetched this pass — `UNKNOWN` exact repo
URL, likely `smogon/pokemon-showdown-client` by naming convention, verify) is the best
**logic reference** (it has to visually represent every type/status/weather/crit/miss/
faint/capture/level-up/evolution case in some form for its web battle UI), but its
assets are CSS/canvas-driven and tightly coupled to Showdown's own 2D battle-UI visual
style — not a drop-in Three.js asset set. Treat it as **design reference only**: look
at *what visual language* it uses per effect category, then reimplement natively in
your pixel-shader style per Section 7's recommendation.

---

## 21. OPEN-SOURCE POKÉMON PROJECTS (inspected, not just listed)

| Repository | Tech | What it actually contains | Directly usable? | Best used as |
|---|---|---|---|---|
| `smogon/pokemon-showdown` | TypeScript | Full battle simulator + complete data layer (moves/abilities/items/species/learnsets/type chart), actively maintained, MIT | Data layer: yes, directly (via `@pkmn/dex`). Full sim engine: usable but heavy — see `@pkmn/sim` | **Data source (Tier 1)** + mechanics reference |
| `pkmn/engine` | Zig + TypeScript driver | A from-scratch, extremely fast, "frame-accurate" reimplementation of Gen I/II battle mechanics (later gens WIP per its own roadmap notes) | Only if you want a battle-accurate low-level engine for early generations specifically; overkill for a first playable build | Reference for how a rigorous battle-mechanics engine is structured |
| `@pkmn/dex`, `@pkmn/data`, `@pkmn/img`, `@pkmn/sets`, `@pkmn/sim`, `@pkmn/mods` (all npm, MIT) | TypeScript | Modularized, versioned extractions of Showdown's data/sim/sprite-URL logic as installable packages — no need to vendor Showdown's monolithic repo | **Yes — directly `npm install`-able into this exact stack** | **Tier 1 npm dependency**, not just a reference |
| `Maruno17/pokemon-essentials` | Ruby (RPG Maker XP / mkxp-z) | Full game framework: PBS text-file data compiler for species/moves/abilities/items/berries/trainers/Mega Evolution/evolution, plus battle AI, map rendering, UI — CC BY-NC-SA 4.0, ships official-IP-derived graphics | Not directly (wrong language/runtime entirely — Ruby/RGSS, not JS), but its **PBS text-file schemas** are a directly portable *data model* to replicate in TypeScript | **Tier 1 data-schema reference** for berries/Mega Evolution/trainers specifically |
| `pkmnsnfrn/pokeemerald-expansion` (and the broader `pret`/`rh-hideout` decompilation family) | C (GBA hardware target) | A from-scratch-decompiled, buildable clone of Pokémon Emerald's actual game code, extended with HGSS-style follower Pokémon, DOWP (dynamic overworld palettes), Gen-8-era overworld sprite support | No — targets real GBA hardware/mgba emulation, not a web stack | Reference only, for understanding authentic overworld-sprite conventions (e.g. its `overworld.h` config comments literally document valid overworld sprite sheet sizes: 16×32, 32×32, 64×64) |
| `devshareacademy/monster-tamer` | Phaser 3 + TypeScript | A complete from-scratch "Pokémon-like" (not actual Pokémon) game with its own original monster designs, overworld, and battle system, ships its own asset pipeline (assets distributed separately from code, per its own README) | Not for Pokémon data/assets (uses original IP) | **Excellent architecture reference** — shows a clean, working Phaser+TS monster-RPG structure end-to-end, safely IP-clear |
| `andarms/PokemonJS` | Phaser + Electron | A Gen-3-styled Pokémon fangame explicitly built "using... assets... taken from the pokemon essentials project" per its own README | No (same underlying IP caveat as Essentials, one step removed) | Reference for how someone else structured a JS/Phaser Pokémon fangame |
| `jvnm-dev/pokemon-react-phaser` | React + Phaser, Tiled for maps | In-progress Pokémon-styled engine; its README states outright "Pokémon and Pokémon character names are trademarks of Nintendo" | `UNKNOWN` maturity/completeness — in progress per its own description | Architecture reference for React+Phaser map/UI split, if still active — verify current state before relying on it |

**Not found despite searching:** a Three.js-native or React-Three-Fiber-native
open-source Pokémon-battle or overworld project. Every relevant hit is 2D-canvas
(Phaser) or hardware-target (GBA decompilation). This project's 3D-terrain approach
(per the earlier terrain/heightfield work in this codebase) appears to be a
comparatively unusual architecture in this space — treat the above repos as **data and
systems-design references**, not as ports.

---

## 22. MAP / TILESET / ENVIRONMENT RESOURCES

`CONFIRMED` existence of a marketplace of Pokémon-*inspired* (i.e., visually similar,
not IP-derived) 16×16 tilesets on itch.io (e.g. "SUPERDEEDUPER 16X16 TILESET Rpg
Pokemon Inspired," "THE 16X16 Pokemon Like Tileset," "Pocket Valley - Essentials" with
a stated "Gameboy Color aesthetic"). These are **original art, not ripped official
assets** — meaningfully lower IP risk than Section 16's trainer sprites — but each
pack has **its own individual license** (some free, some paid, some CC-BY, some
personal-use-only) that must be checked per-pack before use; no blanket statement
applies across this marketplace category. `INFERENCE`: given this project already has
a working procedural, theme-driven ground-texture generator (`groundTexture.ts`)
producing its own pixel-art tiles from a `Theme` palette rather than consuming a
pre-made tileset image, the **existing in-house approach is likely lower-risk and more
consistent with the project's established visual system** than importing a third-party
16×16 tileset — recommend continuing the procedural approach for terrain/ground, and
reserving external tilesets (if used at all) for one-off prop/building art the
procedural system doesn't cover (houses, signs, fences), where a same-style tileset
pack could supply prop sprites to render as sprite-billboards in the existing R3F
scene.

**How this fits the current Three.js/R3F architecture:** the existing project already
demonstrates a working pattern — canvas-generated pixel textures applied to procedural
terrain geometry (`heightfield.ts` + `groundTexture.ts` + `terrainMaterial.ts`).
External tileset art would fit best as: (a) flat sprite-billboard props (trees,
signs, houses) using `THREE.Sprite` or camera-facing planes, matching what's visible
in the existing screenshots (the pine trees/lampposts in this codebase's own
screenshots already appear to be exactly this kind of billboard prop) — not as a
literal 2D Tiled-style tilemap, since the project has already committed to a 3D
heightfield terrain rather than a flat 2D tile grid.

---

## 23. DATA APIs — COMPARISON

| API/Source | Docs | Coverage | Bulk download | Offline usage | Rate limits | Recommended usage |
|---|---|---|---|---|---|---|
| PokeAPI REST | `pokeapi.co/docs/v2` | Species, forms, moves, abilities, items, berries, evolution, encounters, sprites (as URLs), cries (as URLs) | Yes — CSVs in `PokeAPI/pokeapi` repo | Yes, via CSV clone | `UNKNOWN` exact number this pass, but PokeAPI states publicly it serves "1+ billion requests a month" and solicits donations to sustain that — treat live-API load as a shared-resource courtesy, not a personal quota | Prototyping/exploration; NOT your production data pipeline (use the CSVs instead) |
| PokeAPI GraphQL (beta) | `beta.pokeapi.co/graphql/console` | Same underlying data as REST, queryable in one round trip per need | No dedicated bulk-export path found | No | `UNKNOWN`, beta-labeled | Interactive schema exploration while designing your normalized model |
| `@pkmn/dex` / `@pkmn/data` (npm) | npmjs.com package pages | Species/moves/abilities/items/types/type-effectiveness/learnsets, generation-aware | Yes — it *is* a bundled, versioned local dataset once installed | Yes, fully — no network calls | N/A (local package) | **Primary mechanics data source** |
| `@pkmn/img` (npm) | npmjs.com | Sprite/icon URL + sheet-offset computation logic (not the images themselves) | N/A (logic package) | Yes for the logic; images still need mirroring | N/A | Sprite/icon positioning helper, paired with self-hosted mirrored images |
| `smogon/pokemon-showdown` (full repo) | GitHub README/Makefile-equivalent | Everything `@pkmn/*` packages are extracted from, plus the full battle engine | Yes — clone the repo | Yes | N/A | Only if you need the full battle-resolution engine, not just data |
| `Maruno17/pokemon-essentials` (full repo) | GitHub README | Full RPG Maker XP game framework incl. PBS data files for berries/Mega Evolution/trainers | Yes — clone the repo | Yes | N/A | PBS files as a *schema reference* to replicate in TypeScript — do not run the Ruby code itself |

**Recommendation reiterated:** the finished game must **not** depend on any live API
at runtime. Every source above supports a build-time/ingestion-time download step —
use that path exclusively; ship only the normalized local data your game actually
needs.

---

## 24. RECOMMENDED LOCAL DATABASE ARCHITECTURE

```
src/data/pokemon/
  species.ts        // from PokeAPI CSVs: dex#, forms, stats, types, height/weight,
                     // capture rate, growth rate, egg groups, hatch time, habitat,
                     // color, shape, base experience, gen introduced, descriptions
  forms.ts           // alternate/regional/gender forms, linked to species.ts by id
  moves.ts           // from @pkmn/dex: power/accuracy/PP/priority/target/flags/effect
  abilities.ts       // from @pkmn/dex: desc + flags; hidden-ability linkage from PokeAPI
  types.ts           // from @pkmn/dex: names + generation-aware effectiveness matrix
  items.ts           // from PokeAPI: full catalog + categories; cross-ref Showdown for
                     // battle-relevant held-item effects
  heldItems.ts        // relational: pokemon -> itemPool[] (rarity, versionGroup)
  berries.ts          // from PokeAPI berries.csv + berry_flavors.csv
  berryGrowth.ts       // growth-stage timing/mechanics, schema modeled on Essentials PBS
  megaEvolutions.ts    // species/form <-> mega stone item, derived from Essentials PBS items.txt
  evolutions.ts        // from PokeAPI pokemon_evolution.csv + evolution_chains.csv
  encounters.ts        // wild encounter tables — authored per-map by your game design,
                        // NOT bulk-ingested (PokeAPI's location/encounter data is tied
                        // to the official games' specific maps, not yours)
  cries.ts             // id -> local asset path, from PokeAPI/cries repo
  trainers.ts           // authored game content (Section 17) — not ingested from any source
```

### Pipeline: source → raw → normalized → game data

1. **Source → raw data:** `scripts/fetch*.ts` clone/download the upstream repos/CSVs
   into a `raw/` scratch directory (gitignored — not committed to your repo).
2. **Raw data → normalized data:** `scripts/normalize*.ts` parse the CSVs/JSON/PBS
   text into clean TypeScript objects matching the `src/data/pokemon/*.ts` shapes
   above, resolving cross-references (e.g. turning a PokeAPI `species_id` foreign key
   into your own local numeric/string id scheme) and **dropping every field your game
   doesn't use** (do not blindly mirror PokeAPI's full schema — most fields, e.g.
   `game_index` per historical cartridge version, are irrelevant to a new game).
3. **Normalized data → game data:** the committed `src/data/pokemon/*.ts` files ARE
   the game data — plain TypeScript objects/arrays, imported directly by game systems.
   No runtime parsing, no runtime fetch.
4. **Asset source → downloaded assets:** `scripts/fetchSprites.ts` /
   `fetchCries.ts` copy only the specific sprite/cry files your normalized species list
   actually references (do not bulk-copy the entire upstream sprite repo into your
   project — copy only what's used, by id, based on your `species.ts` output) into
   `public/assets/...` (Section 25).
5. **Asset source → normalized naming:** the fetch scripts rename files from upstream's
   numeric-ID convention into your project's naming convention (Section 26) at copy
   time, so the rest of your codebase never depends on upstream's raw filenames.
6. **Game runtime → local data:** game code imports from `src/data/pokemon/*.ts` and
   references `public/assets/...` paths — zero network calls for core data during
   actual play.

---

## 25. AUTOMATED DATA INGESTION PIPELINE

```
scripts/
  fetchPokemonData.ts   // clone/pull PokeAPI CSVs + npm-install @pkmn/dex; no manual copying
  fetchSprites.ts       // clone PokeAPI/sprites (shallow), then copy+rename only the
                         // files referenced by your normalized species/forms list
  fetchCries.ts         // clone PokeAPI/cries (shallow), copy+rename referenced ids only
  fetchItems.ts         // parse PokeAPI item CSVs + cross-ref @pkmn/dex items
  fetchBerries.ts       // parse PokeAPI berries.csv/berry_flavors.csv
  fetchEssentialsPBS.ts // clone Maruno17/pokemon-essentials (shallow), extract ONLY the
                         // PBS text files needed for berries/Mega Evolution/trainer
                         // schema reference — do not import Essentials' bundled
                         // graphics/audio into this project (Section 0 license)
  normalizeData.ts       // raw -> src/data/pokemon/*.ts, per Section 24 pipeline
  validateData.ts         // cross-checks: every species has required sprite files present
                          // on disk, every move referenced by a learnset exists in
                          // moves.ts, every evolution target species id exists, etc.
  reportMissingAssets.ts  // diff of "referenced by normalized data" vs "present on disk",
                           // printed as a checklist for a human to review before shipping
```

**Why script-driven, not manual copying:** this is the explicit requirement from the
task brief (Section 23 of the original prompt) and is also simply necessary at this
scale — ~1,300+ species × several sprite variants × cries × items × moves is not a
task a coding agent should do file-by-file. Every fetch script should be idempotent
(safe to re-run, e.g. skip-if-exists or always-overwrite-cleanly) so the pipeline can
be re-run after upstream data updates.

**Validation is not optional:** because this pipeline spans five independently-
maintained upstream sources (PokeAPI, `@pkmn/dex`, PokeAPI/sprites, PokeAPI/cries,
Essentials), cross-source id mismatches are the most likely failure mode — a species
present in one source but renamed/missing in another. `validateData.ts` existing and
being run as part of the pipeline (not just written and forgotten) is what catches
this before it becomes a runtime bug.

---

## 26. ASSET DIRECTORY DESIGN

```
public/assets/pokemon/
  sprites/
    front/{id}.png
    back/{id}.png
    shiny/front/{id}.png
    shiny/back/{id}.png
    female/front/{id}.png        // only written when a real female-variant sprite exists
  animated/
    showdown/{id}.gif             // or pre-extracted frame sheets, per Section 5's
                                    // GIF->frames conversion step, your choice
  icons/{id}.png
  cries/{id}.ogg
  forms/{speciesId}/{formSlug}/front.png   // mirrors the sprites/ shape, scoped per form

public/assets/battle/
  effects/                        // your ORIGINAL type/category-keyed effect assets,
                                    // per Section 7/20 — not sourced externally
  status/                         // ditto, original

public/assets/items/
  icons/{itemId}.png
  berries/{berryId}.png
  mega-stones/{itemId}.png        // same tree as icons/ — Mega Stones ARE items,
                                    // don't fork a parallel naming scheme for them

public/assets/trainers/
  overworld/{trainerSlug}/{direction}-{frame}.png   // sliced from Section 16 sheets
  battle/{trainerSlug}.png
```

**Rationale for deviating from the prompt's example structure:** the prompt's example
put Mega Stones in their own top-level folder; this document recommends nesting them
under `items/mega-stones/` instead, because — per Section 14 — Mega Stones are
mechanically ordinary items with one extra relational field, not a structurally
distinct asset category. Keeping them in the same tree as other item icons avoids a
special-cased fetch/normalize path for what is otherwise identical data.

---

## 27. ASSET NAMING CONVENTIONS

**Source-side (what upstream repos actually use, so your fetch scripts know what to
match):** `CONFIRMED` — PokeAPI/sprites and PokeAPI/cries both key files by **National
Pokédex numeric ID** (`25.png`, `25.ogg` for Pikachu), with variant/form/shininess
encoded via **directory nesting**, not filename suffixes (e.g. `shiny/25.png`, not
`25-shiny.png`).

**Recommended normalized convention for this project** (adapting the prompt's example
after confirming what upstream actually provides):
```
pokemon/{dexId}/front.png
pokemon/{dexId}/back.png
pokemon/{dexId}/shiny-front.png
pokemon/{dexId}/shiny-back.png
pokemon/{dexId}/icon.png
pokemon/{dexId}/cry.ogg
pokemon/{dexId}/forms/{formSlug}/front.png
pokemon/{dexId}/forms/{formSlug}/icon.png
```
This flattens upstream's directory-nesting-per-variant convention (which spreads one
Pokémon's assets across many top-level folders) into a **per-Pokémon folder**
containing all of that Pokémon's own variants — easier for game code to resolve
("give me everything for id 25") and easier to spot-check completeness for one species
at a time during validation.

**Forms, including Mega Evolution, using this scheme:**
```
pokemon/006/front.png                      // base Charizard
pokemon/006/forms/mega-x/front.png
pokemon/006/forms/mega-y/front.png
```
This matches the prompt's own suggested example (`006/charizard/`,
`006/mega-charizard-x/`) in spirit, adjusted to nest forms under the shared numeric
dex-id folder rather than giving every form its own top-level slug folder — since a
Mega form is not a new species, this keeps that relationship structurally visible in
the folder layout itself, matching how `evolutions.ts`/`megaEvolutions.ts` (Section 24)
already model it relationally.

---

## 28. SOURCE PRIORITY — FULL DETAIL

**TIER 1 — Best structured data:**
- **USE FIRST:** `@pkmn/dex` (npm) for moves/abilities/items/types/type-effectiveness/
  learnsets/species base stats — TypeScript-native, zero-parse, generation-aware.
- **USE FIRST (alongside, not instead):** PokeAPI CSVs (via repo clone) for anything
  `@pkmn/dex` doesn't carry: Pokédex flavor text, capture rate, base happiness, hatch
  counter, habitat, color, shape, egg groups, localized names, full evolution
  condition metadata.
- **DO NOT USE UNLESS NECESSARY:** live PokeAPI REST/GraphQL calls at runtime, or as
  your primary ingestion method (prefer the CSVs/npm packages; live API is for
  exploration only, per Section 23).

**TIER 2 — Best sprite source:**
- **USE FIRST:** `PokeAPI/sprites` repo (bulk clone, copy-and-rename only what's
  referenced).
- **USE IF THE FIRST SOURCE IS MISSING SOMETHING:** `@pkmn/img` for sprite/icon URL
  and sheet-offset *logic* if you need Showdown-specific sprite variants PokeAPI/
  sprites doesn't mirror — but still self-host the actual image bytes per `@pkmn/img`'s
  own documented recommendation.
- **DO NOT USE UNLESS NECESSARY:** hotlinking any upstream URL directly from your
  shipped game (bandwidth-courtesy and offline-reliability both argue against it).

**TIER 3 — Best animation source:**
- **USE FIRST:** `PokeAPI/sprites`' Showdown-mirrored idle-animation GIFs, converted
  to frame sequences at build time (Section 5).
- **USE IF THE FIRST SOURCE IS MISSING SOMETHING:** nothing better was found for true
  attack/hit/faint animation — build your own generic type-keyed effect system
  (Section 7) instead of continuing to search for a source that does not appear to
  exist.
- **DO NOT USE UNLESS NECESSARY:** ROM-decompilation animation-script code
  (`pokeemerald`-family) as anything but a *conceptual* reference — it's not portable
  code and it's built on ripped assets.

**TIER 4 — Best item/berry source:**
- **USE FIRST:** PokeAPI CSVs for the full item/berry catalog and static data fields.
- **USE IF THE FIRST SOURCE IS MISSING SOMETHING:** `smogon/pokemon-showdown`
  `data/items.ts` for battle-relevant held-item effect logic; `Maruno17/pokemon-
  essentials` PBS files as a *schema reference* for berry-growth-mechanic completeness
  (not for its bundled art/audio — Section 0 license).
- **DO NOT USE UNLESS NECESSARY:** re-deriving held-item battle effects from scratch
  when Showdown's `data/items.ts` already encodes them correctly.

**TIER 5 — Best trainer source:**
- **USE FIRST:** nothing external — author trainer battle content (teams, AI
  difficulty, rewards) yourself once your species/move/item data exists (Section 17);
  this is game-design content, not researchable data.
- **USE IF THE FIRST SOURCE IS MISSING SOMETHING:** Pokémon Essentials PBS `trainers`
  schema as a *structural* reference for what fields a trainer record should have.
- **DO NOT USE UNLESS NECESSARY:** any specific franchise trainer's actual in-game
  team as "canonical data" — that's licensed game content, not open data, regardless
  of which fan wiki hosts a transcription of it.

**TIER 6 — Best battle effects:**
- **USE FIRST:** your own original type/category-keyed particle/shader effect system
  (Section 7/20), reusing the project's existing pixel-shader visual language.
- **USE IF THE FIRST SOURCE IS MISSING SOMETHING:** Showdown-client visual design as a
  *design-language reference* only (which colors/motifs it associates with which
  type/status), never as a literal asset import.
- **DO NOT USE UNLESS NECESSARY:** searching further for a "move animation asset
  pack" — this research pass found none, and further searching is unlikely to change
  that conclusion given how consistently every relevant hit pointed back to
  code-driven, engine-specific implementations rather than portable assets.

**TIER 7 — Useful supplementary repositories:**
- `devshareacademy/monster-tamer` — safest, most directly useful **architecture**
  reference (original IP, complete working Phaser+TS monster-RPG).
- `pkmn/engine` — reference for rigorous, frame-accurate battle-mechanics engine
  design, if/when battle-mechanics precision becomes a priority.
- `pkmnsnfrn/pokeemerald-expansion` (and `rh-hideout` family) — reference only, for
  authentic overworld-sprite sizing/animation-convention documentation (its own config
  comments are a good, freely-readable spec even though the assets themselves aren't
  usable).

---

## 29. SOURCE MATRIX

| Category | Resource | URL | Format | Coverage | Bulk Download | Animation | API | Recommended | Usage Status |
|---|---|---|---|---|---|---|---|---|---|
| Species/stats/types | PokeAPI CSVs | github.com/PokeAPI/pokeapi | CSV | All gens, all forms | Yes (git clone) | N/A | Yes (REST/GraphQL, not primary) | Yes | Tier 1 |
| Moves/abilities/items/types (mechanics) | `@pkmn/dex` | npmjs.com/package/@pkmn/dex | TS/JSON (npm) | All mainline gens | Yes (npm install) | N/A | No (local) | Yes | Tier 1 |
| Sprite/icon URL logic | `@pkmn/img` | npmjs.com/package/@pkmn/img | TS (npm), points at image URLs | Showdown's sprite/icon set | Logic only; mirror images separately | N/A | No (local) | Yes, paired with self-hosting | Tier 1 (logic) |
| All sprites | PokeAPI/sprites | github.com/PokeAPI/sprites | PNG/SVG/GIF | Gen I–current, shiny, forms | Yes (git clone) | Yes (GIFs) | Served via PokeAPI too | Yes | Tier 1 |
| Cries | PokeAPI/cries | github.com/PokeAPI/cries | OGG | Gen 1–9 | Yes (git clone) | N/A (audio) | Served via PokeAPI too | Yes | Tier 1 |
| Move/ability/item mechanics logic | `smogon/pokemon-showdown` | github.com/smogon/pokemon-showdown | TypeScript | All mainline gens + historical mods | Yes (git clone) | N/A | No | Yes, via `@pkmn/*` extraction | Tier 1 (via npm) |
| Berries/Mega Evolution/trainers schema | `Maruno17/pokemon-essentials` | github.com/Maruno17/pokemon-essentials | PBS plain text (Ruby project) | Full game framework | Yes (git clone) | N/A | No | Schema reference only; CC BY-NC-SA, IP caveat | Tier 4/5 reference |
| Overworld/trainer sprites | Eevee Expo / Project Pokemon / PokeCommunity threads | eeveeexpo.com, projectpokemon.org, pokecommunity.com | PNG sheets | Gen 4-era NPC/trainer coverage, partial | Manual ZIP download only | Walk-cycle frames | No | Use with caution — highest IP-risk category | Tier "placeholder only" pending legal review |
| Move/battle-effect animations | — (none found) | — | — | — | — | — | — | Build your own (Section 7) | Confirmed gap |
| Tilesets | Various itch.io packs | itch.io (search "Pokemon-like tileset") | PNG tilesheets | Varies per pack | Manual, per-pack license | Some (water autotile frames per pack) | No | Only for props the procedural system doesn't cover; check each pack's license | Tier "supplementary, case-by-case" |
| Fallback original-IP monsters | Openmon project | itch.io (Openmon-tagged assets) | PNG | Partial (verify full roster before depending on it) | Manual, CC0 | `UNKNOWN` per-asset | No | Yes, specifically as the no-legal-risk fallback | Verify scope before committing |

---

## 30. RECOMMENDED SOURCES (recap)

Species/moves/abilities/items/types/evolution mechanics: `@pkmn/dex` + PokeAPI CSVs.
Sprites/icons: `PokeAPI/sprites`. Animated idle sprites: same repo's Showdown mirror.
Cries: `PokeAPI/cries`. Berries/Mega Evolution/trainer schema: `Maruno17/pokemon-
essentials` PBS files (schema only, not bundled art/audio). Battle-mechanics logic
depth: `smogon/pokemon-showdown` (via `@pkmn/*` packages, not the monolithic repo).

## 31. FALLBACK SOURCES (recap)

PokeAPI GraphQL for interactive exploration. `@pkmn/sim`/`pkmn/engine` if you later
need a more rigorous battle-resolution engine than a simple data-driven approach gives
you. Openmon (CC0) as a wholesale IP-risk-free fallback if a legal review before
Android release concludes the Nintendo-IP fan-reference approach is unacceptable for a
distributed app.

---

## 32. EXACT CODING-AGENT WORKFLOW

**STEP 1 — Read source priority (Section 28) and the licensing notice (Section 0)
before writing any ingestion code.** Confirm with the project owner whether the
Android-release IP-risk tradeoff (Section 0/37) has been decided, since it affects
whether Section 16 (trainer sprites) should be built at all or stubbed with
placeholders pending original art.

**STEP 2 — Set up the ingestion workspace.**
```bash
mkdir -p raw && cd raw
git clone --depth 1 https://github.com/PokeAPI/pokeapi.git
git clone --depth 1 https://github.com/PokeAPI/sprites.git
git clone --depth 1 https://github.com/PokeAPI/cries.git
git clone --depth 1 https://github.com/Maruno17/pokemon-essentials.git
cd .. && npm install @pkmn/dex @pkmn/data @pkmn/img
```
Add `raw/` to `.gitignore` — none of this is committed; only your normalized output
(`src/data/pokemon/*.ts`) and the specific copied/renamed assets are committed.

**STEP 3 — Download raw data.** Nothing further needed beyond Step 2's clones — the
data is already local as CSVs/PBS text/npm packages. Do not write a live-API scraper;
one is not needed given Step 2.

**STEP 4 — Normalize data.** Write `scripts/normalizeData.ts` (Section 25) to parse
`raw/pokeapi/data/v2/csv/*.csv` and query `@pkmn/dex`, producing the
`src/data/pokemon/*.ts` files per Section 24's schema. Start with a **small subset**
(e.g. the first 20 species and their moves/abilities/items) to validate the pipeline
shape before running it against the full ~1,300-species dataset — this catches schema
mistakes cheaply.

**STEP 5 — Download assets.** Run `scripts/fetchSprites.ts` / `fetchCries.ts`
(Section 25) **after** Step 4 succeeds, since they read the normalized species list to
know which ids to copy — do not bulk-copy the entire upstream sprite/cry repos into
`public/assets/`.

**STEP 6 — Validate missing assets.** Run `scripts/validateData.ts` /
`reportMissingAssets.ts`. Fix any species/move/item cross-reference gaps the report
surfaces before proceeding — do not silently ship with holes in the data.

**STEP 7 — Place assets in directories.** Confirm the fetch scripts wrote files
matching Section 26/27's directory and naming conventions exactly — game code in
later steps will assume this shape.

**STEP 8 — Expose data through TypeScript modules.** Ensure every file in
`src/data/pokemon/` has clean, explicit TypeScript types/interfaces (not `any`) — this
is what makes the rest of the game codebase safe to build against.

**STEP 9 — Connect game systems.** Only after Steps 1–8 are complete and validated
should battle/inventory/encounter/evolution game-logic systems be built against this
data — per the original task brief, **do not build those systems as part of this
research/ingestion phase.**

---

## 33. MISSING / UNKNOWN RESOURCES (explicit list)

- **Move/attack/hit/faint animation assets:** confirmed gap — build your own
  (Section 7/9/20).
- **Type icon set, status icon set, Poké Ball icon set, badge icon set:** no dedicated
  open source confirmed — build your own or verify one exists before depending on it.
- **Berry growth/pickup/planting/shaking as true frame animations:** does not exist as
  such in any official game researched — it's a static-sprite-per-growth-stage swap,
  not a frame animation; reframe the task accordingly (Section 12).
- **UI sound effects (capture, evolution, item-use, environment):** no dedicated open
  dataset found distinct from cries.
- **Exact PokeAPI CSV column names** for several fields flagged `INFERENCE` throughout
  this document (gender-difference flag, evolved-species foreign key name, held-item
  wild-encounter CSV filename, item sprite path) — verify directly against the cloned
  repo's actual CSV headers before writing ingestion code; this document identifies
  *which files* to look in but did not exhaustively verify every column name.
- **`pokemon-showdown-client` repo URL** — referenced as a likely-named sibling repo to
  `smogon/pokemon-showdown` but not independently fetched/confirmed this pass.
- **Full scope of the Openmon project** — one CC0 asset pack was found and verified;
  whether it covers enough original-monster variety to substitute for the full
  Pokémon roster is unverified.

---

## 34. RISKS AND TECHNICAL LIMITATIONS

1. **IP risk is the dominant, cross-cutting risk of this entire project**, not a
   footnote — it touches species data, sprites, cries, moves, and especially trainer/
   overworld human-character sprites (Section 16, the single highest-risk category
   found). This is a business/legal decision, not a technical one; this document's job
   is to make sure that decision is made with full information rather than discovered
   after an Android store submission.
2. **Move/battle-effect animation is a real, confirmed content gap** — budget original
   design/implementation time for this rather than continuing to search for a source
   that this research indicates does not exist in usable form.
3. **Cross-source id/name drift** — PokeAPI, Showdown, and Essentials each maintain
   their own independent species/move/item identifier and naming schemes; the
   normalization step (Section 24 Step 2) is where subtle mismatches (e.g. a Showdown
   move id using no spaces/hyphens vs. PokeAPI's hyphenated identifier style) will
   surface — budget real QA time here, not just a mechanical field-mapping pass.
4. **Upstream data is a moving target.** PokeAPI, Showdown, and `@pkmn/*` are all
   actively maintained and change over time (new generations, bugfixes, balance
   patches). Pin specific commit/tag/npm-version references in your ingestion scripts
   rather than always pulling `master`/`latest`, so your game's data doesn't shift
   underneath you without an explicit, reviewed update.
5. **Bandwidth/goodwill risk for live APIs.** PokeAPI explicitly notes serving "1+
   billion requests a month" and solicits donations — treat their live REST/GraphQL
   endpoints as a shared community resource to use sparingly (exploration only), not
   as your production data path, both as a technical best-practice and out of
   consideration for the maintainers.
6. **Overworld/trainer sprite sheet dimensions are not standardized** across the three
   forum sources in Section 16 — expect to need per-source slicing logic, not one
   universal grid-slicer.
7. **Ogg Vorbis (cries) browser compatibility** should be spot-checked against your
   actual target browser/WebView matrix before shipping, particularly if any
   iOS/Safari surface is ever in scope alongside the stated Android-first plan.