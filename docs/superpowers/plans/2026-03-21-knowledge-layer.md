# Knowledge Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the four `src/knowledge/` TypeScript data files that power the generator and optimizer engines, enriched with modern Claude Code features (skills, hooks, rules files, subagents, `@` imports).

**Architecture:** Pure TypeScript data modules — no logic, no imports from other `src/` files. Each file exports typed constants (`BEST_PRACTICES`, `ANTI_PATTERNS`, `SECTION_TEMPLATES`, `THINKING_LEVELS`) consumed by the engines. The engines continue to work with their inline data until a future migration task; these files are additive.

**Tech Stack:** TypeScript strict mode, ES modules. No test runner available until `pnpm create next-app` is run — verification is via TypeScript type assertions (`satisfies`) and inline `console.assert` checks runnable with `npx tsx`.

---

## Prerequisites

> The project has no `package.json` yet. All files are plain TypeScript. Verification uses `npx tsx` (zero-install TypeScript runner) for inline assertions.
> Check: `npx tsx --version` — if missing, install with `npm install -g tsx`.

---

## File Map

| File | Action | Lines (est.) |
|------|--------|-------------|
| `src/knowledge/thinking-levels.ts` | Create | ~40 |
| `src/knowledge/best-practices.ts` | Create | ~130 |
| `src/knowledge/antipatterns.ts` | Create | ~120 |
| `src/knowledge/section-templates.ts` | Create | ~520 |
| `src/knowledge/index.ts` | Create | ~10 |

All files are independent — no cross-imports between knowledge files.

---

## Task 1: `thinking-levels.ts`

**Files:**
- Create: `src/knowledge/thinking-levels.ts`

This is the smallest file. Fully spec'd in the original CLAUDE.md. Good warm-up.

- [ ] **Step 1: Create the file**

```typescript
// src/knowledge/thinking-levels.ts

export interface ThinkingLevel {
  name: string;
  triggers: string[];
  budget: string;
  useFor: string;
}

export interface ThinkingLevelsConfig {
  description: string;
  levels: ThinkingLevel[];
  note: string;
}

export const THINKING_LEVELS: ThinkingLevelsConfig = {
  description: "Claude Code maps specific phrases to thinking budget levels",
  levels: [
    {
      name: "think",
      triggers: ["think"],
      budget: "~10K tokens",
      useFor: "Routine tasks, simple bug fixes, small feature additions",
    },
    {
      name: "think hard / megathink",
      triggers: ["think about it", "think a lot", "think deeply", "think hard", "think more"],
      budget: "~20K tokens",
      useFor: "API design, moderate architecture decisions, multi-file changes",
    },
    {
      name: "ultrathink",
      triggers: [
        "think harder",
        "think intensely",
        "think longer",
        "think really hard",
        "think super hard",
        "think very hard",
        "ultrathink",
      ],
      budget: "~32K tokens (maximum)",
      useFor: "Complex architecture, critical migrations, deep debugging, system design",
    },
  ],
  note: "These triggers only work in Claude Code CLI — not in claude.ai web or the API.",
};

export const THINKING_TEMPLATE = `## Thinking guidance
- For routine changes: use default thinking
- For architecture and API design: use "think hard"
- For complex refactors and critical decisions: use "ultrathink"`;
```

- [ ] **Step 2: Verify structure**

```typescript
// Add at the bottom of thinking-levels.ts temporarily to verify, then remove before commit
console.assert(THINKING_LEVELS.levels.length === 3, "Expected 3 thinking levels");
console.assert(THINKING_LEVELS.levels[2].triggers.includes("ultrathink"), "ultrathink trigger missing");
console.assert(typeof THINKING_TEMPLATE === "string", "Template must be a string");
console.log("thinking-levels.ts ✓");
```

Run: `npx tsx src/knowledge/thinking-levels.ts`
Expected: `thinking-levels.ts ✓`

- [ ] **Step 3: Remove the console assertions, commit**

```bash
git init  # if not already a git repo
git add src/knowledge/thinking-levels.ts
git commit -m "feat(knowledge): add thinking-levels data module"
```

---

## Task 2: `best-practices.ts`

**Files:**
- Create: `src/knowledge/best-practices.ts`

Contains all existing rules from the CLAUDE.md spec + 6 new rules in existing categories + 4 new `"features"` category rules.

- [ ] **Step 1: Create the interface and existing rules (from spec)**

