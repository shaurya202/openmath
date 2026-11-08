import { IMathProvider, ProviderSolveRequest, MATH_SYSTEM_PROMPT, parseSolutionResponse } from './types';
import { MathSolution } from '@/types';

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

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: MATH_SYSTEM_PROMPT },
      { role: 'user', content: request.query },
    ];

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
    const rawContent = data.choices?.[0]?.message?.content || '';
    return parseSolutionResponse('groq', rawContent, request.query);
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const solution = await this.solve(request);
    yield solution.content || '';
  }
}