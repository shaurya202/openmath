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

export function getActiveMathProvider(host?: string | null): IMathProvider {
  const isVercelDomain = host
    ? host.toLowerCase().includes('vercel.app')
    : Boolean(process.env.VERCEL || process.env.VERCEL_URL);

  const isPublikDomain = Boolean(host && host.toLowerCase().includes('publik'));

  // On publik domains, always use the publik account balance.
  if (isPublikDomain || process.env.PROVIDER === 'publik') {
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
    return new PublikProvider();
  }

  // If a Gemini key is present in the environment, use it (Vercel or anywhere).
  if (process.env.GEMINI_API_KEY) {
    const gemini = new GeminiProvider();
    if (gemini.isAvailable()) return gemini;
  }

  // If an Ollama endpoint is configured (local or cloud), use it.
  if (process.env.OLLAMA_API_KEY || (process.env.OLLAMA_HOST && process.env.OLLAMA_HOST !== 'http://localhost:11434')) {
    return new OllamaProvider();
  }

  // On Vercel without a Gemini/Ollama key, use the publik account balance.
  if (isVercelDomain) {
    return new PublikProvider();
  }

  // Local / other environments: honor explicit provider selection.
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

  // Fallbacks
  const gemini = new GeminiProvider();
  if (gemini.isAvailable()) return gemini;

  const openai = new OpenAIProvider();
  if (openai.isAvailable()) return openai;

  return new PublikProvider();
}