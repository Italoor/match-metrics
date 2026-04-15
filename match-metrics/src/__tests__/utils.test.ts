/**
 * Unit tests for src/lib/utils.ts
 */
import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn', () => {
  it('merges class names and resolves conflicting Tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('omits falsy conditional classes', () => {
    expect(cn('base', false && 'hidden', undefined, null, 'block')).toBe('base block');
  });

  it('supports object syntax from clsx', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });
});
