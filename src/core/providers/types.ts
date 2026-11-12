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
6. Provide your complete response as natural markdown text. Do NOT output JSON.
7. Do NOT use emojis anywhere in your responses under any circumstances. Keep all explanations and output completely free of emojis.`;

const EMOJI_REGEX = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;

export function stripEmojis(text: string): string {
  if (!text) return text;
  return text
    .replace(EMOJI_REGEX, (match) => {
      const cp = match.codePointAt(0) || 0;
      // Preserve standard mathematical operators, arrows, logic symbols, and Greek letters
      if (cp >= 0x2190 && cp <= 0x22ff) return match;
      if (cp >= 0x27f0 && cp <= 0x27ff) return match;
      if (cp >= 0x0370 && cp <= 0x03ff) return match;
      return '';
    })
    .replace(/[ \t]{2,}/g, ' ');
}

export function parseSolutionResponse(prefix: string, rawText: string, query: string): MathSolution {
  const sanitized = stripEmojis(rawText || '').trim();
  // Handle JSON fallback if model returns JSON
  if (sanitized.startsWith('{') && sanitized.endsWith('}')) {
    try {
      const parsed = JSON.parse(sanitized);
      let content = stripEmojis(parsed.interpretation || '');
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        const stepsText = parsed.steps
          .map((s: { title?: string; stepNumber?: number; latex?: string; explanation?: string }) => {
            const title = s.title ? `**Step ${s.stepNumber || ''}: ${stripEmojis(s.title)}**\n` : '';
            const latex = s.latex ? `$$${s.latex}$$\n` : '';
            const explanation = s.explanation ? stripEmojis(s.explanation) : '';
            return `${title}${latex}${explanation}`.trim();
          })
          .filter(Boolean)
          .join('\n\n');
        content = content ? `${content}\n\n${stepsText}` : stepsText;
      }
      if (parsed.boxedAnswer && parsed.boxedAnswer !== 'N/A' && !/ready/i.test(parsed.boxedAnswer)) {
        content += `\n\n**Final Answer:**\n$$\\boxed{${stripEmojis(parsed.boxedAnswer)}}$$`;
      }
      return {
        id: `${prefix}-${Date.now()}`,
        query,
        content: content || sanitized,
        interpretation: parsed.interpretation ? stripEmojis(parsed.interpretation) : undefined,
        steps: parsed.steps,
        boxedAnswer: parsed.boxedAnswer ? stripEmojis(parsed.boxedAnswer) : undefined,
        graphableFunctions: parsed.graphableFunctions || extractGraphableFunctions(content),
        suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
          ? parsed.suggestedFollowUps.map((s: string) => stripEmojis(s))
          : undefined,
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
    content: sanitized,
    graphableFunctions: extractGraphableFunctions(sanitized),
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
