// src/knowledge/antipatterns.ts

export interface AntiPattern {
  id: string;
  pattern: RegExp; // use /.^/ (never-matches sentinel) for programmatically-detected patterns
  message: string;
  severity: "critical" | "warning" | "suggestion";
  fix: string;
  programmatic?: boolean; // true when pattern is /.^/ and detection is done structurally
}

export const ANTI_PATTERNS: AntiPattern[] = [
  // ── Self-evident instructions ──
  {
    id: "self-evident-clean-code",
    pattern: /\b(write clean code|write good code|follow best practices|use proper coding standards)\b/i,
    message: "Self-evident instruction. Claude already does this. Adding it wastes context tokens.",
    severity: "critical",
    fix: "Remove this line entirely, or replace with a specific rule: e.g., 'Use early returns, max 50 lines per function'",
  },
  {
    id: "self-evident-quality",
    pattern: /\b(high quality|good quality|production quality|well-written)\b/i,
    message: "'Quality' without definition is meaningless. Specify what quality means for your project.",
    severity: "warning",
    fix: "Replace with measurable criteria: 'Passes ESLint strict, >80% test coverage, no any types'",
  },

  // ── Vague qualifiers ──
  {
    id: "vague-as-needed",
    pattern: /\b(as needed|if appropriate|when necessary|as applicable|where relevant)\b/i,
    message: "Vague qualifier — Claude will guess what you mean. Specify the condition explicitly.",
    severity: "warning",
    fix: "Replace with: 'When [specific condition], do [specific action]'",
  },
  {
    id: "vague-etc",
    pattern: /\betc\.?\b/i,
    message: "'etc.' forces Claude to guess what else you meant. List items explicitly or remove.",
    severity: "warning",
    fix: "List all items, or write 'including X, Y, and Z'",
  },
  {
    id: "vague-best-practices",
    pattern: /\bbest practices\b/i,
    message: "Which best practices? This means different things in different contexts.",
    severity: "warning",
    fix: "Name the specific practices: 'parameterized queries, input validation, error boundaries'",
  },
  {
    id: "vague-properly",
    pattern: /\b(properly|correctly|appropriately)\b/i,
    message: "Define what 'properly' means for your project.",
    severity: "suggestion",
    fix: "Replace with the expected behavior: 'Return a 400 JSON error body with code and message fields'",
  },

  // ── Hedge words ──
  {
    id: "hedge-try-to",
    pattern: /\b(try to|attempt to|try and)\b/i,
    message: "'Try to' makes the instruction optional. Claude doesn't need permission to try.",
    severity: "suggestion",
    fix: "Replace with a direct instruction: 'Do X' not 'Try to do X'",
  },
  {
    id: "hedge-maybe",
    pattern: /\b(maybe|perhaps|possibly|might want to|could consider|you may want)\b/i,
    message: "Hedge words make instructions feel optional. Be direct.",
    severity: "suggestion",
    fix: "State the condition: 'If X, then do Y' — or remove if truly optional",
  },

  // ── Over-specification ──
  {
    id: "api-docs-inline",
    pattern: /\b(endpoint|api|route).*\b(GET|POST|PUT|DELETE|PATCH)\s+\//i,
    message: "API documentation in CLAUDE.md — this should be linked, not inlined.",
    severity: "warning",
    fix: "Replace with: 'API documentation: @docs/api.md' or a link to your docs",
  },
  {
    id: "file-by-file",
    pattern: /\b(src\/\w+\/\w+\.\w+)\s*[-—:]\s*.{20,}/,
    message: "File-by-file descriptions don't belong in CLAUDE.md. Claude can read the files.",
    severity: "warning",
    fix: "Remove file descriptions. Claude reads code directly — describe patterns and conventions instead.",
  },

  // ── Contradictions ──
  {
    id: "contradiction-always-never",
    pattern: /always\s+(\w+(?:\s+\w+){0,3})/gi,
    message: "Check for contradicting 'never' rules — 'always X' + 'never X' confuses Claude.",
    severity: "critical",
    fix: "Review all 'always' and 'never' rules for conflicts. Keep one, or add conditions.",
  },

  // ── Too long ──
  {
    id: "over-200-lines",
    pattern: /.^/, // detected programmatically: line count > 200
    programmatic: true,
    message: "CLAUDE.md exceeds 200 lines. Anthropic recommends under 200. Longer files reduce adherence.",
    severity: "critical",
    fix: "Move detailed content to .claude/rules/ files or use @imports for secondary docs",
  },

  // ── NEW: Modern Claude Code anti-patterns ──
  {
    id: "mandatory-action-not-hook",
    pattern: /\b(always run|after every|before each|run .+ after every|must run)\b/i,
    message: "This mandatory action belongs in a hook, not an advisory instruction. Claude may ignore CLAUDE.md — hooks never do.",
    severity: "critical",
    fix: "Configure a hook in .claude/settings.json. Ask Claude: 'Write a hook that runs [action] after every file edit.'",
  },
  {
    id: "skill-content-in-claude-md",
    pattern: /.^/, // detected programmatically: section > 15 lines on a single domain topic
    programmatic: true,
    message: "This domain-specific block belongs in a skill, not CLAUDE.md. It loads context every session even when irrelevant.",
    severity: "warning",
    fix: "Create .claude/skills/<topic>/SKILL.md with this content. Reference it as 'Use the api-conventions skill for API patterns.'",
  },
  {
    id: "missing-at-imports",
    pattern: /.^/, // detected programmatically: no @ imports AND file > 50 lines AND README/package.json exists
    programmatic: true,
    message: "Missing @ imports. Claude can read README and package.json directly — reference them instead of duplicating content.",
    severity: "warning",
    fix: "Add to top of CLAUDE.md: 'See @README.md and @package.json for project overview and commands.'",
  },
  {
    id: "path-agnostic-rule",
    pattern: /\bfor \.(ts|js|py|tsx)\s+files\b|\bin the .* (directory|folder)\b/i,
    message: "This rule is scoped to specific files/directories. Put it in .claude/rules/ with paths: frontmatter so it only loads when relevant.",
    severity: "warning",
    fix: "Create .claude/rules/<topic>.md with ---\\npaths:\\n  - \"src/api/**/*.ts\"\\n--- frontmatter.",
  },
  {
    id: "no-verification-criteria",
    pattern: /.^/, // detected programmatically: no backtick commands matching test/lint patterns
    programmatic: true,
    message: "No verification criteria found. Claude can't check its own work without runnable commands.",
    severity: "critical",
    fix: "Add: '- Test: `pnpm test [filename]`\\n- Lint: `pnpm lint`\\n- Type check: `pnpm tsc --noEmit`'",
  },
  {
    id: "contradictory-emphasis",
    pattern: /.^/, // detected programmatically: count of IMPORTANT|YOU MUST occurrences > 2
    programmatic: true,
    message: "Too many emphasized rules dilutes the effect. Claude treats everything as equally critical.",
    severity: "suggestion",
    fix: "Keep ≤ 2 rules with strong emphasis. Reserve for genuinely critical constraints only.",
  },
  {
    id: "dense-paragraph",
    pattern: /.^/, // detected programmatically: paragraph > 5 lines without headers or bullets
    programmatic: true,
    message: "Dense paragraphs are harder for Claude to scan. Claude reads structure the same way humans do.",
    severity: "warning",
    fix: "Break into bullets under a clear markdown header.",
  },
  {
    id: "subagent-worthy-instruction",
    pattern: /\b(explore the codebase|read all files|investigate|scan all|review everything in)\b/i,
    message: "This investigation should be delegated to a subagent. Doing it inline fills your main context with file reads.",
    severity: "suggestion",
    fix: "Remove from CLAUDE.md and use: 'Use a subagent to [investigate X]' in your prompts, or create .claude/agents/<name>.md.",
  },
];
