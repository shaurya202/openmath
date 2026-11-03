import { IMathProvider } from './types';
import { OfflineMathProvider } from './offlineProvider';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';
import { OllamaProvider } from './ollamaProvider';

export * from './types';
export { OfflineMathProvider } from './offlineProvider';
export { GeminiProvider } from './geminiProvider';
export { OpenAIProvider } from './openaiProvider';
export { OllamaProvider } from './ollamaProvider';

export function getActiveMathProvider(): IMathProvider {
  // 1. Check Ollama (if OLLAMA_MODEL is configured or explicitly selected)
  if (process.env.OLLAMA_MODEL || process.env.PROVIDER === 'ollama') {
    return new OllamaProvider(process.env.OLLAMA_MODEL || 'gemma4:31b-cloud');
  }

  // 2. Check Gemini
  const gemini = new GeminiProvider();
  if (gemini.isAvailable()) {
    return gemini;
  }

  // 3. Check OpenAI / OpenRouter
  const openai = new OpenAIProvider();
  if (openai.isAvailable()) {
    return openai;
  }

  // 4. Default to Ollama if default port is reachable or fall back to zero-key
  return new OllamaProvider('gemma4:31b-cloud');
}
