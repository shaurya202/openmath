import { describe, it, expect } from 'vitest';
import { OfflineMathProvider } from './offlineProvider';

describe('OfflineMathProvider', () => {
  const provider = new OfflineMathProvider();

  it('solves linear equations accurately', async () => {
    const res = await provider.solve({ query: '3x + 6 = 21' });
    expect(res.boxedAnswer).toBe('x = 5');
    expect(res.steps.length).toBeGreaterThan(0);
    expect(res.graphableFunctions).toBeDefined();
  });

  it('solves basic power derivatives accurately', async () => {
    const res = await provider.solve({ query: 'Find derivative of x^4' });
    expect(res.boxedAnswer).toBe('4x^{3}');
    expect(res.steps.length).toBe(2);
  });

  it('matches benchmark quadratic problems', async () => {
    const res = await provider.solve({ query: 'Solve 2x^2 + 5x - 3 = 0' });
    expect(res.boxedAnswer).toContain('\\frac{1}{2}');
    expect(res.boxedAnswer).toContain('-3');
  });

  it('streams solution tokens via async generator', async () => {
    const stream = provider.solveStream({ query: '2x + 4 = 10' });
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const fullText = chunks.join('');
    expect(fullText).toContain('Step-by-Step Derivation');
    expect(fullText).toContain('\\boxed{');
  });
});
