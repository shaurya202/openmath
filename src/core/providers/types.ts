import { MathSolution } from '@/types';
import { extractGraphableFunctions } from '../math/latex';

export const MATH_SYSTEM_PROMPT = `You are OpenMath, a warm, remarkably clear human math tutor and mentor.
Talk naturally, conversationally, and engagingly—like a great teacher sitting beside a student with a pencil and paper.

Tone & Voice Guidelines:
1. Speak in a natural first-person conversational voice ("Let's break this down...", "Notice that...", "We can make this much easier by...", "Here's the intuition...").
2. Avoid robotic boilerplate phrasing (never say "I will now compute the formula", "Execution of step", or generic filler).
3. If the user sends a greeting, general inquiry, or non-math prompt, respond warmly and directly as a friendly tutor. Do NOT make up fake math steps or a final answer for prompts that don't have one.
4. If the user presents a math problem or concept:
   - Walk through the problem with intuitive reasoning, focusing on *why* it works rather than rote memorization.
   - If steps or derivation are helpful, format them naturally in your explanation (e.g. **Step 1: ...**).
   - Only include a final answer if the problem actually has a calculated or algebraic result (e.g. **Final Answer:** $$\\boxed{...}$$). Do not include a final answer if none exists.
5. Format math expressions in clean LaTeX:
   - Inline math: $formula$
   - Display/block math: $$formula$$
6. Provide your complete response as natural markdown text. Do NOT output JSON.`;

export function parseSolutionResponse(prefix: string, rawText: string, query: string): MathSolution {
  const trimmed = (rawText || '').trim();
  // Handle JSON fallback if model returns JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      let content = parsed.interpretation || '';
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        const stepsText = parsed.steps
          .map((s: { title?: string; stepNumber?: number; latex?: string; explanation?: string }) => {
            const title = s.title ? `**Step ${s.stepNumber || ''}: ${s.title}**\n` : '';
            const latex = s.latex ? `$$${s.latex}$$\n` : '';
            const explanation = s.explanation || '';
            return `${title}${latex}${explanation}`.trim();
          })
          .filter(Boolean)
          .join('\n\n');
        content = content ? `${content}\n\n${stepsText}` : stepsText;
      }
      if (parsed.boxedAnswer && parsed.boxedAnswer !== 'N/A' && !/ready/i.test(parsed.boxedAnswer)) {
        content += `\n\n**Final Answer:**\n$$\\boxed{${parsed.boxedAnswer}}$$`;
      }
      return {
        id: `${prefix}-${Date.now()}`,
        query,
        content: content || trimmed,
        interpretation: parsed.interpretation,
        steps: parsed.steps,
        boxedAnswer: parsed.boxedAnswer,
        graphableFunctions: parsed.graphableFunctions || extractGraphableFunctions(content),
        suggestedFollowUps: parsed.suggestedFollowUps,
        confidence: 0.99,
        timestamp: Date.now(),
      };
    } catch {
      // Ignore JSON parse failure and treat as text
    }
  }

  return {
    id: `${prefix}-${Date.now()}`,
    query,
    content: trimmed,
    graphableFunctions: extractGraphableFunctions(trimmed),
    confidence: 0.98,
    timestamp: Date.now(),
  };
}

export interface ProviderSolveRequest {
  query: string;
  imageBase64?: string;
  imageMimeType?: string;
  subject?: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

export interface IMathProvider {
  readonly name: string;
  isAvailable(): boolean;
  solve(request: ProviderSolveRequest): Promise<MathSolution>;
  solveStream(request: ProviderSolveRequest): AsyncIterable<string>;
}
