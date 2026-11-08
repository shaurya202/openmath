'use client';

import React, { useState } from 'react';
import { ChatMessage, MathSolution } from '@/types';
import { MathView } from '../math/MathView';
import {
  LineChart,
  Copy,
  Check,
  Edit2,
  RotateCcw,
  FileQuestion,
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
  onEditMessage,
  onRetryResponse,
}) => {
  const isUser = message.role === 'user';
  const solution = message.solution;
  const practiceQ = message.practiceQuestion;
  const [copied, setCopied] = useState(false);

  // Local state for practice questions
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

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
      <div className="flex justify-end space-x-2 my-3 group animate-fade-in">
        {/* User Action buttons */}
        <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center space-x-1 self-center pr-2 transition-opacity">
          {onEditMessage && (
            <button
              type="button"
              onClick={() => onEditMessage(message.content)}
              aria-label="Edit message"
              title="Edit question"
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            >
              <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => copyText(message.content)}
            aria-label="Copy message"
            title="Copy question text"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        </div>

        <div className="max-w-2xl bg-brand-600 dark:bg-brand-700 text-white rounded-xl px-4 py-2.5 shadow-2xs">
          {message.imageUrl && (
            <div className="my-2">
              <img
                src={message.imageUrl}
                alt="Uploaded Problem"
                className="max-h-48 rounded object-contain bg-black/20 border border-white/20"
              />
            </div>
          )}
          <MathView content={message.content} className="text-white font-medium text-sm" />
        </div>
      </div>
    );
  }

  const displayContent = message.content || solution?.content || solution?.interpretation || '';
  const graphable = solution?.graphableFunctions && solution.graphableFunctions.length > 0 ? solution.graphableFunctions : [];

  return (
    <div className="my-4 animate-fade-in group">
      <div className="space-y-3 max-w-3xl">
        {practiceQ ? (
          /* Interactive Inline Practice Question */
          <div className="bg-white dark:bg-dark-card border-2 border-brand-500/30 dark:border-brand-500/40 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-dark-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-1.5">
                <FileQuestion className="w-4 h-4" />
                <span>Interactive practice question</span>
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
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-5 shadow-2xs space-y-4">
            {/* Header info & actions */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  OpenMath Tutor
                </span>
              </div>

              {/* Response action buttons */}
              <div className="flex items-center space-x-1">
                {onRetryResponse && (
                  <button
                    type="button"
                    onClick={() => onRetryResponse(solution?.query || message.content)}
                    aria-label="Retry solution"
                    title="Regenerate solution"
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => copyText(displayContent)}
                  aria-label="Copy response"
                  title="Copy answer"
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Unified Text Answer */}
            <div className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
              <MathView content={displayContent} />
            </div>

            {/* Grapher Bridge */}
            {graphable.length > 0 && (
              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-dark-border/60">
                <span className="text-xs text-gray-500 dark:text-dark-muted truncate pr-2">
                  Graphable equations: <code className="text-brand-500 font-mono">{graphable.join(', ')}</code>
                </span>
                <Link
                  href={`/grapher?funcs=${encodeURIComponent(graphable.join(';'))}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 transition-colors shrink-0"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Plot in Grapher</span>
                </Link>
              </div>
            )}

            {/* Top-up link if 402 balance exhausted */}
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
