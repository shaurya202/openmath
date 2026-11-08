'use client';

import React, { useState } from 'react';
import { FRQGradingResult } from '@/types';
import { MathView } from '../math/MathView';
import { CheckCircle2, AlertCircle, Sparkles, Send, FileCheck } from 'lucide-react';

export const FRQGrader: React.FC = () => {
  const [question, setQuestion] = useState(
    'Find the area of the region bounded by y = x^2 and y = 4.'
  );
  const [studentWork, setStudentWork] = useState(
    'The intersection points are x = -2 and x = 2.\nSet up integral: int_{-2}^2 (4 - x^2) dx\n= [4x - x^3/3] from -2 to 2\n= (8 - 8/3) - (-8 + 8/3) = 16 - 16/3 = 32/3.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FRQGradingResult | null>(null);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !studentWork.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          studentWork,
          correctAnswer: '\\text{Area} = \\frac{32}{3}',
        }),
      });

      const data = await res.json();
      if (data.result) {
        setResult(data.result);
      }
    } catch (err) {
      console.error('Grading error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-gray-200 dark:border-dark-border pb-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
          Free-response grader
        </h2>
        <p className="text-sm text-gray-600 dark:text-dark-muted mt-1">
          Paste your work and get it scored against an AP-style rubric.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGrade} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-xs space-y-4">
        <div>
          <label htmlFor="frq-question-input" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Problem statement
          </label>
          <input
            id="frq-question-input"
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="frq-student-work" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Solution to evaluate
          </label>
          <textarea
            id="frq-student-work"
            required
            rows={5}
            value={studentWork}
            onChange={(e) => setStudentWork(e.target.value)}
            placeholder="Paste your mathematical steps, equations, or reasoning here..."
            className="w-full mt-1.5 p-3.5 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-500 font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span>Grading against rubric...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Grade Submission</span>
            </>
          )}
        </button>
      </form>

      {/* Grading Result Card */}
      {result && (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border border-l-2 border-l-brand-600 rounded-r-lg p-6 shadow-xs space-y-5 animate-fade-in">
          {/* Header Score summary */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-4">
            <div>
              <span className="text-xs text-brand-600 dark:text-brand-400">
                Evaluation Scorecard
              </span>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {result.totalScore} / {result.maxScore} Points ({result.percentage}%)
              </h3>
            </div>
            <div className={`px-3 py-1 rounded font-mono text-xs font-semibold ${
              result.percentage >= 80
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800'
            }`}>
              {result.percentage >= 80 ? 'Passing' : 'Needs review'}
            </div>
          </div>

          {/* Rubric Breakdown Grid */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-gray-800 dark:text-gray-200">
              Rubric criterion breakdown
            </h4>
            <div className="divide-y divide-gray-100 dark:divide-dark-border border border-gray-200 dark:border-dark-border rounded-md">
              {result.rubricBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-50/40 dark:bg-dark-surface/30 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-900 dark:text-white">{item.criterion}</span>
                    <span className="font-mono text-brand-600 dark:text-brand-400">
                      {item.score} / {item.maxPoints} pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-dark-muted">{item.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Feedback */}
          <div className="p-4 rounded-md bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-900/40 text-xs space-y-1">
            <span className="font-semibold text-brand-800 dark:text-brand-300 flex items-center">
              Tutor Notes:
            </span>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {result.overallFeedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
