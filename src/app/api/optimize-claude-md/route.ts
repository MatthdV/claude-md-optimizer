import { NextRequest, NextResponse } from 'next/server';
import { createLLMClient, createFallbackClient, getDefaultModel } from '@/lib/llm';

// Increase serverless function timeout (requires Vercel Pro for >10s)
export const maxDuration = 60; // seconds

const SYSTEM_PROMPT_OPTIMIZE_EN = `You are an expert in CLAUDE.md, the configuration file for Anthropic's Claude Code.

You will receive an existing CLAUDE.md file and a list of detected issues.
Your job is to REWRITE the file to fix all issues while following Anthropic's best practices AND maximizing the quality score.

## SCORING CRITERIA YOU MUST OPTIMIZE FOR

The file is scored on 5 dimensions. Your rewrite must maximize ALL of them:

### 1. ACTIONABILITY — runnable commands
You MUST include a "## Commands" section with concrete runnable commands:
- Dev server: \`npm run dev\` or \`pnpm dev\`
- Build: \`npm run build\` or \`pnpm build\`
- Lint: \`npm run lint\` or \`pnpm lint\`
- TypeCheck: \`npx tsc --noEmit\` or \`pnpm tsc --noEmit\`
- Tests: \`npm test\` or \`pnpm test\`
If the original file has these commands, keep them exactly. If not, infer them from the stack.
Also include a "## Verification" or "## Testing" section with verification steps.

### 2. CONCISENESS — no bloat
- REMOVE: file tree / directory listings (Claude can explore the codebase itself)
- REMOVE: inline TypeScript type definitions (Claude can read the source)
- REMOVE: full SQL schemas (Claude can read the migration files)
- REMOVE: detailed roadmaps, phases, pricing tables — not relevant for Claude Code
- REMOVE: long component lists, detailed descriptions of each file
- KEEP UNDER 150 LINES — aim for 60-100 lines
- Every line must give Claude information it cannot get from the codebase itself

### 3. SPECIFICITY — no vague words
Remove ALL vague qualifiers and hedge words. Replace with concrete instructions:
- BANNED words (remove or replace): "as needed", "if appropriate", "when necessary", "etc", "and so on", "various", "properly", "correctly", "good quality", "high quality", "best practices", "maybe", "perhaps", "possibly", "might want to", "could consider", "try to", "basically", "generally", "usually"
- BAD: "Handle errors properly"
- GOOD: "Log errors with console.error, return a 400 status code, show a user-friendly message"

### 4. COMPLETENESS — required sections present
For code projects, include ALL of these sections:
- "## Project" — describe the app purpose, stack
- "## Commands" — dev, build, test, lint commands
- "## Code Style" — naming conventions, indentation, formatting rules
- "## Workflow" — git workflow, PR process, deployment steps
- "## Architecture" — key patterns, folder structure overview (NOT a file tree)
- "## Testing" — testing approach, frameworks used
- "## Gotchas" or "## Constraints" — things to watch out for, rules to follow, things to never do
- "## Error Handling" — how to handle errors, edge cases, fallback behavior
CRITICAL: Do NOT delete sections just to make the file shorter. Each missing required section costs points.

### 5. CONSISTENCY — no contradictions
- Never contradict yourself (e.g., "always X" in one section and "never X" in another)
- Do not duplicate the same instruction in multiple sections
- Keep a consistent tone (imperative, direct)

## REWRITING RULES

1. Section names MUST stay in English: Project, Commands, Code Style, Workflow, Architecture, Testing, Gotchas, Error Handling, Verification, Constraints
2. Content/descriptions can be in the user's language
3. Start with "# [Project Name]"
4. Use ## for all section headings (consistent level)
5. Use bullet points with \`backtick\` code formatting for commands and file paths
6. Be direct and imperative ("Use X", "Never do Y") — not descriptive ("X is used", "Y should be avoided")

FORMAT: Raw markdown only. No wrapping code blocks. No explanations.
Output ONLY the rewritten CLAUDE.md content.`;

