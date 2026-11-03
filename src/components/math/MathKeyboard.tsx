'use client';

import React, { useState } from 'react';
import { MathView } from './MathView';
import { X, Delete, CornerDownLeft, Sparkles } from 'lucide-react';

interface MathKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (snippet: string) => void;
  onBackspace?: () => void;
  onSubmit?: () => void;
}

type CategoryKey = 'popular' | 'algebra' | 'calculus' | 'trig' | 'greek';

interface FormulaButton {
  label: string;
  latex: string;
  displayLatex?: string;
}

const CATEGORIES: Record<CategoryKey, { title: string; formulas: FormulaButton[] }> = {
  popular: {
    title: 'Popular',
    formulas: [
      { label: '+', latex: '+' },
      { label: '-', latex: '-' },
      { label: '×', latex: '\\times ' },
      { label: '÷', latex: '\\div ' },
      { label: 'fraction', latex: '\\frac{a}{b}', displayLatex: '\\frac{\\square}{\\square}' },
      { label: 'x²', latex: 'x^2' },
      { label: 'xⁿ', latex: 'x^{n}', displayLatex: 'x^{\\square}' },
      { label: '√x', latex: '\\sqrt{x}', displayLatex: '\\sqrt{\\square}' },
      { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', displayLatex: '\\sqrt[n]{\\square}' },
      { label: 'π', latex: '\\pi ' },
      { label: '∞', latex: '\\infty ' },
      { label: '±', latex: '\\pm ' },
      { label: '≤', latex: '\\le ' },
      { label: '≥', latex: '\\ge ' },
      { label: '≠', latex: '\\ne ' },
      { label: '=', latex: ' = ' },
    ],
  },
  algebra: {
    title: 'Algebra',
    formulas: [
      { label: 'x', latex: 'x' },
      { label: 'y', latex: 'y' },
      { label: 'z', latex: 'z' },
      { label: '(x)', latex: '(x)' },
      { label: '|x|', latex: '|x|' },
      { label: 'log', latex: '\\log(x)' },
      { label: 'ln', latex: '\\ln(x)' },
      { label: 'log_b', latex: '\\log_{b}(x)', displayLatex: '\\log_{\\square}(x)' },
      { label: 'x₁', latex: 'x_{1}', displayLatex: 'x_{\\square}' },
      { label: 'f(x)', latex: 'f(x)' },
      { label: 'g(x)', latex: 'g(x)' },
      { label: 'n!', latex: 'n!' },
      { label: 'nCr', latex: '\\binom{n}{r}', displayLatex: '\\binom{n}{k}' },
      { label: '≈', latex: '\\approx ' },
      { label: 'e', latex: 'e' },
      { label: 'e^x', latex: 'e^{x}' },
    ],
  },
  calculus: {
    title: 'Calculus',
    formulas: [
      { label: 'd/dx', latex: '\\frac{d}{dx} ' },
      { label: 'd²/dx²', latex: '\\frac{d^2}{dx^2} ' },
      { label: '∫', latex: '\\int ' },
      { label: '∫_a^b', latex: '\\int_{a}^{b} ', displayLatex: '\\int_{\\square}^{\\square}' },
      { label: 'lim', latex: '\\lim_{x \\to 0} ', displayLatex: '\\lim_{x \\to \\square}' },
      { label: 'lim_inf', latex: '\\lim_{x \\to \\infty} ' },
      { label: '∑', latex: '\\sum_{n=1}^{\\infty} ', displayLatex: '\\sum_{\\square}^{\\square}' },
      { label: '∏', latex: '\\prod_{n=1}^{k} ', displayLatex: '\\prod' },
      { label: '∂/∂x', latex: '\\frac{\\partial}{\\partial x} ' },
      { label: '∇', latex: '\\nabla ' },
      { label: 'dx', latex: '\\,dx' },
      { label: 'dy', latex: '\\,dy' },
    ],
  },
  trig: {
    title: 'Trigonometry',
    formulas: [
      { label: 'sin', latex: '\\sin(x)' },
      { label: 'cos', latex: '\\cos(x)' },
      { label: 'tan', latex: '\\tan(x)' },
      { label: 'sin⁻¹', latex: '\\arcsin(x)' },
      { label: 'cos⁻¹', latex: '\\arccos(x)' },
      { label: 'tan⁻¹', latex: '\\arctan(x)' },
      { label: 'sec', latex: '\\sec(x)' },
      { label: 'csc', latex: '\\csc(x)' },
      { label: 'cot', latex: '\\cot(x)' },
      { label: 'θ', latex: '\\theta ' },
      { label: 'sin²', latex: '\\sin^2(x)' },
      { label: 'cos²', latex: '\\cos^2(x)' },
    ],
  },
  greek: {
    title: 'Greek & Logic',
    formulas: [
      { label: 'α', latex: '\\alpha ' },
      { label: 'β', latex: '\\beta ' },
      { label: 'γ', latex: '\\gamma ' },
      { label: 'δ', latex: '\\delta ' },
      { label: 'λ', latex: '\\lambda ' },
      { label: 'σ', latex: '\\sigma ' },
      { label: 'ω', latex: '\\omega ' },
      { label: 'Δ', latex: '\\Delta ' },
      { label: '∈', latex: '\\in ' },
      { label: '∉', latex: '\\notin ' },
      { label: '⊂', latex: '\\subset ' },
      { label: '∪', latex: '\\cup ' },
      { label: '∩', latex: '\\cap ' },
      { label: '∀', latex: '\\forall ' },
      { label: '∃', latex: '\\exists ' },
      { label: '⟹', latex: '\\implies ' },
    ],
  },
};

export const MathKeyboard: React.FC<MathKeyboardProps> = ({
  isOpen,
  onClose,
  onInsert,
  onBackspace,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryKey>('popular');

  if (!isOpen) return null;

  return (
    <div className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-lg p-3 transition-all animate-fade-in">
      {/* Category Tabs Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-dark-border overflow-x-auto">
        <div className="flex space-x-1">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === cat
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-surface'
              }`}
            >
              {CATEGORIES[cat].title}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1 pl-2">
          {onBackspace && (
            <button
              type="button"
              onClick={onBackspace}
              className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-dark-muted dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-dark-surface"
              title="Backspace"
            >
              <Delete className="w-4 h-4" />
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              className="p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-md"
              title="Solve"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-dark-surface"
            title="Close Keyboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formula Buttons Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1">
        {CATEGORIES[activeTab].formulas.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInsert(item.latex)}
            className="flex items-center justify-center min-h-[38px] px-2 py-1 text-sm bg-gray-50 dark:bg-dark-surface hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-brand-950/30 border border-gray-200 dark:border-dark-border/80 rounded-lg text-gray-800 dark:text-gray-100 transition-all active:scale-95 shadow-xs"
            title={item.label}
          >
            <MathView content={`$${item.displayLatex || item.latex}$`} />
          </button>
        ))}
      </div>
    </div>
  );
};
