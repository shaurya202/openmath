import { IMathProvider, ProviderSolveRequest, MATH_SYSTEM_PROMPT, parseSolutionResponse } from './types';
import { MathSolution } from '@/types';

export class GeminiProvider implements IMathProvider {
  readonly name = 'Google Gemini (Multimodal)';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async solve(request: ProviderSolveRequest): Promise<MathSolution> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured');
    }

    const parts: Array<
      | { inlineData: { mimeType: string; data: string } }
      | { text: string }
    > = [];

    // Multimodal image support
    if (request.imageBase64 && request.imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: request.imageMimeType,
          data: request.imageBase64,
        },
      });
      parts.push({
        text: `Solve the mathematical problem in this image. Additional user notes: ${request.query || 'None'}`,
      });
    } else {
      parts.push({ text: request.query });
    }

    // Discover available models for this key, then try generateContent on each.
    let candidateModels: string[] = [];
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
      );
      if (listRes.ok) {
        const listData = (await listRes.json()) as {
          models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
        };
        candidateModels = (listData.models || [])
          .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map((m) => (m.name || '').replace(/^models\//, ''))
          .filter(Boolean);
      }
    } catch {
      // ignore; fall back to defaults below
    }
    if (candidateModels.length === 0) {
      candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    }

    let res: Response | null = null;
    let lastErr = '';
    for (const m of candidateModels.slice(0, 6)) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            systemInstruction: {
              parts: [{ text: MATH_SYSTEM_PROMPT }],
            },
            generationConfig: {
              temperature: 0.1,
            },
          }),
        }
      );
      if (res.ok) break;
      lastErr = await res.text();
      res = null;
    }
    if (!res) {
      throw new Error(`Gemini API error: ${lastErr}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseSolutionResponse('gemini', rawText, request.query);
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const solution = await this.solve(request);
    yield solution.content || '';
  }
}
