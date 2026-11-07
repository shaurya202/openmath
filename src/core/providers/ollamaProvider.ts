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

export class OllamaProvider implements IMathProvider {
  readonly name: string;
  private host: string;
  private model: string;
  private apiKey: string | undefined;

  constructor(model?: string, host?: string, apiKey?: string) {
    this.model = model || process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
    this.host = (host || process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/+$/, '');
    this.apiKey = apiKey || process.env.OLLAMA_API_KEY;
    this.name = `Ollama (${this.model})`;
  }

  isAvailable(): boolean {
    // If explicitly configured or running on default port
    return Boolean(this.model);
  }

  async solve(request: ProviderSolveRequest): Promise<MathSolution> {
    const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (request.imageBase64 && request.imageMimeType) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: request.query || 'Solve the math problem in this image.' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${request.imageMimeType};base64,${request.imageBase64}`,
            },
          },
        ],
      });
    } else {
      messages.push({ role: 'user', content: request.query });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    const res = await fetch(`${this.host}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';

    // Strip markdown code fences if present (e.g. ```json ... ```)
    const cleanJson = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanJson);

      // Normalize steps (support both string arrays and object arrays)
      const normalizedSteps: SolutionStep[] = (parsed.steps || []).map(
        (step: any, idx: number) => {
          if (typeof step === 'string') {
            return {
              stepNumber: idx + 1,
              title: `Step ${idx + 1}`,
              explanation: step,
            };
          }
          return {
            stepNumber: step.stepNumber || idx + 1,
            title: step.title || `Step ${idx + 1}`,
            latex: step.latex,
            explanation: step.explanation || '',
          };
        }
      );

      return {
        id: `ollama-${Date.now()}`,
        query: request.query,
        interpretation: parsed.interpretation || request.query,
        steps: normalizedSteps,
        boxedAnswer: parsed.boxedAnswer || 'N/A',
        graphableFunctions:
          parsed.graphableFunctions || extractGraphableFunctions(rawContent),
        suggestedFollowUps: parsed.suggestedFollowUps || [],
        confidence: 0.98,
        timestamp: Date.now(),
      };
    } catch {
      return {
        id: `ollama-raw-${Date.now()}`,
        query: request.query,
        interpretation: request.query,
        steps: [
          {
            stepNumber: 1,
            title: 'Solution',
            explanation: rawContent,
          },
        ],
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
