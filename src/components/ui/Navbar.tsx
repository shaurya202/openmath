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
  Cpu,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('openmath_theme');
    if (saved === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
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

  const navItems = [
    { name: 'Solver', href: '/', icon: Pi },
    { name: 'Grapher', href: '/grapher', icon: LineChart },
    { name: 'Study Suite', href: '/study', icon: BookOpen },
    { name: 'AP Exam Hub', href: '/ap-exams', icon: GraduationCap },
    { name: 'FRQ Grader', href: '/grader', icon: CheckCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-dark-bg/80 border-b border-gray-200/80 dark:border-dark-border/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Model Badge */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <span className="font-bold text-lg leading-none">Ω</span>
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
                OpenMath
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-gray-100 text-gray-700 dark:bg-dark-surface dark:text-gray-300 border border-gray-200 dark:border-dark-border">
              <Cpu className="w-3 h-3 mr-1 text-brand-500" />
              gemma4:31b
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-white dark:hover:bg-dark-surface transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="OpenMath on GitHub"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="flex md:hidden border-t border-gray-100 dark:border-dark-border/60 px-4 py-2 overflow-x-auto space-x-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-brand-500 text-white'
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
  );
};
