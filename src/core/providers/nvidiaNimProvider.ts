import { IMathProvider, ProviderSolveRequest } from './types';
import { MathSolution } from '@/types';
import { extractGraphableFunctions } from '../math/latex';

const SYSTEM_PROMPT = `You are OpenMath, a world-class AI mathematics tutor and solver powered by NVIDIA NIM.
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

export const DEFAULT_NIM_MODEL = 'meta/llama-3.1-70b-instruct';
export const FALLBACK_NIM_MODELS = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'deepseek-ai/deepseek-r1',
  'nvidia/llama-3.1-nemotron-70b-instruct',
];

export class NvidiaNimProvider implements IMathProvider {
  name: string;
  private apiKey: string | undefined;
  private baseURL: string;
  private model: string;

  constructor(apiKey?: string, baseURL?: string, model?: string) {
    this.apiKey = apiKey || process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY;
    this.baseURL = baseURL || process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    this.model = model || process.env.NVIDIA_NIM_MODEL || DEFAULT_NIM_MODEL;
    this.name = `NVIDIA NIM (${this.model})`;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async solve(request: ProviderSolveRequest): Promise<MathSolution> {
    if (!this.isAvailable()) {
      throw new Error('NVIDIA_NIM_API_KEY is not configured');
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

    const modelsToTry = [...new Set([this.model, ...FALLBACK_NIM_MODELS])];
    let lastError = '';

    for (const currentModel of modelsToTry) {
      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          response_format: currentModel.includes('deepseek') ? undefined : { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        lastError = await res.text();
        // If 404/410, model is retired or unavailable, try next candidate
        if (res.status === 404 || res.status === 410) {
          continue;
        }
        throw new Error(`NVIDIA NIM API error (${res.status}): ${lastError}`);
      }

      this.model = currentModel;
      this.name = `NVIDIA NIM (${currentModel})`;

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';

      try {
        const parsed = JSON.parse(content);
        return {
          id: `nim-${Date.now()}`,
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
          id: `nim-raw-${Date.now()}`,
          query: request.query,
          interpretation: request.query,
          steps: [{ stepNumber: 1, title: 'Solution', explanation: content }],
          boxedAnswer: 'N/A',
          graphableFunctions: extractGraphableFunctions(content),
          suggestedFollowUps: [],
          confidence: 0.95,
          timestamp: Date.now(),
        };
      }
    }

    throw new Error(`NVIDIA NIM API error: All candidate models retired or unavailable. Last error: ${lastError}`);
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    if (!this.isAvailable()) {
      throw new Error('NVIDIA_NIM_API_KEY is not configured');
    }

    const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    messages.push({ role: 'user', content: request.query });

    const modelsToTry = [...new Set([this.model, ...FALLBACK_NIM_MODELS])];
    let activeRes: Response | null = null;

    for (const currentModel of modelsToTry) {
      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          stream: true,
          temperature: 0.2,
        }),
      });

      if (!res.ok || !res.body) {
        if (res.status === 404 || res.status === 410) {
          continue;
        }
        const err = await res.text();
        throw new Error(`NVIDIA NIM stream error (${res.status}): ${err}`);
      }

      this.model = currentModel;
      this.name = `NVIDIA NIM (${currentModel})`;
      activeRes = res;
      break;
    }

    if (!activeRes || !activeRes.body) {
      throw new Error('NVIDIA NIM stream error: All candidate models unavailable');
    }

    const reader = activeRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.replace('data: ', '');
        if (jsonStr === '[DONE]') return;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // ignore stream parse errors
        }
      }
    }
  }
}