```typescript
// src/knowledge/best-practices.ts

export interface BestPractice {
  id: string;
  rule: string;
  source: string;
  category: "include" | "exclude" | "structure" | "style" | "features";
  severity: "critical" | "warning" | "suggestion";
}

export const BEST_PRACTICES: BestPractice[] = [
  // ── WHAT TO INCLUDE ──
  {
    id: "include-bash-commands",
    rule: "Include bash commands Claude can't guess (build, test, lint, deploy commands)",
    source: "anthropic-docs",
    category: "include",
    severity: "critical",
  },
  {
    id: "include-code-style-diffs",
    rule: "Include code style rules that differ from defaults (not standard language conventions Claude already knows)",
    source: "anthropic-docs",
    category: "include",
    severity: "critical",
  },
  {
    id: "include-test-instructions",
    rule: "Include testing instructions and preferred test runners",
    source: "anthropic-docs",
    category: "include",
    severity: "critical",
  },
  {
    id: "include-repo-etiquette",
    rule: "Include repository etiquette: branch naming, PR conventions, commit message format",
    source: "anthropic-docs",
    category: "include",
    severity: "warning",
  },
  {
    id: "include-arch-decisions",
    rule: "Include architectural decisions specific to the project",
    source: "anthropic-docs",
    category: "include",
    severity: "warning",
  },
  {
    id: "include-env-quirks",
    rule: "Include developer environment quirks: required env vars, setup steps",
    source: "anthropic-docs",
    category: "include",
    severity: "warning",
  },
  {
    id: "include-gotchas",
    rule: "Include common gotchas or non-obvious behaviors",
    source: "anthropic-docs",
    category: "include",
    severity: "warning",
  },
  {
    id: "include-verification",
    rule: "Include verification criteria so Claude can check its own work (tests, linters, expected outputs)",
    source: "anthropic-docs",
    category: "include",
    severity: "critical",
  },
  // ── NEW include rules ──
  {
    id: "include-at-imports",
    rule: "Use @README.md, @package.json imports to give Claude project context from files it can read directly — don't inline their content",
    source: "anthropic-docs",
    category: "include",
    severity: "warning",
  },
  {
    id: "include-verification-criteria",
    rule: "Include runnable verification criteria (test commands, lint commands, expected outputs) so Claude can check its own work. Per Anthropic: 'This is the single highest-leverage thing you can do.'",
    source: "anthropic-docs",
    category: "include",
    severity: "critical",
  },

  // ── WHAT TO EXCLUDE ──
  {
    id: "exclude-inferable",
    rule: "Do NOT include anything Claude can figure out by reading the code",
    source: "anthropic-docs",
    category: "exclude",
    severity: "warning",
  },
  {
    id: "exclude-standard-conventions",
    rule: "Do NOT include standard language conventions Claude already knows",
    source: "anthropic-docs",
    category: "exclude",
    severity: "warning",
  },
  {
    id: "exclude-api-docs",
    rule: "Do NOT include detailed API documentation — link to docs instead",
    source: "anthropic-docs",
    category: "exclude",
    severity: "warning",
  },
  {
    id: "exclude-frequent-changes",
    rule: "Do NOT include information that changes frequently",
    source: "anthropic-docs",
    category: "exclude",
    severity: "suggestion",
  },
  {
    id: "exclude-tutorials",
    rule: "Do NOT include long explanations or tutorials",
    source: "anthropic-docs",
    category: "exclude",
    severity: "warning",
  },
  {
    id: "exclude-file-descriptions",
    rule: "Do NOT include file-by-file descriptions of the codebase",
    source: "anthropic-docs",
    category: "exclude",
    severity: "warning",
  },
  {
    id: "exclude-self-evident",
    rule: "Do NOT include self-evident practices like 'write clean code'",
    source: "anthropic-docs",
    category: "exclude",
    severity: "critical",
  },
  // ── NEW exclude rule ──
  {
    id: "exclude-path-specific-in-main",
    rule: "Do NOT put path-specific instructions (e.g., 'for .ts files', 'in the API directory') in the main CLAUDE.md — use .claude/rules/ with paths: frontmatter instead",
    source: "anthropic-docs",
    category: "exclude",
    severity: "warning",
  },

  // ── STRUCTURE ──
  {
    id: "target-under-200-lines",
    rule: "Target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence",
    source: "anthropic-docs",
    category: "structure",
    severity: "critical",
  },
  {
    id: "use-markdown-structure",
    rule: "Use markdown headers and bullets to group related instructions",
    source: "anthropic-docs",
    category: "structure",
    severity: "warning",
  },
  {
    id: "keep-concise",
    rule: "For each line, ask: 'Would removing this cause Claude to make mistakes?' If not, cut it",
    source: "anthropic-docs",
    category: "structure",
    severity: "critical",
  },
  // ── NEW structure rule ──
  {
    id: "use-imports-to-split",
    rule: "When CLAUDE.md grows large, split with @path/to/import rather than inlining all content. Imported files load at launch alongside the main file.",
    source: "anthropic-docs",
    category: "structure",
    severity: "warning",
  },

  // ── STYLE ──
  {
    id: "be-specific-not-vague",
    rule: "Write instructions that are concrete enough to verify: 'Use 2-space indentation' not 'Format code properly'",
    source: "anthropic-docs",
    category: "style",
    severity: "critical",
  },
  {
    id: "use-emphasis-for-critical",
    rule: "Use emphasis (IMPORTANT, YOU MUST) for critical rules to improve adherence",
    source: "anthropic-docs",
    category: "style",
    severity: "suggestion",
  },
  {
    id: "no-contradictions",
    rule: "Never let two rules contradict each other — Claude may pick one arbitrarily",
    source: "anthropic-docs",
    category: "style",
    severity: "critical",
  },
  // ── NEW style rules ──
  {
    id: "treat-like-code",
    rule: "Treat CLAUDE.md like code — review when things go wrong, prune regularly, test that behavior actually changes when you add or remove a rule",
    source: "anthropic-docs",
    category: "style",
    severity: "warning",
  },
  {
    id: "limit-emphasis",
    rule: "Reserve IMPORTANT and YOU MUST for ≤ 2 truly critical rules. Over-emphasis dilutes adherence.",
    source: "anthropic-docs",
    category: "style",
    severity: "suggestion",
  },

  // ── FEATURES (new category) ──
  {
    id: "use-hooks-for-mandatory",
    rule: "If an action MUST happen every time with zero exceptions, use a hook (.claude/settings.json), not a CLAUDE.md instruction. Hooks are deterministic; CLAUDE.md is advisory.",
    source: "anthropic-docs",
    category: "features",
    severity: "critical",
  },
  {
    id: "use-skills-for-domain",
    rule: "Domain-specific knowledge or repeatable workflows belong in a skill (.claude/skills/<topic>/SKILL.md), not CLAUDE.md. Skills load on demand without consuming context every session.",
    source: "anthropic-docs",
    category: "features",
    severity: "warning",
  },
  {
    id: "use-rules-for-path-scoped",
    rule: "Instructions that only apply to specific file types or directories belong in .claude/rules/ with paths: frontmatter, not in the main CLAUDE.md. They load only when matching files are opened.",
    source: "anthropic-docs",
    category: "features",
    severity: "warning",
  },
  {
    id: "use-subagents-for-isolation",
    rule: "Tasks that read many files or need focused, isolated context should be delegated to a subagent (.claude/agents/), not described as instructions in CLAUDE.md.",
    source: "anthropic-docs",
    category: "features",
    severity: "suggestion",
  },
];
```

