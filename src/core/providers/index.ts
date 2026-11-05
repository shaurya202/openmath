import { IMathProvider } from './types';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';
import { OllamaProvider } from './ollamaProvider';
import { PublikProvider } from './publik';
import { NvidiaNimProvider } from './nvidiaNimProvider';

export * from './types';
export { GeminiProvider } from './geminiProvider';
export { OpenAIProvider } from './openaiProvider';
export { OllamaProvider } from './ollamaProvider';
export { PublikProvider } from './publik';
export { NvidiaNimProvider } from './nvidiaNimProvider';

export function getActiveMathProvider(): IMathProvider {
  // 1. Primary: NVIDIA NIM if NVIDIA_NIM_API_KEY is configured (default for Vercel)
  if (process.env.NVIDIA_NIM_API_KEY || process.env.PROVIDER === 'nvidia' || process.env.PROVIDER === 'nim') {
    const nim = new NvidiaNimProvider();
    if (nim.isAvailable()) return nim;
  }

  // 2. User's own key if configured (OpenAI, Gemini)
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

  // 3. Fallback: publik API
  return new PublikProvider();
}
