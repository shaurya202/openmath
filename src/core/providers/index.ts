import { IMathProvider } from './types';
import { OfflineMathProvider } from './offlineProvider';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';

export * from './types';
export { OfflineMathProvider } from './offlineProvider';
export { GeminiProvider } from './geminiProvider';
export { OpenAIProvider } from './openaiProvider';

export function getActiveMathProvider(): IMathProvider {
  // 1. Check Gemini
  const gemini = new GeminiProvider();
  if (gemini.isAvailable()) {
    return gemini;
  }

  // 2. Check OpenAI / OpenRouter
  const openai = new OpenAIProvider();
  if (openai.isAvailable()) {
    return openai;
  }

  // 3. Guaranteed offline zero-key engine
  return new OfflineMathProvider();
}
