import { IMathProvider, ProviderSolveRequest } from './types';
import { MathSolution, SolutionStep } from '@/types';
import { extractGraphableFunctions } from '../math/latex';

const SYSTEM_PROMPT = `You are OpenMath, an expert AI mathematics tutor and problem solver.
Solve the given problem step-by-step.
Format all math in LaTeX:
- Inline equations: $...$
- Display/block equations: $$...$$
Enclose the final result in \\boxed{answer}.
Always respond in JSON matching this schema:
{
  "interpretation": "Short problem summary with LaTeX",
  "steps": [
    { "stepNumber": 1, "title": "Step Title", "latex": "Equation if any", "explanation": "Explanation" }
  ],
  "boxedAnswer": "Final answer without \\boxed wrapper",
  "graphableFunctions": ["x^2 - 9"],
  "suggestedFollowUps": ["Follow-up question 1", "Follow-up question 2"]
}`;

export class GroqProvider implements IMathProvider {
  readonly name: string;
  private apiKey: string | undefined;
  private baseURL: string;
  private model: string;

  constructor(apiKey?: string, baseURL?: string, model?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY;
    this.baseURL = (baseURL || process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
    this.model = (model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim();
    this.name = `Groq (${this.model})`;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  supportsImages(): boolean {
    return false;
  }

  async solve(request: ProviderSolveRequest): Promise<MathSolution> {
    if (!this.isAvailable()) throw new Error('GROQ_API_KEY is not configured');
    if (request.imageBase64) throw new Error('Groq provider does not support image inputs');

    const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: request.query }];

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages, temperature: 0.1 }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    const cleanJson = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const parsed = JSON.parse(cleanJson);
      const normalizedSteps: SolutionStep[] = (parsed.steps || []).map((step: any, idx: number) => {
        if (typeof step === 'string') {
          return { stepNumber: idx + 1, title: `Step ${idx + 1}`, explanation: step };
        }
        return {
          stepNumber: step.stepNumber || idx + 1,
          title: step.title || `Step ${idx + 1}`,
          latex: step.latex,
          explanation: step.explanation || '',
        };
      });
      return {
        id: `groq-${Date.now()}`,
        query: request.query,
        interpretation: parsed.interpretation || request.query,
        steps: normalizedSteps,
        boxedAnswer: parsed.boxedAnswer || 'N/A',
        graphableFunctions: parsed.graphableFunctions || extractGraphableFunctions(rawContent),
        suggestedFollowUps: parsed.suggestedFollowUps || [],
        confidence: 0.98,
        timestamp: Date.now(),
      };
    } catch {
      return {
        id: `groq-raw-${Date.now()}`,
        query: request.query,
        interpretation: request.query,
        steps: [{ stepNumber: 1, title: 'Solution', explanation: rawContent }],
        boxedAnswer: 'See derivation above',
        graphableFunctions: extractGraphableFunctions(rawContent),
        confidence: 0.9,
        timestamp: Date.now(),
      };
    }
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const solution = await this.solve(request);
    yield `### Problem Interpretation\n${solution.interpretation}\n\n`;
    yield `### Step-by-Step Derivation\n`;
    for (const step of solution.steps) {
      yield `\n**Step ${step.stepNumber}: ${step.title}**\n`;
      if (step.latex) yield `$$${step.latex}$$\n`;
      yield `${step.explanation}\n`;
    }
    yield `\n### Final Answer\n$$\\boxed{${solution.boxedAnswer}}$$\n`;
  }
}