- [ ] **Step 2: Verify — no duplicate IDs, correct counts**

Add temporarily at the bottom of the file, run, then remove:

```typescript
const ids = BEST_PRACTICES.map(p => p.id);
const uniqueIds = new Set(ids);
console.assert(uniqueIds.size === ids.length, `Duplicate IDs found: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);

const featureRules = BEST_PRACTICES.filter(p => p.category === "features");
console.assert(featureRules.length === 4, `Expected 4 features rules, got ${featureRules.length}`);

const criticals = BEST_PRACTICES.filter(p => p.severity === "critical");
console.assert(criticals.length >= 8, `Expected ≥8 critical rules, got ${criticals.length}`);

console.log(`best-practices.ts ✓ (${BEST_PRACTICES.length} rules, ${featureRules.length} features)`);
```

Run: `npx tsx src/knowledge/best-practices.ts`
Expected: `best-practices.ts ✓ (31 rules, 4 features)`

- [ ] **Step 3: Remove assertions, commit**

```bash
git add src/knowledge/best-practices.ts
git commit -m "feat(knowledge): add best-practices data with features category"
```

---

## Task 3: `antipatterns.ts`

**Files:**
- Create: `src/knowledge/antipatterns.ts`

Contains all existing anti-patterns from the CLAUDE.md spec + 8 new ones. Programmatic patterns use `/.^/` sentinel (never-matches regex).

- [ ] **Step 1: Create the file**

```typescript
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
```

- [ ] **Step 2: Verify — no duplicate IDs, sentinel patterns correctly used**

Add temporarily, run, then remove:

```typescript
const ids = ANTI_PATTERNS.map(p => p.id);
const uniqueIds = new Set(ids);
console.assert(uniqueIds.size === ids.length, `Duplicate IDs: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);

const sentinels = ANTI_PATTERNS.filter(p => p.programmatic === true);
console.assert(sentinels.length === 6, `Expected 6 programmatic patterns, got ${sentinels.length}`);
// Verify all programmatic patterns use the sentinel
sentinels.forEach(p => {
  console.assert(p.pattern.source === ".^", `Pattern ${p.id} should use /.^/ sentinel, got /${p.pattern.source}/`);
});

const criticals = ANTI_PATTERNS.filter(p => p.severity === "critical");
console.assert(criticals.length >= 4, `Expected ≥4 critical patterns, got ${criticals.length}`);

console.log(`antipatterns.ts ✓ (${ANTI_PATTERNS.length} patterns, ${sentinels.length} programmatic)`);
```

Run: `npx tsx src/knowledge/antipatterns.ts`
Expected: `antipatterns.ts ✓ (20 patterns, 6 programmatic)`

- [ ] **Step 3: Remove assertions, commit**

```bash
git add src/knowledge/antipatterns.ts
git commit -m "feat(knowledge): add antipatterns data with modern Claude Code patterns"
```

---

## Task 4: `section-templates.ts`

**Files:**
- Create: `src/knowledge/section-templates.ts`

The largest file. Contains all 10 project type templates. The `react-nextjs` template comes from the original CLAUDE.md spec; the other 9 come from the design spec.

- [ ] **Step 1: Create the interfaces and universal `modern_claude_code` section constant**

```typescript
// src/knowledge/section-templates.ts

export type ProjectType =
  | "react-nextjs"
  | "python-backend"
  | "fullstack"
  | "data-analysis"
  | "content-creation"
  | "design-system"
  | "devops-infra"
  | "mobile"
  | "api-backend"
  | "generic";

export interface SectionTemplate {
  heading: string;
  content: string;      // markdown string with [PLACEHOLDER] markers
  required: boolean;
  priority: number;     // 1 = most important
}

const MODERN_CLAUDE_CODE_SECTION: SectionTemplate = {
  heading: "## Modern Claude Code",
  content: `<!-- Hooks — mandatory actions (configure in .claude/settings.json): -->
<!-- - [MANDATORY_ACTION e.g., run lint after every file edit] -->

<!-- Skills — domain knowledge (.claude/skills/<topic>/SKILL.md): -->
<!-- - [DOMAIN_TOPIC e.g., api-conventions, db-schema] -->

<!-- Path-scoped rules (.claude/rules/<topic>.md with paths: frontmatter): -->
<!-- - [FILE_TYPE_RULE e.g., src/api/**/*.ts -> api validation rules] -->`,
  required: false,
  priority: 6,
};
```

- [ ] **Step 2: Add the `react-nextjs` template (from original CLAUDE.md spec)**

```typescript
export const REACT_NEXTJS_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# Project",
    content: "[PROJECT_NAME] — [ONE_LINE_DESCRIPTION]\n\nSee @README.md and @package.json for project overview.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Dev: \`pnpm dev\`
- Build: \`pnpm build\`
- Test: \`pnpm test\`
- Lint: \`pnpm lint\`
- Type check: \`pnpm tsc --noEmit\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- Use ES modules (import/export), not CommonJS (require)
- Destructure imports when possible
- Functional components with hooks only — no class components
- [NAMING_CONVENTION: e.g., camelCase for vars, PascalCase for components]
- [FORMATTING: e.g., Prettier defaults, 2-space indent]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Workflow",
    content: `- Be sure to typecheck when done making a series of code changes
- Prefer running single tests, not the whole suite, for performance
- Commit with descriptive messages following [COMMIT_CONVENTION: e.g., conventional commits]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- [ROUTER: e.g., App Router with /app directory]
- [STATE_MANAGEMENT: e.g., Zustand for client state, React Query for server state]
- [DATABASE: e.g., PostgreSQL via Prisma]
- [AUTH: e.g., NextAuth.js with Google OAuth]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Testing",
    content: `- Framework: [TEST_FRAMEWORK: e.g., Vitest + React Testing Library]
- Test behavior, not implementation details
- Every new component needs: renders without crashing, handles empty/loading/error states
- Run: \`pnpm test [filename]\` for single files`,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: `- [NON_OBVIOUS_BEHAVIOR_1]
- [NON_OBVIOUS_BEHAVIOR_2]`,
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];
```

- [ ] **Step 3: Add `python-backend` template (fully-rendered in design spec)**

```typescript
export const PYTHON_BACKEND_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @pyproject.toml for project overview and dependencies.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Install: \`poetry install\`
- Dev server: \`[DEV_COMMAND e.g., uvicorn app.main:app --reload]\`
- Test: \`pytest [filename]\` (single file preferred over full suite)
- Test all: \`pytest\`
- Type check: \`mypy .\`
- Lint/format: \`ruff check . && ruff format .\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- All functions and methods must have type annotations
- snake_case for variables, functions, modules; PascalCase for classes
- Black-compatible formatting (ruff format enforces this)
- No \`Any\` types unless documented with a comment explaining why
- [ADDITIONAL_STYLE_RULE]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- Framework: [FRAMEWORK e.g., FastAPI, Django, Flask]
- ORM: [ORM e.g., SQLAlchemy, Django ORM, Tortoise]
- Database: [DB e.g., PostgreSQL, SQLite]
- Cache: [CACHE e.g., Redis, none]
- [ADDITIONAL_ARCH_DECISION]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Workflow",
    content: `- Run \`mypy .\` and \`pytest\` before committing
- Prefer single test files: \`pytest tests/test_auth.py\`
- Commit format: [COMMIT_CONVENTION e.g., conventional commits]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Testing",
    content: `- Framework: pytest with [FIXTURES e.g., pytest-asyncio, factory_boy]
