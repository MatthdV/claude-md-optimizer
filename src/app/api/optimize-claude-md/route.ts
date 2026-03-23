import { NextRequest, NextResponse } from 'next/server';
import { createLLMClient, createFallbackClient, getDefaultModel } from '@/lib/llm';

const SYSTEM_PROMPT_OPTIMIZE_EN = `You are an expert in CLAUDE.md, the configuration file for Anthropic's Claude Code.

You will receive an existing CLAUDE.md file and a list of detected issues.
Your job is to REWRITE the file to fix all issues while following Anthropic's best practices.

REWRITING RULES:
1. UNDER 200 LINES — this is critical. Most CLAUDE.md files are too long. Be ruthless about cutting.
2. REMOVE all file tree / directory listings — Claude Code can explore the codebase itself
3. REMOVE all inline TypeScript type definitions — Claude Code can read the source types
4. REMOVE all obvious instructions — don't tell Claude what it already knows (e.g. "use descriptive names", "handle errors properly")
5. REMOVE all API documentation — Claude Code can read the actual API files
6. KEEP and SHARPEN: build/test/lint/typecheck commands, non-obvious conventions, gotchas, project-specific workflows
7. KEEP section headers in English: Project, Commands, Code Style, Workflow, Architecture, Testing, Gotchas, Verification
8. ADD a Verification section if missing — this is the "single highest-leverage thing" per Anthropic
9. REPLACE vague instructions with specific ones: "Format code properly" → "Use 2-space indentation, no semicolons"
10. CONVERT mandatory actions to hooks format: mention .claude/settings.json for things that MUST be enforced
11. FILL any [PLACEHOLDER] values if the context allows it, otherwise keep them
12. Descriptions can be in the user's language, but section names stay in English

FORMAT: Raw markdown. Start with "# [Project Name]". No wrapping code blocks.

IMPORTANT: The output must be ONLY the rewritten CLAUDE.md. No explanations, no "here's what I changed", just the file content.`;

const SYSTEM_PROMPT_OPTIMIZE_FR = `Tu es un expert en CLAUDE.md, le fichier de configuration pour Claude Code d'Anthropic.

Tu vas recevoir un fichier CLAUDE.md existant et une liste de problèmes détectés.
Ton travail est de RÉÉCRIRE le fichier pour corriger tous les problèmes en suivant les best practices Anthropic.

RÈGLES DE RÉÉCRITURE :
1. SOUS 200 LIGNES — c'est critique. La plupart des CLAUDE.md sont trop longs. Sois impitoyable dans les coupes.
2. SUPPRIME tous les arbres de fichiers / listings de répertoires — Claude Code peut explorer le codebase lui-même
3. SUPPRIME toutes les définitions de types TypeScript inline — Claude Code peut lire les types sources
4. SUPPRIME toutes les instructions évidentes — ne dis pas à Claude ce qu'il sait déjà
5. SUPPRIME toute la documentation d'API — Claude Code peut lire les fichiers API directement
6. GARDE et AFFÛTE : commandes build/test/lint/typecheck, conventions non évidentes, gotchas, workflows spécifiques au projet
7. GARDE les noms de sections en anglais : Project, Commands, Code Style, Workflow, Architecture, Testing, Gotchas, Verification
8. AJOUTE une section Verification si elle est absente — c'est le "single highest-leverage thing" selon Anthropic
9. REMPLACE les instructions vagues par des spécifiques : "Formate le code proprement" → "Utilise 2 espaces d'indentation, pas de points-virgules"
10. CONVERTIS les actions obligatoires au format hooks : mentionne .claude/settings.json pour ce qui DOIT être appliqué
11. REMPLIS les placeholders [LIKE_THIS] si le contexte le permet, sinon garde-les
12. Les descriptions peuvent être en français, mais les noms de sections restent en anglais

FORMAT : Markdown brut. Commence par "# [Nom du projet]". Pas de blocs de code englobants.

IMPORTANT : La sortie doit être UNIQUEMENT le CLAUDE.md réécrit. Pas d'explications, pas de "voici ce que j'ai changé", juste le contenu du fichier.`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as {
      content?: string;
      recommendations?: string[];
      language?: string;
      apiKey?: string;
      baseURL?: string;
      model?: string;
    };
    const { content, recommendations = [], language = 'en', apiKey, baseURL, model } = body;

    if (!content || content.trim().length < 20) {
      return NextResponse.json(
        { error: language === 'fr' ? 'Contenu trop court' : 'Content too short' },
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

    const systemPrompt = language === 'fr' ? SYSTEM_PROMPT_OPTIMIZE_FR : SYSTEM_PROMPT_OPTIMIZE_EN;

    const userMessage = [
      '## Current CLAUDE.md to optimize:',
      '```markdown',
      content,
      '```',
      '',
      recommendations.length > 0
        ? `## Issues detected:\n${recommendations.map((r) => `- ${r}`).join('\n')}`
        : '',
    ].join('\n');

    const response = await client.chat.completions.create({
      model: model || getDefaultModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    const optimized = response.choices[0]?.message?.content ?? '';

    const cleaned = optimized
      .replace(/^```markdown\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    return NextResponse.json({ content: cleaned });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('optimize-claude-md error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
