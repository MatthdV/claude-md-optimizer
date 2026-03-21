# Claude.md Generator & Optimizer — Build Instructions

You are building a Next.js application from scratch. It does two things:

1. **Generator**: the user types a lazy, vague prompt like "I'm building a React dashboard with Supabase" and the app generates a complete, production-quality CLAUDE.md file following Anthropic's official best practices
2. **Optimizer**: once generated (or if the user pastes an existing CLAUDE.md), the app scores it, flags problems, and suggests improvements

The entire app runs client-side. No backend, no LLM calls. The generator uses templates + project-type detection. The optimizer uses pattern-matching heuristics.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **State management**: Zustand
- **Styling**: Tailwind CSS v3
- **Icons**: lucide-react
- **Charts**: recharts (radar chart for score dimensions)
- **Package manager**: pnpm

Initialize: `pnpm create next-app@latest claude-md-optimizer --typescript --tailwind --app --src-dir --no-import-alias`

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← Main page: 3-panel layout
│   └── globals.css
├── types/
│   └── index.ts
├── utils/
│   └── helpers.ts
├── knowledge/
│   ├── best-practices.ts     ← Anthropic's official CLAUDE.md rules (codified)
│   ├── section-templates.ts  ← Templates for each section type × project type
│   ├── antipatterns.ts       ← What NOT to put in a CLAUDE.md
│   └── thinking-levels.ts   ← Thinking trigger guidance
├── engines/
│   ├── index.ts
│   ├── generator-engine.ts   ← Takes lazy prompt → full CLAUDE.md
│   ├── analysis-engine.ts    ← Parse, detect project type, flag issues
│   ├── evaluation-engine.ts  ← 5-dimension scoring (Anthropic-aligned)
│   ├── enhancement-engine.ts ← Suggestion generator
│   ├── recommendation-engine.ts
│   └── orchestrator.ts
├── store/
│   └── optimizer-store.ts
└── components/
    ├── LazyPromptInput.tsx    ← Step 1: user describes their project
    ├── Editor.tsx             ← Step 2: edit the generated CLAUDE.md
    ├── OptimizerSidebar.tsx   ← Step 3: scores + suggestions
    ├── ScoreDashboard.tsx
    ├── DimensionBar.tsx
    ├── SuggestionCard.tsx
    ├── RecommendationCard.tsx
    ├── SeverityBadge.tsx
    ├── DiffView.tsx
    └── ModeToggle.tsx
```

---

## The Knowledge Layer

This is what distinguishes this tool from a generic linter. All rules, templates, and anti-patterns are derived from Anthropic's official documentation. Source these from the knowledge/ directory.

### `knowledge/best-practices.ts`

Codify the official rules from https://code.claude.com/docs/en/best-practices and https://code.claude.com/docs/en/memory as structured data. These are the actual rules the generator and optimizer enforce:

```typescript
export interface BestPractice {
  id: string;
  rule: string;           // the instruction
  source: string;         // "anthropic-docs" | "anthropic-blog" | "prompt-engineering-guide"
  category: "include" | "exclude" | "structure" | "style";
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
];
```

### `knowledge/antipatterns.ts`

Patterns the optimizer flags as problems:

```typescript
export interface AntiPattern {
  id: string;
  pattern: RegExp;
  message: string;
  severity: "critical" | "warning" | "suggestion";
  fix: string;
}

export const ANTI_PATTERNS: AntiPattern[] = [
  // ── Self-evident instructions (the #1 anti-pattern per Anthropic) ──
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

  // ── Hedge words (weak instructions) ──
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

  // ── Over-specification (bloated CLAUDE.md) ──
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
    pattern: /$/gm, // counted externally, not via regex
    message: "CLAUDE.md exceeds 200 lines. Anthropic recommends under 200. Longer files reduce adherence.",
    severity: "critical",
    fix: "Move detailed content to .claude/rules/ files or use @imports for secondary docs",
  },
];
```

### `knowledge/section-templates.ts`

Templates used by the Generator Engine. Each project type gets a tailored CLAUDE.md skeleton:

```typescript
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
  content: string;      // with [PLACEHOLDER] markers the user fills in
  required: boolean;     // must appear in every CLAUDE.md for this project type
  priority: number;      // 1 = most important
}

