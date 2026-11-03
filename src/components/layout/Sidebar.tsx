'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatSession } from '@/types';
import {
  Plus,
  MessageSquare,
  Trash2,
  Pi,
  LineChart,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Github,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Solver', href: '/', icon: Pi },
    { name: 'Grapher', href: '/grapher', icon: LineChart },
    { name: 'Study Suite', href: '/study', icon: BookOpen },
    { name: 'AP Exam Hub', href: '/ap-exams', icon: GraduationCap },
    { name: 'FRQ Grader', href: '/grader', icon: CheckCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-2xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-dark-card border-r border-gray-200/80 dark:border-dark-border/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
        }`}
      >
        {/* Top Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-dark-border/60">
          <Link href="/" className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <span className="font-bold text-base leading-none">Ω</span>
            </div>
            {isOpen && (
              <span className="font-bold text-base text-gray-900 dark:text-white tracking-tight leading-tight">
                OpenMath
              </span>
            )}
          </Link>

          <button
            onClick={onToggle}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface hidden md:flex items-center justify-center transition-colors"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-all shadow-xs ${
              isOpen ? 'px-4' : 'px-2'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {isOpen && <span>New Chat</span>}
          </button>
        </div>

        {/* Navigation Tools */}
        <div className="px-2 py-2 border-b border-gray-100 dark:border-dark-border/60 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 font-semibold'
                    : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-surface hover:text-gray-900 dark:hover:text-white'
                }`}
                title={!isOpen ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {isOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Recent Chats Section */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            <div className="px-2 pb-1.5 text-xs font-semibold text-gray-500 dark:text-dark-muted">
              Recent calculations
            </div>

            {sessions.length === 0 ? (
              <div className="px-2 py-3 text-xs text-gray-400 dark:text-dark-muted text-center">
                No saved calculations yet
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => onSelectSession(sess.id)}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-gray-100 dark:bg-dark-surface text-gray-900 dark:text-white font-semibold'
                        : 'text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-surface/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-gray-400 group-hover:text-brand-500" />
                      <span className="truncate">{sess.title || 'Math Conversation'}</span>
                    </div>

                    <button
                      type="button"
                      aria-label="Delete chat"
                      onClick={(e) => onDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer & Status */}
        <div className="p-3 border-t border-gray-100 dark:border-dark-border/60 bg-gray-50/50 dark:bg-dark-surface/30 space-y-2">
          {isOpen && (
            <div className="flex items-center space-x-1.5 text-[10px] font-mono font-medium text-purple-700 dark:text-purple-300 px-2 py-1 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800/40 truncate">
              <Cpu className="w-3 h-3 shrink-0 text-purple-500" />
              <span className="truncate">Ollama: gemma4:31b</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            {isOpen && <span className="text-[11px] font-mono">v1.1 OpenMath</span>}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="OpenMath on GitHub"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
