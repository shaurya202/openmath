'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Pi,
  LineChart,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Moon,
  Sun,
  Github,
  Sparkles,
  ExternalLink,
  ChevronDown,
  X,
} from 'lucide-react';

interface PublikStatus {
  slug: string;
  version: string;
  hasAppToken: boolean;
  providerKind: string;
  activeProvider?: string;
  credential: {
    install_id: string;
    claim_url: string | null;
    claim_state: 'anonymous' | 'claimed';
    add_credit_url: string | null;
    cost_sentence: string | null;
    balance_micros: number | null;
    balanceLine: string;
  } | null;
  disclosure: string;
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [publikStatus, setPublikStatus] = useState<PublikStatus | null>(null);
  const [showPublikModal, setShowPublikModal] = useState(false);
  const [showDisclosureModal, setShowDisclosureModal] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('openmath_theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }

    // Fetch publik API status
    fetch('/api/publik/status')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setPublikStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('openmath_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('openmath_theme', 'dark');
      setIsDark(true);
    }
  };

  const handleAcceptDisclosure = async () => {
    setProvisioning(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/publik/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptDisclosure: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Provisioning failed');
      }
      setShowDisclosureModal(false);
      // Refresh status
      const updated = await (await fetch('/api/publik/status')).json();
      setPublikStatus(updated);
      setShowPublikModal(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setProvisioning(false);
    }
  };

  const navItems = [
    { name: 'Solver', href: '/', icon: Pi },
    { name: 'Grapher', href: '/grapher', icon: LineChart },
    { name: 'Study Suite', href: '/study', icon: BookOpen },
    { name: 'AP Exam Hub', href: '/ap-exams', icon: GraduationCap },
    { name: 'FRQ Grader', href: '/grader', icon: CheckCircle },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Model/Publik Badge */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                  <Pi className="w-4 h-4" />
                </div>
                <div className="flex items-baseline">
                  <span className="font-semibold text-base text-gray-900 dark:text-white tracking-tight">
                    OpenMath
                  </span>
                </div>
              </Link>

              {publikStatus?.activeProvider?.includes('NVIDIA') ? (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800"> {/* unslop-ignore: deliberate chalkboard palette */}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  <span>{publikStatus.activeProvider}</span>
                </span>
              ) : publikStatus?.credential ? (
                <button
                  type="button"
                  onClick={() => setShowPublikModal(!showPublikModal)}
                  className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-200 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-1.5" />
                  <span>{publikStatus.credential.balanceLine || 'publik API active'}</span>
                  <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                </button>
              ) : publikStatus?.hasAppToken ? (
                <button
                  type="button"
                  onClick={() => setShowDisclosureModal(true)}
                  className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                  <span>Enable publik AI ($0.05 free)</span>
                </button>
              ) : null}
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-dark-card dark:text-white border border-brand-200/80 dark:border-dark-border font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface transition-colors border border-transparent hover:border-gray-200 dark:hover:border-dark-border"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <a
                href="https://github.com/shaurya202/openmath"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OpenMath on GitHub"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-dark-border text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile nav bar row */}
        <div className="flex md:hidden border-t border-gray-100 dark:border-dark-border/60 px-4 py-1.5 overflow-x-auto space-x-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-surface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* publik First-Run / Status Card Popover Modal */}
      {showPublikModal && publikStatus?.credential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  publik API Status
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPublikModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 rounded-xl">
                <div className="text-sm font-semibold text-brand-900 dark:text-brand-200">
                  {publikStatus.credential.balanceLine}
                </div>
                {publikStatus.credential.cost_sentence && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {publikStatus.credential.cost_sentence}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-muted">
                Install ID: <code className="font-mono">{publikStatus.credential.install_id.slice(0, 8)}</code>
              </p>
            </div>

            <div className="pt-2 flex flex-col space-y-2">
              {publikStatus.credential.claim_state === 'anonymous' && publikStatus.credential.claim_url ? (
                <a
                  href={publikStatus.credential.claim_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-xs transition-colors"
                >
                  <span>Sign in with publik</span>
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              ) : publikStatus.credential.add_credit_url ? (
                <a
                  href={publikStatus.credential.add_credit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-xs transition-colors"
                >
                  <span>Add a plan or pack</span>
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => setShowPublikModal(false)}
                className="w-full px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-dark-muted dark:hover:bg-dark-surface transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* publik Disclosure Modal */}
      {showDisclosureModal && publikStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Enable AI with publik
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {publikStatus.disclosure}
            </p>

            {errorMsg && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisclosureModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-dark-muted dark:hover:bg-dark-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={provisioning}
                onClick={handleAcceptDisclosure}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {provisioning ? 'Connecting...' : 'Accept & Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
