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

export const DEFAULT_NIM_MODEL = 'deepseek-ai/deepseek-v4.1-flash';
export const FALLBACK_NIM_MODELS = [
  'deepseek-ai/deepseek-v4.1-flash',
  'deepseek-ai/deepseek-coder-6.7b-instruct',
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.2-3b-instruct',
];
export const VISION_NIM_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'meta/llama-3.2-90b-vision-instruct',
];

export class NvidiaNimProvider implements IMathProvider {
  name: string;
  private apiKey: string | undefined;
  private baseURL: string;
  private model: string;

  constructor(apiKey?: string, baseURL?: string, model?: string) {
    const rawKey = apiKey || process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY || process.env.NVIDIA_KEY || process.env.NIM_KEY;
    this.apiKey = rawKey ? rawKey.trim().replace(/^['"]|['"]$/g, '') : undefined;
    this.baseURL = (baseURL || process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1').trim().replace(/\/+$/, '');
    this.model = (model || process.env.NVIDIA_NIM_MODEL || DEFAULT_NIM_MODEL).trim().replace(/^['"]|['"]$/g, '');
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

    let availableModels: string[] = [];
    try {
      const modelsRes = await fetch(`${this.baseURL}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(3000),
      });
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        availableModels = (modelsData.data || []).map((m: any) => m.id);
      }
    } catch {
      // ignore /models fetch failure
    }

    let modelsToTry: string[];
    if (request.imageBase64) {
      const candidateVision = availableModels.filter(
        (m) => m.includes('vision') || m.includes('-vl')
      );
      modelsToTry = [
        ...new Set([
          ...candidateVision,
          ...VISION_NIM_MODELS,
          ...availableModels,
        ]),
      ].slice(0, 6);
    } else {
      modelsToTry = [
        ...new Set([
          ...(this.model ? [this.model] : []),
          ...availableModels,
          DEFAULT_NIM_MODEL,
          ...FALLBACK_NIM_MODELS,
        ]),
      ].slice(0, 6);
    }
    let lastError = '';

    for (const currentModel of modelsToTry) {
      try {
        const res = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: currentModel,
            messages,
            temperature: 0.2,
            max_tokens: 2048,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          lastError = await res.text();
          // If 404/410/400 (model retired, not found, or not entitled for account), try next candidate
          if (res.status === 404 || res.status === 410 || res.status === 400) {
            continue;
          }
          throw new Error(`NVIDIA NIM API error (${res.status}): ${lastError}`);
        }

        this.model = currentModel;
        this.name = `NVIDIA NIM (${currentModel})`;

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '{}';

        let jsonStr = content.trim();
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        } else {
          const firstBrace = content.indexOf('{');
          const lastBrace = content.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = content.slice(firstBrace, lastBrace + 1);
          }
        }

        const extractBoxed = (text: string) => {
          const m = text.match(/\\boxed\{([^}]+)\}/);
          return m ? m[1] : null;
        };

        try {
          const parsed = JSON.parse(jsonStr);
          return {
            id: `nim-${Date.now()}`,
            query: request.query,
            interpretation: parsed.interpretation || request.query,
            steps: Array.isArray(parsed.steps) ? parsed.steps : [],
            boxedAnswer: parsed.boxedAnswer || extractBoxed(content) || 'N/A',
            graphableFunctions: parsed.graphableFunctions || extractGraphableFunctions(content),
            suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps : [],
            confidence: 0.99,
            timestamp: Date.now(),
          };
        } catch {
          const boxed = extractBoxed(content);
          return {
            id: `nim-raw-${Date.now()}`,
            query: request.query,
            interpretation: request.query,
            steps: [{ stepNumber: 1, title: 'Solution', explanation: content }],
            boxedAnswer: boxed || 'N/A',
            graphableFunctions: extractGraphableFunctions(content),
            suggestedFollowUps: [],
            confidence: 0.95,
            timestamp: Date.now(),
          };
        }
      } catch (err: any) {
        lastError = err.message || String(err);
        continue;
      }
    }

    throw new Error(`NVIDIA NIM API error: All candidate models unavailable. (Available on key: ${availableModels.slice(0, 10).join(', ') || 'none'}). Last error: ${lastError}`);
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
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

    let availableModels: string[] = [];
    try {
      const modelsRes = await fetch(`${this.baseURL}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(3000),
      });
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        availableModels = (modelsData.data || []).map((m: any) => m.id);
      }
    } catch {
      // ignore
    }

    let modelsToTry: string[];
    if (request.imageBase64) {
      const candidateVision = availableModels.filter(
        (m) => m.includes('vision') || m.includes('-vl')
      );
      modelsToTry = [
        ...new Set([
          ...candidateVision,
          ...VISION_NIM_MODELS,
          ...availableModels,
        ]),
      ].slice(0, 6);
    } else {
      modelsToTry = [
        ...new Set([
          ...(this.model ? [this.model] : []),
          ...availableModels,
          DEFAULT_NIM_MODEL,
          ...FALLBACK_NIM_MODELS,
        ]),
      ].slice(0, 6);
    }
    let activeRes: Response | null = null;

    for (const currentModel of modelsToTry) {
      try {
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
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok || !res.body) {
          if (res.status === 404 || res.status === 410 || res.status === 400) {
            continue;
          }
          const err = await res.text();
          throw new Error(`NVIDIA NIM stream error (${res.status}): ${err}`);
        }

        this.model = currentModel;
        this.name = `NVIDIA NIM (${currentModel})`;
        activeRes = res;
        break;
      } catch {
        continue;
      }
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
