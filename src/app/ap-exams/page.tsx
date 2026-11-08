'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MathView } from '@/components/math/MathView';
import { ArtifactDrawer } from '@/components/workspace/ArtifactDrawer';
import { ArtifactData } from '@/types';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface APUnit {
  number: number;
  title: string;
  weight: string;
  description: string;
  keyTheorems: { title: string; latex: string; description: string }[];
  sampleQuestions: {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }[];
}

const AP_CALCULUS_BC_UNITS: APUnit[] = [
  {
    number: 1,
    title: 'Limits and Continuity',
    weight: '4–7% of AP Exam',
    description: 'Foundations of limits, definition of continuity, Intermediate Value Theorem, and algebraic limit evaluation.',
    keyTheorems: [
      {
        title: "L'Hôpital's Rule",
        latex: '\\lim_{x \\to c} \\frac{f(x)}{g(x)} = \\lim_{x \\to c} \\frac{f\'(x)}{g\'(x)} \\quad \\text{if } \\frac{0}{0} \\text{ or } \\frac{\\pm\\infty}{\\pm\\infty}',
        description: "Differentiate numerator and denominator separately when encountering indeterminate forms.",
      },
      {
        title: 'Intermediate Value Theorem (IVT)',
        latex: 'f(c) = k \\quad \\text{for some } c \\in (a, b) \\text{ where } f(a) < k < f(b)',
        description: 'If a function is continuous on [a, b], it takes on every value between f(a) and f(b).',
      },
    ],
    sampleQuestions: [
      {
        question: 'Evaluate $\\lim_{x \\to 0} \\frac{\\sin(4x)}{x}$.',
        options: ['0', '1', '4', 'Does not exist'],
        correctOptionIndex: 2,
        explanation: "By L'Hôpital's rule or standard trigonometric limits: $\\lim_{x \\to 0} \\frac{4\\cos(4x)}{1} = 4(1) = 4$.",
      },
      {
        question: 'Which condition guarantees that $f(x)$ is continuous at $x = c$?',
        options: [
          'f(c) is defined',
          '\\lim_{x \\to c} f(x) exists',
          '\\lim_{x \\to c} f(x) = f(c)',
          'f\'(c) exists',
        ],
        correctOptionIndex: 2,
        explanation: 'Continuity requires both the limit and function value to exist and be equal: $\\lim_{x \\to c} f(x) = f(c)$.',
      },
    ],
  },
  {
    number: 2,
    title: 'Differentiation: Definition & Fundamental Rules',
    weight: '4–7% of AP Exam',
    description: 'Instantaneous rates of change, limit definition of derivative, power rule, product rule, and quotient rule.',
    keyTheorems: [
      {
        title: 'Limit Definition of Derivative',
        latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}",
        description: 'Calculates the exact slope of the tangent line to f at x.',
      },
      {
        title: 'Product & Quotient Rules',
        latex: "\\frac{d}{dx}[u \\cdot v] = u'v + uv', \\quad \\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u'v - uv'}{v^2}",
        description: 'Fundamental product and quotient differentiation properties.',
      },
    ],
    sampleQuestions: [
      {
        question: 'What is the derivative of $f(x) = x^3 \\cdot e^x$?',
        options: [
          '3x^2 \\cdot e^x',
          'x^3 e^x + 3x^2 e^x',
          '3x^2 + e^x',
          'x^2 e^x (x + 1)',
        ],
        correctOptionIndex: 1,
        explanation: "Using product rule $(uv)' = u'v + uv'$: $3x^2 e^x + x^3 e^x$.",
      },
    ],
  },
  {
    number: 6,
    title: 'Integration and Accumulation of Change',
    weight: '17–20% of AP Exam',
    description: 'Riemann sums, Fundamental Theorem of Calculus (FTC parts 1 & 2), substitution, and integration by parts.',
    keyTheorems: [
      {
        title: 'Fundamental Theorem of Calculus (Part 1)',
        latex: "\\frac{d}{dx}\\left[\\int_{a}^{x} f(t) dt\\right] = f(x)",
        description: 'The derivative of an accumulation function is the original integrand.',
      },
      {
        title: 'Integration by Parts',
        latex: '\\int u \\, dv = uv - \\int v \\, du',
        description: 'Essential BC technique derived from the product rule.',
      },
    ],
    sampleQuestions: [
      {
        question: 'Evaluate $\\int x e^x \\, dx$ using integration by parts.',
        options: [
          'x e^x - e^x + C',
          'x e^x + e^x + C',
          '\\frac{x^2}{2} e^x + C',
          'e^x + C',
        ],
        correctOptionIndex: 0,
        explanation: 'Set $u = x \\implies du = dx$, and $dv = e^x dx \\implies v = e^x$. Then $\\int u dv = uv - \\int v du = x e^x - e^x + C$.',
      },
    ],
  },
  {
    number: 10,
    title: 'Infinite Sequences and Series (BC Specialty)',
    weight: '17–18% of AP Exam',
    description: 'Convergence tests, geometric series, p-series, Taylor polynomials, Maclaurin series, and Taylor error bound.',
    keyTheorems: [
      {
        title: 'Taylor Series Expansion',
        latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(c)}{n!} (x - c)^n',
        description: 'Representation of infinitely differentiable functions as polynomials around c.',
      },
      {
        title: 'Ratio Test for Absolute Convergence',
        latex: 'L = \\lim_{n \\to \\infty} \\left|\\frac{a_{n+1}}{a_n}\\right| < 1 \\implies \\text{converges absolutely}',
        description: 'Primary convergence test for finding radius and interval of convergence.',
      },
    ],
    sampleQuestions: [
      {
        question: 'What is the Maclaurin series for $\\cos(x)$?',
        options: [
          '\\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n+1}}{(2n+1)!}',
          '\\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n}}{(2n)!}',
          '\\sum_{n=0}^{\\infty} \\frac{x^n}{n!}',
          '\\sum_{n=0}^{\\infty} x^n',
        ],
        correctOptionIndex: 1,
        explanation: 'Cosine is an even function, containing only even powers of x with alternating signs.',
      },
    ],
  },
];

