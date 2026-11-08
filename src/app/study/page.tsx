'use client';

import React, { useState } from 'react';
import { FlashcardsDeck } from '@/components/study/FlashcardsDeck';
import { PracticeExam } from '@/components/study/PracticeExam';
import { Brain, Award } from 'lucide-react';

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'exam'>('flashcards');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Subnav Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Study
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5">
            Review formulas and test yourself.
          </p>
        </div>
        <div className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'flashcards'
                ? 'bg-white dark:bg-dark-surface text-brand-700 dark:text-brand-300 shadow-2xs font-semibold'
                : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'exam'
                ? 'bg-white dark:bg-dark-surface text-brand-700 dark:text-brand-300 shadow-2xs font-semibold'
                : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Practice exam</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-1">
        {activeTab === 'flashcards' ? <FlashcardsDeck /> : <PracticeExam />}
      </div>
    </div>
  );
}
