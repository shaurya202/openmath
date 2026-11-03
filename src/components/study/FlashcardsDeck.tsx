'use client';

import React, { useState, useEffect } from 'react';
import { Flashcard } from '@/types';
import { INITIAL_FLASHCARDS } from '@/core/samples/mathCorpus';
import { calculateSM2 } from '@/core/srs/sm2';
import { MathView } from '../math/MathView';
import { RotateCw, CheckCircle2, ChevronRight, ChevronLeft, Plus, Sparkles, Brain } from 'lucide-react';

export const FlashcardsDeck: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New card form state
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newSubject, setNewSubject] = useState<'algebra' | 'calculus' | 'trigonometry'>('calculus');

  // Load from localStorage or initialize with curated corpus
  useEffect(() => {
    const saved = localStorage.getItem('openmath_flashcards');
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch {
        setCards(INITIAL_FLASHCARDS);
      }
    } else {
      setCards(INITIAL_FLASHCARDS);
    }
  }, []);

  const saveCards = (updated: Flashcard[]) => {
    setCards(updated);
    localStorage.setItem('openmath_flashcards', JSON.stringify(updated));
  };

  const currentCard = cards[currentIndex];

  const handleSM2Review = (grade: number) => {
    if (!currentCard) return;

    const sm2 = calculateSM2({
      grade,
      repetitions: currentCard.repetitions,
      interval: currentCard.interval,
      easeFactor: currentCard.easeFactor,
    });

    const updated = cards.map((c, idx) =>
      idx === currentIndex
        ? {
            ...c,
            repetitions: sm2.repetitions,
            interval: sm2.interval,
            easeFactor: sm2.easeFactor,
            nextReviewDate: sm2.nextReviewDate,
          }
        : c
    );

    saveCards(updated);
    setIsFlipped(false);
    // Next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const newCard: Flashcard = {
      id: `fc-custom-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      latexFront: newFront.trim(),
      latexBack: newBack.trim(),
      subject: newSubject,
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: Date.now(),
    };

    const updated = [...cards, newCard];
    saveCards(updated);
    setNewFront('');
    setNewBack('');
    setShowAddModal(false);
  };

  if (!currentCard) {
    return <div className="text-center p-8 text-gray-500">Loading flashcards...</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Formula flashcards
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-card transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add card</span>
          </button>
        </div>
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[280px] cursor-pointer rounded-3xl border border-gray-200 dark:border-dark-border bg-gradient-to-b from-white to-gray-50 dark:from-dark-card dark:to-dark-surface p-8 shadow-md flex flex-col justify-between transition-all hover:shadow-lg relative overflow-hidden"
      >
        <div className="flex justify-between items-center text-xs text-gray-400 dark:text-dark-muted font-medium">
          <span className="uppercase tracking-wider font-semibold text-brand-500">
            {currentCard.subject}
          </span>
          <span className="flex items-center space-x-1">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Click to flip</span>
          </span>
        </div>

        <div className="py-6 text-center my-auto">
          {!isFlipped ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Prompt / Concept
              </span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentCard.front}
              </p>
              {currentCard.latexFront && (
                <div className="pt-2 text-xl">
                  <MathView content={`$$${currentCard.latexFront}$$`} displayMode={true} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                Answer & Formula
              </span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentCard.back}
              </p>
              {currentCard.latexBack && (
                <div className="pt-2 text-xl text-brand-600 dark:text-brand-400">
                  <MathView content={`$$\\boxed{${currentCard.latexBack}}$$`} displayMode={true} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-[11px] text-center text-gray-400 dark:text-dark-muted">
          SM-2 Interval: {currentCard.interval} days | Reps: {currentCard.repetitions} | EF: {currentCard.easeFactor}
        </div>
      </div>

      {/* SM-2 Rating Controls (Revealed after flip) */}
      {isFlipped ? (
        <div className="space-y-2 animate-fade-in">
          <p className="text-center text-xs font-semibold text-gray-500 dark:text-dark-muted">
            Rate your recall difficulty:
          </p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleSM2Review(1)}
              className="py-2.5 px-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100 transition-colors"
            >
              Again (1)
            </button>
            <button
              onClick={() => handleSM2Review(3)}
              className="py-2.5 px-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 transition-colors"
            >
              Hard (3)
            </button>
            <button
              onClick={() => handleSM2Review(4)}
              className="py-2.5 px-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
            >
              Good (4)
            </button>
            <button
              onClick={() => handleSM2Review(5)}
              className="py-2.5 px-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 transition-colors"
            >
              Easy (5)
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center px-4">
          <button
            onClick={() => {
              setIsFlipped(false);
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
            }}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-900 dark:text-dark-muted dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            onClick={() => {
              setIsFlipped(false);
              setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
            }}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-900 dark:text-dark-muted dark:hover:text-white"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Custom Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Create New Math Flashcard
            </h3>
            <form onSubmit={handleAddCard} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Concept / Prompt (Front)
                </label>
                <input
                  type="text"
                  required
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="e.g. Taylor Series expansion of e^x"
                  className="w-full mt-1 px-3 py-2 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Formula / Proof (Back in LaTeX)
                </label>
                <textarea
                  required
                  rows={3}
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="e.g. \sum_{n=0}^\infty \frac{x^n}{n!}"
                  className="w-full mt-1 px-3 py-2 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Subject Area
                </label>
                <select
                  value={newSubject}
                  onChange={(e: any) => setNewSubject(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="algebra">Algebra</option>
                  <option value="calculus">Calculus</option>
                  <option value="trigonometry">Trigonometry</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-dark-muted hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
