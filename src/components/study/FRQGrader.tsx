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
      <div className="text-center space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 text-xs font-semibold">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Rubric-Based AI Grading</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Free Response & Homework Auto-Grader
        </h2>
        <p className="text-xs text-gray-500 dark:text-dark-muted max-w-md mx-auto">
          Evaluates conceptual setup, intermediate calculus/algebraic steps, units, and boxed answer against official AP-style rubrics.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGrade} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-muted">
            Question / Problem Statement
          </label>
          <input
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-muted">
            Student Solution / Derivation to Grade
          </label>
          <textarea
            required
            rows={5}
            value={studentWork}
            onChange={(e) => setStudentWork(e.target.value)}
            placeholder="Paste your mathematical steps, equations, or reasoning here..."
            className="w-full mt-1.5 p-3.5 text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50"
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
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
          {/* Header Score summary */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border/80 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Evaluation Scorecard
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {result.totalScore} / {result.maxScore} Points ({result.percentage}%)
              </h3>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
              result.percentage >= 80
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              {result.percentage >= 80 ? 'Mastery Achieved' : 'Needs Practice'}
            </div>
          </div>

          {/* Rubric Breakdown Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-muted">
              4-Point Rubric Criterion Breakdown
            </h4>
            <div className="space-y-2">
              {result.rubricBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-gray-100 dark:border-dark-border/60 bg-gray-50/50 dark:bg-dark-surface/40 space-y-1"
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
          <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-900/40 text-xs space-y-1">
            <span className="font-bold text-brand-800 dark:text-brand-300 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Tutor Notes:
            </span>
            <p className="text-brand-900 dark:text-brand-200 leading-relaxed">
              {result.overallFeedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