- Test behavior via public API, not implementation details
- Every endpoint needs: happy path, validation error, auth error tests
- Run: \`pytest tests/[filename]\``,
    required: false,
    priority: 4,
  },
  {
    heading: "## Constraints",
    content: `- Do not expose secrets in logs or error responses
- [CONSTRAINT_1 e.g., all DB queries must be parameterized]
- [CONSTRAINT_2]`,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: `- [NON_OBVIOUS_BEHAVIOR_1]
- [NON_OBVIOUS_BEHAVIOR_2]`,
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];
```

- [ ] **Step 4: Add remaining 7 templates**

```typescript
export const API_BACKEND_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @package.json for project overview.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Dev: \`[DEV_COMMAND]\`
- Test: \`[TEST_COMMAND e.g., pnpm test]\` (single file preferred)
- Lint: \`[LINT_COMMAND]\`
- Migrate: \`[MIGRATE_COMMAND e.g., pnpm db:migrate]\`
- Type check: \`[TYPECHECK_COMMAND]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- [NAMING_CONVENTION e.g., camelCase for variables, PascalCase for types]
- Error response format: [ERROR_RESPONSE_FORMAT e.g., { error: { code, message } }]
- [ADDITIONAL_STYLE_RULE]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- Framework: [FRAMEWORK e.g., Express, Fastify, Hono]
- Auth: [AUTH e.g., JWT with refresh tokens]
- Database: [DB e.g., PostgreSQL via Drizzle]
- Cache: [CACHE e.g., Redis]
- Rate limiting: [RATE_LIMITING e.g., per-IP, 100 req/min]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## API conventions",
    content: `- Versioning: [VERSIONING_STRATEGY e.g., /v1/ prefix in URL]
