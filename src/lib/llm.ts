import OpenAI from 'openai';

export function createLLMClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.LLM_API_KEY!,
    baseURL: process.env.LLM_API_BASE_URL || 'https://api.anthropic.com/v1',
  });
}

export function getDefaultModel(): string {
  return process.env.LLM_DEFAULT_MODEL || 'claude-sonnet-4-20250514';
}
