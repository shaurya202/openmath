'use client';

import React, { useState, useEffect } from 'react';
import { ExamQuestion } from '@/types';
import { INITIAL_EXAM_QUESTIONS } from '@/core/samples/mathCorpus';
import { MathView } from '../math/MathView';
import confetti from 'canvas-confetti';
import { Timer, CheckCircle, XCircle, Award, RotateCcw, ArrowRight } from 'lucide-react';

export const PracticeExam: React.FC = () => {
  const [questions] = useState<ExamQuestion[]>(INITIAL_EXAM_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes

  // Countdown timer
  useEffect(() => {
    if (isFinished || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, secondsLeft]);

  const currentQ = questions[currentIdx];

  const handleSelectOption = (optionIdx: number) => {
    if (isFinished) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIdx,
    }));
  };

  const handleTextAnswer = (text: string) => {
    if (isFinished) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: text,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (q.type === 'multiple_choice') {
        if (selectedAnswers[q.id] === q.correctOptionIndex) {
          score += 1;
        }
      } else {
        // Free response: check if student derivation contains target value
        const ans = String(selectedAnswers[q.id] || '').trim().toLowerCase();
        const isCorrect =
          ans.includes('32/3') ||
          ans.includes('10.67') ||
          (q.correctAnswerLatex && ans.includes(q.correctAnswerLatex.toLowerCase().replace(/\\text\{.*?\}|\s+/g, '')));
        if (isCorrect) {
          score += 1;
        }
      }
    });
    return score;
  };

  const finishExam = () => {
    setIsFinished(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const resetExam = () => {
    setSelectedAnswers({});
    setIsFinished(false);
    setCurrentIdx(0);
    setSecondsLeft(600);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  if (isFinished) {
    const finalScore = calculateScore();
    const pct = Math.round((finalScore / questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Practice Exam Complete!
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-muted">
            You scored {finalScore} out of {questions.length} ({pct}%)
          </p>
        </div>

        {/* Detailed Solutions Breakdown */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-dark-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-muted">
            Question Review & Solutions
          </h3>
          {questions.map((q, idx) => {
            const isCorrect =
              q.type === 'multiple_choice'
                ? selectedAnswers[q.id] === q.correctOptionIndex
                : true;

            return (
              <div
                key={q.id}
                className="p-4 rounded-2xl border border-gray-100 dark:border-dark-border/60 bg-gray-50/50 dark:bg-dark-surface/50 space-y-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    Question {idx + 1} ({q.subject})
                  </span>
                  {isCorrect ? (
                    <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-bold text-red-500">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Incorrect
                    </span>
                  )}
                </div>

                <MathView content={q.question} />

                <div className="p-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200/60 dark:border-dark-border/60 text-xs text-gray-700 dark:text-gray-300">
                  <p className="font-semibold text-brand-600 dark:text-brand-400 mb-1">
                    Correct Answer:
                  </p>
                  <MathView content={`$$${q.correctAnswerLatex}$$`} displayMode={true} />
                  <p className="mt-1 text-gray-600 dark:text-dark-muted">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={resetExam}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retake Practice Exam</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Top Header: Progress and Timer */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border/80 pb-4">
        <div>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            AP / College Level Diagnostic
          </span>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Question {currentIdx + 1} of {questions.length}
          </h3>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 font-mono text-xs font-semibold">
          <Timer className="w-3.5 h-3.5" />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="space-y-3 py-2">
        <MathView content={currentQ.question} className="text-base text-gray-900 dark:text-white font-medium" />
      </div>

      {/* Answer Options */}
      {currentQ.type === 'multiple_choice' && currentQ.options && (
        <div className="space-y-2">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentQ.id] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 font-semibold text-brand-900 dark:text-brand-100'
                    : 'border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-surface text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-muted'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <MathView content={`$${option}$`} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {currentQ.type === 'free_response' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 dark:text-dark-muted">
            Your Mathematical Derivation (LaTeX or text):
          </label>
          <textarea
            rows={4}
            value={String(selectedAnswers[currentQ.id] || '')}
            onChange={(e) => handleTextAnswer(e.target.value)}
            placeholder="Write out intermediate steps or final answer..."
            className="w-full p-3 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono"
          />
        </div>
      )}

      {/* Navigation & Submit button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-border/80">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((prev) => prev - 1)}
          className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-surface disabled:opacity-40"
        >
          Previous
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((prev) => prev + 1)}
            className="flex items-center space-x-1 px-5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={finishExam}
            className="flex items-center space-x-1.5 px-6 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Submit Exam</span>
          </button>
        )}
      </div>
    </div>
  );
};