- Pagination: [PAGINATION_FORMAT e.g., cursor-based, { data, nextCursor }]
- Error schema: [ERROR_SCHEMA e.g., { error: { code: string, message: string } }]
- [ADDITIONAL_API_CONVENTION]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Testing",
    content: `- Framework: [TEST_FRAMEWORK e.g., Vitest, Jest]
- Every endpoint: happy path, validation error, auth error, not found
- Run: \`[TEST_COMMAND] [filename]\``,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const FULLSTACK_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @package.json for project overview.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands — Frontend",
    content: `- Dev: \`[FE_DEV e.g., pnpm dev]\`
- Build: \`[FE_BUILD e.g., pnpm build]\`
- Test: \`[FE_TEST e.g., pnpm test]\`
- Lint: \`[FE_LINT e.g., pnpm lint]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands — Backend",
    content: `- Dev: \`[BE_DEV]\`
- Test: \`[BE_TEST]\`
- Lint: \`[BE_LINT]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style — Frontend",
    content: `- Framework: [FE_FRAMEWORK e.g., React, Vue, Svelte]
- Styling: [STYLING_APPROACH e.g., Tailwind CSS, CSS Modules]
- [FE_NAMING_CONVENTION]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Code style — Backend",
    content: `- Language: [BE_LANGUAGE e.g., TypeScript, Python]
- [BE_NAMING_CONVENTION e.g., snake_case for Python, camelCase for TS]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- Frontend: [FE_FRAMEWORK] with [STATE_MANAGEMENT]
- Backend: [BE_FRAMEWORK e.g., Express, FastAPI]
- Database: [DB]
- API type: [API_TYPE e.g., REST, GraphQL, tRPC]
- Auth: [AUTH]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## API boundary",
    content: `- Contract: [API_CONTRACT e.g., OpenAPI spec at docs/api.yaml]
- Never access the database from the frontend directly`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Workflow",
    content: `- Typecheck both sides: \`[FE_TYPECHECK]\` and \`[BE_TYPECHECK]\`
- Commit format: [COMMIT_CONVENTION]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const DATA_ANALYSIS_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @docs/schema.md for project overview and data schemas.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Notebook: \`[NOTEBOOK_COMMAND e.g., jupyter lab]\`
- Tests: \`[TEST_COMMAND e.g., pytest]\`
- Format: \`[FORMAT_COMMAND e.g., ruff format .]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Data sources",
    content: `- Warehouse: [WAREHOUSE e.g., Snowflake, BigQuery, Redshift]
