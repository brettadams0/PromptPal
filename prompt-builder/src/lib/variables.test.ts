import { describe, expect, it } from 'vitest';
import { coerceValue, defaultValues, humanize } from './variables';

describe('humanize', () => {
  it('turns identifiers into labels', () => {
    expect(humanize('target_audience')).toBe('Target audience');
    expect(humanize('maxWords')).toBe('Max words');
    expect(humanize('x')).toBe('X');
  });
});

describe('defaultValues', () => {
  it('uses declared defaults and starts checkboxes unchecked', () => {
    expect(
      defaultValues([
        { name: 'a', label: 'A', type: 'text', defaultValue: 'hi' },
        { name: 'b', label: 'B', type: 'boolean' },
        { name: 'c', label: 'C', type: 'text' },
      ]),
    ).toEqual({ a: 'hi', b: false });
  });
});

describe('coerceValue', () => {
  it('clamps numbers and rejects non-numeric input', () => {
    const n = { name: 'n', label: 'N', type: 'number' as const, min: 0, max: 5 };
    expect(coerceValue(n, '3')).toBe(3);
    expect(coerceValue(n, 9)).toBe(5);
    expect(coerceValue(n, 'abc')).toBeUndefined();
    expect(coerceValue(n, '')).toBeUndefined();
  });

  it('keeps select values only when they are an option', () => {
    const s = { name: 's', label: 'S', type: 'select' as const, options: ['a'] };
    expect(coerceValue(s, 'a')).toBe('a');
    expect(coerceValue(s, 'b')).toBeUndefined();
  });

  it('converts between text and booleans', () => {
    expect(coerceValue({ name: 'b', label: 'B', type: 'boolean' }, 'true')).toBe(true);
    expect(coerceValue({ name: 't', label: 'T', type: 'text' }, 42)).toBe('42');
    expect(coerceValue({ name: 't', label: 'T', type: 'text' }, true)).toBe('');
  });
});
