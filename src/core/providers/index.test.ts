import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getActiveMathProvider } from './index';

describe('getActiveMathProvider domain-based routing', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('selects NvidiaNimProvider on vercel.app domains when key configured', () => {
    process.env.NVIDIA_NIM_API_KEY = 'nvapi-mock-test-key-12345678';
    delete process.env.PROVIDER;
    const provider = getActiveMathProvider('openmath-eight.vercel.app');
    expect(provider.name).toContain('NVIDIA NIM');
  });

  it('selects PublikProvider on publik domains even if NVIDIA key exists', () => {
    process.env.NVIDIA_NIM_API_KEY = 'nvapi-mock-test-key-12345678';
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
