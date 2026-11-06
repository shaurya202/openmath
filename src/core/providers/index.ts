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

  const isPublik = host ? (host.toLowerCase().includes('publik') || !isVercelDomain) : !isVercelDomain;

  // On the Vercel domain, use NVIDIA NIM API only (API key is stored in Vercel).
  // Never fall back to publik on Vercel.
  if (isVercelDomain && !host?.toLowerCase().includes('publik')) {
    return new NvidiaNimProvider();
  }

  // On publik, use the publik API
  if (isPublik || process.env.PROVIDER === 'publik') {
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

  // Fallbacks
  if (process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY) {
    const nim = new NvidiaNimProvider();
    if (nim.isAvailable()) return nim;
  }

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
  if (gemini.isAvailable()) return gemini;

  const openai = new OpenAIProvider();
  if (openai.isAvailable()) return openai;

  return new PublikProvider();
}
