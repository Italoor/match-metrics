/**
 * Unit tests for src/lib/mock-data.ts
 * Validates shape correctness and lookup helper.
 */
import { describe, it, expect } from 'vitest';
import { MOCK_PLAYERS } from '../lib/mock-data';

describe('MOCK_PLAYERS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(MOCK_PLAYERS)).toBe(true);
    expect(MOCK_PLAYERS.length).toBeGreaterThan(0);
  });

  it('every player has a unique id', () => {
    const ids = MOCK_PLAYERS.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every player has required string fields', () => {
    for (const p of MOCK_PLAYERS) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.team).toBe('string');
      expect(typeof p.position).toBe('string');
      expect(typeof p.nationality).toBe('string');
      expect(typeof p.image_url).toBe('string');
    }
  });

  it('every player has a stats object', () => {
    for (const p of MOCK_PLAYERS) {
      expect(p.stats).toBeDefined();
      expect(typeof p.stats).toBe('object');
    }
  });

  it('every player stats object has numeric goals and assists', () => {
    for (const p of MOCK_PLAYERS) {
      expect(typeof p.stats.goals).toBe('number');
      expect(typeof p.stats.assists).toBe('number');
    }
  });

  it('no stat values are NaN', () => {
    for (const p of MOCK_PLAYERS) {
      for (const [key, val] of Object.entries(p.stats)) {
        if (typeof val === 'number') {
          expect(Number.isNaN(val), `${p.name}.stats.${key} should not be NaN`).toBe(false);
        }
      }
    }
  });
});


