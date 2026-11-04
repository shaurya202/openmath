import { describe, it, expect } from 'vitest';
import { balanceLine, topUpUrlFrom402, resolveProvider, APP_SLUG, APP_VERSION } from './publik';

describe('publik module', () => {
  it('has correct slug and version constants', () => {
    expect(APP_SLUG).toBe('openmath');
    expect(APP_VERSION).toBe('1.0.0');
  });

  it('formats balance line accurately', () => {
    expect(balanceLine(null)).toBe('');
    expect(balanceLine(0, 'anonymous')).toBe('$0.00 · link this computer for $0.05 of free use');
    expect(balanceLine(50000, 'anonymous')).toBe('$0.05 of publik balance');
    expect(balanceLine(1500000, 'claimed')).toBe('$1.50 of publik balance');
  });

  it('extracts topUpUrl from 402 payload', () => {
    const errorPayload = {
      error: {
        message: 'No remaining funds.',
        top_up_url: 'https://publikhq.com/top-up?ref=openmath',
      },
    };
    const { message, url } = topUpUrlFrom402(errorPayload);
    expect(message).toBe('No remaining funds.');
    expect(url).toBe('https://publikhq.com/top-up?ref=openmath');
  });

  it('resolves own provider if key provided', () => {
    const provider = resolveProvider({ baseURL: 'https://api.openai.com/v1', apiKey: 'sk-test-key' });
    expect(provider.kind).toBe('own');
  });
});
