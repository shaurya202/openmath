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

export function getActiveMathProvider(host?: string | null): IMathProvider {
  const isVercelDomain = host
    ? host.toLowerCase().includes('vercel.app')
    : Boolean(process.env.VERCEL || process.env.VERCEL_URL);

  const isPublikDomain = Boolean(host && host.toLowerCase().includes('publik'));

  const hasNimKey = Boolean(
    process.env.NVIDIA_NIM_API_KEY ||
      process.env.NVIDIA_API_KEY ||
      process.env.NIM_API_KEY ||
      process.env.NVIDIA_KEY ||
      process.env.NIM_KEY
  );

  // On publik domains, always use the publik account balance (never NIM, even if a key exists).
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

  // If a NVIDIA NIM key is present in the environment, use it (Vercel or anywhere).
  // No publik fallback is used when NIM is selected.
  if (hasNimKey) {
    const nim = new NvidiaNimProvider();
    if (nim.isAvailable()) return nim;
  }

  // On Vercel without a NIM key, use the publik account balance.
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
