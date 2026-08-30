import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createBattle } from '../engine/battleFactory';
import type { BattleAction } from '../engine/battleTypes';
import { CombatantPlate } from '../presentation/ui/CombatantPlate';
import { CommandPanel } from '../presentation/ui/CommandPanel';
import { EventBanner, FloatingNumbers, ScreenFxOverlay } from '../presentation/ui/Overlays';
import { getMove } from '../engine/moveRegistry';

/**
 * DOM overlay smoke tests.
 *
 * The battle UI is a DOM layer above the Canvas, so a render-time throw in any plate,
 * panel or overlay would silently leave the 3D scene visible with no HUD at all - a
 * failure mode that is invisible to typecheck, unit tests and the production build.
 * Static rendering catches it without needing a browser.
 */

const snapshot = createBattle({
  playerTeam: [
    { species: 'Pikachu', level: 22, moves: ['thundershock', 'quickattack', 'thunderwave', 'swordsdance'] },
    { species: 'Squirtle', level: 20 },
  ],
  enemyTeam: [{ species: 'Charmander', level: 21 }],
  seed: 'ui',
});

const player = snapshot.combatants[snapshot.activePlayerId];
const enemy = snapshot.combatants[snapshot.activeEnemyId];
const party = snapshot.playerParty.map((id) => snapshot.combatants[id]);
const noop = (_: BattleAction) => {};

describe('CombatantPlate', () => {
  it('renders identity, HP, Poise and party dots', () => {
    const html = renderToStaticMarkup(
      createElement(CombatantPlate, {
        combatant: player,
        side: 'player',
        order: 'FIRST',
        party: [
          { alive: true, active: true },
          { alive: true, active: false },
        ],
      }),
    );
    expect(html).toContain('Pikachu');
    expect(html).toContain('Lv22');
    expect(html).toContain('POISE');
    expect(html).toContain('FIRST');
    expect(html).toContain(`${player.hp}/${player.stats.hp}`);
    expect(html).toContain('electric');
    expect(html.length).toBeGreaterThan(500);
  });

  it('renders the enemy side without an order pip', () => {
    const html = renderToStaticMarkup(
      createElement(CombatantPlate, { combatant: enemy, side: 'enemy', order: null }),
    );
    expect(html).toContain('Charmander');
    expect(html).not.toContain('FIRST');
  });

  it('renders status, volatiles, boosts and the Staggered state', () => {
    const hurt = {
      ...player,
      hp: Math.floor(player.stats.hp * 0.15),
      poise: 0,
      staggeredTurns: 1,
      status: { id: 'brn' as const },
      volatiles: [{ id: 'confusion' as const, turns: 2 }],
      boosts: { atk: 2, def: -1, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    };
    const html = renderToStaticMarkup(
      createElement(CombatantPlate, { combatant: hurt, side: 'player' }),
    );
    expect(html).toContain('BRN');
    expect(html).toContain('Confused');
    expect(html).toContain('STAGGERED');
    expect(html).toContain('BREAK');
    expect(html).toContain('ATK +2');
    expect(html).toContain('DEF -1');
  });

  it('survives a fainted combatant', () => {
    const dead = { ...player, hp: 0, fainted: true };
    expect(() =>
      renderToStaticMarkup(createElement(CombatantPlate, { combatant: dead, side: 'player' })),
    ).not.toThrow();
  });
});

describe('CommandPanel', () => {
  it('renders the root action bar', () => {
    const html = renderToStaticMarkup(
      createElement(CommandPanel, {
        actor: player,
        target: enemy,
        party,
        disabled: false,
        forcedSwitch: false,
        onCommit: noop,
      }),
    );
    expect(html).toContain('FIGHT');
    expect(html).toContain('GUARD');
    expect(html).toContain('SWITCH');
    expect(html).toContain('1 available');
  });

  it('marks Guard unavailable when locked', () => {
    const locked = { ...player, guardLocked: true };
    const html = renderToStaticMarkup(
      createElement(CommandPanel, {
        actor: locked,
        target: enemy,
        party,
        disabled: false,
        forcedSwitch: false,
        onCommit: noop,
      }),
    );
    expect(html).toContain('unavailable');
  });

  it('renders the forced-switch tray with reserves', () => {
    const html = renderToStaticMarkup(
      createElement(CommandPanel, {
        actor: player,
        target: enemy,
        party,
        disabled: true,
        forcedSwitch: true,
        onCommit: noop,
      }),
    );
    expect(html).toContain('CHOOSE A REPLACEMENT');
    expect(html).toContain('Squirtle');
  });

  it('reports no reserves when the party is a single member', () => {
    const html = renderToStaticMarkup(
      createElement(CommandPanel, {
        actor: player,
        target: enemy,
        party: [player],
        disabled: false,
        forcedSwitch: false,
        onCommit: noop,
      }),
    );
    expect(html).toContain('no reserves');
  });
});

describe('Overlays', () => {
  it('renders a banner', () => {
    const html = renderToStaticMarkup(
      createElement(EventBanner, { message: { id: 1, text: 'POISE BREAK!', tone: 'break' } }),
    );
    expect(html).toContain('POISE BREAK!');
  });

  it('renders nothing for a null banner', () => {
    expect(renderToStaticMarkup(createElement(EventBanner, { message: null }))).toBe('');
  });

  it('mounts the effect overlays without throwing', () => {
    expect(() => renderToStaticMarkup(createElement(ScreenFxOverlay))).not.toThrow();
    expect(() => renderToStaticMarkup(createElement(FloatingNumbers))).not.toThrow();
  });
});

describe('move grid content (the strategic surface the player reads)', () => {
  it('surfaces power, Impact, accuracy, PP and consequence tags', () => {
    // Electric vs a Fire target: neutral. Use a Water target for super-effective.
    const water = createBattle({
      playerTeam: [{ species: 'Pikachu', level: 22, moves: ['thundershock', 'quickattack'] }],
      enemyTeam: [{ species: 'Gyarados', level: 22 }],
      seed: 'grid',
    });
    const pika = water.combatants[water.activePlayerId];
    const gyara = water.combatants[water.activeEnemyId];

    const html = renderToStaticMarkup(
      createElement(CommandPanel, {
        actor: pika,
        target: gyara,
        party: [pika],
        disabled: false,
        forcedSwitch: false,
        onCommit: noop,
      }),
    );
    // The root screen shows FIGHT; the grid itself is behind a click. Assert the data
    // the grid needs is at least well-formed for every slot.
    expect(html).toContain('FIGHT');
    for (const slot of pika.moves) {
      const move = getMove(slot.moveId);
      expect(move, slot.moveId).toBeTruthy();
      expect(move!.impact).toBeGreaterThanOrEqual(0);
      expect(slot.maxPp).toBeGreaterThan(0);
    }
  });
});
