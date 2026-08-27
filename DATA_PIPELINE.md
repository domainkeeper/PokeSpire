# DATA_PIPELINE.md — Pokémon Data & Asset Ingestion Pipeline

## Quick Start

```bash
npm run data:sync          # Full sync: generate data + download sprites + cries
npm run data:sync:force    # Force re-download everything
npm run data:sprites       # Download only sprites + cries (skip data generation)
npm run data:validate      # Validate all data + assets
```

## Architecture

```
Source (npm/CDN)           Raw Cache              Generated TS        Game Assets
─────────────────         ──────────             ────────────         ───────────
@pkmn/dex          →   data/raw/pokemon/    →   src/data/pokemon/   → (imported)
PokeAPI/sprites    →   public/assets/        →   public/assets/      → (served)
PokeAPI/cries      →   public/assets/        →   public/assets/      → (served)
```

### Data Flow

1. **Source → Raw**: `scripts/poke-data-sync.mjs` fetches data from `@pkmn/dex` (npm) and saves raw JSON to `data/raw/pokemon/*.json`
2. **Raw → Generated TS**: The same script generates TypeScript files in `src/data/pokemon/` with lookup maps and accessor functions
3. **Source → Assets**: Sprites are downloaded from PokeAPI/sprites CDN and cries from PokeAPI/cries CDN, organized into `public/assets/pokemon/{id}/`
4. **Generated TS → Game**: Game code imports from `src/data/pokemon/PokemonDatabase.ts` or individual files

### Key Principle: RAW ≠ GAME DATA

- `data/raw/` — cached source data, gitignored, re-downloadable
- `src/data/pokemon/` — generated TypeScript files, committed, the actual game data API
- `public/assets/` — downloaded image/audio files, committed (or gitignored for large assets)

## Commands

| Command | Description |
|---------|-------------|
| `npm run data:sync` | Generate all data + download missing sprites/cries |
| `npm run data:sync:force` | Regenerate everything from scratch |
| `npm run data:sprites` | Download only sprites + cries (uses existing raw data) |
| `npm run data:validate` | Validate all data integrity + asset completeness |

## Data Sources

| Category | Source | Method |
|----------|--------|--------|
| Species/Stats/Types | `@pkmn/dex` (npm) | TypeScript-native, no parsing |
| Moves/Abilities | `@pkmn/dex` (npm) | TypeScript-native |
| Items | `@pkmn/dex` (npm) | TypeScript-native |
| Type Effectiveness | `@pkmn/dex` (npm) | Generation-aware |
| Evolutions | `@pkmn/dex` (npm) | Condition-rich |
| Sprites | PokeAPI/sprites (CDN) | Direct download, organized per-Pokemon |
| Cries | PokeAPI/cries (CDN) | Direct download (.ogg) |

## Asset Structure

```
public/assets/pokemon/
  {id}/
    front.png           # Front-facing sprite
    back.png            # Back-facing sprite
    shiny-front.png     # Shiny variant
    shiny-back.png      # Shiny back variant
    icon.png            # Small party/Pokedex icon
    animated.gif        # Animated battle sprite (Showdown)
    cry.ogg             # Pokemon cry audio
```

## Data Access API

### PokemonDatabase (Primary Interface)

```typescript
import { PokemonDatabase } from '@/data/pokemon/PokemonDatabase';

// Species
PokemonDatabase.getSpecies(id)            // by National Dex number
PokemonDatabase.getSpeciesByName(name)    // case-insensitive
PokemonDatabase.getAllSpecies()            // all species array
PokemonDatabase.getSpeciesByType(type)    // filter by type
PokemonDatabase.getSpeciesByGeneration(gen)

// Moves
PokemonDatabase.getMove(id)
PokemonDatabase.getMoveByName(name)
PokemonDatabase.getAllMoves()

// Abilities
PokemonDatabase.getAbility(id)
PokemonDatabase.getAbilityByName(name)

// Items
PokemonDatabase.getItem(id)
PokemonDatabase.getItemByName(name)

// Types
PokemonDatabase.getType(name)
PokemonDatabase.getTypeById(id)
PokemonDatabase.getEffectiveness(atkType, defTypes) // returns multiplier

// Evolutions
PokemonDatabase.getEvolutions(species)
PokemonDatabase.getEvolutionChain(species)
PokemonDatabase.getPreEvolution(species)
```

### Asset Loaders

```typescript
import { pokemonSprite, pokemonCry, pokemonIcon } from '@/assets/pokemonAssets';

pokemonSprite(25)      // → "/assets/pokemon/025/front.png"
pokemonBackSprite(25)  // → "/assets/pokemon/025/back.png"
pokemonShinySprite(25) // → "/assets/pokemon/025/shiny-front.png"
pokemonIcon(25)        // → "/assets/pokemon/025/icon.png"
pokemonCry(25)         // → "/assets/pokemon/025/cry.ogg"
pokemonAnimated(25)    // → "/assets/pokemon/025/animated.gif"
```

## Validation

The validation script (`scripts/poke-validate.mjs`) checks:

- All species have required fields (name, types, baseStats)
- All type references resolve to valid types
- All ability references in species resolve to valid abilities
- All evolution source/target species exist
- Sprite files (front, back, cry) exist for all species
- No duplicate IDs
- No malformed data

### Known Edge Cases

- Regional forms (Alola/Galar/Hisui) reference species that are deduplicated in the species list — validation accounts for this
- Gen 8+ icons (808+) are not available from the Gen VII icons endpoint — these are expected missing
- Gender-specific forms (Meowstic-F, Basculegion-F) reference non-existent species — cosmetic only

## Adding New Sources

To add a new data source:

1. Add the fetch logic in `scripts/poke-data-sync.mjs`
2. Add the raw JSON schema
3. Add the normalized TypeScript generator
4. Add the accessor functions to the relevant database module
5. Run `npm run data:validate` to verify

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `BATCH_SIZE is not defined` | Update script from latest version |
| `Cannot read properties of undefined` | Run `npm run data:sync` first to generate raw data |
| Missing sprites | Run `npm run data:sprites` |
| TypeScript errors in data files | Run `npm run data:sync --data-only` to regenerate |
| 404 on cry downloads | Check `CRY_BASE` URL in sync script |
