import { describe, it, expect, vi } from 'vitest';
import {
  balanceLine,
  topUpUrlFrom402,
  resolveProvider,
  APP_SLUG,
  APP_VERSION,
  telemetryInstallId,
  usageOff,
  startTelemetry,
  stopTelemetry,
  selfTest,
} from './publik';

describe('publik module', () => {
  it('has correct slug and version constants', () => {
    expect(APP_SLUG).toBe('openmath');
    expect(APP_VERSION).toBe('1.0.0');
  });

  it('formats balance line accurately', () => {
    expect(balanceLine(null)).toBe('');
    expect(balanceLine(0, 'anonymous')).toBe('$0.00 · link this computer for $0.05 of free publik API use');
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

  it('provides a valid UUID v4 telemetry install ID', () => {
    const id = telemetryInstallId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('respects opt-out environment variables for telemetry', () => {
    const origDNT = process.env.DO_NOT_TRACK;
    const origTel = process.env.PUBLIK_TELEMETRY;
    try {
      delete process.env.DO_NOT_TRACK;
      delete process.env.PUBLIK_TELEMETRY;
      expect(usageOff()).toBe(false);

      process.env.DO_NOT_TRACK = '1';
      expect(usageOff()).toBe(true);

      process.env.DO_NOT_TRACK = '';
      process.env.PUBLIK_TELEMETRY = '0';
      expect(usageOff()).toBe(true);

      process.env.PUBLIK_TELEMETRY = 'off';
      expect(usageOff()).toBe(true);
    } finally {
      if (origDNT !== undefined) process.env.DO_NOT_TRACK = origDNT;
      else delete process.env.DO_NOT_TRACK;
      if (origTel !== undefined) process.env.PUBLIK_TELEMETRY = origTel;
      else delete process.env.PUBLIK_TELEMETRY;
    }
  });

  it('can start and stop telemetry safely', () => {
    expect(() => startTelemetry()).not.toThrow();
    expect(() => stopTelemetry()).not.toThrow();
  });

  it('runs selfTest and returns expected formatted status', async () => {
    const result = await selfTest();
    expect(result).toMatch(/^publik self-test: (ok|failed:)/);
  });
});
