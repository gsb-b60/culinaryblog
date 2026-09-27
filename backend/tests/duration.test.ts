import { describe, expect, it } from 'vitest';

import { parseDuration } from '../src/infrastructure/utils/duration.js';

describe('parseDuration', () => {
  it('parses milliseconds', () => {
    expect(parseDuration('500ms')).toBe(500);
  });

  it('parses seconds', () => {
    expect(parseDuration('30s')).toBe(30_000);
  });

  it('parses minutes', () => {
    expect(parseDuration('15m')).toBe(900_000);
  });

  it('parses hours', () => {
    expect(parseDuration('2h')).toBe(7_200_000);
  });

  it('parses days', () => {
    expect(parseDuration('7d')).toBe(604_800_000);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseDuration('  15m  ')).toBe(900_000);
  });

  it('throws on an invalid duration', () => {
    expect(() => parseDuration('abc')).toThrow('Invalid duration');
    expect(() => parseDuration('15x')).toThrow('Invalid duration');
    expect(() => parseDuration('')).toThrow('Invalid duration');
  });
});
