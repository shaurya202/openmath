import { IMathProvider, ProviderSolveRequest, MATH_SYSTEM_PROMPT, parseSolutionResponse } from './types';
import { MathSolution } from '@/types';

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

    const messages: Array<{ role: string; content: unknown }> = [{ role: 'system', content: MATH_SYSTEM_PROMPT }];

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
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    return parseSolutionResponse('openai', content, request.query);
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const solution = await this.solve(request);
    yield solution.content || '';
  }
}
