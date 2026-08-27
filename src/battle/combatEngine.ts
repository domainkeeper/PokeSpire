import type { Combatant, BattleMove } from './types';
import { PokemonDatabase } from '../data/pokemon/PokemonDatabase';

export interface DamageModifiers {
  powerMultiplier: number;
  atkMultiplier: number;
  defMultiplier: number;
  typeEffectivenessOverride: number | null;
  finalDamageMultiplier: number;
}

export function tickGauge(combatant: Combatant, effectiveSpeed: number, deltaMs: number): number {
  const FILL_CONSTANT = 2600;
  const fillPerMs = effectiveSpeed / FILL_CONSTANT;
  return Math.min(100, combatant.gauge + fillPerMs * deltaMs);
}

export function calculateDamage(
  attacker: Combatant,
  defender: Combatant,
  move: BattleMove,
  precisionBonus: boolean,
  braceResult: 'none' | 'graze' | 'perfect',
  modifiers: DamageModifiers
): number {
  const category = (move.category as string).toLowerCase();
  if (category === 'status') return 0;

  const basePower = Number(move.basePower) || 40;
  const atkStat = category === 'physical' ? attacker.species.baseStats.atk : attacker.species.baseStats.spa;
  const defStat = category === 'physical' ? defender.species.baseStats.def : defender.species.baseStats.spd;

  const base =
    ((2 * attacker.level / 5 + 2) *
      (basePower * modifiers.powerMultiplier) *
      ((atkStat * modifiers.atkMultiplier) / (defStat * modifiers.defMultiplier))) /
      50 +
    2;

  const typeMultiplier =
    modifiers.typeEffectivenessOverride ??
    PokemonDatabase.getEffectiveness(move.type, defender.species.types);
  const stab = attacker.species.types.includes(move.type) ? 1.5 : 1;
  const randomFactor = 0.85 + Math.random() * 0.15;

  let total = base * typeMultiplier * stab * randomFactor * modifiers.finalDamageMultiplier;

  if (precisionBonus) total *= move.precisionBonusMultiplier;
  if (braceResult === 'perfect') total *= 0;
  if (braceResult === 'graze') total *= 0.5;

  return Math.max(1, Math.round(total));
}

export function resolveAim(
  aimPosition: number,
  defenderPosition: number,
  move: BattleMove
): { hit: boolean; precisionBonus: boolean } {
  const distance = Math.abs(aimPosition - defenderPosition);
  const shapeRadius = move.shapeSize / 2;

  if (distance > shapeRadius) {
    const missRoll = Math.random() * 100;
    return { hit: missRoll < Number(move.accuracy ?? 100) * 0.5, precisionBonus: false };
  }

  const precisionThreshold = shapeRadius * 0.25;
  return { hit: true, precisionBonus: distance <= precisionThreshold };
}

export function resolveBrace(
  defenderFinalPosition: number,
  impactZoneCenter: number,
  impactZoneWidth: number
): 'none' | 'graze' | 'perfect' {
  const distance = Math.abs(defenderFinalPosition - impactZoneCenter);
  if (distance > impactZoneWidth) return 'perfect';
  if (distance > impactZoneWidth * 0.4) return 'graze';
  return 'none';
}

export function aiDecideMove(
  active: Combatant,
  target: Combatant
): { move: BattleMove; aimPosition: number } {
  const damagingMoves = active.moves.filter((m) => (m.category as string).toLowerCase() !== 'status');
  const usableMoves = damagingMoves.length > 0 ? damagingMoves : active.moves;

  const scored = usableMoves.map((move) => ({
    move,
    score: PokemonDatabase.getEffectiveness(move.type, target.species.types) * Number(move.basePower || 40),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topChoices = scored.slice(0, Math.min(2, scored.length));
  const chosen = topChoices[Math.floor(Math.random() * topChoices.length)].move;

  return { move: chosen, aimPosition: target.arenaPosition };
}
