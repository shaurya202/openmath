'use client';

import React, { useState } from 'react';
import { ChatMessage, SolutionStep, MathSolution, InlinePracticeQuestion } from '@/types';
import { MathView } from '../math/MathView';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LineChart,
  Copy,
  Check,
  Sparkles,
  User,
  Bot,
  Edit2,
  RotateCcw,
  FileQuestion,
  GraduationCap,
  Video,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

interface MessageBubbleProps {
  message: ChatMessage;
  onSelectPrompt?: (prompt: string) => void;
  onEditMessage?: (content: string) => void;
  onRetryResponse?: (content: string) => void;
  onCreatePracticeQuestion?: (solution: MathSolution) => void;
  onCreatePracticeTest?: (solution: MathSolution) => void;
  onCreateVideoExplainer?: (solution: MathSolution) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSelectPrompt,
  onEditMessage,
  onRetryResponse,
  onCreatePracticeQuestion,
  onCreatePracticeTest,
  onCreateVideoExplainer,
}) => {
  const isUser = message.role === 'user';
  const solution = message.solution;
  const practiceQ = message.practiceQuestion;
  const [copied, setCopied] = useState(false);
  const [collapsedSteps, setCollapsedSteps] = useState<Record<number, boolean>>({});

  // Local state for practice questions
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const toggleStep = (stepNumber: number) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckPractice = (correctIdx: number) => {
    setIsChecked(true);
    if (selectedOpt === correctIdx) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end space-x-2 my-4 group animate-fade-in">
        {/* User Action buttons */}
        <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center space-x-1 self-center pr-2 transition-opacity">
          {onEditMessage && (
            <button
              type="button"
              onClick={() => onEditMessage(message.content)}
              aria-label="Edit message"
              title="Edit question"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            >
              <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => copyText(message.content)}
            aria-label="Copy message"
            title="Copy question text"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        </div>

        <div className="max-w-2xl bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          {message.imageUrl && (
            <div className="mb-2">
              <img
                src={message.imageUrl}
                alt="Uploaded Problem"
                className="max-h-48 rounded-lg object-contain bg-black/10 border border-white/20"
              />
            </div>
          )}
          <MathView content={message.content} className="text-white font-medium" />
        </div>
        <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center shrink-0 shadow-xs">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-3 my-4 animate-fade-in group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 space-y-3 max-w-3xl">
        {/* Solution Container */}
        {solution ? (
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border/60">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-dark-muted">
                  Problem formulation
                </span>
              </div>

              {/* Response action buttons */}
              <div className="flex items-center space-x-1">
                {onRetryResponse && (
                  <button
                    type="button"
                    onClick={() => onRetryResponse(solution.query)}
                    aria-label="Retry solution"
                    title="Regenerate solution"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => copyText(solution.boxedAnswer || solution.interpretation)}
                  aria-label="Copy response"
                  title="Copy LaTeX answer"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Interpretation */}
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              <MathView content={solution.interpretation} />
            </div>

            {/* Step-by-Step Derivation */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Step-by-step derivation ({solution.steps.length} steps)
              </div>

              {solution.steps.map((step: SolutionStep) => {
                const isCollapsed = collapsedSteps[step.stepNumber];
                return (
                  <div
                    key={step.stepNumber}
                    className="rounded-xl border border-gray-200/80 dark:border-dark-border/80 bg-gray-50/50 dark:bg-dark-surface/40 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleStep(step.stepNumber)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100/50 dark:hover:bg-dark-surface/80 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {step.stepNumber}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {step.title}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="px-3.5 pb-3 pt-1 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                        {step.latex && (
                          <div className="p-2 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border/60 shadow-2xs">
                            <MathView content={`$$${step.latex}$$`} displayMode={true} />
                          </div>
                        )}
                        <MathView content={step.explanation} className="text-xs sm:text-sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Boxed Final Answer */}
            {solution.boxedAnswer && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Final answer
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(solution.boxedAnswer)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy LaTeX</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="py-2 text-center text-lg font-bold text-gray-900 dark:text-white">
                  <MathView content={`$$\\boxed{${solution.boxedAnswer}}$$`} displayMode={true} />
                </div>
              </div>
            )}

            {/* Grapher Bridge */}
            {solution.graphableFunctions && solution.graphableFunctions.length > 0 && (
              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-dark-border/60">
                <span className="text-xs text-gray-500 dark:text-dark-muted truncate pr-2">
                  Graphable equations: <code className="text-brand-500 font-mono">{solution.graphableFunctions.join(', ')}</code>
                </span>
                <Link
                  href={`/grapher?funcs=${encodeURIComponent(solution.graphableFunctions.join(';'))}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 transition-colors shrink-0"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Plot in Grapher</span>
                </Link>
              </div>
            )}

            {/* In-Chat Dynamic Generator Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-dark-border/60 space-y-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-dark-muted">
                Practice & diagnostics
              </div>
              <div className="flex flex-wrap gap-2">
                {onCreatePracticeQuestion && (
                  <button
                    type="button"
                    onClick={() => onCreatePracticeQuestion(solution)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40 transition-colors"
                  >
                    <FileQuestion className="w-3.5 h-3.5 text-brand-600" />
                    <span>Create practice question</span>
                  </button>
                )}

                {onCreatePracticeTest && (
                  <button
                    type="button"
                    onClick={() => onCreatePracticeTest(solution)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Create practice test</span>
                  </button>
                )}

                {onCreateVideoExplainer && (
                  <button
                    type="button"
                    onClick={() => onCreateVideoExplainer(solution)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    <span>Interactive video walkthrough</span>
                  </button>
                )}
              </div>
            </div>

            {/* Follow-up suggestions */}
            {solution.suggestedFollowUps && solution.suggestedFollowUps.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-dark-muted flex items-center mb-1.5">
                  <Sparkles className="w-3 h-3 mr-1 text-brand-500" /> Suggested Next Steps:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {solution.suggestedFollowUps.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectPrompt?.(prompt)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : practiceQ ? (
          /* Interactive Inline Practice Question */
          <div className="bg-white dark:bg-dark-card border-2 border-brand-500/30 dark:border-brand-500/40 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-dark-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-1.5">
                <FileQuestion className="w-4 h-4" />
                <span>Interactive Practice Question</span>
              </span>
              {isChecked && (
                <span className={selectedOpt === practiceQ.correctOptionIndex ? 'text-xs font-bold text-emerald-600' : 'text-xs font-bold text-red-500'}>
                  {selectedOpt === practiceQ.correctOptionIndex ? 'Correct' : 'Incorrect'}
                </span>
              )}
            </div>

            <MathView content={practiceQ.question} className="text-sm font-medium text-gray-900 dark:text-white" />

            <div className="space-y-2">
              {practiceQ.options.map((opt, optIdx) => {
                const isSelected = selectedOpt === optIdx;
                let optionClasses = 'border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-surface';

                if (isChecked) {
                  if (optIdx === practiceQ.correctOptionIndex) {
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
                    onClick={() => {
                      if (!isChecked) setSelectedOpt(optIdx);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${optionClasses}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-gray-100 dark:bg-dark-surface flex items-center justify-center font-bold text-[10px]">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <MathView content={`$${opt}$`} />
                    </div>
                    {isChecked && optIdx === practiceQ.correctOptionIndex && (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {isChecked && isSelected && optIdx !== practiceQ.correctOptionIndex && (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={selectedOpt === null || isChecked}
                onClick={() => handleCheckPractice(practiceQ.correctOptionIndex)}
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-2xs"
              >
                Check
              </button>

              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
              >
                {showExplanation ? 'Hide Steps' : 'Show Steps'}
              </button>
            </div>

            {showExplanation && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border/60 text-xs space-y-1.5 animate-fade-in">
                <div className="font-semibold text-gray-700 dark:text-gray-200">
                  Derivation:
                </div>
                <MathView content={practiceQ.explanation} />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 shadow-sm text-sm text-gray-800 dark:text-gray-200">
            <MathView content={message.content} />
            {message.topUpUrl && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
                <span className="text-xs text-gray-500">Need more balance?</span>
                <a
                  href={message.topUpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Top Up publik Balance
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
