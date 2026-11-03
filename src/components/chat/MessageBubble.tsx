'use client';

import React, { useState } from 'react';
import { ChatMessage, SolutionStep } from '@/types';
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
} from 'lucide-react';
import Link from 'next/link';

interface MessageBubbleProps {
  message: ChatMessage;
  onSelectPrompt?: (prompt: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSelectPrompt,
}) => {
  const isUser = message.role === 'user';
  const solution = message.solution;
  const [copied, setCopied] = useState(false);
  const [collapsedSteps, setCollapsedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNumber: number) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const copyAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end space-x-2 my-4 animate-fade-in">
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
    <div className="flex space-x-3 my-4 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 space-y-3 max-w-3xl">
        {/* Solution Container */}
        {solution ? (
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-4">
            {/* Interpretation */}
            {solution.interpretation && (
              <div className="border-b border-gray-100 dark:border-dark-border/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Problem Interpretation
                </span>
                <MathView
                  content={solution.interpretation}
                  className="mt-1 text-sm text-gray-800 dark:text-gray-200"
                />
              </div>
            )}

            {/* Steps Accordion */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-muted">
                Step-by-Step Derivation ({solution.steps.length} Steps)
              </span>

              {solution.steps.map((step: SolutionStep) => {
                const isCollapsed = collapsedSteps[step.stepNumber];
                return (
                  <div
                    key={step.stepNumber}
                    className="border border-gray-100 dark:border-dark-border/60 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-dark-surface/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleStep(step.stepNumber)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-dark-surface transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs flex items-center justify-center font-bold">
                          {step.stepNumber}
                        </span>
                        <span>{step.title}</span>
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
              <div className="bg-gradient-to-r from-emerald-500/10 via-brand-500/10 to-indigo-500/10 border-2 border-emerald-500/40 dark:border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Final Answer</span>
                  </div>
                  <button
                    onClick={() => copyAnswer(solution.boxedAnswer)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-800 dark:text-dark-muted dark:hover:text-white"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
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

            {/* Grapher Action Bridge */}
            {solution.graphableFunctions && solution.graphableFunctions.length > 0 && (
              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-dark-border/60">
                <span className="text-xs text-gray-500 dark:text-dark-muted">
                  Graphable equations detected: <code className="text-brand-500">{solution.graphableFunctions.join(', ')}</code>
                </span>
                <Link
                  href={`/grapher?funcs=${encodeURIComponent(solution.graphableFunctions.join(';'))}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 transition-colors"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Plot in Grapher</span>
                </Link>
              </div>
            )}

            {/* Follow-up suggestions */}
            {solution.suggestedFollowUps && solution.suggestedFollowUps.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-medium text-gray-500 dark:text-dark-muted flex items-center mb-1.5">
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
        ) : (
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 shadow-sm text-sm text-gray-800 dark:text-gray-200">
            <MathView content={message.content} />
          </div>
        )}
      </div>
    </div>
  );
};
