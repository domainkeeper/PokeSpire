# Battle System Solution — "Momentum Clash" Battle Engine

**Read this whole document before writing any code.** This file is written for an AI coding agent with no memory between sessions and no ability to infer intent. Every section gives exact file paths, exact interfaces, and exact order of operations. Do not reorganize, rename, or "improve" the structure below — implement it as written. If something is ambiguous, stop and re-read the relevant section instead of guessing.

**This is a standalone Pokémon-style game project** (not the Living Obsidian ARPG — different codebase, different genre, do not mix them up if both exist in the same workspace). The overworld is a rendered pseudo-3D pixel-art world with real-time lighting/shadows, lamp posts, foliage detail, and a rotating minimap HUD (top-right corner, showing a labeled area like "COASTAL CITY" with a player-position dot) — this is a considerably more visually ambitious overworld than a flat 2D tile-grid, so treat the battle screen's presentation bar as needing to match that fidelity, not undercut it with flat placeholder rectangles.

---

## 0. Assumptions about the existing codebase — VERIFY BEFORE STEP 1

- Overworld renderer (`MapRenderer.tsx` or equivalent) is a WebGL/3D-capable renderer given the lighting, shadow-casting lamp posts, and camera angle visible in the reference screenshot — most likely **Three.js**, possibly with a custom shader/lighting pass. **Confirm this before writing any battle-screen 3D code** — run `grep -rn "THREE\|WebGLRenderer\|@react-three" src/` and check `package.json` for `three` / `@react-three/fiber`. If it turns out to be a 2D canvas with painted fake-shadows instead, adjust the VFX/camera sections (6 and 8) accordingly — the *combat engine logic* (Sections 4–5) is renderer-agnostic either way and does not change.
- Data layer already includes (or is being built via) **`@pkmn/dex`** — the user has already implemented ability logic sourced from `@pkmn`. **Do not rebuild ability logic from scratch.** Locate it first (Step 0 below) and integrate the new battle engine against it — do not write a second, competing ability system.
- Move/species/type data should be sourced from `@pkmn/dex`'s typed `Dex` object, not hand-rolled enums. See Section 3.

### Step 0 — Locate the existing ability system before writing anything

Before Step 1 of the file plan, run:
```bash
grep -rln "@pkmn" src/ | sort
grep -rln "onModifyDamage\|onModifyAtk\|onFaint\|onSwitchIn\|abilityEffect\|AbilityHandler" src/
```
This should surface the file(s) where ability hook logic already lives (likely something like `src/battle/abilities.ts`, `src/data/abilities/*.ts`, or similar). **Write down the exact file path and exported function signatures you find** before proceeding — Section 5 below assumes an event-hook shape and tells you exactly where to call into it, but the *names* of the exported functions must come from what you actually find, not be invented fresh. If genuinely nothing exists yet despite the user's statement, stop and flag this back to the user instead of guessing — do not silently build a parallel ability system.

---

## 1. Research summary — why this system, not a copy of an existing one

Five reference systems were evaluated. Each has a defining mechanic:

| System | Core mechanic | Strength | Weakness for a Pokémon-like game |
|---|---|---|---|
| **Classic Pokémon / static turn-based** | Pick move → resolve → pick move | Deep strategy, zero reflex skill needed | Feels dated, no player agency during resolution, "modern" players bounce off it |
| **Raid: Shadow Legends (ATB / speed bar)** | Each unit fills a speed meter; turn happens when full | Turn order emerges from stats, not a rigid rotation; makes Speed a real stat | Still 100% menu-driven, no spatial/skill component |
| **Brawl Stars (twin-stick arena)** | Aim + fire in real time, dodge in real time | Extremely kinetic, high skill ceiling, satisfying VFX/camera | Fully real-time — incompatible with a stats/type RPG, no room for menu-based strategy |
| **mo.co (Supercell action-RPG)** | Real-time movement + weapon abilities on cooldown, juicy hit-feedback (screen shake, hit-stop, numbers popping) | Best-in-class "game feel" reference for camera/VFX punch | Cooldown-based kit, not turn/stat based |
| **MOBA (ability-based, League/Unite style)** | Skillshot targeting (aim a cone/line/circle), cooldowns, positioning matters | Skillshot aiming adds spatial decision-making to an ability | Full real-time positioning is too much for a 1v1 Pokémon battle |

