import { NextRequest, NextResponse } from 'next/server';
import { createLLMClient, createFallbackClient, getDefaultModel } from '@/lib/llm';

const SYSTEM_PROMPT_EN = `You are an expert in CLAUDE.md, the configuration file for Anthropic's Claude Code.

Generate a COMPLETE and PRODUCTION-READY CLAUDE.md from the provided context.

ABSOLUTE RULES (from Anthropic best practices):
1. UNDER 200 LINES — a concise file. Every line must add value.
2. NO obvious instructions — don't tell Claude what it already knows (e.g. "use descriptive variable names")
3. CONCRETE COMMANDS — include exact build, test, lint, typecheck commands
4. SPECIFIC, NOT VAGUE — "Use 2-space indentation" not "Format code properly"
5. INCLUDE a Verification section — this is the "single highest-leverage thing" per Anthropic
6. Mandatory actions should be HOOKS (.claude/settings.json), not instructions in the CLAUDE.md
7. No file lists, no inline API documentation
8. Recommended sections: Project, Commands, Code style, Workflow, Architecture, Testing, Gotchas, Verification

FORMAT: Raw markdown. Start with "# [Project Name]". No wrapping code blocks (no \`\`\`markdown).

If some info is missing despite the answers, use placeholders [LIKE_THIS] that the user can fill in.`;

const SYSTEM_PROMPT_FR = `Tu es un expert en CLAUDE.md, le fichier de configuration pour Claude Code d'Anthropic.

Génère un CLAUDE.md COMPLET et PRODUCTION-READY à partir du contexte fourni.

RÈGLES ABSOLUES (issues des best practices Anthropic) :
1. SOUS 200 LIGNES — un fichier concis. Chaque ligne doit apporter de la valeur.
2. PAS d'instructions évidentes — ne dis pas à Claude ce qu'il sait déjà (ex: "use descriptive variable names")
3. COMMANDES CONCRÈTES — inclure les commandes build, test, lint, typecheck exactes
4. SPÉCIFIQUE, PAS VAGUE — "Use 2-space indentation" pas "Format code properly"
5. INCLURE une section Verification — c'est le "single highest-leverage thing" selon Anthropic
6. Les actions obligatoires doivent être des HOOKS (.claude/settings.json), pas des instructions dans le CLAUDE.md
7. Pas de listes de fichiers, pas de documentation d'API inline
8. Sections recommandées : Project, Commands, Code style, Workflow, Architecture, Testing, Gotchas, Verification

FORMAT : Markdown brut. Commence par "# [Nom du projet]". Pas de blocs de code englobants (pas de \`\`\`markdown).

Note : garde les noms de sections en anglais (Commands, Code style, etc.) — Claude Code les lit en anglais. Seules les descriptions peuvent être en français.

Si certaines infos manquent malgré les réponses, utilise des placeholders [LIKE_THIS] que l'utilisateur pourra remplir.`;

interface Answer {
  questionId: string;
  answer: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as {
      lazyPrompt?: string;
      answers?: Answer[];
      model?: string;
      language?: string;
      apiKey?: string;
      baseURL?: string;
    };
    const { lazyPrompt, answers = [], model, language = 'en', apiKey, baseURL } = body;

    if (!lazyPrompt) {
      return NextResponse.json({ error: 'lazyPrompt requis' }, { status: 400 });
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

    const userContext = [
      `Project: ${lazyPrompt}`,
      '',
      'Answers to clarification questions:',
      ...answers.map((a) => `- ${a.questionId}: ${a.answer}`),
    ].join('\n');

    const response = await client.chat.completions.create({
      model: model || getDefaultModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content ?? '';
    const tokens = response.usage?.total_tokens ?? 0;
    const usedModel = model || getDefaultModel();

    return NextResponse.json({
      content,
      metadata: { model: usedModel, tokens },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('generate-claude-md error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
