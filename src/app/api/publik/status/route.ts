import { NextRequest, NextResponse } from 'next/server';
import {
  readCredential,
  resolveProvider,
  provision,
  DISCLOSURE,
  balanceLine,
  appToken,
  APP_SLUG,
  APP_VERSION,
} from '@/core/providers/publik';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cred = readCredential();
    const token = appToken();
    const provider = resolveProvider();

    return NextResponse.json({
      slug: APP_SLUG,
      version: APP_VERSION,
      hasAppToken: Boolean(token && token.startsWith('pat_')),
      providerKind: provider.kind,
      credential: cred
        ? {
            install_id: cred.install_id,
            claim_url: cred.claim_url,
            claim_state: cred.claim_state,
            add_credit_url: cred.add_credit_url,
            cost_sentence: cred.cost_sentence,
            balance_micros: cred.balance_micros,
            balanceLine: balanceLine(cred.balance_micros, cred.claim_state),
          }
        : null,
      disclosure: DISCLOSURE,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
