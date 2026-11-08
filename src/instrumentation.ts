export async function register() {
  if (process.env.PUBLIK_SELF_TEST && process.env.NEXT_RUNTIME === 'nodejs') {
    const { selfTest } = await import('@/core/providers/publik');
    console.log(await selfTest());
    process.exit(0);
  }
}
