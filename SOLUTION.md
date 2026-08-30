Yes — here is the content converted into clean **Markdown (`.md`) format**, preserving the structure and technical detail from the uploaded file. 

````md
# BATTLE SYSTEM + ATTACK ANIMATION REDESIGN — TECHNICAL DESIGN SPECIFICATION

## 1. CURRENT SYSTEM AUDIT

### 1A. What Currently Exists

**Entry point**

Battle is reachable only via the `#battle` hash route (`src/App.tsx:19`) → `BattleDemo` (`src/battle/BattleDemo.tsx`), which hardcodes a Lv10 Pikachu vs Lv10 Charmander with `maxHp: 100` each.

It is not wired to overworld encounters (`SOLUTION.md` Step 12 was never done).

### Battle Module

The battle module contains 9 files and approximately 670 lines total:

| File | Lines | Role |
|---|---:|---|
| `types.ts` | 50 | `BattlePhase` enum (11 states), `Combatant`, `BattleState`, `BattleMoveExtension` |
| `combatEngine.ts` | 100 | `tickGauge`, `calculateDamage`, `resolveAim`, `resolveBrace`, `aiDecideMove` |
| `useSpeedGauge.ts` | 48 | rAF loop filling ATB gauges |
| `BattleScreen.tsx` | 271 | R3F `<Canvas>`, state machine via `useEffect` chains, HUD |
| `MoveSelectMenu.tsx` | 63 | Horizontal row of move buttons |
| `AimReticle.tsx` | 59 | `<input type="range">` + `CONFIRM AIM` button |
| `BraceMeter.tsx` | 55 | `<input type="range">` + `BRACE` button |
| `moveExtensions.ts` | 26 | 11 hand-authored move entries |
| `BattleDemo.tsx` | 81 | Hardcoded demo fixture |

### Implemented Flow

