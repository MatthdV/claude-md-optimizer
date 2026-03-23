import { NextRequest, NextResponse } from 'next/server';
import { createLLMClient, createFallbackClient, getDefaultModel } from '@/lib/llm';

const SYSTEM_PROMPT_OPTIMIZE_EN = `You are an expert in CLAUDE.md, the configuration file for Anthropic's Claude Code.

You will receive an existing CLAUDE.md file and a list of detected issues.
Your job is to REWRITE the file to fix all issues while following Anthropic's best practices AND maximizing the quality score.

## SCORING CRITERIA YOU MUST OPTIMIZE FOR

The file is scored on 6 dimensions. Your rewrite must maximize each:

### 1. COMPLETENESS (25% of score) — MOST IMPORTANT
The engine detects sections by their heading title + content keywords.
For code projects, you MUST include sections with these exact keywords:

- A "Role" section — include words like "you are", "expert", "engineer", "assistant"
- A "Context" / "Project" section — include words like "project", "architecture", "tech stack", "repository"
- A "Constraints" section — include words like "do not", "never", "avoid", "must not"
- A "Code Style" / "Conventions" section — include words like "naming convention", "indentation", "semicolon", "camelCase", "ESLint", "Prettier"
- An "Output Format" section — include words like "format", "output", "markdown", "code block"
- An "Error Handling" section — include words like "error handling", "edge case", "fallback", "when unsure", "default behavior"
- An "Examples" section if possible — include words like "example", "e.g.", "for instance" (+10 bonus points)

CRITICAL: Do NOT delete sections just to make the file shorter. Each missing required section costs 13+ points.

### 2. CLARITY (25% of score) — EQUALLY IMPORTANT
Remove ALL vague qualifiers and hedge words. These are penalized 3 points each:
- BANNED: "as needed", "if appropriate", "when necessary", "etc", "various", "properly", "correctly", "good quality", "high quality", "best practices"
- BANNED: "maybe", "perhaps", "possibly", "might want to", "could consider", "try to"
- Replace with SPECIFIC instructions: instead of "handle errors properly" → "log the error with console.error, return a 400 status, show a user-friendly message"

### 3. TECHNICAL ACCURACY (20% of score)
- Never mention TSLint (deprecated — use ESLint)
- Never mention Create React App (deprecated — use Vite or Next.js)
- Never mention Moment.js (use date-fns or dayjs instead)
- If multiple naming conventions (camelCase, snake_case, PascalCase) — clarify WHICH applies WHERE (e.g., "camelCase for variables, PascalCase for classes")

### 4. CONSTRAINTS (5% of score)
The constraints section must exist and be specific:
- BAD: "don't do anything bad"
- GOOD: "Never expose API keys in responses. Never modify files outside the src/ directory."

## REWRITING RULES

1. KEEP UNDER 200 LINES — be ruthless about cutting fluff, but never cut required sections
2. REMOVE: file tree / directory listings (Claude can explore the codebase itself)
3. REMOVE: inline TypeScript type definitions (Claude can read the source)
4. REMOVE: all vague/hedge words listed in CLARITY section above
5. KEEP and SHARPEN: build/test/lint commands, non-obvious conventions, project-specific workflows
6. SECTION NAMES: keep in English — Project, Commands, Code Style, Workflow, Architecture, Testing, Gotchas, Error Handling, Examples, Constraints
7. REPLACE vague instructions with specific ones throughout
8. Descriptions can be in the user's language, but section names stay in English

FORMAT: Raw markdown. Start with "# [Project Name]". No wrapping code blocks.

IMPORTANT: Output ONLY the rewritten CLAUDE.md. No explanations, no "here's what I changed", just the file content.`;

const SYSTEM_PROMPT_OPTIMIZE_FR = `Tu es un expert en CLAUDE.md, le fichier de configuration pour Claude Code d'Anthropic.

Tu vas recevoir un fichier CLAUDE.md existant et une liste de problèmes détectés.
Ton travail est de RÉÉCRIRE le fichier pour corriger tous les problèmes en suivant les best practices Anthropic ET en maximisant le score de qualité.

## CRITÈRES DE SCORE À OPTIMISER

Le fichier est noté sur 6 dimensions. Ta réécriture doit maximiser chacune :

### 1. COMPLÉTUDE (25% du score) — LE PLUS IMPORTANT
Le moteur détecte les sections par leur titre + mots-clés dans le contenu.
Pour un projet code, tu DOIS inclure des sections avec ces mots-clés exacts :

- Une section "Role" — inclure des mots comme "you are", "expert", "engineer", "assistant"
- Une section "Context" / "Project" — inclure des mots comme "project", "architecture", "tech stack", "repository"
- Une section "Constraints" — inclure des mots comme "do not", "never", "avoid", "must not"
- Une section "Code Style" / "Conventions" — inclure des mots comme "naming convention", "indentation", "semicolon", "camelCase", "ESLint", "Prettier"
- Une section "Output Format" — inclure des mots comme "format", "output", "markdown", "code block"
- Une section "Error Handling" — inclure des mots comme "error handling", "edge case", "fallback", "when unsure", "default behavior"
- Une section "Examples" si possible — inclure des mots comme "example", "e.g.", "for instance" (+10 points bonus)

CRITIQUE : Ne supprime PAS des sections juste pour raccourcir le fichier. Chaque section requise manquante coûte 13+ points.

### 2. CLARTÉ (25% du score) — AUSSI IMPORTANT
Supprime TOUS les qualificatifs vagues et mots de couverture. Ces mots sont pénalisés 3 points chacun :
- INTERDITS : "as needed", "if appropriate", "when necessary", "etc", "various", "properly", "correctly", "good quality", "high quality", "best practices"
- INTERDITS : "maybe", "perhaps", "possibly", "might want to", "could consider", "try to"
- Remplace par des instructions SPÉCIFIQUES : au lieu de "handle errors properly" → "log the error with console.error, return a 400 status, show a user-friendly message"

### 3. PRÉCISION TECHNIQUE (20% du score)
- Ne jamais mentionner TSLint (déprécié — utilise ESLint)
- Ne jamais mentionner Create React App (déprécié — utilise Vite ou Next.js)
- Ne jamais mentionner Moment.js (utilise date-fns ou dayjs)
- Si plusieurs conventions de nommage (camelCase, snake_case, PascalCase) — précise LAQUELLE s'applique OÙ

### 4. CONTRAINTES (5% du score)
La section constraints doit exister et être spécifique :
- MAUVAIS : "don't do anything bad"
- BON : "Never expose API keys in responses. Never modify files outside the src/ directory."

## RÈGLES DE RÉÉCRITURE

1. SOUS 200 LIGNES — coupe le superflu, mais ne coupe jamais les sections requises
2. SUPPRIME : arbres de fichiers / listings (Claude peut explorer le codebase lui-même)
3. SUPPRIME : définitions de types TypeScript inline (Claude peut lire les sources)
4. SUPPRIME : tous les mots vagues/de couverture listés dans la section CLARTÉ ci-dessus
5. GARDE et AFFÛTE : commandes build/test/lint, conventions non-évidentes, workflows spécifiques au projet
6. NOMS DE SECTIONS : garde en anglais — Project, Commands, Code Style, Workflow, Architecture, Testing, Gotchas, Error Handling, Examples, Constraints
7. REMPLACE les instructions vagues par des spécifiques partout
8. Les descriptions peuvent être en français, mais les noms de sections restent en anglais

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