- Key tables: [KEY_TABLES e.g., events, users, sessions]
- Schema location: [SCHEMA_LOCATION e.g., @docs/schema.md]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## SQL conventions",
    content: `- Dialect: [SQL_DIALECT e.g., BigQuery SQL, Snowflake SQL]
- Always use CTEs over nested subqueries
- Use parameterized queries — never string interpolation
- [JOIN_STYLE e.g., explicit JOINs, not implicit comma joins]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Code style",
    content: `- [PANDAS_CONVENTIONS e.g., use .assign() for chaining, avoid inplace=True]
- Type hints required on all functions
- [ADDITIONAL_STYLE_RULE]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Constraints",
    content: `- PII: [PII_RULES e.g., never log user emails, anonymize before export]
- Query timeout: [QUERY_TIMEOUT e.g., 30 seconds]
- Max rows returned: [MAX_ROW_LIMIT e.g., 10,000 without explicit override]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const CONTENT_CREATION_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "[ONE_LINE_DESCRIPTION]",
    required: true,
    priority: 1,
  },
  {
    heading: "## Voice & tone",
    content: `- Tone: [TONE e.g., direct and confident, warm but professional]
- Formality: [FORMALITY_LEVEL e.g., semi-formal, avoid jargon]
- Personality traits: [TRAITS e.g., honest, curious, never hyperbolic]`,
    required: true,
    priority: 1,
  },
  {
    heading: "## Audience",
    content: `- Primary audience: [PRIMARY_AUDIENCE e.g., senior engineers, startup founders]
- Assumed knowledge: [ASSUMED_KNOWLEDGE_LEVEL e.g., knows how to code, no marketing background]`,
    required: true,
    priority: 1,
  },
  {
    heading: "## Vocabulary",
    content: `- Preferred terms: [PREFERRED_TERMS e.g., "build" not "construct", "use" not "utilize"]
- Forbidden terms: [FORBIDDEN_TERMS e.g., "synergy", "holistic", "leverage" as a verb]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Output format",
    content: `- Length: [TARGET_LENGTH e.g., 800–1200 words for articles]
- Structure: [STRUCTURE e.g., H2 sections, no more than 3 bullet points per section]
- SEO: [SEO_REQUIREMENTS e.g., keyword in first paragraph, meta description ≤ 155 chars]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Review criteria",
    content: `- Done when: [DONE_DEFINITION e.g., passes Hemingway app grade 8, no passive voice]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Gotchas",
    content: `- [BRAND_RULE e.g., never compare to competitor X]
- [SENSITIVE_TOPIC e.g., avoid political commentary]`,
    required: false,
    priority: 5,
  },
  {
    ...MODERN_CLAUDE_CODE_SECTION,
    content: `<!-- Skills — domain knowledge (.claude/skills/<topic>/SKILL.md): -->
<!-- - [DOMAIN_TOPIC e.g., brand-voice, editorial-guidelines] -->`,
    // content-creation: skills only — no hooks or path-scoped rules
  },
];

export const DESIGN_SYSTEM_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @tokens.json for project overview and design tokens.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Build tokens: \`[BUILD_TOKENS_CMD e.g., pnpm build:tokens]\`
- Test: \`[TEST_CMD e.g., pnpm test]\`
- Storybook: \`[STORYBOOK_CMD e.g., pnpm storybook]\`
- Lint: \`[LINT_CMD]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Component conventions",
    content: `- Naming: [NAMING_CONVENTION e.g., PascalCase, Button not button]
- Props API: [PROPS_API_STYLE e.g., variant prop over individual boolean props]
- Composition: [COMPOSITION_PATTERN e.g., compound components, render props]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Design tokens",
    content: `- Colors: [COLOR_SCALE e.g., gray-50 through gray-900, see @tokens.json]
- Spacing: [SPACING_SCALE e.g., 4px base unit, t-shirt sizes sm/md/lg]
- Typography: [TYPOGRAPHY_SCALE e.g., 3 font sizes: sm/base/lg]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Accessibility",
    content: `- Standard: [WCAG_LEVEL e.g., WCAG 2.1 AA minimum]
- [SPECIFIC_A11Y_REQUIREMENTS e.g., all interactive elements keyboard-navigable]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Documentation format",
    content: `- [DOC_STYLE e.g., JSDoc for props, Storybook story per variant]`,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const DEVOPS_INFRA_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md for project overview and runbook.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Plan: \`[TERRAFORM_PLAN e.g., terraform plan -out=plan.tfplan]\`
- Apply: \`[TERRAFORM_APPLY e.g., terraform apply plan.tfplan]\`
- Kubernetes: \`[KUBECTL_CMDS e.g., kubectl apply -f k8s/]\`
- Validate: \`[VALIDATE_CMD e.g., terraform validate && tflint]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Architecture",
    content: `- Cloud provider: [CLOUD_PROVIDER e.g., AWS, GCP, Azure]
