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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Advanced Placement Mathematics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Course Syllabi & Practice
          </h1>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Unit breakdowns, formula sheets, and practice exams for AP Calculus, Statistics, and Precalculus.
          </p>
        </div>
      </div>

      {/* Course Selector Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-dark-border">
        {[
          { id: 'calc-bc', name: 'AP Calculus BC' },
          { id: 'calc-ab', name: 'AP Calculus AB' },
          { id: 'stats', name: 'AP Statistics' },
          { id: 'precalc', name: 'AP Precalculus' },
        ].map((course) => (
          <button
            key={course.id}
            onClick={() => setActiveCourse(course.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeCourse === course.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-surface'
            }`}
          >
            {course.name}
          </button>
        ))}
      </div>

      {/* Units Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            <span>Curriculum Units & Practice Exams</span>
          </h2>
          <span className="text-xs text-gray-500 font-mono">
            College Board Aligned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AP_CALCULUS_BC_UNITS.map((unit) => (
            <div
              key={unit.number}
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-5 shadow-xs hover:border-brand-300 dark:hover:border-brand-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                    Unit {unit.number}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400">
                    {unit.weight}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {unit.title}
                </h3>

                <p className="text-xs text-gray-600 dark:text-dark-muted leading-relaxed">
                  {unit.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-dark-border/60">
                <button
                  type="button"
                  onClick={() => openUnitPracticeTest(unit)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Practice Exam</span>
                </button>

                <button
                  type="button"
                  onClick={() => openUnitReview(unit)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-surface dark:hover:bg-dark-surface/80 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
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
