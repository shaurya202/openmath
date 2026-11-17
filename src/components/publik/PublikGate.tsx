'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import type { GateAction, GateScreen } from '@/core/providers/publik';

type GateResponse = {
  gate?: {
    state: 'sign_in' | 'unreachable' | 'choose' | 'ready';
    claimUrl?: string;
    topUpUrl?: string;
    screen?: GateScreen;
  };
};

const POLL_MS = 3_000;
const POLL_LIMIT_MS = 10 * 60_000;

export const PublikGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gate, setGate] = useState<GateResponse['gate'] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async (): Promise<GateResponse['gate'] | null> => {
    try {
      const res = await fetch('/api/publik/status', { cache: 'no-store' });
      const data = (await res.json()) as GateResponse;
      if (data.gate) {
        setGate(data.gate);
        if (data.gate.state === 'ready') stopPolling();
        return data.gate;
      }
    } catch {
      setGate({
        state: 'unreachable',
        screen: {
          id: 'unreachable',
          title: 'Sign in with publik',
          body: 'publik is not reachable. Check your connection.',
          note: null,
          buttons: [{ action: 'retry', label: 'Retry' }],
        },
      });
    }
    return null;
  }, [stopPolling]);

  useEffect(() => {
    void fetchStatus();
    return () => stopPolling();
  }, [fetchStatus, stopPolling]);

  const startPolling = useCallback(
    (target: 'claimed' | 'plan') => {
      stopPolling();
      const deadline = Date.now() + POLL_LIMIT_MS;
      pollRef.current = setInterval(async () => {
        if (Date.now() >= deadline) {
          stopPolling();
          setNote(
            target === 'claimed'
              ? 'No sign-in after 10 minutes. Click Sign in with publik to try again.'
              : 'No plan detected yet. Click Get a plan or Use my own key.'
          );
          return;
        }
        const next = await fetchStatus();
        if (!next) return;
        if (target === 'claimed' && next.state !== 'sign_in') {
          setNote(null);
          stopPolling();
        } else if (
          target === 'plan' &&
          next.state === 'choose' &&
          next.screen?.buttons.some((b) => b.action === 'connect')
        ) {
          setNote(null);
          stopPolling();
        }
      }, POLL_MS);
    },
    [fetchStatus, stopPolling]
  );

  const handleAction = async (action: GateAction) => {
    if (action === 'retry') {
      setBusy(true);
      setNote(null);
      await fetchStatus();
      setBusy(false);
      return;
    }

    if (action === 'sign_in') {
      if (gate?.claimUrl) window.open(gate.claimUrl, '_blank', 'noopener,noreferrer');
      setNote('Waiting for you to sign in in your browser.');
      startPolling('claimed');
      return;
    }

    if (action === 'get_plan') {
      if (gate?.topUpUrl) window.open(gate.topUpUrl, '_blank', 'noopener,noreferrer');
      setNote('Finish in your browser, then click Connect your plan.');
      startPolling('plan');
      return;
    }

    if (action === 'connect' || action === 'own_key') {
      setBusy(true);
      try {
        const res = await fetch('/api/publik/status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'set_choice',
            choice: action === 'connect' ? 'publik' : 'own_key',
          }),
        });
        const data = (await res.json()) as GateResponse;
        if (data.gate) setGate(data.gate);
      } finally {
        setBusy(false);
      }
    }
  };

  if (gate?.state === 'ready') {
    return <>{children}</>;
  }

  const screen = gate?.screen;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-xl p-6 space-y-5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500 dark:text-dark-muted">
              OpenMath
            </p>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {screen?.title ?? 'Sign in with publik'}
            </h1>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {screen?.body ?? 'Checking your publik session...'}
        </p>

        {(note || screen?.note) && (
          <p className="text-xs text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 rounded-lg px-3 py-2">
            {note ?? screen?.note}
          </p>
        )}

        {screen && (
          <div className="flex flex-col space-y-2 pt-1">
            {screen.buttons.map((btn, idx) => {
              const isPrimary = idx === 0;
              return (
                <button
                  key={btn.action}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleAction(btn.action)}
                  className={
                    isPrimary
                      ? 'w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50'
                      : 'w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-surface text-sm font-medium transition-colors disabled:opacity-50'
                  }
                >
                  <span>{btn.label}</span>
                  {(btn.action === 'sign_in' || btn.action === 'get_plan') && (
                    <ExternalLink className="w-4 h-4 ml-2" />
                  )}
                  {btn.action === 'retry' && <RefreshCw className="w-4 h-4 ml-2" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