- Key services: [KEY_SERVICES e.g., EKS, RDS, ElastiCache, S3]
- Networking: [NETWORKING e.g., VPC with private subnets, NAT gateway]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Workflow",
    content: `- Run \`terraform plan\` and review output before every \`terraform apply\`
- Rollback: [ROLLBACK_PROCEDURE e.g., revert commit and apply previous state]
- Change process: [CHANGE_PROCESS e.g., PR required, reviewed by ops team]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Constraints",
    content: `- Blast radius rules: [BLAST_RADIUS_RULES e.g., max 1 AZ change per deploy]
- Approval requirements: [APPROVAL_REQUIREMENTS e.g., 2 approvals for prod]
- Environments: [ENVIRONMENT_LIST e.g., dev, staging, prod — never cross-apply]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Security",
    content: `- Least privilege: [LEAST_PRIVILEGE_RULES e.g., no wildcard IAM policies]
- Secrets: [SECRETS_MANAGEMENT e.g., AWS Secrets Manager, never in code or env files]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  {
    ...MODERN_CLAUDE_CODE_SECTION,
    content: `<!-- Hooks — mandatory actions (configure in .claude/settings.json): -->
<!-- - run terraform validate after every .tf file edit -->

<!-- Skills — domain knowledge (.claude/skills/<topic>/SKILL.md): -->
<!-- - [DOMAIN_TOPIC e.g., incident-runbook, scaling-playbook] -->