**None of these alone fits.** The gap in the market: every Pokémon-like (Temtem, Pokémon itself, Coromon, Nexomon) is pure static turn-based. Every real-time monster game (mo.co) drops the deep type/stat/ability strategy layer entirely. Since abilities (the single most build-defining system in real Pokémon — Intimidate, Levitate, Protean, weather setters, etc.) are already implemented in this project via `@pkmn`, the battle system below is built to be a **host for that existing ability event model**, not a replacement for it.

### The chosen direction: **ATB Speed-Bar + Skillshot Aiming + Reactive Dodge Window**

This keeps the strategic core (types, stats, abilities, team building, move choice) but makes **both offense and defense require a real-time input**, without becoming a twitch shooter. Three borrowed mechanics, fused:

1. **From Raid: Shadow Legends** → Turn order is not "player then enemy alternating." Every combatant has a **Speed Gauge** that fills based on their effective Speed stat (post-ability/status modifiers — see Section 5). Whoever fills first acts next. This replaces the rigid I-go-you-go turn order and makes Speed-affecting abilities (e.g. an Intimidate-style attack drop, a Speed-boost ability) visibly matter in real time, not just in a hidden stat comparison.
2. **From MOBA skillshots (League/Unite)** → Damaging moves with the tag `aimed: true` require the player to aim a **targeting reticle** (line, cone, or circle depending on the move) at the moment of use. Landing the reticle precisely on the opponent's current position grants a **Precision Bonus** (+20% damage / guaranteed crit chance, move-dependent). Missing entirely (opponent dodges out of the shape) can cause the move to whiff. This is the single most "unique for a Pokémon game" piece — no existing Pokémon-like does skillshot aiming.
3. **From Brawl Stars' dodge/movement tension** → When the enemy's speed gauge fills and they are about to act, the defending player gets a short reactive window (a "Brace" prompt) to nudge their combatant left/right within a confined arena strip. A well-timed Brace reduces incoming damage (grazes the hit); a perfect Brace on certain move types can fully evade. This gives the *defender* something to do besides watch.
4. **From mo.co / Brawl Stars "juice"** → Every hit, crit, faint, ability trigger, and status proc drives `CameraFeedback` (shake/zoom-punch) and `MoveEffect.tsx` VFX. Numbers pop, hit-stop freezes 2-4 frames on big hits, ability activations get their own small callout banner (see Section 5.3). This is presentation, not new logic, but it's what makes the whole thing feel modern instead of like a spreadsheet — and it's what will make the existing ability work actually *visible* to the player instead of being invisible math.

Net result: it is still turn-based in the sense that only one combatant resolves an action at a time, so the existing `@pkmn`-sourced ability logic and type/move data are fully reusable — but *when* that turn happens (Speed Gauge), *how well it lands* (Skillshot aim), and *how much damage gets through* (Brace timing) are all real-time skill inputs layered on top.

---

## 2. Battle flow — state machine (implement exactly this)

