import { IMathProvider } from './types';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';
import { OllamaProvider } from './ollamaProvider';
import { PublikProvider } from './publik';

export * from './types';
export { GeminiProvider } from './geminiProvider';
export { OpenAIProvider } from './openaiProvider';
export { OllamaProvider } from './ollamaProvider';
export { PublikProvider } from './publik';

export function getActiveMathProvider(): IMathProvider {
  // 1. User's own key if configured (OpenAI, Gemini)
  if (process.env.PROVIDER === 'openai') {
    const openai = new OpenAIProvider();
    if (openai.isAvailable()) return openai;
  }
  if (process.env.PROVIDER === 'gemini') {
    const gemini = new GeminiProvider();
    if (gemini.isAvailable()) return gemini;
  }
  if (process.env.PROVIDER === 'ollama' || process.env.OLLAMA_MODEL) {
    return new OllamaProvider(process.env.OLLAMA_MODEL || 'gemma4:31b-cloud');
  }

  const gemini = new GeminiProvider();
  if (gemini.isAvailable()) {
    return gemini;
  }

  const openai = new OpenAIProvider();
  if (openai.isAvailable()) {
    return openai;
  }

  // 2. Primary provider: publik API
  return new PublikProvider();
}