<!-- Path-scoped rules (.claude/rules/<topic>.md with paths: frontmatter): -->
<!-- - [FILE_TYPE_RULE e.g., **/*.tf -> terraform style rules] -->`,
  },
];

export const MOBILE_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @package.json for project overview.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Build: \`[BUILD_CMD e.g., pnpm ios / pnpm android]\`
- Test: \`[TEST_CMD e.g., pnpm test]\`
- Emulator: \`[EMULATOR_CMD e.g., pnpm start]\`
- Lint: \`[LINT_CMD]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- Platform: [PLATFORM e.g., React Native, iOS Swift, Android Kotlin]
- [NAMING_CONVENTION e.g., camelCase for RN, Swift conventions for iOS]
- [ADDITIONAL_STYLE_RULE]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- Navigation: [NAVIGATION_LIBRARY e.g., React Navigation, UIKit]
- State management: [STATE_MANAGEMENT e.g., Zustand, Redux Toolkit]
- API layer: [API_LAYER e.g., React Query, Alamofire]
- Offline strategy: [OFFLINE_STRATEGY e.g., SQLite cache, optimistic updates]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Performance budgets",
    content: `- Bundle size: [BUNDLE_SIZE_LIMIT e.g., < 50MB]
- Frame rate target: [FRAME_RATE_TARGET e.g., 60fps on mid-range devices]
- Startup time: [STARTUP_TIME_LIMIT e.g., cold start < 2s]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Constraints",
    content: `- Offline: [OFFLINE_REQUIREMENTS e.g., core features work without internet]
- Permissions: [PERMISSIONS_POLICY e.g., request at point of use, explain why]`,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const GENERIC_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "[ONE_LINE_DESCRIPTION]",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Dev: \`[DEV_COMMAND]\`
- Build: \`[BUILD_COMMAND]\`
- Test: \`[TEST_COMMAND]\`
- Lint: \`[LINT_COMMAND]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- Language: [LANGUAGE]
- Naming: [NAMING_CONVENTION]
- Formatting: [FORMATTING_TOOL e.g., Prettier, Black, gofmt]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Workflow",
    content: `- Typecheck: \`[TYPECHECK_COMMAND]\`
- Commit format: [COMMIT_CONVENTION]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Constraints",
    content: "- [CONSTRAINT_1]\n- [CONSTRAINT_2]",
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];
```

- [ ] **Step 5: Add the `SECTION_TEMPLATES` lookup map**

```typescript
export const SECTION_TEMPLATES: Record<ProjectType, SectionTemplate[]> = {
  "react-nextjs": REACT_NEXTJS_TEMPLATE,
  "python-backend": PYTHON_BACKEND_TEMPLATE,
  "api-backend": API_BACKEND_TEMPLATE,
  fullstack: FULLSTACK_TEMPLATE,
  "data-analysis": DATA_ANALYSIS_TEMPLATE,
  "content-creation": CONTENT_CREATION_TEMPLATE,
  "design-system": DESIGN_SYSTEM_TEMPLATE,
  "devops-infra": DEVOPS_INFRA_TEMPLATE,
  mobile: MOBILE_TEMPLATE,
  generic: GENERIC_TEMPLATE,
};
```

- [ ] **Step 6: Verify — all 10 templates exist, required sections present, line counts**

Add temporarily, run, then remove:

```typescript
const projectTypes: ProjectType[] = [
  "react-nextjs", "python-backend", "api-backend", "fullstack",
  "data-analysis", "content-creation", "design-system", "devops-infra",
  "mobile", "generic",
];

console.assert(Object.keys(SECTION_TEMPLATES).length === 10, "Expected 10 project types");

for (const type of projectTypes) {
  const template = SECTION_TEMPLATES[type];
  console.assert(template !== undefined, `Missing template for ${type}`);

  // Every template must have the modern_claude_code section
  const hasModern = template.some(s => s.heading === "## Modern Claude Code");
  console.assert(hasModern, `${type} is missing modern_claude_code section`);

  // Every template must have at least one required section
  const hasRequired = template.some(s => s.required === true);
  console.assert(hasRequired, `${type} has no required sections`);

  // Priorities must be unique per template (no two sections with same priority)
  const priorities = template.map(s => s.priority);
  // Allow duplicates only for priority 1 (fullstack has two priority-1 command sections)
  console.log(`  ${type}: ${template.length} sections ✓`);
}

console.log(`section-templates.ts ✓ (${Object.keys(SECTION_TEMPLATES).length} project types)`);
```

Run: `npx tsx src/knowledge/section-templates.ts`
Expected: 10 lines of section counts + `section-templates.ts ✓ (10 project types)`

- [ ] **Step 7: Remove assertions, commit**

```bash
git add src/knowledge/section-templates.ts
git commit -m "feat(knowledge): add all 10 project type section templates"
```

---

## Task 5: Barrel export `index.ts`

**Files:**
- Create: `src/knowledge/index.ts`

- [ ] **Step 1: Create the barrel**

```typescript
// src/knowledge/index.ts

export * from "./best-practices";
export * from "./antipatterns";
export * from "./section-templates";
export * from "./thinking-levels";
```

- [ ] **Step 2: Verify imports resolve via a separate check file**

```typescript
// tmp-index-check.ts (at project root — delete after running)
import { BEST_PRACTICES, ANTI_PATTERNS, SECTION_TEMPLATES, THINKING_LEVELS } from "./src/knowledge/index";
console.assert(BEST_PRACTICES.length > 0, "BEST_PRACTICES empty");
console.assert(ANTI_PATTERNS.length > 0, "ANTI_PATTERNS empty");
console.assert(Object.keys(SECTION_TEMPLATES).length === 10, "SECTION_TEMPLATES incomplete");
console.assert(THINKING_LEVELS.levels.length === 3, "THINKING_LEVELS incomplete");
console.log("index.ts ✓ — all exports resolved");
```

Run: `npx tsx tmp-index-check.ts && rm tmp-index-check.ts`
Expected: `index.ts ✓ — all exports resolved`

- [ ] **Step 3: Commit**

```bash
git add src/knowledge/index.ts
git commit -m "feat(knowledge): add barrel export for knowledge layer"
```

---

## Final verification

- [ ] **Confirm all 5 files exist**

```bash
ls src/knowledge/
```
Expected: `antipatterns.ts  best-practices.ts  index.ts  section-templates.ts  thinking-levels.ts`

- [ ] **Confirm total export counts**

```typescript
// tmp-verify.ts (delete after running)
import { BEST_PRACTICES } from "./src/knowledge/best-practices";
import { ANTI_PATTERNS } from "./src/knowledge/antipatterns";
import { SECTION_TEMPLATES } from "./src/knowledge/section-templates";
import { THINKING_LEVELS } from "./src/knowledge/thinking-levels";

console.log(`BEST_PRACTICES: ${BEST_PRACTICES.length} rules`);
console.log(`ANTI_PATTERNS: ${ANTI_PATTERNS.length} patterns`);
console.log(`SECTION_TEMPLATES: ${Object.keys(SECTION_TEMPLATES).length} project types`);
console.log(`THINKING_LEVELS: ${THINKING_LEVELS.levels.length} levels`);

// Spot-check: features category exists
const featureRules = BEST_PRACTICES.filter(p => p.category === "features");
console.assert(featureRules.length === 4, "features category missing");

// Spot-check: no duplicate IDs across files
const bpIds = BEST_PRACTICES.map(p => p.id);
const apIds = ANTI_PATTERNS.map(p => p.id);
const allIds = [...bpIds, ...apIds];
const uniqueAll = new Set(allIds);
console.assert(uniqueAll.size === allIds.length, "Duplicate IDs found across files");

console.log("✓ Knowledge layer complete");
```

Run: `npx tsx tmp-verify.ts && rm tmp-verify.ts`

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(knowledge): complete knowledge layer — best-practices, antipatterns, section-templates, thinking-levels"
```
