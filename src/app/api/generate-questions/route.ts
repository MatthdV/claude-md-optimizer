import { NextRequest, NextResponse } from 'next/server';
import { createLLMClient, createFallbackClient, getDefaultModel } from '@/lib/llm';

const SYSTEM_PROMPT_EN = `You are an expert in CLAUDE.md (the configuration file for Anthropic's Claude Code).

The user wants to generate a CLAUDE.md from a vague project description.
Your role is to ask 3 to 5 TARGETED questions to fill in the missing information.

Rules:
- Do NOT ask questions whose answer is obvious from the prompt (e.g. if the user says "React", don't ask "Which frontend framework?")
- Focus on what Claude Code NEEDS to know: non-obvious commands, unusual code conventions, specific architecture, workflow constraints
- Each question should have 2-4 options + free text possibility
- Questions should relate to Anthropic best practices: build/test/lint commands, non-standard code style, commit conventions, project gotchas
- Keep questions concise and direct
- Return EXACTLY valid JSON, nothing else

Output format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Which package manager do you use?",
      "type": "choice",
      "options": ["npm", "pnpm", "yarn", "bun"]
    },
    {
      "id": "q2",
      "question": "Describe your team's commit conventions",
      "type": "text",
      "placeholder": "e.g. conventional commits, Jira ticket prefix..."
    }
  ]
}`;

const SYSTEM_PROMPT_FR = `Tu es un expert en CLAUDE.md (le fichier de configuration pour Claude Code d'Anthropic).

L'utilisateur veut générer un CLAUDE.md à partir d'une description vague de son projet.
Ton rôle est de poser 3 à 5 questions CIBLÉES pour combler les informations manquantes.

Règles :
- Ne pose PAS de questions dont la réponse est évidente depuis le prompt (ex: si l'utilisateur dit "React", ne demande pas "Quel framework frontend ?")
- Concentre-toi sur ce que Claude Code a BESOIN de savoir : commandes non évidentes, conventions de code inhabituelles, architecture spécifique, contraintes de workflow
- Chaque question doit avoir 2-4 options + possibilité de texte libre
- Les questions doivent être en rapport avec les bonnes pratiques Anthropic : commandes build/test/lint, style de code non-standard, conventions de commit, gotchas du projet
- Formule les questions de façon concise et directe
- Retourne EXACTEMENT du JSON valide, rien d'autre

Format de sortie :
{
  "questions": [
    {
      "id": "q1",
      "question": "Quel gestionnaire de paquets utilises-tu ?",
      "type": "choice",
      "options": ["npm", "pnpm", "yarn", "bun"]
    },
    {
      "id": "q2",
      "question": "Décris les conventions de commit de ton équipe",
      "type": "text",
      "placeholder": "ex: conventional commits, Jira ticket prefix..."
    }
  ]
}`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as {
      lazyPrompt?: string;
      model?: string;
      language?: string;
      apiKey?: string;
      baseURL?: string;
    };
    const { lazyPrompt, model, language = 'en', apiKey, baseURL } = body;

    if (!lazyPrompt || lazyPrompt.trim().length < 5) {
      return NextResponse.json(
        { error: language === 'fr' ? 'Prompt trop court' : 'Prompt too short' },
        { status: 400 }
      );
    }

    let client;
    if (apiKey && baseURL) {
      client = createLLMClient(apiKey, baseURL);
    } else {
      client = createFallbackClient();
    }

    if (!client) {
      return NextResponse.json(
        { error: language === 'fr' ? 'Aucune clé API configurée' : 'No API key configured' },
        { status: 401 }
      );
    }

    const systemPrompt = language === 'fr' ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;

    const response = await client.chat.completions.create({
      model: model || getDefaultModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Project: ${lazyPrompt}` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content ?? '';

    try {
      const parsed = JSON.parse(content) as unknown;
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: 'LLM response parsing failed', raw: content },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('generate-questions error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
