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
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'flashcards'
                ? 'bg-white dark:bg-dark-surface text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'exam'
                ? 'bg-white dark:bg-dark-surface text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Practice exam</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'flashcards' ? <FlashcardsDeck /> : <PracticeExam />}
      </div>
    </div>
  );
}
