/**
 * Animation profile selection.
 *
 * Resolution order:
 *   1. MOVE_PROFILE_OVERRIDES[moveId]   - hand-authored signature moves
 *   2. derived from move data           - flags / category / power / priority
 *   3. PROJECTILE fallback
 *
 * Step 2 is what keeps this from becoming ~900 hand-written animations: Showdown's
 * flags already describe how a move behaves physically (`contact`, `punch`, `bullet`,
 * `sound`, `slicing`, `pulse`, `heal`, `powder`), which maps cleanly onto silhouette.
 */

import type { MoveRuntime } from '../../engine/battleTypes';
import { MOVE_PROFILE_OVERRIDES } from './moveProfileOverrides';
import { buildProfile } from './profileCatalog';
import type { AnimCategory, AnimModifier, AnimationProfile } from './animationTypes';

const HEAVY_POWER = 100;

function deriveModifiers(move: MoveRuntime): AnimModifier[] {
  const mods: AnimModifier[] = [];
  if (move.basePower >= HEAVY_POWER) mods.push('heavy');
  if (move.priority > 0) mods.push('quick');
  if (move.recoil) mods.push('recoil');
  return mods;
}

function deriveCategory(move: MoveRuntime): AnimCategory {
  // Support moves first: these must never read as attacks.
  if (move.category === 'status') {
    if (move.heal) return 'HEAL';
    if (move.primary.boosts?.target === 'self') return 'SELF_BUFF';
    if (move.primary.status || move.primary.boosts?.target === 'foe') return 'STATUS_APPLY';
    return 'SELF_BUFF';
  }

  if (move.hits) return 'MULTI_HIT';

  const f = move.flags;

  if (f.contact) {
    if (f.slicing) return 'SLASH';
    return 'CONTACT_STRIKE';
  }

  // Non-contact physical with no projectile flag reads best as force from the ground.
  if (f.bullet || f.bomb) return 'PROJECTILE';
  if (f.sound || f.pulse) return 'BEAM';
  if (f.wind) return 'AREA_WAVE';

  if (move.category === 'physical') return 'AREA_GROUND';

  return 'PROJECTILE';
}

const cache = new Map<string, AnimationProfile>();

export function resolveProfile(move: MoveRuntime): AnimationProfile {
  const cached = cache.get(move.id);
  if (cached) return cached;

  const override = MOVE_PROFILE_OVERRIDES[move.id];
  const profile = override
    ? buildProfile(
        override.category,
        override.modifiers ?? deriveModifiers(move),
        { timings: override.timings, knobs: override.knobs },
      )
    : buildProfile(deriveCategory(move), deriveModifiers(move));

  cache.set(move.id, profile);
  return profile;
}

/** Profile for the Guard action, which is not a move. */
export function guardProfile(): AnimationProfile {
  return buildProfile('GUARD');
}

/** Exposed for the FX preview harness. */
export function resolvedCategoryOf(move: MoveRuntime): AnimCategory {
  return MOVE_PROFILE_OVERRIDES[move.id]?.category ?? deriveCategory(move);
}

export function clearProfileCache(): void {
  cache.clear();
}
