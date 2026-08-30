import { defineConfig } from 'vitest/config';

/**
 * Isolated from vite.config.ts on purpose: the battle engine is pure TypeScript with
 * no React/Three dependency, so tests need neither the react plugin nor a DOM.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    reporters: ['default'],
  },
});
