export type ProviderId = 'openai' | 'anthropic' | 'google' | 'groq' | 'custom';

export interface Provider {
  id: ProviderId;
  name: string;
  baseURL: string;
  placeholder: string;
  keyPrefix: string;
  defaultModel: string;
  models: { id: string; name: string }[];
}

export const providers: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    placeholder: 'sk-proj-...',
    keyPrefix: 'sk-',
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
      { id: 'o3-mini', name: 'o3 Mini' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    placeholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
    defaultModel: 'claude-sonnet-4-20250514',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    ],
  },
  {
    id: 'google',
    name: 'Google (Gemini)',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    placeholder: 'AIza...',
    keyPrefix: 'AIza',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    placeholder: 'gsk_...',
    keyPrefix: 'gsk_',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom (LiteLLM, Ollama...)',
    baseURL: '',
    placeholder: 'your-api-key',
    keyPrefix: '',
    defaultModel: '',
    models: [],
  },
];

export function getProvider(id: ProviderId): Provider {
  return providers.find((p) => p.id === id) ?? providers[0];
}
