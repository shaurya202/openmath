import { IMathProvider, ProviderSolveRequest } from './types';
import { MathSolution } from '@/types';
import { extractGraphableFunctions } from '../math/latex';

const SYSTEM_PROMPT = `You are OpenMath, an expert AI mathematics tutor and problem solver.
When solving problems:
1. Always formulate expressions in standard LaTeX:
   - Inline equations: wrap in single dollar signs $...$
   - Display equations: wrap in double dollar signs $$...$$
2. Provide structured step-by-step reasoning.
3. Conclude with the final answer in a LaTeX box: \\boxed{answer}.
4. Return your response as valid JSON matching this schema:
{
  "interpretation": "Plain text with LaTeX summarizing the problem",
  "steps": [
    { "stepNumber": 1, "title": "Step Title", "latex": "LaTeX formula if applicable", "explanation": "Detailed explanation" }
  ],
  "boxedAnswer": "Final answer without the \\boxed wrapper",
  "graphableFunctions": ["x^2 - 4"],
  "suggestedFollowUps": ["Follow up question 1", "Follow up question 2"]
}
`;

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

    const parts: any[] = [];

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
        const listData = await listRes.json();
        candidateModels = (listData.models || [])
          .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map((m: any) => (m.name || '').replace(/^models\//, ''))
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
              parts: [{ text: SYSTEM_PROMPT }],
            },
            generationConfig: {
              responseMimeType: 'application/json',
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
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const parsed = JSON.parse(rawText);
      return {
        id: `gemini-${Date.now()}`,
        query: request.query,
        interpretation: parsed.interpretation || request.query,
        steps: parsed.steps || [],
        boxedAnswer: parsed.boxedAnswer || 'N/A',
        graphableFunctions: parsed.graphableFunctions || extractGraphableFunctions(rawText),
        suggestedFollowUps: parsed.suggestedFollowUps || [],
        confidence: 0.98,
        timestamp: Date.now(),
      };
    } catch {
      return {
        id: `gemini-raw-${Date.now()}`,
        query: request.query,
        interpretation: request.query,
        steps: [
          {
            stepNumber: 1,
            title: 'Solution',
            explanation: rawText,
          },
        ],
        boxedAnswer: 'See steps above',
        confidence: 0.9,
        timestamp: Date.now(),
      };
    }
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const solution = await this.solve(request);
    yield `### Problem\n${solution.interpretation}\n\n`;
    for (const step of solution.steps) {
      yield `\n**Step ${step.stepNumber}: ${step.title}**\n`;
      if (step.latex) yield `$$${step.latex}$$\n`;
      yield `${step.explanation}\n`;
    }
    yield `\n### Final Answer\n$$\\boxed{${solution.boxedAnswer}}$$\n`;
  }
}
