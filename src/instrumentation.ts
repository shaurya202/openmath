export async function register() {
  if (process.env.PUBLIK_SELF_TEST && process.env.NEXT_RUNTIME === 'nodejs') {
    const { selfTest } = await import('@/core/providers/publik');
    const msg = await selfTest();
    process.stdout.write(`${msg}\n`, () => {
      process.exit(0);
    });
    return;
  }
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NEXT_PHASE !== 'phase-production-build' && !process.env.VITEST) {
      const { startTelemetry } = await import('@/core/providers/publik');
      startTelemetry();
    }
  }
}