```
IDLE (overworld)
  → ENCOUNTER_TRIGGER (player walks into wild Pokémon on Route 1)
  → BATTLE_INTRO (camera transition, combatants slide/spawn in; on-switch-in abilities fire here — see 5.2)
  → GAUGE_TICK (all combatants' Speed Gauges fill simultaneously in real time, using effective post-ability speed)
      → when a gauge hits 100%: that combatant becomes ACTIVE
  → ACTIVE_TURN
      IF active combatant is player-controlled:
        → MOVE_SELECT (radial menu appears)
        → IF chosen move has aimed:true → AIMING (reticle phase)
        → ELSE → skip straight to RESOLVE
      IF active combatant is AI-controlled:
        → AI_DECIDE (pick move + pick aim target, described in section 5)
  → DEFENDER_BRACE (only if the move is not a guaranteed-hit status move)
      → defending player gets a Brace window (~700ms) to nudge position
  → RESOLVE (ability pre-hooks → damage/effect calculation → ability post-hooks, Section 5)
  → IMPACT (VFX + CameraFeedback + HP bar animate + combat log line + ability callout if one triggered)
  → CHECK_FAINT
      IF a combatant's HP hits 0 → FAINT_SEQUENCE → (if team has more) SWITCH_PROMPT else BATTLE_END
      ELSE → back to GAUGE_TICK (gauges resume filling, the combatant who just acted resets to 0%)
  → BATTLE_END (victory/defeat screen, return to MapRenderer)
```

Implement this as an explicit finite state machine, not as ad-hoc booleans. Use a single `battlePhase` enum and a `switch` in the main battle loop. This is the single most important structural rule in this document — **a bad coding agent's #1 failure mode is turning this into tangled boolean flags.** Do not do that.

```ts
export type BattlePhase =
  | "INTRO"
  | "GAUGE_TICK"
  | "MOVE_SELECT"
  | "AIMING"
  | "AI_DECIDE"
  | "DEFENDER_BRACE"
  | "RESOLVE"
  | "IMPACT"
  | "FAINT_SEQUENCE"
  | "SWITCH_PROMPT"
  | "BATTLE_END";
```

---

## 3. Data integration — use `@pkmn/dex`, do not reinvent

Per `POKE_DB.md`, `@pkmn/dex` is already the intended data source for species/moves/abilities/items/types/type-effectiveness. The battle engine's types must be built **on top of** it, not parallel to it.

`src/battle/types.ts`
```ts
import type { Species, Move as DexMove, Ability } from "@pkmn/dex";

// Custom fields this battle system adds on top of the real @pkmn move data.
// Do not duplicate fields @pkmn/dex already provides (basePower, accuracy,
// category, priority, type, flags, etc.) — extend, don't replace.
export interface BattleMoveExtension {
  aimed: boolean;          // true = requires AIMING phase
  shape: "single" | "line" | "cone" | "circle"; // only relevant if aimed
  shapeSize: number;       // width of line/cone/circle in arena units, 0-100 scale
  precisionBonusMultiplier: number; // e.g. 1.2 for +20% damage
}

// A move as used in battle = the real @pkmn dex move + our extension fields.
export type BattleMove = DexMove & BattleMoveExtension;

export interface Combatant {
  id: string;
  species: Species;        // from @pkmn/dex — do not re-derive stats/types by hand
  level: number;
  currentHp: number;
  maxHp: number;
  ability: Ability;        // from @pkmn/dex — resolved via the existing ability system (Section 0/5)
  moves: BattleMove[];
  gauge: number;            // 0-100
  arenaPosition: number;    // 0-100, horizontal position within the brace strip
  statusConditions: string[]; // use @pkmn's status id strings (e.g. "brn", "par"), not custom enums
  volatileFlags: Record<string, boolean>; // per-battle ability/move state, e.g. Intimidate-applied, Protean-changed-type
  isPlayerControlled: boolean;
}

export interface BattleState {
  phase: BattlePhase;
  playerTeam: Combatant[];
  enemyTeam: Combatant[];
  activeCombatantId: string | null;
  pendingMove: BattleMove | null;
  aimPosition: number | null;
  braceInput: number | null;
  combatLog: string[];
  turnCount: number;
}
```

