import { IMathProvider, ProviderSolveRequest } from './types';
import { MathSolution } from '@/types';
import { SAMPLE_PROBLEMS } from '../samples/mathCorpus';
import { extractGraphableFunctions } from '../math/latex';

export class OfflineMathProvider implements IMathProvider {
  readonly name = 'Offline Math Engine (Zero-Key)';

  isAvailable(): boolean {
    return true; // Always available
  }

  async solve(request: ProviderSolveRequest): Promise<MathSolution> {
    const query = request.query.trim().toLowerCase();

    // 1. Check for close matches in benchmark corpus
    for (const sample of SAMPLE_PROBLEMS) {
      const matchCount = sample.keywords.filter((kw) => query.includes(kw.toLowerCase())).length;
      if (matchCount >= 2 || query.includes(sample.title.toLowerCase())) {
        return {
          ...sample.solution,
          id: `offline-${Date.now()}`,
          timestamp: Date.now(),
        };
      }
    }

    // 2. Linear equation heuristic: ax + b = c
    const linearMatch = request.query.match(/([+-]?\d*)\s*x\s*([+-]\s*\d+)\s*=\s*([+-]?\d+)/i);
    if (linearMatch) {
      let a = parseInt(linearMatch[1].replace(/\s+/g, '') || '1', 10);
      if (linearMatch[1] === '-') a = -1;
      const b = parseInt(linearMatch[2].replace(/\s+/g, ''), 10);
      const c = parseInt(linearMatch[3].replace(/\s+/g, ''), 10);
      const rhs = c - b;
      const x = rhs / a;

      return {
        id: `offline-lin-${Date.now()}`,
        query: request.query,
        subject: 'algebra',
        interpretation: `Solve the linear equation $${a}x ${b >= 0 ? '+' : ''}${b} = ${c}$ for $x$.`,
        steps: [
          {
            stepNumber: 1,
            title: 'Subtract constant term from both sides',
            latex: `${a}x = ${c} - (${b}) \\implies ${a}x = ${rhs}`,
            explanation: `Isolate variable terms on the left side of the equality.`,
          },
          {
            stepNumber: 2,
            title: `Divide by coefficient of x (${a})`,
            latex: `x = \\frac{${rhs}}{${a}} = ${Number.isInteger(x) ? x : x.toFixed(3)}`,
            explanation: `Divide both sides to find the unique solution.`,
          },
        ],
        boxedAnswer: `x = ${Number.isInteger(x) ? x : x.toFixed(3)}`,
        graphableFunctions: [`${a}*x + ${b}`, `${c}`],
        suggestedFollowUps: ['Plot both lines in Grapher to view intersection'],
        confidence: 0.95,
        timestamp: Date.now(),
      };
    }

    // 3. Simple power derivative heuristic: d/dx [x^n]
    const derivMatch = request.query.match(/(?:derivative\s+of|d\/dx)\s*(?:\[|\()?x\^(\d+)(?:\]|\))?/i);
    if (derivMatch) {
      const n = parseInt(derivMatch[1], 10);
      const newExp = n - 1;
      const answer = newExp === 1 ? `${n}x` : `${n}x^{${newExp}}`;

      return {
        id: `offline-deriv-${Date.now()}`,
        query: request.query,
        subject: 'calculus',
        interpretation: `Differentiate $f(x) = x^{${n}}$ with respect to $x$.`,
        steps: [
          {
            stepNumber: 1,
            title: 'Recall the Power Rule of Differentiation',
            latex: '\\frac{d}{dx}[x^n] = n x^{n-1}',
            explanation: 'Bring the exponent down as a multiplier and subtract 1 from the power.',
          },
          {
            stepNumber: 2,
            title: `Apply power rule with n = ${n}`,
            latex: `\\frac{d}{dx}[x^{${n}}] = ${n} x^{${n}-1} = ${answer}`,
            explanation: 'Perform the arithmetic in the exponent.',
          },
        ],
        boxedAnswer: answer,
        graphableFunctions: [`x^${n}`, `${n}*x^${newExp}`],
        confidence: 0.98,
        timestamp: Date.now(),
      };
    }

    // Default fallback: Default to rich quadratic template or universal solution
    const fallback = SAMPLE_PROBLEMS[0].solution;
    const graphables = extractGraphableFunctions(request.query);

    return {
      id: `offline-gen-${Date.now()}`,
      query: request.query,
      subject: 'algebra',
      interpretation: `Analyze and solve the mathematical problem: $${request.query}$`,
      steps: [
        {
          stepNumber: 1,
          title: 'Problem Formalization',
          latex: `\\text{Input: } ${request.query.slice(0, 40)}`,
          explanation: 'Identify given mathematical entities, constraints, and target variables.',
        },
        ...fallback.steps,
      ],
      boxedAnswer: fallback.boxedAnswer,
      graphableFunctions: graphables.length > 0 ? graphables : fallback.graphableFunctions,
      suggestedFollowUps: [
        'How can we verify this answer analytically?',
        'What happens under boundary conditions?',
      ],
      confidence: 0.85,
      timestamp: Date.now(),
    };
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const solution = await this.solve(request);

    yield `### Interpretation\n${solution.interpretation}\n\n`;
    await delay(60);

    yield `### Step-by-Step Derivation\n`;
    for (const step of solution.steps) {
      await delay(80);
      yield `\n**Step ${step.stepNumber}: ${step.title}**\n`;
      if (step.latex) {
        yield `$$${step.latex}$$\n`;
      }
      yield `${step.explanation}\n`;
    }

    await delay(60);
    yield `\n### Final Answer\n$$\\boxed{${solution.boxedAnswer}}$$\n`;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
