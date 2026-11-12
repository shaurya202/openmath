import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getActiveMathProvider } from './index';
import { parseSolutionResponse } from './types';

describe('parseSolutionResponse', () => {
  it('parses plain text greeting without fake steps or boxed answer', () => {
    const greeting = "Hello there! I'm OpenMath. What math problem can I help you explore today?";
    const sol = parseSolutionResponse('publik', greeting, 'hello!');

    expect(sol.content).toBe(greeting);
    expect(sol.steps).toBeUndefined();
    expect(sol.boxedAnswer).toBeUndefined();
    expect(sol.graphableFunctions).toEqual([]);
  });

  it('extracts graphable equations from single text response', () => {
    const mathResponse = "To find the vertex of $y = x^2 - 4x + 3$, we complete the square: **Final Answer:** $$\\boxed{(2, -1)}$$";
    const sol = parseSolutionResponse('publik', mathResponse, 'vertex of x^2 - 4x + 3');

    expect(sol.content).toBe(mathResponse);
    expect(sol.graphableFunctions).toContain('x^2 - 4x + 3');
  });

  it('gracefully converts legacy JSON response to formatted text', () => {
    const legacyJson = JSON.stringify({
      interpretation: 'Let us solve x + 2 = 5.',
      steps: [{ stepNumber: 1, title: 'Subtract 2', latex: 'x = 5 - 2', explanation: 'Subtract 2 from both sides.' }],
      boxedAnswer: 'x = 3',
    });
    const sol = parseSolutionResponse('publik', legacyJson, 'x + 2 = 5');

    expect(sol.content).toContain('Let us solve x + 2 = 5.');
    expect(sol.content).toContain('**Step 1: Subtract 2**');
    expect(sol.content).toContain('$$\\boxed{x = 3}$$');
  });

  it('strips all emojis from responses while preserving math symbols', () => {
    const raw = 'Hello! 😊 Let us solve $x^2 = 4$ 🚀 \\implies x = \\pm 2 👍';
    const sol = parseSolutionResponse('publik', raw, 'solve x^2=4');

    expect(sol.content).not.toContain('😊');
    expect(sol.content).not.toContain('🚀');
    expect(sol.content).not.toContain('👍');
    expect(sol.content).toContain('Hello! Let us solve $x^2 = 4$ \\implies x = \\pm 2');
  });
});

describe('getActiveMathProvider domain-based routing', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('selects GeminiProvider on vercel.app domains when key configured', () => {
    process.env.GEMINI_API_KEY = 'gemini-mock-test-key-12345678';
    delete process.env.PROVIDER;
    const provider = getActiveMathProvider('openmath-eight.vercel.app');
    expect(provider.name).toContain('Gemini');
  });

  it('selects PublikProvider on publik domains even if Gemini key exists', () => {
    process.env.GEMINI_API_KEY = 'gemini-mock-test-key-12345678';
    delete process.env.PROVIDER;
    const provider = getActiveMathProvider('openmath.publik.app');
    expect(provider.name).toContain('publik API');
  });

  it('selects PublikProvider for local/default host when not on vercel', () => {
    delete process.env.NVIDIA_NIM_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    delete process.env.VERCEL;
    delete process.env.VERCEL_URL;
    delete process.env.PROVIDER;
    const provider = getActiveMathProvider('localhost:3000');
    expect(provider.name).toContain('publik API');
  });
});
