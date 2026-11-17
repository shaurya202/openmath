import { NextRequest, NextResponse } from 'next/server';
import { getActiveMathProvider } from '@/core/providers';
import {
  readCredential,
  writeCredential,
  resolveProvider,
  provision,
  readWallet,
  gateScreen,
  setChoice,
  USES_AI,
  DEFAULT_BASE_URL,
  DISCLOSURE,
  balanceLine,
  appToken,
  APP_SLUG,
  APP_VERSION,
  startTelemetry,
} from '@/core/providers/publik';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getGateStatus(host: string | null) {
  const token = appToken();
  const activeProvider = getActiveMathProvider(host);
  const provider = resolveProvider();
  const providerKind = activeProvider.name.includes('NVIDIA') ? 'nvidia' : provider.kind;

  const basePayload = {
    slug: APP_SLUG,
    version: APP_VERSION,
    hasAppToken: Boolean(token && token.startsWith('pat_')),
    providerKind,
    activeProvider: activeProvider.name,
    disclosure: DISCLOSURE,
  };

  let cred = readCredential();
  let key = process.env.PUBLIK_API_KEY || cred?.key || '';
  let walletResult: Awaited<ReturnType<typeof readWallet>>;

  try {
    if (!key) {
      cred = await provision();
      key = cred.key;
    }
    walletResult = await readWallet(key);
    if (walletResult.status === 401 && !process.env.PUBLIK_API_KEY) {
      writeCredential(null);
      cred = await provision();
      key = cred.key;
      walletResult = await readWallet(key);
    }
  } catch (e) {
    const offline = e instanceof TypeError || (e instanceof Error && /abort|timeout/i.test(e.name));
    return {
      ...basePayload,
      credential: null,
      gate: {
        state: 'unreachable' as const,
        screen: gateScreen('unreachable', null, null, offline ? undefined : e instanceof Error ? e.message : String(e)),
      },
    };
  }

  const w = walletResult.wallet;
  if (!w) {
    return {
      ...basePayload,
      credential: null,
      gate: {
        state: 'unreachable' as const,
        screen: gateScreen('unreachable', null, null, walletResult.message ?? undefined),
      },
    };
  }

  const credPayload = cred
    ? {
        install_id: cred.install_id,
        claim_url: w.claim_url ?? cred.claim_url,
        claim_state: w.claim_state,
        add_credit_url: w.top_up_url ?? cred.add_credit_url,
        cost_sentence: cred.cost_sentence,
        balance_micros: w.balance_micros,
        balanceLine: balanceLine(w.balance_micros, w.claim_state),
        choice: cred.choice ?? null,
      }
    : null;

  if (w.claim_state !== 'claimed') {
    return {
      ...basePayload,
      credential: credPayload,
      gate: {
        state: 'sign_in' as const,
        claimUrl: w.claim_url ?? cred?.claim_url ?? `${DEFAULT_BASE_URL.replace(/\/api\/v1$/, '')}/wallet`,
        screen: gateScreen('sign_in', w),
      },
    };
  }

  const choice = USES_AI ? cred?.choice ?? null : null;
  if (USES_AI && !choice) {
    return {
      ...basePayload,
      credential: credPayload,
      gate: {
        state: 'choose' as const,
        topUpUrl: w.top_up_url,
        screen: gateScreen('choose', w),
      },
    };
  }

  startTelemetry();
  return {
    ...basePayload,
    credential: credPayload,
    gate: {
      state: 'ready' as const,
      choice,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const status = await getGateStatus(host);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const body = await req.json().catch(() => ({}));

    if (body.action === 'set_choice') {
      const choice = body.choice === 'publik' || body.choice === 'own_key' ? body.choice : null;
      setChoice(choice);
      const status = await getGateStatus(host);
      return NextResponse.json({ success: true, ...status });
    }

    if (!body.acceptDisclosure) {
      return NextResponse.json(
        { error: 'User disclosure must be accepted before provisioning.' },
        { status: 400 }
      );
    }

    const cred = await provision();
    return NextResponse.json({
      success: true,
      credential: {
        install_id: cred.install_id,
        claim_url: cred.claim_url,
        claim_state: cred.claim_state,
        add_credit_url: cred.add_credit_url,
        cost_sentence: cred.cost_sentence,
        balance_micros: cred.balance_micros,
        balanceLine: balanceLine(cred.balance_micros, cred.claim_state),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
