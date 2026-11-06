import { describe, it, expect } from 'vitest';
import { NvidiaNimProvider } from './nvidiaNimProvider';

describe('NvidiaNimProvider', () => {
  it('instantiates with defaults', () => {
    const provider = new NvidiaNimProvider();
    expect(provider.name).toContain('NVIDIA NIM');
    expect(provider.isAvailable()).toBe(false);
  });

  it('reports available when valid apiKey provided', () => {
    const provider = new NvidiaNimProvider('nvapi-test-key-12345678');
    expect(provider.isAvailable()).toBe(true);
    expect(provider.name).toContain('meta/llama-3.3-70b-instruct');
  });

  it('allows custom model selection', () => {
    const provider = new NvidiaNimProvider('nvapi-test-key-12345678', undefined, 'deepseek-ai/deepseek-r1');
    expect(provider.name).toBe('NVIDIA NIM (deepseek-ai/deepseek-r1)');
  });
});