export default function APExamHubPage() {
  const [activeCourse, setActiveCourse] = useState<'calc-bc' | 'calc-ab' | 'stats' | 'precalc'>('calc-bc');
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);

  const openUnitPracticeTest = (unit: APUnit) => {
    setActiveArtifact({
      id: `test-unit-${unit.number}`,
      type: 'practice_test',
      title: `Unit ${unit.number} Practice Exam: ${unit.title}`,
      subtitle: `Official AP-Style Diagnostic (${unit.sampleQuestions.length} Questions)`,
      data: {
        questions: unit.sampleQuestions,
      },
    });
  };

  const openUnitReview = (unit: APUnit) => {
    setActiveArtifact({
      id: `review-unit-${unit.number}`,
      type: 'ap_unit',
      title: `Unit ${unit.number}: ${unit.title}`,
      subtitle: unit.weight,
      data: {
        overview: unit.description,
        keyTheorems: unit.keyTheorems,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Editorial Monograph Header */}
      <div className="border-b border-gray-200 dark:border-dark-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Advanced Placement Mathematics
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Course units and practice exams
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-dark-muted leading-relaxed">
            Key formulas and timed practice questions for AP Calculus, Statistics, and Precalculus.
          </p>
        </div>

        {/* Course Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {([
            { id: 'calc-bc', name: 'AP Calculus BC' },
            { id: 'calc-ab', name: 'AP Calculus AB' },
            { id: 'stats', name: 'AP Statistics' },
            { id: 'precalc', name: 'AP Precalculus' },
          ] as const).map((course) => (
            <button
              key={course.id}
              onClick={() => setActiveCourse(course.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap border ${
                activeCourse === course.id
                  ? 'bg-brand-600 text-white border-brand-700 dark:border-brand-500'
                  : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {course.name}
            </button>
          ))}
        </div>
      </div>

      {/* Units Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Units and practice exams
          </h2>
          <span className="text-xs text-gray-500 dark:text-dark-muted">
            Aligned to the College Board rubric
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AP_CALCULUS_BC_UNITS.map((unit) => (
            <div
              key={unit.number}
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-5 hover:border-brand-500/60 dark:hover:border-brand-500/60 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border/80 pb-2">
                  <span className="text-xs font-mono font-semibold text-brand-700 dark:text-brand-300">
                    Unit {unit.number}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400 dark:text-dark-muted">
                    {unit.weight}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-white pt-1">
                  {unit.title}
                </h3>

                <p className="text-xs text-gray-600 dark:text-dark-muted leading-relaxed">
                  {unit.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-3 border-t border-gray-100 dark:border-dark-border/60">
                <button
                  type="button"
                  onClick={() => openUnitPracticeTest(unit)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Practice Exam</span>
                </button>

                <button
                  type="button"
                  onClick={() => openUnitReview(unit)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-dark-surface dark:hover:bg-dark-border text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Key Formulas</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Artifact Drawer for Practice Tests and Formula Review */}
      <ArtifactDrawer
        artifact={activeArtifact}
        onClose={() => setActiveArtifact(null)}
      />
    </div>
  );
}
