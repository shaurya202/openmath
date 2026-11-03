import { IMathProvider, ProviderSolveRequest } from './types';
import { MathSolution } from '@/types';
import { extractGraphableFunctions } from '../math/latex';

const SYSTEM_PROMPT = `You are OpenMath, a world-class AI mathematics tutor and solver.
Format all math output using LaTeX:
- Inline: $formula$
- Display: $$formula$$
Provide a structured step-by-step solution, followed by the final answer enclosed in \\boxed{answer}.
Format as JSON:
{
  "interpretation": "Summary of problem with LaTeX",
  "steps": [
    { "stepNumber": 1, "title": "Step Name", "latex": "equation", "explanation": "text" }
  ],
  "boxedAnswer": "result",
  "graphableFunctions": ["x^2"],
  "suggestedFollowUps": ["Follow-up question"]
}`;

export class OpenAIProvider implements IMathProvider {
  readonly name = 'OpenAI Compatible (GPT-4o/Groq/Ollama)';
  private apiKey: string | undefined;
  private baseURL: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.baseURL = baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async solve(request: ProviderSolveRequest): Promise<MathSolution> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key is not configured');
    }

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

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(content);
      return {
        id: `openai-${Date.now()}`,
        query: request.query,
        interpretation: parsed.interpretation || request.query,
        steps: parsed.steps || [],
        boxedAnswer: parsed.boxedAnswer || 'N/A',
        graphableFunctions: parsed.graphableFunctions || extractGraphableFunctions(content),
        suggestedFollowUps: parsed.suggestedFollowUps || [],
        confidence: 0.99,
        timestamp: Date.now(),
      };
    } catch {
      return {
        id: `openai-raw-${Date.now()}`,
        query: request.query,
        interpretation: request.query,
        steps: [{ stepNumber: 1, title: 'Solution', explanation: content }],
        boxedAnswer: 'N/A',
        timestamp: Date.now(),
      };
    }
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const solution = await this.solve(request);
    yield `### Interpretation\n${solution.interpretation}\n\n`;
    for (const step of solution.steps) {
      yield `\n**Step ${step.stepNumber}: ${step.title}**\n`;
      if (step.latex) yield `$$${step.latex}$$\n`;
      yield `${step.explanation}\n`;
    }
    yield `\n### Final Answer\n$$\\boxed{${solution.boxedAnswer}}$$\n`;
  }
}