const SYSTEM_PROMPT_OPTIMIZE_FR = `Tu es un expert en CLAUDE.md, le fichier de configuration pour Claude Code d'Anthropic.

Tu vas recevoir un fichier CLAUDE.md existant et une liste de problèmes détectés.
Ton travail est de RÉÉCRIRE le fichier pour corriger tous les problèmes en suivant les best practices Anthropic ET en maximisant le score de qualité.

## CRITÈRES DE SCORE À OPTIMISER

Le fichier est noté sur 5 dimensions. Ta réécriture doit maximiser TOUTES :

### 1. ACTIONNABILITÉ — commandes exécutables
Tu DOIS inclure une section "## Commands" avec des commandes concrètes exécutables :
- Serveur dev : \`npm run dev\` ou \`pnpm dev\`
- Build : \`npm run build\` ou \`pnpm build\`
- Lint : \`npm run lint\` ou \`pnpm lint\`
- TypeCheck : \`npx tsc --noEmit\` ou \`pnpm tsc --noEmit\`
- Tests : \`npm test\` ou \`pnpm test\`
Si le fichier original contient ces commandes, garde-les exactement. Sinon, déduis-les de la stack.
Inclus aussi une section "## Verification" ou "## Testing" avec les étapes de vérification.

### 2. CONCISION — pas de ballast
- SUPPRIME : arborescences de fichiers / listings de répertoires (Claude peut explorer le codebase)
- SUPPRIME : définitions de types TypeScript inline (Claude peut lire les sources)
- SUPPRIME : schémas SQL complets (Claude peut lire les fichiers de migration)
- SUPPRIME : roadmaps détaillées, phases, tableaux de prix — non pertinent pour Claude Code
- SUPPRIME : listes de composants longues, descriptions détaillées de chaque fichier
- RESTE SOUS 150 LIGNES — vise 60-100 lignes
- Chaque ligne doit donner à Claude une information qu'il ne peut pas obtenir du codebase lui-même

### 3. SPÉCIFICITÉ — pas de mots vagues
Supprime TOUS les qualificatifs vagues et mots de couverture. Remplace par des instructions concrètes :
- Mots INTERDITS (supprime ou remplace) : "as needed", "if appropriate", "when necessary", "etc", "and so on", "various", "properly", "correctly", "good quality", "high quality", "best practices", "maybe", "perhaps", "possibly", "might want to", "could consider", "try to", "basically", "generally", "usually"
- MAUVAIS : "Handle errors properly"
- BON : "Log errors with console.error, return a 400 status code, show a user-friendly message"

### 4. COMPLÉTUDE — sections requises présentes
Pour les projets code, inclure TOUTES ces sections :
- "## Project" — décris le but de l'app, la stack
- "## Commands" — commandes dev, build, test, lint
- "## Code Style" — conventions de nommage, indentation, règles de formatage
- "## Workflow" — workflow git, processus PR, étapes de déploiement
- "## Architecture" — patterns clés, vue d'ensemble de la structure (PAS un arbre de fichiers)
- "## Testing" — approche de test, frameworks utilisés
- "## Gotchas" ou "## Constraints" — choses à surveiller, règles à suivre, choses à ne jamais faire
- "## Error Handling" — comment gérer les erreurs, cas limites, comportement par défaut
CRITIQUE : Ne supprime PAS des sections juste pour raccourcir le fichier.

### 5. COHÉRENCE — pas de contradictions
- Ne te contredis jamais ("toujours X" dans une section et "jamais X" dans une autre)
- Ne duplique pas la même instruction dans plusieurs sections
- Garde un ton cohérent (impératif, direct)

## RÈGLES DE RÉÉCRITURE

1. Les noms de sections DOIVENT rester en anglais : Project, Commands, Code Style, Workflow, Architecture, Testing, Gotchas, Error Handling, Verification, Constraints
2. Le contenu/descriptions peut être en français
3. Commence par "# [Nom du Projet]"
4. Utilise ## pour tous les titres de sections (niveau cohérent)
5. Utilise des puces avec formatage \`backtick\` pour les commandes et chemins de fichiers
6. Sois direct et impératif ("Utilise X", "Ne fais jamais Y") — pas descriptif

FORMAT : Markdown brut uniquement. Pas de blocs de code englobants. Pas d'explications.
La sortie doit être UNIQUEMENT le contenu du CLAUDE.md réécrit.`;

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
