import OpenAI from 'openai';

export function createLLMClient(apiKey: string, baseURL: string): OpenAI {
  return new OpenAI({ apiKey, baseURL });
}

export function createFallbackClient(): OpenAI | null {
  if (!process.env.LLM_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_API_BASE_URL || 'https://api.openai.com/v1',
  });
}

export function getDefaultModel(): string {
  return process.env.LLM_DEFAULT_MODEL || 'gpt-4o';
}
