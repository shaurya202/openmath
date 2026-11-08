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
        className={`fixed top-14 bottom-0 left-0 z-40 w-64 bg-gray-50/90 dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
        }`}
      >
        {/* Top Header / Collapse Toggle */}
        <div className="h-12 flex items-center justify-between px-3.5 border-b border-gray-200/80 dark:border-dark-border/80">
          {isOpen ? (
            <span className="text-xs font-semibold text-gray-500 dark:text-dark-muted">
              Workspace
            </span>
          ) : (
            <span className="font-semibold text-sm text-brand-600 dark:text-brand-400 mx-auto">
              <Pi className="w-4 h-4" />
            </span>
          )}

          <button
            onClick={onToggle}
            aria-label="Toggle sidebar"
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-dark-card hidden md:flex items-center justify-center transition-colors"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors border border-brand-700 dark:border-brand-500/30 ${
              isOpen ? 'px-3.5' : 'px-2'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {isOpen && <span>New problem</span>}
          </button>
        </div>

        {/* Navigation Tools */}
        <div className="px-2.5 py-2 border-b border-gray-200/80 dark:border-dark-border/80 space-y-0.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-dark-card text-brand-700 dark:text-brand-300 border border-gray-200/80 dark:border-dark-border font-semibold'
                    : 'text-gray-600 dark:text-dark-muted hover:bg-gray-200/50 dark:hover:bg-dark-card/60 hover:text-gray-900 dark:hover:text-white'
                }`}
                title={!isOpen ? item.name : undefined}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
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
              <div className="px-2 py-4 text-xs text-gray-400 dark:text-dark-muted/70">
                Problems you solve will show up here.
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => onSelectSession(sess.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white font-medium border border-gray-200/80 dark:border-dark-border'
                        : 'text-gray-600 dark:text-dark-muted hover:bg-gray-200/50 dark:hover:bg-dark-card/40 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-1">
                      <MessageSquare className="w-3 h-3 text-gray-400 dark:text-dark-muted shrink-0" />
                      <span className="truncate text-xs">
                        {sess.title || 'Untitled problem'}
                      </span>
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
        <div className="p-3 border-t border-gray-200/80 dark:border-dark-border/80 bg-gray-100/50 dark:bg-dark-bg/40">
          <div className="flex items-center justify-between text-xs text-gray-500">
            {isOpen && <span className="text-xs text-gray-500 dark:text-dark-muted">Runs on your device</span>}
            <a
              href="https://github.com/shaurya202/openmath"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="OpenMath on GitHub"
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-dark-card transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