**Move extension data (`aimed`, `shape`, `shapeSize`, `precisionBonusMultiplier`) is not something `@pkmn/dex` provides** — you have to author it per-move. Do not attempt to auto-derive it. Start with a small hand-authored override table for the Route 1 wild species' actual movesets only (not all ~900 moves in the dex):
```ts
// src/battle/moveExtensions.ts
export const MOVE_EXTENSIONS: Record<string, BattleMoveExtension> = {
  tackle: { aimed: false, shape: "single", shapeSize: 0, precisionBonusMultiplier: 1 },
  ember:  { aimed: true, shape: "cone", shapeSize: 30, precisionBonusMultiplier: 1.2 },
  // add entries only for moves actually reachable by Route 1 encounters + starter movesets
};
const DEFAULT_EXTENSION: BattleMoveExtension = { aimed: false, shape: "single", shapeSize: 0, precisionBonusMultiplier: 1 };
export function getMoveExtension(moveId: string): BattleMoveExtension {
  return MOVE_EXTENSIONS[moveId] ?? DEFAULT_EXTENSION;
}
```
Any move without an explicit entry defaults to a plain non-aimed hit — this means the aiming/skillshot layer can be rolled out move-by-move without blocking the rest of the system, and nothing crashes on an unmapped move.

**Type effectiveness:** call `@pkmn/dex`'s own type-chart lookup (`Dex.types.get(...)` / the `Dex` object's effectiveness calculation) — do not hand-write a type chart. If the existing ability-system code (Section 0) already wraps this in a helper, reuse that helper rather than calling `@pkmn/dex` a second, differently-shaped way.

---

## 4. Combat engine — exact algorithms

`src/battle/combatEngine.ts` — pure TypeScript, **no JSX, no React imports**. Takes a `BattleState`, returns a new `BattleState`. This separation is mandatory: it lets the logic be tested without rendering anything.

### 4.1 Speed Gauge fill rate
```ts
function tickGauge(combatant: Combatant, effectiveSpeed: number, deltaMs: number): number {
  const FILL_CONSTANT = 2600; // tune this — higher = slower overall pace
  const fillPerMs = effectiveSpeed / FILL_CONSTANT;
  return Math.min(100, combatant.gauge + fillPerMs * deltaMs);
}
```
`effectiveSpeed` must come from the existing ability/status system's modified-stat calculation (Section 5.1), **not** `combatant.species.baseStats.spe` directly — abilities and status conditions (paralysis, a Speed-boosting ability, etc.) need to visibly change gauge fill rate for this system to make sense at all. Run this for every combatant on every animation frame during `GAUGE_TICK`. First to hit 100 becomes `activeCombatantId`. Tie (same frame): higher effective Speed acts first, deterministic. When a combatant acts, reset **only their** gauge to 0.

### 4.2 Damage formula
```ts
function calculateDamage(
  attacker: Combatant,
  defender: Combatant,
  move: BattleMove,
  precisionBonus: boolean,
  braceResult: "none" | "graze" | "perfect",
  modifiers: DamageModifiers // from ability hooks, Section 5.1 — power/atk/def multipliers, type overrides, etc.
): number {
  if (move.category === "status") return 0;

  const atkStat = move.category === "physical" ? attacker.species.baseStats.atk : attacker.species.baseStats.spa;
  const defStat = move.category === "physical" ? defender.species.baseStats.def : defender.species.baseStats.spd;

  const base =
    ((2 * attacker.level / 5 + 2) * (move.basePower * modifiers.powerMultiplier) * ((atkStat * modifiers.atkMultiplier) / (defStat * modifiers.defMultiplier))) / 50 + 2;

  const typeMultiplier = modifiers.typeEffectivenessOverride ?? getTypeEffectiveness(move.type, defender.species.types); // from @pkmn/dex, Section 3
  const stab = attacker.species.types.includes(move.type) ? 1.5 : 1;
  const randomFactor = 0.85 + Math.random() * 0.15;

  let total = base * typeMultiplier * stab * randomFactor * modifiers.finalDamageMultiplier;

  if (precisionBonus) total *= move.precisionBonusMultiplier;
  if (braceResult === "perfect") total *= 0;
  if (braceResult === "graze") total *= 0.5;

  return Math.max(1, Math.round(total));
}

interface DamageModifiers {
  powerMultiplier: number;       // e.g. an ability that boosts a move's power
  atkMultiplier: number;         // e.g. Intimidate lowering attacker's atk
  defMultiplier: number;
  typeEffectivenessOverride: number | null; // e.g. an ability that grants immunity to a type
  finalDamageMultiplier: number; // catch-all late multiplier, e.g. a "resist super-effective" ability
}
```
`modifiers` must be produced by calling into the existing ability-hook system located in Step 0 — this function should never call ability logic itself, it just accepts the already-resolved multiplier bundle as a parameter. Keep this function pure and ability-agnostic; Section 5 is where ability logic actually plugs in.

