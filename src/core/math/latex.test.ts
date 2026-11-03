import { describe, it, expect } from 'vitest';
import {
  normalizeLatexDelimiters,
  balanceUnclosedDelimiters,
  parseMathSegments,
  extractGraphableFunctions,
} from './latex';

describe('LaTeX Normalizer & Parser', () => {
  it('converts bracket delimiters to dollar delimiters', () => {
    const raw = 'The equation is \\[ x^2 + y^2 = 1 \\] and \\( a = b \\)';
    const result = normalizeLatexDelimiters(raw);
    expect(result).toBe('The equation is $$ x^2 + y^2 = 1 $$ and $ a = b $');
  });

  it('balances unclosed streaming delimiters correctly', () => {
    // Unclosed inline dollar
    expect(balanceUnclosedDelimiters('Let $x = 5')).toBe('Let $x = 5$');
    // Already balanced
    expect(balanceUnclosedDelimiters('Let $x = 5$')).toBe('Let $x = 5$');
    // Unclosed block dollar
    expect(balanceUnclosedDelimiters('Solution:\n$$\\int x dx')).toBe('Solution:\n$$\\int x dx$$');
    // Already balanced block
    expect(balanceUnclosedDelimiters('Solution:\n$$\\int x dx$$')).toBe('Solution:\n$$\\int x dx$$');
  });

  it('parses mixed markdown and math segments', () => {
    const input = 'We evaluate $f(x) = x^2$ and find: $$f\'(x) = 2x$$ which is linear.';
    const segments = parseMathSegments(input);

    expect(segments).toEqual([
      { type: 'text', content: 'We evaluate ' },
      { type: 'inline-math', content: 'f(x) = x^2' },
      { type: 'text', content: ' and find: ' },
      { type: 'display-math', content: "f'(x) = 2x" },
      { type: 'text', content: ' which is linear.' },
    ]);
  });

  it('extracts graphable function expressions from text', () => {
    const text = 'Given $f(x) = x^2 - 4x + 3$, find the roots.';
    const funcs = extractGraphableFunctions(text);
    expect(funcs.length).toBeGreaterThan(0);
    expect(funcs[0]).toContain('x^2');
  });
});