// Example for react-nextjs:
export const REACT_NEXTJS_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# Project",
    content: "[PROJECT_NAME] — [ONE_LINE_DESCRIPTION]",
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
];
```

Create similar templates for each of the other project types. Follow these guidelines per type:

- **python-backend**: Commands (pip/poetry, pytest, mypy, ruff), Code style (Black formatting, snake_case, type hints), Architecture (framework, ORM, DB), Workflow (pytest, mypy before commit)
- **fullstack**: Merge frontend + backend patterns. Commands for both. Architecture section covers both layers. Constraints about API boundaries.
- **api-backend**: Commands (test, lint, migrate), Code style (naming, error response format), Architecture (framework, auth, DB, cache), API conventions (REST/GraphQL, versioning, pagination)
- **data-analysis**: Commands (notebook, tests), Code style (pandas conventions, SQL dialect), Data sources (warehouse, tables, schemas), Constraints (PII, query timeouts)
- **content-creation**: Voice & tone, Audience, Vocabulary (preferred/avoided terms), Output format (length, structure, SEO)
- **design-system**: Component conventions, Tokens (colors, spacing, typography), Accessibility (WCAG level), Documentation format
- **devops-infra**: Commands (terraform, kubectl, docker), Architecture (cloud provider, services), Workflow (change management, rollback), Constraints (blast radius, approval requirements)
- **mobile**: Commands (build, test, emulator), Code style (platform conventions), Architecture (navigation, state, API layer), Constraints (performance budgets, offline support)
- **generic**: Minimal: Commands, Code style, Workflow, Constraints. Used when project type can't be detected.

The generator picks the right template based on the lazy prompt, fills in what it can infer, and leaves `[PLACEHOLDER]` markers for what it can't.

### `knowledge/thinking-levels.ts`

Thinking level guidance to optionally include in generated CLAUDE.md files:

```typescript
export const THINKING_LEVELS = {
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
      triggers: ["think harder", "think intensely", "think longer", "think really hard", "think super hard", "think very hard", "ultrathink"],
      budget: "~32K tokens (maximum)",
      useFor: "Complex architecture, critical migrations, deep debugging, system design",
    },
  ],
  note: "These triggers only work in Claude Code CLI — not in claude.ai web or the API.",
};

// Template for including thinking guidance in generated CLAUDE.md
export const THINKING_TEMPLATE = `## Thinking guidance
- For routine changes: use default thinking
- For architecture and API design: use "think hard"
- For complex refactors and critical decisions: use "ultrathink"`;
```

---

## Generator Engine (`src/engines/generator-engine.ts`)

This is the new core of the app. Takes a lazy prompt and produces a complete CLAUDE.md.

### Input
A string like:
- "React dashboard with Supabase"
- "Python FastAPI backend with PostgreSQL"
- "I'm building a design system for my company"
- "Data pipeline with Snowflake and dbt"

### Process

1. **Detect project type** from keyword signals in the prompt (reuse the same keyword-matching logic as the analysis engine, but tuned for common stack mentions)

2. **Select template** from `section-templates.ts` based on detected type

3. **Fill placeholders** from the lazy prompt:
   - Extract mentioned technologies (React, Supabase, Tailwind, PostgreSQL, etc.)
   - Map them to the right sections (Supabase → Architecture/Database, Tailwind → Code style)
   - Leave unfillable placeholders as `[DESCRIBE_YOUR_X]` for the user to complete

4. **Apply best practices** automatically:
   - Add bash commands section with `dev`, `build`, `test`, `lint` commands guessed from the stack
   - Add code style section with sensible defaults for the detected language
   - Add workflow section with "typecheck after changes" + "prefer single test runs"
   - Include verification criteria (test commands, lint commands)
   - Keep it under 200 lines
   - Never add self-evident instructions

5. **Output** a complete markdown string ready for the editor

### Key design rules for the generator

- **Concise by default**: Anthropic says "for each line, ask: would removing this cause Claude to make mistakes?" Generate tight, specific instructions.
- **No padding**: Don't add "write clean code", "follow best practices", "use proper error handling" — these waste context.
- **Actionable commands**: Every section should have something Claude can actually execute or verify: `pnpm test`, `pnpm lint`, a specific naming rule.
- **Placeholders are honest**: If we can't infer something from the lazy prompt, don't guess — mark it `[PLACEHOLDER]` and let the user fill it in.

### Example: lazy prompt → generated output

Input: `"React dashboard with Supabase and Tailwind"`

Output:
```markdown
# React Dashboard