### 4.3 Aiming resolution (skillshot)
```ts
function resolveAim(aimPosition: number, defenderPosition: number, move: BattleMove): {
  hit: boolean;
  precisionBonus: boolean;
} {
  const distance = Math.abs(aimPosition - defenderPosition);
  const shapeRadius = move.shapeSize / 2;

  if (distance > shapeRadius) {
    const missRoll = Math.random() * 100;
    return { hit: missRoll < move.accuracy * 0.5, precisionBonus: false };
  }

  const precisionThreshold = shapeRadius * 0.25;
  return { hit: true, precisionBonus: distance <= precisionThreshold };
}
```
Fixed 1800ms aiming window (shrinking timer ring). No input → default to defender's last known position (never impossible to use).

### 4.4 Brace resolution (defender's reactive dodge)
```ts
function resolveBrace(defenderFinalPosition: number, impactZoneCenter: number, impactZoneWidth: number): "none" | "graze" | "perfect" {
  const distance = Math.abs(defenderFinalPosition - impactZoneCenter);
  if (distance > impactZoneWidth) return "perfect";
  if (distance > impactZoneWidth * 0.4) return "graze";
  return "none";
}
```
~700ms window; impact zone telegraphs 400ms in, giving ~300ms genuine reaction time. Status moves and any move flagged `target: "self"` or otherwise unavoidable (per `@pkmn/dex` move data — check the real `target` field, don't invent a new flag) skip `DEFENDER_BRACE` entirely.

---

## 5. Ability system integration — this is the critical section, read carefully

**Do not write new ability logic here.** This section only describes *where in the new battle flow* to call into the ability system you located in Step 0. If the function names below don't match what you actually found, use the real names — treat these as placeholders for the *shape* of the integration, not literal required names.

### 5.1 Stat-modification hooks (affects gauge speed and damage)
Before computing `effectiveSpeed` (4.1) or `DamageModifiers` (4.2), call the existing ability system's stat-modifier resolution for each relevant stat, in this order:
1. Attacker's ability (e.g. an ability that boosts own Atk/Spe)
2. Defender's ability (e.g. Intimidate-style, or a defensive stat boost)
3. Active status conditions (paralysis speed drop, burn atk drop, etc. — likely already handled by the existing `@pkmn`-based logic)
4. Field/weather effects, if implemented — if not implemented yet, skip; do not stub fake weather logic just to fill this slot

Collect the result into the `DamageModifiers` / `effectiveSpeed` shapes used in Section 4. This is a read-only query into the existing system — the new battle engine should not mutate ability state directly.

### 5.2 Trigger-point hooks (abilities that fire on events, not stats)
Wire these exact call sites into the state machine from Section 2:

| Battle phase | Ability trigger to check | Example real Pokémon ability this covers |
|---|---|---|
| `BATTLE_INTRO`, `SWITCH_PROMPT` resolution | on-switch-in triggers | Intimidate, weather/terrain setters, Trace |
| `RESOLVE`, before damage calc | on-move-used / on-move-about-to-hit triggers | Protean (type change), a damage-prevention ability |
| `RESOLVE`, after damage calc | on-hit / on-damaging-hit triggers | Rough Skin, Static, a contact-punish ability |
| `CHECK_FAINT` | on-faint triggers (self or the one that fainted the opponent) | Uncommon in-battle abilities that trigger on a KO |
| end of `GAUGE_TICK` each frame (or once per `RESOLVE`, whichever the existing system expects) | end-of-turn triggers | Poison/burn residual damage if ability-adjacent, weather damage |

If the existing ability system was built assuming a classic "turn resolves, then all end-of-turn effects fire" model, that assumption still holds here — a "turn" in this system is just one `ACTIVE_TURN → RESOLVE → IMPACT → CHECK_FAINT` cycle for a single combatant, not a synchronized pair of moves. Map the existing hook timing onto *that* granularity.

### 5.3 Making ability triggers visible (ties into Section 6)
When any ability hook actually fires (not just gets checked and does nothing), push a short callout to `combatLog` and trigger a small non-intrusive UI banner (e.g. "Intimidate!" with the ability's icon) during the `IMPACT` phase, alongside the move's own VFX. This matters specifically because the existing ability work is invisible math right now — this battle system is also the first place it becomes something the player actually sees happen.

---

## 6. AI decision logic (enemy combatants)

```ts
function aiDecideMove(active: Combatant, target: Combatant): { move: BattleMove; aimPosition: number } {
  const damagingMoves = active.moves.filter(m => m.category !== "status");
  const usableMoves = damagingMoves.length > 0 ? damagingMoves : active.moves;

  const scored = usableMoves.map(move => ({
    move,
    score: getTypeEffectiveness(move.type, target.species.types) * move.basePower,
  }));

  scored.sort((a, b) => b.score - a.score);
  const topChoices = scored.slice(0, Math.min(2, scored.length));
  const chosen = topChoices[Math.floor(Math.random() * topChoices.length)].move;

  return { move: chosen, aimPosition: target.arenaPosition };
}
```
Intentionally basic for v1 — no ability-awareness in the AI's move scoring yet (e.g. it won't specifically avoid a move type the defender's ability resists). Do not add that until the base loop is proven; note it as a clearly-labeled `// TODO: ability-aware AI scoring` comment instead of half-implementing it now.

---

## 7. File plan — create exactly these files, in this order

### Step 0 (see above) — locate existing ability system, confirm renderer tech
### Step 1 — `src/battle/types.ts` (Section 3)
### Step 2 — `src/battle/moveExtensions.ts` (Section 3)
### Step 3 — `src/battle/combatEngine.ts` (Section 4) — pure logic, no React, manually test with 3-4 console-logged calls before moving on, then delete the test calls
### Step 4 — Confirm the integration points from Section 5 compile against the real ability-system exports found in Step 0
### Step 5 — `src/battle/useSpeedGauge.ts` — ticks gauges every frame during `GAUGE_TICK`, log values to console for 5 seconds, confirm a faster effective-Speed combatant reaches 100 first
### Step 6 — `src/battle/BattleScreen.tsx` — static layout with hardcoded dummy data first, no interactivity. Match the overworld's visual fidelity (Section 8) — do not ship flat placeholder rectangles as the "final" look
### Step 7 — `src/battle/MoveSelectMenu.tsx`
### Step 8 — `src/battle/AimReticle.tsx`
### Step 9 — `src/battle/BraceMeter.tsx`
### Step 10 — Wire the full state machine in `BattleScreen.tsx` against `combatEngine.ts`, only after Steps 1-9 each individually render/compile correctly
### Step 11 — VFX & camera hookup into `MoveEffect.tsx` / `CameraFeedback`, plus the ability-callout banner from Section 5.3
### Step 12 — Encounter trigger wiring from `MapRenderer.tsx` (Section 9)

**Do not attempt Steps 6-12 in one pass.** Build and manually verify each step. This system has a lot of interacting timing logic (gauge fill, aim window, brace window, ability hook timing) — building it all at once is exactly how a weak coding agent produces something that "looks done" but is subtly broken.

---

## 8. UI layout direction (modern, not the old 4-menu-box style)

- **No static "4 boxes on the bottom" Gen 1-3 layout.** Combatants are positioned dynamically on a horizontal arena strip (doubles as the Brace strip), not fixed portrait boxes.
- Given the overworld's real-time lighting/shadow presentation (per the reference screenshot), the battle arena should carry the same visual register — a lit ground plane with a soft directional shadow under each combatant, not a flat 2D backdrop. If the overworld is confirmed Three.js (Step 0), reuse its lighting/shadow setup for the battle arena rather than building a second lighting system from scratch.
- **Speed Gauge bars** for both combatants sit at the top of the screen, filling continuously in real time.
- **HP bars** float directly above each combatant (not in a separate corner box).
- **Move select** is a radial/arc menu (4-6 moves arranged in an arc near the active combatant), not a rigid 2x2 grid.
- **Aim reticle**: a semi-transparent shape (line/cone/circle per move) following player input, with a shrinking ring timer.
- **Brace prompt**: the arena strip highlights an incoming "impact zone" that telegraphs briefly before impact.
- **Ability callout**: a small banner (icon + ability name) in a corner when an ability actually triggers, per Section 5.3 — must not block the combat log or HP bars.
- **Combat log**: small, collapsible text feed in a corner — supplementary, not the focus.
- Camera does a slow push-in during `AIMING` and a snap zoom-punch during `IMPACT`.

---

## 9. Encounter trigger (Step 12)

In `MapRenderer.tsx`, wherever Route 1 wild-encounter collision is currently detected:
```ts
function onWildEncounterTriggered(wildPokemon: Combatant) {
  cameraTransition.playEncounterFlash(); // reuse existing transition if present, else a simple fade
  setActiveScreen("battle");
  initializeBattleState({
    playerTeam: getPlayerParty(),
    enemyTeam: [wildPokemon],
  });
}
```
`initializeBattleState` sets `phase: "INTRO"`, all `gauge: 0`, starting `arenaPosition: 30` (player) / `70` (enemy). After `BATTLE_END`, return to `MapRenderer` at the exact tile/position the player was standing on before the encounter — do not reset player position.

---

## 10. Explicit build checklist (work through top to bottom, do not reorder)

- [ ] Step 0: existing ability-system file(s) located and function signatures written down; renderer tech confirmed (Three.js or otherwise)
- [ ] Step 1-2: `types.ts` + `moveExtensions.ts` compile, no errors
- [ ] Step 3: `combatEngine.ts` — manual test calls confirm sane damage numbers, then delete the test calls
- [ ] Step 4: ability-hook call sites compile against real exports, not placeholder names
- [ ] Step 5: gauge values climb correctly in console, faster effective-Speed combatant reaches 100 first
- [ ] Step 6: `BattleScreen.tsx` renders hardcoded dummy combatants with lighting/shadow consistent with the overworld, no interactivity yet
- [ ] Step 7: move select menu appears, clicking a move logs the correct move id
- [ ] Step 8: aim reticle appears only for `aimed: true` moves, dragging moves it, releasing logs aim position
- [ ] Step 9: brace meter appears during `DEFENDER_BRACE`, input moves the combatant sprite
- [ ] Step 10: full state machine wired — play a full turn end-to-end with console logs at each phase transition, confirm the sequence matches Section 2 exactly
- [ ] Step 11: VFX/camera fire on impact, HP bar animates instead of snapping, ability callout banner appears when an ability actually triggers
- [ ] Step 12: walking into Route 1 grass triggers `BATTLE_INTRO`, battle end returns to the correct overworld position

Do not mark a step complete until it is visually/console-verified. Do not move to the next numbered step with a previous one half-working "because it'll probably be fine."