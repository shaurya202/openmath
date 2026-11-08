'use client';

import React, { useState } from 'react';
import { ArtifactData, SolutionStep } from '@/types';
import { MathView } from '../math/MathView';
import { X, CheckCircle, XCircle, Award, Play, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ArtifactQuestion {
  id?: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

interface ArtifactTheorem {
  title: string;
  latex: string;
  description: string;
}

interface ArtifactDrawerProps {
  artifact: ArtifactData | null;
  onClose: () => void;
}

export const ArtifactDrawer: React.FC<ArtifactDrawerProps> = ({ artifact, onClose }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, boolean>>({});
  const [showSteps, setShowSteps] = useState<Record<number, boolean>>({});
  const [videoStep, setVideoStep] = useState(0);

  if (!artifact) return null;

  const questions = (artifact.data.questions as ArtifactQuestion[] | undefined) || [];
  const keyTheorems = (artifact.data.keyTheorems as ArtifactTheorem[] | undefined) || [];
  const steps = (artifact.data.steps as SolutionStep[] | undefined) || [];
  const overview = typeof artifact.data.overview === 'string' ? artifact.data.overview : '';

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (checkedAnswers[qIdx]) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCheckQuestion = (qIdx: number, correctIdx: number) => {
    setCheckedAnswers((prev) => ({ ...prev, [qIdx]: true }));
    if (selectedAnswers[qIdx] === correctIdx) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 },
      });
    }
  };

  const calculateScore = (qs: ArtifactQuestion[]) => {
    let correct = 0;
    qs.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] md:w-[520px] bg-white dark:bg-dark-card border-l border-gray-200 dark:border-dark-border shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border/80 bg-gray-50/50 dark:bg-dark-surface/40">
        <div>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 capitalize">
            {artifact.type.replace('_', ' ')}
          </span>
          <h2 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-[340px]">
            {artifact.title}
          </h2>
          {artifact.subtitle && (
            <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
              {artifact.subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close artifact drawer"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Practice Test View */}
        {artifact.type === 'practice_test' && (
          <div className="space-y-6">
            {/* Score Banner */}
            <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/40 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                  Score
                </span>
                <div className="text-xl font-bold text-brand-600 dark:text-brand-400">
                  {calculateScore(questions)} / {questions.length}
                </div>
              </div>
              <Award className="w-8 h-8 text-brand-500" />
            </div>

            {/* Questions List */}
            {questions.map((q, qIdx) => {
              const isChecked = checkedAnswers[qIdx];
              const isCorrect = selectedAnswers[qIdx] === q.correctOptionIndex;

              return (
                <div
                  key={q.id || qIdx}
                  className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-dark-muted">
                    <span>Question {qIdx + 1} of {questions.length}</span>
                    {isChecked && (
                      <span className={isCorrect ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </div>

                  <MathView content={q.question} className="text-sm font-medium text-gray-900 dark:text-white" />

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options?.map((opt: string, optIdx: number) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      let optionClasses = 'border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-surface';

                      if (isChecked) {
                        if (optIdx === q.correctOptionIndex) {
                          optionClasses = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 font-semibold';
                        } else if (isSelected) {
                          optionClasses = 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200';
                        }
                      } else if (isSelected) {
                        optionClasses = 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-semibold';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${optionClasses}`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-md bg-gray-100 dark:bg-dark-surface flex items-center justify-center font-bold text-[10px]">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <MathView content={`$${opt}$`} />
                          </div>
                          {isChecked && optIdx === q.correctOptionIndex && (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {isChecked && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Question Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={selectedAnswers[qIdx] === undefined || isChecked}
                      onClick={() => handleCheckQuestion(qIdx, q.correctOptionIndex)}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-2xs"
                    >
                      Check Answer
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSteps((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                      className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
                    >
                      {showSteps[qIdx] ? 'Hide Steps' : 'Show Steps'}
                    </button>
                  </div>

                  {/* Collapsible Steps */}
                  {showSteps[qIdx] && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border/60 text-xs space-y-1.5 animate-fade-in">
                      <div className="font-semibold text-gray-700 dark:text-gray-200">
                        Detailed Derivation:
                      </div>
                      <MathView content={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AP Unit Summary View */}
        {artifact.type === 'ap_unit' && (
          <div className="space-y-4">
            <div className="prose dark:prose-invert text-xs space-y-3">
              <div className="p-3 bg-brand-50/60 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-800/40 rounded-xl">
                <span className="font-bold text-brand-700 dark:text-brand-300">Unit Overview:</span>
                <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {overview}
                </p>
              </div>

              {keyTheorems.map((thm, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl space-y-1.5"
                >
                  <div className="font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    <span>{thm.title}</span>
                  </div>
                  <MathView content={thm.latex} displayMode={true} />
                  <p className="text-gray-600 dark:text-dark-muted">{thm.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Explainer Animation View */}
        {artifact.type === 'video_explainer' && (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-white text-center shadow-lg overflow-hidden">
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-brand-600 text-[10px] font-mono font-medium">
                Step {videoStep + 1} of {steps.length}
              </div>

              <div className="space-y-3 max-w-sm animate-fade-in">
                <h3 className="text-sm font-semibold text-brand-300">
                  {steps[videoStep]?.title || 'Step derivation'}
                </h3>
                <div className="text-base font-mono py-2 bg-slate-800/80 rounded-xl px-4 border border-slate-700">
                  <MathView
                    content={steps[videoStep]?.latex || steps[videoStep]?.title || ''}
                    displayMode={true}
                  />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {steps[videoStep]?.explanation}
                </p>
              </div>
            </div>

            {/* Video Controls */}
            <div className="flex items-center justify-center space-x-3 bg-gray-50 dark:bg-dark-surface p-2.5 rounded-xl border border-gray-200 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setVideoStep((prev) => Math.max(0, prev - 1))}
                disabled={videoStep === 0}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  if (videoStep < (steps.length || 1) - 1) {
                    setVideoStep((prev) => prev + 1);
                  } else {
                    setVideoStep(0);
                  }
                }}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-2xs"
              >
                {videoStep < (steps.length || 1) - 1 ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Next Step</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setVideoStep((prev) => Math.min((steps.length || 1) - 1, prev + 1))}
                disabled={videoStep >= (steps.length || 1) - 1}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