## Commands
- Dev: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`
- Type check: `pnpm tsc --noEmit`

## Code style
- Use ES modules (import/export), not CommonJS
- Functional components with hooks — no class components
- Tailwind for all styling — no CSS modules or styled-components
- camelCase for variables/functions, PascalCase for components and types

## Architecture
- Next.js App Router (/app directory)
- Supabase for auth and database
- Tailwind CSS for styling
- [STATE_MANAGEMENT: e.g., Zustand, React Context, or React Query]

## Workflow
- Typecheck after making code changes: `pnpm tsc --noEmit`
- Run relevant tests after changes: `pnpm test [filename]`
- Prefer single test files over full suite for speed

## Constraints
- Do not add new npm packages without discussing trade-offs first
- Do not expose Supabase service role key in client-side code
- Keep components under 150 lines — extract sub-components when longer

## Gotchas
- [ADD_PROJECT_SPECIFIC_GOTCHAS]
```

Note: ~40 lines. Tight. No fluff. Everything is something Claude would actually use.

---

## Analysis Engine (`src/engines/analysis-engine.ts`)

Same as before, but now the detection rules enforce Anthropic's actual best practices.

### Detection Rules (7 rules)

1. **`self-evident-instruction`** (critical): Match against the ANTI_PATTERNS list. Flag any line that contains self-evident instructions like "write clean code", "good quality", "follow best practices".

2. **`over-200-lines`** (critical): Count lines. If > 200, flag with Anthropic's recommendation.

3. **`vague-qualifier`** (warning): Match "as needed", "if appropriate", "etc.", "various", "properly", "correctly", "best practices" — per ANTI_PATTERNS.

4. **`hedge-word`** (suggestion): Match "maybe", "try to", "might want to", "could consider".

5. **`missing-section`** (critical): Required sections by project type:
   - All types: Commands (build/test/lint), Code style, Workflow
   - Code projects: + Architecture, Constraints
   - Content projects: + Voice/Tone, Audience
   - Data projects: + Data sources, Query dialect

6. **`contradiction`** (critical): Detect "always X" conflicting with "never X" across sections.

