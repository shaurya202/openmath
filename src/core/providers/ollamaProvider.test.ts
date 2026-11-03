import { describe, it, expect } from 'vitest';
import { OllamaProvider } from './ollamaProvider';

describe('OllamaProvider', () => {
  const provider = new OllamaProvider('gemma4:31b-cloud');

  it('initializes with model name correctly', () => {
    expect(provider.name).toBe('Ollama (gemma4:31b-cloud)');
    expect(provider.isAvailable()).toBe(true);
  });
});
