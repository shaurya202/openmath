'use client';

import React, { useState } from 'react';
import { X, Delete, ArrowRight, Calculator } from 'lucide-react';

interface FloatingCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToInput?: (val: string) => void;
}

export const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({
  isOpen,
  onClose,
  onInsertToInput,
}) => {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChar = (ch: string) => {
    setExpr((prev) => prev + ch);
  };

  const handleClear = () => {
    setExpr('');
    setResult(null);
  };

  const handleBackspace = () => {
    setExpr((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    try {
      let sanitized = expr
        .replace(/\^/g, '**')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\blog\b/g, 'Math.log10')
        .replace(/\bln\b/g, 'Math.log')
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b/gi, 'Math.E');

      // Expand implicit multiplication
      sanitized = sanitized.replace(/(\d+)\s*([a-zA-Z(])/g, '$1*$2');

      const fn = new Function(`"use strict"; return (${sanitized});`);
      const val = fn();
      if (typeof val === 'number' && !isNaN(val)) {
        // Round cleanly to 6 decimal places if needed
        const formatted = Math.round(val * 1e8) / 1e8;
        setResult(String(formatted));
      } else {
        setResult('Error');
      }
    } catch {
      setResult('Error');
    }
  };

  const handleInsert = () => {
    if (result && result !== 'Error' && onInsertToInput) {
      onInsertToInput(result);
      onClose();
    } else if (expr && onInsertToInput) {
      onInsertToInput(expr);
      onClose();
    }
  };

  const buttons = [
    ['sin', 'cos', 'tan', 'sqrt'],
    ['ln', 'log', 'pi', '^'],
    ['(', ')', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', 'AC', 'DEL'],
  ];

  return (
    <div className="fixed bottom-24 right-6 z-50 w-72 sm:w-80 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl p-4 animate-fade-in text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-dark-border/80">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
          <Calculator className="w-3.5 h-3.5 text-brand-600" />
          <span>Scientific Calculator</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close calculator"
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-surface"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Screen Display */}
      <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-2.5 mb-3 border border-gray-100 dark:border-dark-border text-right min-h-[56px] flex flex-col justify-center">
        <div className="text-xs font-mono text-gray-500 dark:text-dark-muted truncate">
          {expr || '0'}
        </div>
        <div className="text-lg font-mono font-bold text-brand-600 dark:text-brand-400 truncate">
          {result !== null ? `= ${result}` : ' '}
        </div>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-1.5 text-xs font-medium">
        {buttons.flat().map((btn) => {
          const isEquals = btn === '=';
          const isAC = btn === 'AC';
          const isDEL = btn === 'DEL';
          const isOp = ['+', '-', '×', '÷', '^', 'sin', 'cos', 'tan', 'sqrt', 'ln', 'log'].includes(btn);

          return (
            <button
              key={btn}
              type="button"
              onClick={() => {
                if (isEquals) handleCalculate();
                else if (isAC) handleClear();
                else if (isDEL) handleBackspace();
                else if (btn === '×') handleChar('*');
                else if (btn === '÷') handleChar('/');
                else if (['sin', 'cos', 'tan', 'sqrt', 'ln', 'log'].includes(btn)) handleChar(`${btn}(`);
                else handleChar(btn);
              }}
              className={`p-2 rounded-lg transition-all active:scale-95 ${
                isEquals
                  ? 'bg-brand-600 text-white font-bold col-span-1 shadow-xs'
                  : isAC
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold'
                  : isDEL
                  ? 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 font-semibold'
                  : isOp
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold'
                  : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border/60 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-surface'
              }`}
            >
              {btn}
            </button>
          );
        })}
      </div>

      {/* Insert Action */}
      {onInsertToInput && (result !== null || expr) && (
        <button
          type="button"
          onClick={handleInsert}
          className="mt-3 w-full flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
        >
          <span>Use in Question</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