```text
INTRO
  ↓
GAUGE_TICK
  ↓
Gauge reaches 100
  ↓
MOVE_SELECT (player)
or
AI_DECIDE (enemy)
  ↓
optional AIMING
  ↓
DEFENDER_BRACE
  ↓
RESOLVE
  ↓
IMPACT
  ↓
GAUGE_TICK
or
BATTLE_END
````

### Effects / Animation Infrastructure

The genuinely valuable existing asset is the effect infrastructure.

`MoveEffect` (`src/game/effects/MoveEffect.tsx`):

* selects an `EffectFamily`

* builds an `EffectTimeline` through `buildRecipe` (`presets/recipes.ts`)

* plays it through `EffectTimelinePlayer` (`timeline/EffectTimelinePlayer.tsx`)

* spawns typed layer primitives:

  * `ParticleEffect`
  * `RingEffect`
  * `BeamEffect`
  * `FlipbookEffect`
  * `ProjectileEffect`
  * `TrailEffect`
  * `FlashEffect`

* communicates camera feedback through:

  ```text
  cameraBus → CameraFeedback
  ```

`typePalettes.ts` supplies per-type colors/shapes.

`TYPE_COLORS` covers all 18 types.

`qualityStore` provides:

```text
LOW / MED / HIGH
```

particle scaling.

### Data Layer

`PokemonDatabase` (`src/data/pokemon/PokemonDatabase.ts`) exposes:

* species
* moves
* abilities
* items
* types

`getEffectiveness(atkType, defTypes)` works correctly.

Encoding:

```text
0 = neutral
1 = resist
2 = weak
3|4 = immune
```

### Assets Already on Disk

`public/assets/pokemon/` contains:

* 993 directories
* each containing `sprite-sheet.png`
* each containing `animation.json`

`src/game/pixel/AnimatedSprite.tsx` exists and can play them at original GIF frame timing.

`public/assets/vfx/` contains exactly two flipbook sheets:

* `impact`
* `slash`

### Stack

```text
React 18
Three.js 0.185
@react-three/fiber
drei
postprocessing
zustand
TypeScript
Vite
@pkmn/dex
@pkmn/data
```

---

## 1B. What Is Actually Wrong

These are verified defects, in severity order.

Each is a root cause, not merely a symptom.

### Blocking / Correctness

#### B1 — Battle hard-softlocks on the first enemy turn

`AI_DECIDE` sets:

```text
phase: 'DEFENDER_BRACE'
activeCombatantId = enemy.id
```

(`BattleScreen.tsx:120-125`)

However, `BraceMeter` renders only when:

```text
state.activeCombatantId === player.id
```

(`BattleScreen.tsx:266`)

Therefore, when the enemy attacks:

* no component mounts
* nothing calls `handleBraceComplete`
* the state machine stops forever

Nothing else handles `DEFENDER_BRACE`.

The game becomes unplayable once the enemy gauge first fills.

---

#### B2 — Brace is inverted

The player braces against their own attack.

`activeCombatantId` represents the attacker.

Therefore:

```text
activeCombatantId === player.id
```

shows the brace prompt while the player is attacking.

`braceResult` is then applied inside `calculateDamage` to reduce the attacker's output.

A "perfect brace" therefore makes the player's own move deal `0` damage.

---

#### B3 — Brace is a trivially dominant exploit

The system calls:

```ts
resolveBrace(
  s.braceInput ?? 50,
  50,
  30
)
```

with a hardcoded centre of `50` and width `30`.

Therefore:

```text
distance > 30
→ perfect
→ damage × 0
```

Dragging the slider to `0` or `100` guarantees zero damage.

There is:

* no timer
* no meaningful pressure
* no meaningful tradeoff

The defender's `arenaPosition` (`30/70`) is never read.

`braceInput` is never written back to it.

---

#### B4 — Timeline unit mismatch destroys every attack animation

`EffectPhase.at` is authored in **seconds**:

```ts
at: duration * 0.2
```

Example:

```text
duration = 0.8
at = 0.16
```

But `EffectTimelinePlayer` compares it against milliseconds:

```text
phase.at <= elapsedMs
```

After one frame:

```text
elapsedMs ≈ 16
```

Therefore:

```text
0
0.16
0.48
```

are all already considered elapsed.

Every phase spawns simultaneously:

* windup particles
* projectile launch
* impact flipbook
* expanding ring
* camera shake

all on frame 1.

This is why attacks have no:

* windup
* travel
* anticipation
* impact beat

The projectile and its arrival explosion are effectively created on the same frame.

---

#### B5 — `onComplete` can never fire

Completion requires:

```text
activeLayers.length === 0
```

But nothing removes entries from `activeLayers`.

Once a phase spawns:

```text
activeLayers
```

remains non-empty forever.

Therefore:

```text
MoveEffect.onComplete
```

never executes.

`BattleScreen` currently works around this using:

```text
setTimeout(..., 1200)
```

This is a fragile workaround.

---

#### B6 — React state is mutated directly

Examples:

```ts
c.gauge = newGauge
```

in `useSpeedGauge.ts:29`

and:

```ts
defender.currentHp = ...
```

in `BattleScreen.tsx:182`

and:

```ts
attacker.gauge = 0
```

in `BattleScreen.tsx:210`

No `setState` accompanies these mutations.

Therefore React does not reliably re-render.

The gauge bar only appears to update when another state transition happens to trigger a render.

---

#### B7 — There is no HP bar

The plate currently shows HP as text.

The only bar is bound to:

```text
player.gauge
```

There is no visual representation of actual HP.

---

#### B8 — Aimed moves can never miss

`resolveAim` returns:

```text
{
  hit,
  precisionBonus
}
```

but `BattleScreen.tsx:170` only reads:

```text
precisionBonus
```

and discards:

```text
hit
```

For non-aimed moves:

```text
move.accuracy
```

is never consulted.

---

#### B9 — Damage is applied before the animation

HP is decremented at:

```text
BattleScreen.tsx:182
```

Then:

```text
setActiveEffect
```

starts the animation.

Therefore the HP value changes before the hit visually connects.

This is currently masked by B6/B7.

---

#### B10 — Blind fixed timeouts cause desynchronization

The system uses fixed:

```text
1200ms
```

timeouts for:

* INTRO
* IMPACT

These durations are unrelated to actual timeline length.

Changing an effect's duration therefore silently desynchronizes gameplay from visuals.

---

### Presentation

#### B11 — Combatants are untextured boxes

`BattleScreen.tsx:35-43` renders:

```text
boxGeometry
```

meshes.

The project already has:

* 993 animated sprite sheets
* a working `AnimatedSprite` player

but they are referenced by nothing.

---

#### B12 — Zero sprite motion

There is currently no:

* lunge
* recoil
* flinch
* shake
* squash
* tint
* scale response

The "animation" is essentially:

```text
particle puff
+
two static boxes
```

Combined with B4, attacks feel weightless.

---

#### B13 — Every special move looks identical

`MOVE_OVERRIDES` maps 47 moves to families such as:

```text
beam
cloud
pulse
burst
impact
frost
swarm
```

But `buildRecipe` only actually implements:

```text
projectile
slash
```

Everything else falls back to a generic particle burst.

Therefore moves such as:

```text
Flamethrower
Thunderbolt
Ice Beam
Earthquake
Surf
Hyper Beam
```

are effectively the same effect with different colors.

---

#### B14 — Hit-stop and flash are configured but not implemented

Recipes configure:

```text
hitStop: 40–70
flash
flashOpacity
```

but `CameraFeedback` only implements:

* shake
* punch

There is no hit-stop.

No recipe emits a flash layer.

`FlashEffect` is a:

```text
50×50 world-space plane
```

at:

```text
z = -5
```

while the camera is around:

```text
z ≈ 7
```

Therefore it is behind the combatants and cannot function as a hit flash.

---

#### B15 — OrbitControls conflicts with camera feedback

`BattleScreen.tsx:251` mounts:

```text
OrbitControls
```

which writes camera transforms every frame.

`CameraFeedback` caches an initial position and also writes absolute positions.

The two systems therefore fight each other.

Free player orbiting also makes directed combat camera work impossible.

---

#### B16 — Only one effect can exist at a time

`activeEffect` is a single nullable object.

A second effect overwrites the first.

Therefore:

* multi-hit moves
* overlapping effects
* chained effects

cannot be properly presented.

---

#### B17 — Dead parallel effect system

`presets.ts`:

```text
586 lines
```

plus:

```text
effectRegistry.resolveEffect
duplicated MOVE_OVERRIDES
```

are exported from:

```text
effects/index.ts
```

but imported nowhere.

There are currently two competing effect architectures.

This is a maintenance trap.

---

#### B18 — `StatusOverlay` is unused in battle

`StatusOverlay` is only a single additive sphere.

It is used by:

```text
EffectDemo
```

but never by battle.

---

### Strategic Depth

#### B19 — Only one real decision exists

The player chooses a move.

Aim and brace are:

* unpressured
* exploitable
* dominated by obvious answers

There is currently:

* no switching
* no status application
* no stat stages
* no PP
* no items
* no crits

---

#### B20 — `FAINT_SEQUENCE` and `SWITCH_PROMPT` are unreachable

`RESOLVE` jumps directly to:

```text
BATTLE_END
```

`playerTeam` and `enemyTeam` exist as arrays but the battle screen is constructed from single combatants and always uses:

```text
[0]
```

Switching does not exist.

This removes one of the deepest sources of Pokémon-style strategy.

---

#### B21 — Status systems are declared but unused

These fields exist:

```text
statusConditions
volatileFlags
```

but are never:

* read
* written
* resolved

No status effects actually exist.

---

#### B22 — Damage uses raw base stats

`calculateDamage` reads:

```text
attacker.species.baseStats.atk
```

directly.

There is no:

* level stat calculation
* IV system
* EV system
* nature system

Therefore:

```text
Lv100 Charmander
```

and:

```text
Lv10 Charmander
```

have almost identical Attack contribution.

`maxHp` is hardcoded to `100`.

Level and team building are therefore strategically inert.

---

#### B23 — Continuous ATB prevents prediction

Real-time ATB means turns happen because the timer reaches a threshold.

This prevents meaningful prediction.

The player cannot reasonably think:

> If I do X, they will answer Y, so I should prepare Z.

The current system is:

* too real-time to become a proper strategy system
* too menu-driven to become a skill-based action system

This is the core design flaw.

---

#### B24 — AI is deterministic and exploitable

`aiDecideMove` scores:

```text
effectiveness × basePower
```

and randomly selects from the top two.

It ignores:

* its HP
* status
* player's typing
* switching
* Guard

There is therefore no meaningful opponent to read.

---

#### B25 — Ability effects are absent

`DamageModifiers` is hardcoded to:

```text
all 1
```

at the only call site.

Therefore:

* STAB
* type effectiveness

are essentially the only damage modifiers.

---

## 1C. What Should Be Preserved, Refactored, Replaced, or Untouched

| Verdict            | Items                                                                                                                                                                                                                              | Reason                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **PRESERVE AS-IS** | `ParticleEffect`, `RingEffect`, `BeamEffect`, `FlipbookEffect`, `ProjectileEffect`, `TrailEffect`, `typePalettes.ts`, `TYPE_COLORS`, `qualityStore`, `AnimatedSprite`, `PokemonDatabase`, `getEffectiveness`, all of `src/data/**` | Sound reusable primitives and valuable existing assets            |
| **REFACTOR**       | `EffectTimelinePlayer`, `CameraFeedback`, `recipes.ts`, `combatEngine.calculateDamage`                                                                                                                                             | Architecture is correct but implementation is incomplete or buggy |
| **REPLACE**        | `BattleScreen.tsx`, `useSpeedGauge`, `AimReticle`, `BraceMeter`, `MoveSelectMenu`, `resolveAim`, `resolveBrace`, `FlashEffect`, `BattleDemo`                                                                                       | These encode the flawed real-time-slider direction                |
| **DELETE**         | `presets.ts`, duplicate `MOVE_OVERRIDES`, `resolveEffect`, `resolveEffectByType`, `EffectPreset`, `ActiveEffect`, `buildSimpleTimeline`                                                                                            | Dead/duplicated architecture                                      |
| **DO NOT TOUCH**   | `MapRenderer`, `OverworldScene`, `Player`, `SpriteActor`, `terrain`, `SkyDome`, `Minimap`, `ExpandedMap`, `VirtualJoystick`, `gameStore`, persistence, world/map data, `scripts/**`, theme system                                  | Out of scope                                                      |

### Type System Decision

`SOLUTION.md §3` mandates:

```ts
BattleMove = DexMove & BattleMoveExtension
Combatant.species = Species
```

However, the actual implementation obtains data from `PokemonDatabase` and uses:

```ts
as unknown as Species
```

This is an unsound bridge.

### Decision

Standardize the battle engine on:

```text
PokemonDatabase's PokemonSpeciesData
PokemonDatabase's MoveData
```

Delete:

```text
@pkmn/dex
```

type imports from:

```text
src/battle/types.ts
```

Reason:

`PokemonDatabase` is the project's real populated/generated data layer.

This removes an entire class of runtime shape errors.

---

# 2. CORE DESIGN GOALS

| #   | Goal                                  | Measurable Meaning                                                     |
| --- | ------------------------------------- | ---------------------------------------------------------------------- |
| G1  | Logic decides, visuals report         | Engine is pure and produces events                                     |
| G2  | Every attack reads as physical action | Anticipation → windup → release → travel → contact → reaction → settle |
| G3  | Impact through contrast, not volume   | Strong hits get feedback; resisted hits stay light                     |
| G4  | Player understands what happened      | Event banner + log + action feedback                                   |
| G5  | Discrete predictable turns            | Simultaneous commit + deterministic ordering                           |
| G6  | Type chart used twice                 | Damage + Imprint/Detonate                                              |
| G7  | One distinctive mechanic              | Imprint/Detonate integrates deeply                                     |
| G8  | Reusable animation configuration      | ~10 categories + overrides                                             |
| G9  | Browser realistic                     | ≤400 live particles at MED                                             |
| G10 | No desync                             | One authoritative phase enum + guarded timeouts                        |
| G11 | Respect player time                   | Full turn ≤4.5s; 3× fast-forward available                             |

---

# 3. NEW BATTLE EXPERIENCE

## Encounter

**0.0–1.9s**

* Screen wipes from overworld.
* Arena fades up.
* Lit ground ellipse appears.
* Soft directional shadows appear under combatants.
* Enemy sprite drops from above-right.
* Small dust ring.
* Player sprite slides from lower-left.
* HP plates fly in.
* Camera holds wide framing.
* Banner:

```text
A wild CHARMANDER appeared!
```

* Action bar rises.

---

## Decision

**Untimed**

Three actions:

```text
FIGHT
GUARD
SWITCH
```

FIGHT opens a:

```text
2×2 move grid
```

Hovering a move shows:

* type color
* power
* accuracy
* PP
* category
* consequence hint

Examples:

```text
SUPER EFFECTIVE ×2
```

or:

```text
DETONATE
```

Enemy plate shows:

* current Imprint
* remaining turns

Player plate shows:

```text
FIRST / SECOND
```

No timer.

---

## Commit and Telegraph

**0.5s**

After confirmation:

* move grid collapses
* both sides lock
* opponent's action category is revealed

Possible categories:

```text
PHYSICAL
SPECIAL
STATUS
GUARD
SWITCH
```

The exact move remains hidden.

This creates the mind game.

---

## Resolution

Approximately:

```text
1.1s per action
```

Faster combatant acts first.

Sequence:

```text
anticipation
→ windup
→ lunge/fire
→ contact
→ hit-stop
→ reaction
```

At contact:

* world freezes for 70ms
* defender flashes white
* defender knocked back
* damage number appears
* HP leading edge snaps
* ghost bar drains behind it

Super-effective:

```text
SUPER EFFECTIVE
```

Detonate:

```text
DETONATE!
SHATTERED
```

Resisted hits receive minimal feedback.

---

## End of Turn

**0.4s**

* Burn ticks.
* Poison ticks.
* Imprint counters decrement.
* Status chips update.
* Action bar returns.

---

## Knockout

**2.2s**

* Final hit gets longer hit-stop.
* Defender collapses.
* Sprite desaturates.
* Sprite sinks.
* Sprite dissolves.
* Plate leaves screen.
* Switch tray appears or victory begins.

---

## Throughout

The camera:

* never orbits
* never moves without purpose
* pushes in slightly during contact
* otherwise remains stable

Combat log:

* collapsed
* two lines
* expandable

---

# 4. ATTACK ANIMATION SYSTEM

## 4.1 Seven Stages

All timings are milliseconds.

| Stage        |  Default | Purpose                |
| ------------ | -------: | ---------------------- |
| `ANTICIPATE` |    120ms | Announces action       |
| `WINDUP`     |    180ms | Builds force           |
| `RELEASE`    | 60–140ms | Commitment             |
| `TRAVEL`     |  0–320ms | Shows spatial movement |
| `CONTACT`    | 60–140ms | Impact/hit-stop        |
| `REACT`      |    200ms | Communicates result    |
| `SETTLE`     |    180ms | Returns to neutral     |

### 1. ANTICIPATE

Attacker:

```text
scale 1.06 × 0.96
drop 0.04u
```

No VFX.

Attacker plate pulses once.

Damage:

```text
none
```

---

### 2. WINDUP

Attacker:

* moves 0.18u away from target
* scale `0.94 × 1.08`

Particles:

```text
8–14
```

Move name fades in.

---

### 3. RELEASE

Attacker snaps forward.

Defender begins a slight flinch anticipation.

Heavy attacks may receive:

```text
2% camera dolly
```

Projectile/beam spawns.

---

### 4. TRAVEL

Melee:

```text
0ms
```

Projectile:

```text
0–320ms
```

Projectile travels with trail.

Beam extends from origin to target.

---

### 5. CONTACT

Impact feedback occurs here.

At:

```text
T + 0
```

commit damage.

Effects:

* hit-stop
* defender flash
* knockback
* impact flipbook
* ring
* debris
* damage number
* HP snap
* effectiveness banner

---

### 6. REACT

Defender performs result-specific reaction.

Ghost HP bar drains.

Status chips update.

---

### 7. SETTLE

Both combatants return to rest.

All one-shot layers must be disposed.

Next action cannot begin until:

```text
all layers complete
OR
hard timeout fires
```

---

## Total Duration

Fast melee:

```text
~800ms
```

Heavy beam:

```text
~1400ms
```

Hard cap:

```text
1600ms
```

If a profile exceeds the cap:

```text
clamp
+
log warning
```

---

## 4.2 Non-Negotiable Timing Rules

### Rule 1 — Damage commits at contact

Never:

```text
RELEASE
resolution start
setTimeout
```

Only:

```text
CONTACT T+0
```

---

### Rule 2 — Hit-stop is timescale, not a pause

During hit-stop:

```text
combatant animation = frozen
particles = frozen
camera shake = continues
```

---

### Rule 3 — One shake per event

Never stack shakes.

A larger shake replaces a smaller active shake.

---

### Rule 4 — Every stage has a timeout

```text
stageTimeout = plannedDuration + 400ms
```

If timeout fires:

* force-complete
* dispose layers
* advance

---

### Rule 5 — Arrival is idempotent

Both:

```text
ProjectileEffect.onArrive
```

and:

```text
TRAVEL timeout
```

must route through:

```text
advanceStage()
```

protected by:

```text
hasAdvanced
```

---

# 4.3 Fixing the Timeline Engine

Before creating new animations:

### Fix B4

Rename:

```text
EffectPhase.at
```

to:

```text
atMs
```

Rename:

```text
EffectTimeline.totalDuration
```

to:

```text
totalDurationMs
```

All recipes must use integer milliseconds.

---

### Fix B5

Every active layer receives:

```text
durationMs
```

Each frame:

```text
spawnTime + durationMs < elapsed
```

causes removal.

Completion:

```text
elapsed >= totalDurationMs
AND
activeLayers.length === 0
```

Safety net:

```text
totalDurationMs + 400ms
```

must force completion.

---

### Fix B14

Implement:

```text
hitStop
flash
```

through the camera feedback system.

Hit-stop uses shared:

```text
timeScale
```

Flash becomes:

```html
DOM overlay
```

instead of a world-space plane.

Delete the old world-space `FlashEffect`.

---

# 5. ATTACK CATEGORIES

Ten categories should be implemented as reusable `AnimationProfile` records.

| Category         | Windup |  Travel | Contact | Main Identity     |
| ---------------- | -----: | ------: | ------: | ----------------- |
| `CONTACT_STRIKE` |    160 |       0 |      80 | Lunge             |
| `SLASH`          |    140 |       0 |      70 | Dash + slash      |
| `PROJECTILE`     |    200 | 220–320 |      80 | Projectile        |
| `BEAM`           |    280 | 120–260 |     100 | Charge + beam     |
| `AREA_GROUND`    |    240 |       0 |     110 | Slam              |
| `MULTI_HIT`      |    150 |       0 |  45/hit | Repeated contacts |
| `STATUS_APPLY`   |    220 |     180 |       0 | Cloud/status      |
| `SELF_BUFF`      |    180 |       0 |       0 | Rising ring       |
| `GUARD`          |    120 |       0 |       0 | Shield            |
| `HEAL`           |    200 |       0 |       0 | Rising sparkles   |

---

## Composable Modifiers

### `recoil`

After reaction:

* attacker self-damage flinch
* self-damage number

---

### `heavy`

For:

```text
basePower >= 100
```

Effects:

```text
windup × 1.35
hit-stop × 1.4
2% release dolly
```

---

### `quick`

For:

```text
priority > 0
```

Effects:

```text
windup × 0.7
hit-stop × 0.85
```

---

# 5.1 Inheritance Model

Create:

```ts
type AnimCategory =
  | 'CONTACT_STRIKE'
  | 'SLASH'
  | 'PROJECTILE'
  | 'BEAM'
  | 'AREA_GROUND'
  | 'MULTI_HIT'
  | 'STATUS_APPLY'
  | 'SELF_BUFF'
  | 'GUARD'
  | 'HEAL';
```

And:

```ts
interface AttackProfile {
  category: AnimCategory;
  modifiers?: ('recoil' | 'heavy' | 'quick')[];
  overrides?: Partial<StageTimings & VisualKnobs>;
}
```

Resolution order:

1. `MOVE_PROFILES[moveId]`
2. Derived default from move data
3. `PROJECTILE` fallback

Identity comes from:

* type palette
* timing overrides
* particle texture

Available particle textures:

```text
circle
shard
leaf
drop
star
smoke
spark
wave
ring
diamond
square
```

No per-move animation code.

---

# 6. DEFENDER REACTIONS

Every result needs a visually distinct silhouette.

| Result          | Reaction                                  |
| --------------- | ----------------------------------------- |
| Normal          | 0.18u knockback + white flash             |
| Critical        | 0.30u knockback + rotation + double flash |
| Super-effective | 0.26u knockback + tremor + type glow      |
| Resisted        | 0.06u recoil, no shake                    |
| Immune          | No movement; ward ring                    |
| Miss            | Lateral sidestep + afterimage             |
| Status          | Slow shudder + status tint                |
| Stat change     | Rise/sink + chevrons                      |
| Healing         | Gentle rise + green tint                  |
| Heavy           | 0.42u knockback + rotation + dust         |
| Multi-hit       | Escalating jitter                         |
| Detonate        | Knockback + upward pop + Imprint burst    |
| Knockout        | Dedicated KO sequence                     |

---

## Idle Baseline

Always-running idle animation:

```text
0.02u vertical sine bob
0.5Hz
```

Combatants are phase-offset.

Below:

```text
25% HP
```

change to:

```text
0.35Hz
+
8% red tint
```

This creates a passive danger read.

---

# 7. DAMAGE + EFFECTIVENESS FEEDBACK

## 7.1 Impact Tier Table

Tier is determined from:

```text
damageDealt / defender.maxHp
```

then modified by result flags.

| Tier | Condition         | Hit-stop | Shake | Punch |     Flash | Number |
| ---- | ----------------- | -------: | ----: | ----: | --------: | -----: |
| T0   | `<6%` or resisted |        0 |     0 |     0 |      none |  0.85× |
| T1   | `6–18%`           |       55 |  0.05 |  0.03 |      none |     1× |
| T2   | `18–30%`          |       75 |  0.07 | 0.045 |      none |  1.15× |
| T3   | `≥30%`            |      100 |  0.10 | 0.065 |  6% white |   1.5× |
| T4   | lethal            |      130 |  0.11 |  0.07 | 10% white |   1.6× |

### Critical Modifier

```text
hit-stop ×1.25
shake +0.02
punch +0.015
number ×1.2
```

Banner:

```text
CRITICAL!
```

### Detonate Modifier

```text
hit-stop ×1.2
shake +0.015
flash 8% Imprint colour
number ×1.15
```

Banner:

```text
DETONATE!
```

---

# 7.2 Explicit Prohibitions

Screen shake must NOT occur on:

* resisted hits
* immune hits
* misses
* status application
* stat changes
* healing
* Guard
* switching
* end-of-turn ticks
* T0 damage

Screen flash only occurs on:

```text
T3
T4
Detonate
```

Hit-stop only occurs during:

```text
damaging CONTACT
```

If shakes overlap:

```text
larger replaces smaller
```

Maximum:

```text
one banner
```

Banner dwell:

```text
900ms
```

Cross-fade:

```text
120ms
```

If more than 3 banners queue:

```text
collapse remainder into combat log
```

---

# 7.3 HP Bar Behaviour

Use two stacked fills.

### Leading Fill

At contact:

```text
snap immediately
```

### Ghost Fill

```text
350ms
ease-out
```

The gap visually communicates damage magnitude.

### Thresholds

```text
>50%   green #48bb78
20–50% amber #ecc94b
<20%   red #f56565
```

Color transition:

```text
200ms crossfade
```

Below 20%:

```text
opacity 1.0 ↔ 0.75
1.2Hz
```

Multi-hit:

* leading fill snaps per hit
* ghost bar drains once from pre-move to post-move

---

# 7.4 Damage Numbers

Spawn at defender body centre.

Horizontal offset:

```text
±0.15u
```

Animation:

```text
rise 0.5u
700ms
ease-out
12% horizontal drift
```

Opacity:

```text
400ms at 1.0
+
300ms fade
```

Colors:

```text
normal = white
critical = gold
detonate = amber
resisted = grey
heal = green
```

Maximum:

```text
6 concurrent numbers
```

Oldest is removed when exceeded.

Numbers are DOM overlays positioned using projected world coordinates.

---

# 8. KNOCKOUT + BATTLE TRANSITIONS

## 8.1 Knockout Sequence

Total:

```text
2200ms
```

| Time | Event                                         |
| ---: | --------------------------------------------- |
|    0 | Final contact + 130ms hit-stop                |
|  130 | Hit-stop releases; knockback; HP reaches zero |
|  300 | Damage number peaks; faint banner             |
|  450 | Desaturation begins                           |
|  700 | 300ms deliberate hold                         |
| 1000 | Sprite sinks and fades                        |
| 1450 | Sprite unmounts; HP plate leaves              |
| 1700 | Camera widens                                 |
| 2000 | Branch to switch/victory/defeat               |
| 2200 | Next sequence                                 |

No additional camera shake after the initial lethal impact.

---

## 8.2 Switch-In

Total:

```text
900ms
```

Sequence:

```text
0      outgoing compression/fade
200    incoming sprite drops
380    landing
420    HP plate enters
600    Go! <NAME>!
900    complete
```

Incoming Pokémon always has:

```text
no Imprint
```

Switching therefore clears Imprint.

---

## 8.3 Battle Intro

Total:

```text
1900ms
```

Sequence:

```text
0       overworld wipe completes
0–300   arena fades
250     enemy enters
500     player enters
700     HP plates enter
1000    "A wild <NAME> appeared!"
1500    action bar enters
1900    SELECTING_ACTION
```

Camera:

```text
8% slow push
```

then stops.

No orbiting.

---

## 8.4 Victory / Defeat

### Victory

```text
1600ms
```

* player celebration hop ×2
* enemy plate exits
* victory banner
* transition

### Defeat

```text
1600ms
```

* scene desaturates
* defeat banner
* fade to black

Both invoke:

```ts
onBattleEnd(victory: boolean)
```

exactly once.

Use a guard flag.

---

# 9. BATTLE UI REDESIGN

All battle UI is DOM overlay above the single Canvas.

Target:

```text
16:9
```

with mobile-portrait fallback.

| Component         | Purpose                  |
| ----------------- | ------------------------ |
| Combatant Plate   | Full combatant state     |
| HP Bar            | Health                   |
| Name/Level/Types  | Identity + matchup       |
| Status Chips      | Active conditions        |
| Imprint Glyph     | Unique mechanic          |
| Turn Order Pip    | Predict action order     |
| Action Bar        | FIGHT / GUARD / SWITCH   |
| Move Grid         | Move selection           |
| Move Cell         | Move details             |
| Consequence Tags  | Effectiveness / Detonate |
| Move Detail Rail  | Expanded move info       |
| Intent Telegraph  | Opponent category        |
| Event Banner      | Immediate result         |
| Damage Numbers    | Magnitude                |
| Combat Log        | History                  |
| Switch Tray       | Team selection           |
| Fast-Forward Hint | Speed control            |

---

## Anti-Clutter Rules

At most:

```text
one transient overlay
```

visible at a time.

Move grid and switch tray are mutually exclusive.

Combat log never auto-expands.

No UI overlaps:

* combatant plates
* sprites

During resolution:

```text
all interactive UI = disabled
opacity = 60%
```

The player cannot interact with the battle while actions are resolving.

---

# 10. STRATEGIC BATTLE DESIGN

## 10.1 Why Current Decisions Are Shallow

Current system has:

```text
one meaningful input
=
move choice
```

There is:

* no switching
* no status
* no stat stages
* no PP
* no crits
* no meaningful abilities

Continuous ATB eliminates prediction.

---

# 10.2 Five Strategic Pillars

### 1. Discrete Simultaneous Commit

Both sides choose actions.

Then:

```text
priority
→ effective Speed
→ seeded tiebreak
```

determines resolution.

---

### 2. Switching

At least:

```text
2 reserves
```

Switching costs the entire turn.

Switching:

* risks taking a hit
* resets matchup
* clears Imprint

---

### 3. Guard

Guard:

```text
50% damage reduction
priority +4
clears own Imprint
grants SHATTERED immunity this turn
```

Cannot be used consecutively.

Use:

```text
guardLocked
```

---

### 4. Status + Stat Stages

Add:

* burn
* poison
* paralysis equivalent
* stat stages
* setup
* debuff

These create reasons not to attack every turn.

---

### 5. Imprint / Detonate

The unique mechanic.

It turns:

```text
type coverage
```

into:

```text
two-move planning
```

---

# 10.3 Decision Space

Every turn the player evaluates:

* attack for immediate tempo
* create an Imprint
* Detonate existing Imprint
* Guard
* switch
* apply status
* buff
* debuff

Because the opponent's category is telegraphed but exact move remains hidden, the choices interact.

---

# 10.4 Supporting Mechanics

| Mechanic            | Rule                         | Fixes   | Purpose                 |
| ------------------- | ---------------------------- | ------- | ----------------------- |
| Computed stats      | Standard stat formulas       | B22     | Makes levels meaningful |
| Accuracy            | Roll before damage           | B8      | Creates risk/reward     |
| Critical hits       | 1/16 base, ×1.5 damage       | —       | Controlled variance     |
| Stat stages         | Multipliers                  | B21/B25 | Setup and counterplay   |
| PP                  | Per-move resource            | B19     | Prevents spam           |
| Switching           | Costs turn, clears Imprint   | B20     | Counterplay             |
| Guard               | 50% reduction, +4 priority   | B3/B20  | Defensive option        |
| Status              | Persistent conditions        | B21     | Long-term strategy      |
| Abilities           | Real modifiers               | B25     | Team identity           |
| Simultaneous commit | Both actions selected        | B23     | Prediction              |
| Imprint/Detonate    | Type-based two-step mechanic | G6/G7   | Unique identity         |

---

# 11. TYPE STRATEGY

Types remain a core strategic pillar.

They should affect:

* damage
* switching
* move choice
* prediction
* Imprint
* Detonate
* team composition
* status/control

The desired thought process is:

> "If I use this move now, the opponent will probably respond with X, so I should prepare Y."

---

# 12. UNIQUE MECHANIC CANDIDATES

At least three candidates should be evaluated.

The strongest proposed system is:

# Imprint / Detonate

The type chart is used twice:

```text
damage calculation
+
Detonate eligibility
```

This turns coverage into a sequence.

---

# 13. SELECTED UNIQUE MECHANIC — IMPRINT / DETONATE

The mechanic revolves around placing a temporary elemental imprint on the opponent.

## Core Concept

Certain attacks apply an:

```text
Imprint
```

of their move type.

Example:

```text
Use FIRE move
↓
Enemy becomes FIRE-Imprinted
↓
Use a move whose type is super-effective against FIRE
↓
DETONATE
```

The second move:

* deals its normal damage
* triggers the Imprint
* creates a stronger secondary event
* applies `SHATTERED`

---

## Imprint Rules

An Imprint lasts:

```text
3 turns
```

Only one Imprint can exist on a combatant.

Switching:

```text
clears Imprint
```

Guard:

```text
clears own Imprint
```

New Imprint:

```text
replaces old Imprint
```

---

## Detonate

A move detonates the Imprint when its type is super-effective against the Imprinted type.

Example:

```text
FIRE Imprint
+
WATER attack
=
DETONATE
```

The UI displays:

```text
DETONATE
```

before committing.

---

## Detonate Result

Detonate produces:

* enhanced damage feedback
* Imprint glyph shatter
* special camera impact
* `SHATTERED` debuff
* unique banner

The Imprint is then removed.

---

# 14. COMPLETE TURN FLOW

```text
SELECTING_ACTION
      ↓
PLAYER_COMMIT
      ↓
OPPONENT_COMMIT
      ↓
SHOW_INTENT_TELEGRAPH
      ↓
DETERMINE_ORDER
      ↓
ACTION 1
      ↓
ANTICIPATE
      ↓
WINDUP
      ↓
RELEASE
      ↓
TRAVEL
      ↓
CONTACT
      ↓
DAMAGE COMMIT
      ↓
REACTION
      ↓
SETTLE
      ↓
ACTION 2
      ↓
END-OF-TURN STATUS
      ↓
IMPRINT TIMER
      ↓
BATTLE CHECK
      ↓
NEXT TURN
```

If a Pokémon faints:

```text
KO
↓
SWITCH
or
VICTORY/DEFEAT
```

---

# 15. STRATEGIC BATTLE EXAMPLES

## Scenario 1 — Type Setup

Player:

```text
FIRE Pokémon
```

Opponent:

```text
GRASS Pokémon
```

Player can immediately use a super-effective FIRE attack.

But if that attack also creates an Imprint, the player may instead consider a lower-damage move that sets up a future Detonate.

---

## Scenario 2 — Predicting a Switch

Opponent is likely to switch into a WATER Pokémon.

Player can:

```text
attack
```

or:

```text
prepare an Imprint
```

or:

```text
use Guard
```

The player is therefore predicting rather than simply selecting the highest-power move.

---

## Scenario 3 — Guard Prediction

Opponent telegraphs:

```text
PHYSICAL
```

Player may:

```text
GUARD
```

But Guard cannot be used twice consecutively.

Therefore the opponent can predict the Guard and choose a setup/status move.

---

## Scenario 4 — Detonate Risk

Player has:

```text
FIRE Imprint
```

Opponent can:

```text
switch
```

to clear it.

Therefore the player must decide:

```text
Detonate now
```

or:

```text
try to preserve the setup
```

---

## Scenario 5 — Low HP

Player's Pokémon is below:

```text
20% HP
```

Options:

```text
attack
Guard
switch
Detonate
status
```

The correct answer depends on:

* opponent category
* Speed
* typing
* current Imprint
* remaining team
* status
* future matchup

---

# 16. BATTLE STATE MACHINE

The new system should use an explicit reducer/state machine rather than chained `useEffect` transitions.

Possible states:

```text
INTRO
SELECTING_ACTION
COMMITTING
TELEGRAPH
RESOLVING_ORDER
ANTICIPATE
WINDUP
RELEASE
TRAVEL
CONTACT
REACT
SETTLE
END_TURN
SWITCHING
FORCED_SWITCH
VICTORY
DEFEAT
```

Every state must define:

* entry condition
* permitted actions
* blocked actions
* transitions
* animation relationship
* exit condition

The key principle:

```text
battle state
=
authoritative
```

UI and animation are presentations of that state.

---

# 17. GAMEPLAY ↔ ANIMATION ARCHITECTURE

## Game Logic Owns

The engine determines:

* selected move
* target
* hit/miss
* damage
* effectiveness
* critical
* status
* stat changes
* Imprint
* Detonate
* KO

---

## Animation Owns

The animation system determines:

* sprite motion
* particles
* camera movement
* screen flash
* hit-stop presentation
* damage number animation
* UI transitions

Animation must never calculate gameplay outcomes.

---

## Communication

Prefer:

```text
Battle Engine
      ↓
Battle Events
      ↓
Animation Director
      ↓
Visual Timeline
```

Example event:

```ts
{
  type: 'DAMAGE_CONTACT',
  attackerId,
  defenderId,
  damage,
  effectiveness,
  critical,
  detonate
}
```

The animation system consumes this event.

It does not decide whether damage occurred.

---

# 18. IMPLEMENTATION BLUEPRINT

## Feature: Battle State Machine

### Purpose

Replace fragile `useEffect` chains.

### Inputs

```text
player action
enemy action
battle state
```

### State Changes

Reducer transitions through explicit phases.

### Output

Presentation snapshot.

### Timing

Only animation director controls visual duration.

### Failure Cases

A stuck animation must never block gameplay.

### Implementation

Use:

```text
reducer
+
battle director
+
event queue
```

---

## Feature: Attack Profiles

### Purpose

Make animations reusable.

### Inputs

```text
move data
type
power
category
flags
```

### Output

```text
AnimationProfile
```

### Implementation

No per-move animation functions.

---

## Feature: HP Animation

### Purpose

Make damage readable.

### Inputs

```text
old HP
new HP
```

### Output

```text
leading fill
ghost fill
```

### Timing

```text
leading = immediate
ghost = 350ms
```

---

## Feature: Imprint

### Purpose

Unique strategic mechanic.

### Inputs

```text
move type
target
existing Imprint
```

### Output

```text
apply Imprint
replace Imprint
Detonate
```

---

# 19. IMPLEMENTATION ORDER

## Phase 1 — Stabilize Engine

1. Replace continuous ATB.
2. Introduce explicit reducer.
3. Fix direct state mutation.
4. Fix damage resolution.
5. Add computed stats.
6. Add accuracy.
7. Add crits.
8. Add status.
9. Add PP.
10. Add switching.

---

## Phase 2 — Fix Timeline Infrastructure

1. Rename timing fields to milliseconds.
2. Add layer cleanup.
3. Add hard completion timeout.
4. Implement hit-stop.
5. Implement DOM flash.
6. Remove OrbitControls.
7. Add animation director.

---

## Phase 3 — Build Animation Profiles

Implement:

```text
CONTACT_STRIKE
SLASH
PROJECTILE
BEAM
AREA_GROUND
MULTI_HIT
STATUS_APPLY
SELF_BUFF
GUARD
HEAL
```

---

## Phase 4 — Combatant Presentation

Replace boxes with:

```text
AnimatedSprite
```

Add:

* idle bob
* lunge
* recoil
* flinch
* KO
* switch-in

---

## Phase 5 — Battle UI

Implement:

* combatant plates
* HP bars
* status chips
* move grid
* effectiveness tags
* event banner
* switch tray
* combat log
* turn-order indicator

---

## Phase 6 — Imprint / Detonate

Implement:

* Imprint state
* 3-turn duration
* glyph
* Detonate condition
* SHATTERED
* Detonate animation
* Detonate UI tag

---

## Phase 7 — AI

AI should consider:

* type matchup
* HP
* status
* switching
* Guard
* Imprint
* Detonate
* setup
* predicted player category

AI should not simply:

```text
choose highest effectiveness × power
```

---

## Phase 8 — Overworld Integration

Only after battle is stable:

```text
overworld encounter
↓
battle
↓
result
↓
return to overworld
```

---

# 20. DO NOT DO

Do NOT:

* add random particles everywhere
* add screen shake to every attack
* make every attack use the same animation
* create bespoke code for every move
* use fixed 1200ms timeouts for effects
* apply damage before contact
* let animation calculate damage
* use continuous ATB
* bring back Aim/Brace sliders
* allow free defensive exploits
* make the player wait through unskippable animations
* add dozens of unrelated mechanics
* create another effect architecture
* duplicate move override tables
* use world-space UI unnecessarily
* allow OrbitControls during battle
* rewrite unrelated overworld systems
* add new dependencies without necessity
* replace the existing effect primitives unnecessarily
* add complexity merely to appear innovative

---

# 21. ACCEPTANCE CRITERIA

The redesign is successful only when all of the following are true.

## Battle Logic

* [ ] No battle soft-locks.
* [ ] No direct React state mutation.
* [ ] No continuous ATB.
* [ ] Actions resolve deterministically.
* [ ] Switching works.
* [ ] Guard works.
* [ ] Status works.
* [ ] Accuracy works.
* [ ] Critical hits work.
* [ ] Computed stats work.
* [ ] PP works.
* [ ] AI makes contextual decisions.

## Animation

* [ ] Every attack has anticipation.
* [ ] Every attack has a visible windup.
* [ ] Projectile attacks visibly travel.
* [ ] Damage occurs at contact.
* [ ] Defender reacts to damage.
* [ ] HP leading fill snaps on contact.
* [ ] Ghost HP bar drains afterward.
* [ ] Hit-stop works.
* [ ] Camera shake is tier-based.
* [ ] Flash works.
* [ ] KO has a dedicated sequence.
* [ ] Multi-hit attacks can show multiple contacts.
* [ ] Animations cannot soft-lock battle progression.
* [ ] All effect layers are cleaned up.

## Presentation

* [ ] Real Pokémon sprites are used.
* [ ] Combatants have idle motion.
* [ ] Combatants lunge/recoil.
* [ ] Different attack categories visibly differ.
* [ ] UI is readable.
* [ ] No UI overlaps sprites.
* [ ] Camera cannot be freely orbited.
* [ ] Battle feedback is understandable without relying entirely on text.

## Strategy

* [ ] Type effectiveness matters.
* [ ] Switching matters.
* [ ] Guard matters.
* [ ] Status matters.
* [ ] Speed matters.
* [ ] Prediction matters.
* [ ] Opponent actions can be partially inferred.
* [ ] Imprint creates meaningful two-step planning.
* [ ] Detonate creates meaningful risk/reward.
* [ ] The unique mechanic cannot simply be ignored.

## Performance

* [ ] One Canvas.
* [ ] No unnecessary dependencies.
* [ ] Particle quality respects `qualityStore`.
* [ ] MED quality stays within approximately 400 live particles.
* [ ] Animation systems remain reusable.
* [ ] No duplicate effect architecture remains.

## Final Experience Test

A player should be able to understand:

```text
WHAT HAPPENED?
WHY DID IT HAPPEN?
WHAT SHOULD I DO NEXT?
```

And the battle should feel like:

```text
Pokémon-style strategy
+
prediction
+
type interaction
+
meaningful switching
+
unique Imprint/Detonate gameplay
+
high-impact readable animation
```

rather than:

```text
menu
+
timer
+
slider
+
particle explosion
```

```
```
