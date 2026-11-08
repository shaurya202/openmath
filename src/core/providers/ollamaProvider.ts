import { IMathProvider, ProviderSolveRequest, MATH_SYSTEM_PROMPT, parseSolutionResponse } from './types';
import { MathSolution } from '@/types';

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
    const rawContent = data.choices?.[0]?.message?.content || '';
    return parseSolutionResponse('ollama', rawContent, request.query);
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const solution = await this.solve(request);
    yield solution.content || '';
  }
}
