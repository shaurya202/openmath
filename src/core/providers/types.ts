import { MathSolution } from '@/types';

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