7. **`no-verification-criteria`** (critical): If no section contains runnable commands (regex for backtick commands like \`pnpm test\`, \`npm run\`, \`pytest\`, etc.), flag it. Per Anthropic: "Give Claude a way to verify its work — this is the single highest-leverage thing you can do."

### Section Classification

Parse by headings. Classify using keyword patterns. But the section taxonomy now matches what Anthropic actually recommends:

| Section Type  | What Anthropic says to include                          |
|---------------|--------------------------------------------------------|
| commands      | Bash commands Claude can't guess                        |
| code_style    | Rules that DIFFER from defaults only                    |
| workflow      | How to work: typecheck, test, commit conventions        |
| architecture  | Project-specific decisions Claude can't infer from code |
| constraints   | What NOT to do — explicit boundaries                    |
| testing       | Runner, conventions, coverage expectations              |
| gotchas       | Non-obvious behaviors and common pitfalls               |
| env_setup     | Required env vars, setup steps                          |
| verification  | How Claude should check its own work                    |

---

## Evaluation Engine (`src/engines/evaluation-engine.ts`)

### Dimensions (revised to match Anthropic priorities)

| Dimension             | Weight | What it measures (per Anthropic docs)                              |
|-----------------------|--------|--------------------------------------------------------------------|
| **Actionability**     | 30%    | Are instructions concrete enough to verify? Can Claude run/test?   |
| **Conciseness**       | 25%    | Under 200 lines? No self-evident instructions? No bloat?          |
| **Specificity**       | 20%    | No vague qualifiers, hedges, or "properly/correctly"?              |
| **Completeness**      | 15%    | Required sections present for the detected project type?           |
| **Consistency**       | 10%    | No contradictions? No duplicate instructions?                      |

These dimensions directly reflect what Anthropic says matters most. Notably:
- "Actionability" is #1 because Anthropic says verification is "the single highest-leverage thing"
- "Conciseness" is #2 because "bloated CLAUDE.md files cause Claude to ignore your actual instructions"
- "Specificity" is #3 because "'Use 2-space indentation' not 'Format code properly'"
- "Completeness" is lower because a short, focused file beats a comprehensive but bloated one

### Scoring Algorithms

**Actionability (0–100):**
```
has_commands = sections contain backtick commands (build/test/lint)
has_test_command = mentions a specific test runner invocation
has_lint_command = mentions a specific lint command
has_typecheck = mentions typecheck command

score = 0
if has_commands: score += 40
if has_test_command: score += 25
if has_lint_command: score += 15
if has_typecheck: score += 10
if has_examples_section: score += 10
```

**Conciseness (0–100):**
```
line_count = total lines
self_evident_count = matches against self-evident anti-patterns
bloat_lines = lines that match "exclude" anti-patterns (API docs inline, file descriptions, etc.)

score = 100
if line_count > 200: score -= 30
if line_count > 300: score -= 20 (additional)
score -= self_evident_count * 15
score -= bloat_lines * 5
score = max(0, score)
```

**Specificity (0–100):**
```
vague_count = vague qualifier matches
hedge_count = hedge word matches

penalty = vague_count * 5 + hedge_count * 3
score = max(0, 100 - penalty)
```

**Completeness (0–100):**
```
required = required_sections_for(project_type)
present = found sections
score = (present / required) * 100
```

**Consistency (0–100):**
```
contradictions = detected contradictions
duplicates = near-duplicate instructions (Jaccard > 0.7)

score = 100 - contradictions * 25 - duplicates * 10
score = max(0, score)
```

### Grade Bands
- 90–100: A — Ready to ship
- 75–89: B — Good, minor improvements possible
- 60–74: C — Functional but has problems
- 40–59: D — Significant issues
- 0–39: F — Needs rewrite

---

## Enhancement & Recommendation Engines

Same architecture as before, but suggestion text now references Anthropic's actual guidance. For example:

- Instead of "Add a role definition" → "CLAUDE.md doesn't need a role definition. Instead, add the commands, code style rules, and architectural decisions that Claude can't infer from reading your code (per Anthropic best practices)."
- Instead of "Replace 'properly' with specific instruction" → "Anthropic recommends: 'Use 2-space indentation' not 'Format code properly.' What does 'properly' mean for your project?"

The recommendation engine suggests `.claude/rules/` files for projects that would exceed 200 lines with everything in one file.

---

## UI Flow

The app has 3 phases, shown as a wizard-like flow:

### Phase 1: Lazy Prompt (`LazyPromptInput.tsx`)
- Large text input: "Describe your project in a sentence or two"
- Placeholder: "React dashboard with Supabase and Tailwind"
- "Generate CLAUDE.md" button
- Below: detected project type badge, detected technologies pills

### Phase 2: Editor (`Editor.tsx`)
- Full-height monospace textarea showing the generated CLAUDE.md
- Yellow highlights on `[PLACEHOLDER]` markers the user needs to fill
- "Analyze" button in toolbar (or real-time toggle)
- The user can also paste an existing CLAUDE.md here, skipping Phase 1

### Phase 3: Optimizer Sidebar (`OptimizerSidebar.tsx`)
- Appears on the right when analysis runs
- Tabs: Score | Issues | Suggestions | Add Sections
- Same component structure as before

### Layout
```
Phase 1 (centered):
┌──────────────────────────────────────┐
│  Describe your project...            │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  └──────────────────────────────┘    │
│  [Generate CLAUDE.md]                │
└──────────────────────────────────────┘

Phase 2+3 (split):
┌──────────────────┬───────────────────┐
│                  │  Score: B (78)    │
│  # My Project    │  ━━━━━━━━━━━      │
│  ## Commands     │                   │
│  - pnpm dev      │  Issues (3)       │
│  - pnpm test     │  Suggestions (5)  │
│  ...             │  Add Sections (2) │
│                  │                   │
└──────────────────┴───────────────────┘
```

---

## Zustand Store

```typescript
interface OptimizerStore {
  // Phase
  phase: "input" | "editor";

  // Generator
  lazyPrompt: string;
  setLazyPrompt: (p: string) => void;
  generate: () => void;  // runs generator engine, sets content, moves to "editor" phase

  // Editor
  content: string;
  setContent: (c: string) => void;

  // Optimizer
  mode: OptimizerMode;
  setMode: (m: OptimizerMode) => void;
  isAnalyzing: boolean;
  result: OptimizerResult | null;
  error: string | null;
  analyze: () => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: SidebarTab;
  setActiveTab: (t: SidebarTab) => void;
  filterSeverity: IssueSeverity | "all";
  setFilterSeverity: (s: IssueSeverity | "all") => void;
  expandedCardId: string | null;
  setExpandedCardId: (id: string | null) => void;

  // Actions
  applySuggestion: (s: Suggestion) => void;
  applyRecommendation: (r: SectionRecommendation) => void;
  reset: () => void;  // back to Phase 1
}
```

---

## Type Definitions

Same as before (all types from previous version), plus:

```typescript
// Generator additions
export interface GeneratorInput {
  lazyPrompt: string;
}

export interface GeneratorOutput {
  content: string;
  detectedProjectType: ProjectType;
  detectedTechnologies: string[];
  placeholders: string[];  // list of [PLACEHOLDER] markers that need filling
  lineCount: number;
}
```

---

## Visual Design

- **Phase 1**: centered, clean, minimal. Large input with generous padding. Indigo-600 primary button.
- **Phase 2+3**: split layout. White editor, gray-50 sidebar. Same as before.
- **Placeholder highlights**: in the editor, `[PLACEHOLDER]` text should stand out — use a yellow/amber background with CSS or inline styling.
- **Score display**: large grade letter (text-6xl) colored by grade. Radar chart below.

---

## Build Order

1. Initialize Next.js + install deps (Zustand, recharts, lucide-react)
2. Create `src/types/index.ts` and `src/utils/helpers.ts`
3. Create `src/knowledge/` — all best practices, anti-patterns, templates, thinking levels
4. Build Generator Engine — test with console.log that lazy prompts produce good CLAUDE.md output
5. Build Analysis Engine with the 7 revised detection rules
6. Build Evaluation Engine with the 5 Anthropic-aligned dimensions
7. Build Enhancement + Recommendation engines
8. Build Orchestrator
9. Create Zustand store
10. Build Phase 1 UI: LazyPromptInput
11. Build Phase 2 UI: Editor with placeholder highlighting
12. Build Phase 3 UI: OptimizerSidebar with all sub-components
13. Wire everything: generate → edit → analyze → apply → re-analyze
14. Test with lazy prompts: "React app with Supabase", "Python FastAPI", "data pipeline with dbt"
15. Polish: loading states, animations, responsive layout

---

## What NOT to Build

- No backend API routes
- No database
- No LLM calls
- No auth
- No dark mode (v1)
- No file import/export (v1)
- No markdown preview — this is a CLAUDE.md editor, not a doc viewer

## Test Cases

After building, verify these scenarios work:

**Test 1 — Generator**: Input "React dashboard with Supabase and Tailwind" → generates a CLAUDE.md under 60 lines with Commands, Code style, Architecture, Workflow, Constraints sections. No "write clean code" or "follow best practices" anywhere.

**Test 2 — Optimizer on self-evident bloat**: Paste this into the editor:
```
# Instructions
You are a helpful coding assistant. Write good quality code and follow best practices. Handle errors properly. Don't do anything bad.
```
Expected: Grade F (~20), critical flags for self-evident instructions, vague qualifiers, missing commands, missing verification criteria.

**Test 3 — Optimizer on good file**: Paste a tight CLAUDE.md with Commands, Code style, Workflow, Architecture. Expected: Grade A or B, minimal suggestions.
