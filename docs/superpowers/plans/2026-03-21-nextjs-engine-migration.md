# Next.js Init + Engine Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Next.js app infrastructure and migrate all engines to consume the `src/knowledge/` layer instead of inline data.

**Architecture:** The knowledge layer (`src/knowledge/`) already exists with `ANTI_PATTERNS`, `BEST_PRACTICES`, `SECTION_TEMPLATES`, `THINKING_LEVELS`. This plan wires up Next.js scaffolding, aligns the type system with the knowledge layer's model, migrates the four existing engines to import from knowledge instead of duplicating data inline, and creates the missing generator engine.

**Tech Stack:** Next.js 14 (App Router), TypeScript strict, Tailwind CSS v3, Zustand, recharts, lucide-react, vitest

---

## File Map

| File | Status | Change |
|------|--------|--------|
| `package.json` | Replace | `pnpm create next-app` creates new one; add vitest + extra deps |
| `next.config.ts` | Create | Auto-created by Next.js |
| `tsconfig.json` | Create | Auto-created by Next.js (strict mode required) |
| `tailwind.config.ts` | Create | Auto-created by Next.js |
| `vitest.config.ts` | Create | Add vitest for unit testing |
| `src/app/layout.tsx` | Create | Root layout (Next.js scaffold) |
| `src/app/page.tsx` | Create | Root page (stub) |
| `src/app/globals.css` | Create | Global Tailwind CSS |
| `src/types/index.ts` | Modify | New ProjectType (10 types), SectionType (9), ScoreDimension (5), GeneratorInput/Output |
| `src/engines/analysis-engine.ts` | Modify | Use ANTI_PATTERNS; new SECTION_PATTERNS; new PROJECT_TYPE_SIGNALS (10 types); updated REQUIRED_FOR_PROJECT_TYPE |
| `src/engines/evaluation-engine.ts` | Modify | Replace 6 dimensions with 5 Anthropic-aligned; use ANTI_PATTERNS |
| `src/engines/enhancement-engine.ts` | Modify | Use ANTI_PATTERNS.fix for reasoning; add generators for self-evident / over-200-lines |
| `src/engines/recommendation-engine.ts` | Modify | Update applicableTo to 10 new project types; add recommendations for new SectionTypes |
| `src/engines/generator-engine.ts` | Create | New: lazy prompt → full CLAUDE.md via SECTION_TEMPLATES |
| `src/engines/index.ts` | Modify | Export `generate` from generator-engine |

---

## Task 1: Initialize Next.js + install dependencies

**Files:**
- Replace: `package.json` (Next.js will overwrite)
- Create: `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `vitest.config.ts`

**Context:** The project root has a minimal `package.json` (just tsx + typescript) and a `package-lock.json` from npm. Both will be replaced. Existing `src/knowledge/`, `src/engines/`, `src/types/`, `src/utils/` directories must be preserved intact.

- [ ] **Step 1: Remove npm artifacts before pnpm init**

```bash
cd "/Users/c_mdevillele/Documents/Documents - L062N6GVX9/Claude Md optimizer"
rm -f package-lock.json
rm -rf node_modules
```

- [ ] **Step 2: Run pnpm create next-app in-place**

```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --no-import-alias --eslint --yes
```

When prompted "The directory . contains files that could conflict. Continue?" → Yes.

Expected: creates `src/app/`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `public/`, `.gitignore`, updated `package.json`.

- [ ] **Step 3: Verify existing src/ directories are intact**

```bash
ls src/knowledge/ src/engines/ src/types/ src/utils/
```

Expected: all existing files still present.

- [ ] **Step 4: Add project dependencies**

```bash
pnpm add zustand recharts lucide-react
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/testing-library__jest-dom
```

- [ ] **Step 5: Add vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:
```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 6: Update package.json scripts**

Add to the `"scripts"` section of `package.json`:
```json
"test": "vitest",
"test:run": "vitest run",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 7: Verify tsconfig has strict mode**

Check `tsconfig.json` contains `"strict": true`. If not, add it under `"compilerOptions"`.

- [ ] **Step 8: Verify Next.js dev server starts**

```bash
pnpm dev &
sleep 3
curl -s http://localhost:3000 | head -5
kill %1
```

Expected: HTML response with Next.js content.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 app with Tailwind, vitest, Zustand, recharts"
```

---

## Task 2: Update type system (`src/types/index.ts`)

**Files:**
- Modify: `src/types/index.ts`

**Context:** Current types use an incompatible model (6 broad `ProjectType`s, 6 `ScoreDimension`s, 14 `SectionType`s). These must align with the knowledge layer and the spec. The knowledge layer already exports `ProjectType` from `section-templates.ts` — re-export it here to avoid duplication.

**Key changes:**
- `ProjectType`: drop 6-type model, re-export from knowledge (10 specific types)
- `SectionType`: 14 types → 9 (commands, code_style, workflow, architecture, constraints, testing, gotchas, env_setup, verification)
- `ScoreDimension`: 6 → 5 (actionability, conciseness, specificity, completeness, consistency)
- Add `GeneratorInput` and `GeneratorOutput` interfaces

- [ ] **Step 1: Write the failing typecheck**

In a terminal, run:
```bash
pnpm typecheck 2>&1 | head -20
```

Note current errors (baseline). After our changes this must pass with zero errors.

- [ ] **Step 2: Replace src/types/index.ts**

Full file content:

```typescript
// ─── Re-exported from knowledge layer ────────────────────────────────
export type { ProjectType } from "../knowledge/section-templates";

// ─── Section Types (Anthropic taxonomy) ──────────────────────────────

export type SectionType =
  | "commands"       // bash commands: build, test, lint, dev
  | "code_style"     // rules that differ from defaults only
  | "workflow"       // how to work: typecheck, commit, test single files
  | "architecture"   // project-specific decisions not inferrable from code
  | "constraints"    // what NOT to do — explicit boundaries
  | "testing"        // runner, conventions, coverage expectations
  | "gotchas"        // non-obvious behaviors and common pitfalls
  | "env_setup"      // required env vars, setup steps
  | "verification";  // how Claude checks its own work

export type IssueSeverity = "critical" | "warning" | "suggestion";

export type SuggestionCategory = "gap" | "enhancement" | "addition";

// Anthropic-aligned 5-dimension scoring model
export type ScoreDimension =
  | "actionability"  // can Claude execute/verify? (30%)
  | "conciseness"    // under 200 lines, no bloat? (25%)
  | "specificity"    // no vague qualifiers? (20%)
  | "completeness"   // required sections present? (15%)
  | "consistency";   // no contradictions or duplicates? (10%)

export type Grade = "A" | "B" | "C" | "D" | "F";

// ─── Parsed Document ─────────────────────────────────────────────────

export interface ParsedSection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  headingLevel: number;
}

export interface ClaudeMdDocument {
  raw: string;
  sections: ParsedSection[];
  detectedProjectType: ProjectType;
  secondaryProjectType?: ProjectType;
  language: string;
  contentHash: string;
}

// ─── Analysis Engine Output ──────────────────────────────────────────

export interface AnalysisIssue {
  id: string;
  sectionId: string | null;
  severity: IssueSeverity;
  title: string;
  description: string;
  line?: number;
  matchedText?: string;
  ruleId: string;
}

export interface AnalysisResult {
  document: ClaudeMdDocument;
  issues: AnalysisIssue[];
  missingSections: SectionType[];
  timestamp: number;
}

// ─── Enhancement Engine Output ───────────────────────────────────────

export interface Suggestion {
  id: string;
  category: SuggestionCategory;
  severity: IssueSeverity;
  relatedIssueId?: string;
  sectionId: string | null;
  title: string;
  description: string;
  currentText?: string;
  suggestedText: string;
  impact: number;
  reasoning: string;
}

// ─── Evaluation Engine Output ────────────────────────────────────────

export interface DimensionScore {
  dimension: ScoreDimension;
  score: number;  // 0–100
  weight: number; // 0.0–1.0
  explanation: string;
  issues: string[];
}

export interface EvaluationResult {
  dimensions: DimensionScore[];
  compositeScore: number;
  grade: Grade;
  summary: string;
}

// ─── Recommendation Engine Output ────────────────────────────────────

export interface SectionRecommendation {
  sectionType: SectionType;
  title: string;
  description: string;
  impact: number;
  template: string;
  reasoning: string;
}

// ─── Generator Engine ─────────────────────────────────────────────────

export interface GeneratorInput {
  lazyPrompt: string;
}

export interface GeneratorOutput {
  content: string;
  detectedProjectType: ProjectType;
  detectedTechnologies: string[];
  placeholders: string[];
  lineCount: number;
}

// ─── Orchestrator ────────────────────────────────────────────────────

export interface OptimizerResult {
  analysis: AnalysisResult;
  evaluation: EvaluationResult;
  suggestions: Suggestion[];
  recommendations: SectionRecommendation[];
  processingTimeMs: number;
}

export type OptimizerMode = "realtime" | "on-demand";

export interface OptimizerState {
  mode: OptimizerMode;
  isAnalyzing: boolean;
  result: OptimizerResult | null;
  error: string | null;
  lastAnalyzedHash: string | null;
}

// ─── UI State ────────────────────────────────────────────────────────

export type SidebarTab = "score" | "issues" | "suggestions" | "recommendations";

export interface SidebarState {
  isOpen: boolean;
  activeTab: SidebarTab;
  expandedSuggestionId: string | null;
  filterSeverity: IssueSeverity | "all";
}
```

- [ ] **Step 3: Run typecheck — expect errors in engines (good — they haven't been migrated)**

```bash
pnpm typecheck 2>&1 | grep "error TS" | wc -l
```

Expected: errors in engines referencing old ProjectType values like "code-focused", "design", "operations".

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor(types): align ProjectType/SectionType/ScoreDimension with knowledge layer and spec"
```

---

## Task 3: Migrate analysis engine

**Files:**
- Modify: `src/engines/analysis-engine.ts`

**Context:** The analysis engine has three sources of inline data to migrate:
1. `VAGUE_QUALIFIERS` / `HEDGE_WORDS` arrays → use `ANTI_PATTERNS` from knowledge
2. `SECTION_PATTERNS` → update from 14 old types to 9 new `SectionType`
3. `PROJECT_TYPE_SIGNALS` → update from 6 broad types to 10 specific types
4. `REQUIRED_FOR_PROJECT_TYPE` → update to new types on both axes

The engine's core logic (parseDocument, classifySection, detectProjectType, analyze functions) is well-structured and stays. Only the data and type references change.

- [ ] **Step 1: Add imports for knowledge layer at top of analysis-engine.ts**

Replace the current imports block (lines 1-17) with:
```typescript
import type {
  ClaudeMdDocument,
  ParsedSection,
  SectionType,
  AnalysisIssue,
  AnalysisResult,
  IssueSeverity,
} from "../types";
import type { ProjectType } from "../knowledge/section-templates";
import { ANTI_PATTERNS } from "../knowledge/antipatterns";
import { hashContent, generateId } from "../utils/helpers";
```

- [ ] **Step 2: Replace SECTION_PATTERNS with new 9-type taxonomy**

Replace the `SECTION_PATTERNS` constant (currently lines 21-78) with:
```typescript
const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  commands: [
    /\b(commands?|bash|scripts?|run|build|test|lint|deploy|start|dev)\b/i,
    /\b(pnpm|npm|yarn|pip|poetry|cargo|go run|make|docker)\b/i,
  ],
  code_style: [
    /\b(code style|style guide|conventions?|formatting|lint|prettier|eslint)\b/i,
    /\b(naming|camelCase|snake_case|PascalCase|indentation|semicolons?|imports?)\b/i,
  ],
  workflow: [
    /\b(workflow|process|checklist|steps?|protocol|how to work)\b/i,
    /\b(commit|branch|pull request|typecheck|type.?check|single test)\b/i,
  ],
  architecture: [
    /\b(architecture|arch|design|structure|tech stack|patterns?|overview)\b/i,
    /\b(database|auth|api|framework|library|module|service|router)\b/i,
  ],
  constraints: [
    /\b(constraints?|limitations?|restrictions?|boundaries?|rules?|must not)\b/i,
    /\b(do not|don't|never|avoid|prohibited|forbidden|off.?limits)\b/i,
  ],
  testing: [
    /\b(tests?|testing|spec|coverage|jest|vitest|pytest|tdd|unit|integration)\b/i,
    /\b(mock|fixture|assertion|expect|test runner|e2e)\b/i,
  ],
  gotchas: [
    /\b(gotchas?|pitfalls?|known issues?|caveats?|watch out|heads? up)\b/i,
    /\b(warning|caution|note:|important:|beware)\b/i,
  ],
  env_setup: [
    /\b(env|environment|setup|install|prerequisites?|requirements?|getting started)\b/i,
    /\b(\.env|api.?key|token|secret|env.?var|config|credentials?)\b/i,
  ],
  verification: [
    /\b(verificati|verify|validation?|done criteria|checklist|self.?review|sign.?off)\b/i,
    /\b(before.?commit|before.?push|before.?merge|ready.?to.?ship)\b/i,
  ],
};
```

- [ ] **Step 3: Replace PROJECT_TYPE_SIGNALS with 10 new project types**

Replace the `PROJECT_TYPE_SIGNALS` constant (currently lines 82-110) with:
```typescript
const PROJECT_TYPE_SIGNALS: Record<ProjectType, RegExp[]> = {
  "react-nextjs": [
    /\b(react|next\.?js|nextjs|app router|jsx|tsx|pages?\/|app\/)\b/i,
    /\b(component|hook|useState|useEffect|tailwind|shadcn)\b/i,
  ],
  "python-backend": [
    /\b(python|fastapi|flask|django|pydantic|uvicorn|gunicorn)\b/i,
    /\b(pip|poetry|pytest|mypy|ruff|black|sqlalchemy)\b/i,
  ],
  fullstack: [
    /\b(fullstack|full.?stack|frontend.?backend|backend.?frontend)\b/i,
    /\b(monorepo|turbo|nx|api.?routes?|server.?components?)\b/i,
  ],
  "data-analysis": [
    /\b(data.?analysis|analytics|dashboard|chart|graph|metric|kpi)\b/i,
    /\b(pandas|numpy|matplotlib|tableau|looker|bigquery|snowflake|dbt)\b/i,
  ],
  "content-creation": [
    /\b(content|blog|article|newsletter|social.?media|linkedin|twitter|post)\b/i,
    /\b(headline|copy|editorial|seo|brand.?voice|tone|audience)\b/i,
  ],
  "design-system": [
    /\b(design.?system|component.?library|storybook|figma|tokens?|theming)\b/i,
    /\b(ui.?kit|wireframe|prototype|typography|color.?palette|spacing)\b/i,
  ],
  "devops-infra": [
    /\b(devops|infra|infrastructure|deployment|monitoring|kubernetes|k8s)\b/i,
    /\b(terraform|docker|aws|gcp|azure|ci.?cd|pipeline|runbook)\b/i,
  ],
  mobile: [
    /\b(mobile|ios|android|react.?native|expo|flutter|swift|kotlin)\b/i,
    /\b(app.?store|play.?store|simulator|emulator|native|xcode)\b/i,
  ],
  "api-backend": [
    /\b(api|rest|graphql|grpc|endpoint|swagger|openapi|microservice)\b/i,
    /\b(express|fastify|hono|nestjs|prisma|drizzle|postgresql|redis)\b/i,
  ],
  generic: [], // fallback — detected when no other type scores above threshold
};
```

- [ ] **Step 4: Update detectProjectType to use new types and fallback to "generic"**

Update the `detectProjectType` function signature and fallback value. Find the line:
```typescript
primary: first[1] > 0 ? (first[0] as ProjectType) : "code-focused",
```
Replace with:
```typescript
primary: first[1] > 0 ? (first[0] as ProjectType) : "generic",
```

Also update the initialization of `scores` to use the new types:
```typescript
const scores: Record<ProjectType, number> = {
  "react-nextjs": 0,
  "python-backend": 0,
  "fullstack": 0,
  "data-analysis": 0,
  "content-creation": 0,
  "design-system": 0,
  "devops-infra": 0,
  "mobile": 0,
  "api-backend": 0,
  "generic": 0,
};
```

- [ ] **Step 5: Replace REQUIRED_FOR_PROJECT_TYPE with new types**

Replace the `REQUIRED_FOR_PROJECT_TYPE` constant (currently at line ~309) with:
```typescript
const REQUIRED_FOR_PROJECT_TYPE: Record<ProjectType, SectionType[]> = {
  "react-nextjs":     ["commands", "code_style", "workflow", "architecture"],
  "python-backend":   ["commands", "code_style", "workflow", "architecture"],
  "fullstack":        ["commands", "code_style", "workflow", "architecture", "constraints"],
  "data-analysis":    ["commands", "code_style", "workflow"],
  "content-creation": ["constraints", "workflow"],
  "design-system":    ["commands", "code_style", "architecture"],
  "devops-infra":     ["commands", "workflow", "constraints"],
  "mobile":           ["commands", "code_style", "workflow", "architecture"],
  "api-backend":      ["commands", "code_style", "workflow", "architecture", "constraints"],
  "generic":          ["commands", "workflow"],
};
```

- [ ] **Step 6: Replace VAGUE_QUALIFIERS and HEDGE_WORDS with ANTI_PATTERNS**

Remove the `VAGUE_QUALIFIERS` array (lines ~274-307) and `HEDGE_WORDS` array. Replace the vague-qualifier and hedge-word detection rules to use `ANTI_PATTERNS`:

```typescript
// ── Anti-pattern detection (from knowledge layer) ──
{
  id: "anti-pattern",
  severity: "warning",
  title: "Anti-pattern detected",
  test(doc) {
    const issues: AnalysisIssue[] = [];
    const fullContent = doc.sections.map((s) => `${s.title} ${s.content}`).join("\n");

    for (const ap of ANTI_PATTERNS) {
      if (ap.programmatic) continue; // handled by dedicated rules below
      const matches = fullContent.matchAll(new RegExp(ap.pattern.source, "gi"));
      for (const match of matches) {
        // Find which section this match is in
        const matchPos = match.index ?? 0;
        const sectionId = doc.sections.find((s) => {
          const sectionText = `${s.title} ${s.content}`;
          return sectionText.includes(match[0]);
        })?.id ?? null;

        issues.push({
          id: generateId(),
          sectionId,
          severity: ap.severity,
          title: `Anti-pattern: ${ap.id.replace(/-/g, " ")}`,
          description: ap.message,
          matchedText: match[0],
          ruleId: ap.id,
        });
      }
    }
    return issues;
  },
},

// ── Over 200 lines (programmatic) ──
{
  id: "over-200-lines",
  severity: "critical",
  title: "CLAUDE.md exceeds 200 lines",
  test(doc) {
    const lineCount = doc.raw.split("\n").length;
    if (lineCount <= 200) return [];
    return [{
      id: generateId(),
      sectionId: null,
      severity: "critical",
      title: `File is ${lineCount} lines (limit: 200)`,
      description:
        "Anthropic recommends under 200 lines. Longer files consume more context and reduce adherence. Move detailed content to .claude/rules/ files or use @imports.",
      ruleId: "over-200-lines",
    }];
  },
},

// ── No verification criteria (programmatic) ──
{
  id: "no-verification-criteria",
  severity: "critical",
  title: "No verification criteria",
  test(doc) {
    const hasRunnable = /`[^`]+`/.test(doc.raw) && /(pnpm|npm|yarn|pytest|cargo|go |make|npx)\s+\w+/.test(doc.raw);
    if (hasRunnable) return [];
    return [{
      id: generateId(),
      sectionId: null,
      severity: "critical",
      title: "No runnable verification commands found",
      description:
        "Per Anthropic: 'Give Claude a way to verify its work — this is the single highest-leverage thing you can do.' Add a Commands section with build/test/lint commands.",
      ruleId: "no-verification-criteria",
    }];
  },
},
```

- [ ] **Step 7: Fix classifySection fallback**

In `classifySection`, change the fallback from `"context"` to `"architecture"`:
```typescript
let bestMatch: SectionType = "architecture";
```

- [ ] **Step 8: Run typecheck — expect zero errors in analysis engine**

```bash
pnpm typecheck 2>&1 | grep "analysis-engine" | head -10
```

Expected: no errors from analysis-engine.ts.

- [ ] **Step 9: Run a quick smoke test**

```bash
cat > /tmp/test-analysis.ts << 'EOF'
import { analyze } from "./src/engines/analysis-engine";
const result = analyze("# My Project\n## Commands\n- Dev: `pnpm dev`\n- Test: `pnpm test`\n## Code style\n- Use 2-space indentation");
console.log("ProjectType:", result.document.detectedProjectType);
console.log("Issues:", result.issues.length);
console.log("PASS");
EOF
cd "/Users/c_mdevillele/Documents/Documents - L062N6GVX9/Claude Md optimizer" && npx tsx /tmp/test-analysis.ts
```

Expected: `PASS` printed without errors.

- [ ] **Step 10: Commit**

```bash
git add src/engines/analysis-engine.ts
git commit -m "refactor(analysis): use ANTI_PATTERNS from knowledge; update to 10 project types and 9 section types"
```

---

## Task 4: Migrate evaluation engine

**Files:**
- Modify: `src/engines/evaluation-engine.ts`

**Context:** The evaluation engine scores across 6 dimensions that don't match the spec. Replace with 5 Anthropic-aligned dimensions (from spec). The inline `VAGUE_PATTERNS`/`HEDGE_PATTERNS` arrays must use `ANTI_PATTERNS` from knowledge. `REQUIRED_SECTIONS` must use the new types.

**New dimension model:**
| Dimension | Weight | Core Algorithm |
|-----------|--------|----------------|
| actionability | 30% | +40 has commands, +25 test cmd, +15 lint cmd, +10 typecheck, +10 examples |
| conciseness | 25% | -30 if >200 lines, -15/self-evident match, -5/bloat match |
| specificity | 20% | -5/vague match, -3/hedge match |
| completeness | 15% | required present / required total × 100 |
| consistency | 10% | -25/contradiction, -10/duplicate |

- [ ] **Step 1: Add knowledge imports to evaluation-engine.ts**

After the existing `import type {...} from "../types"` block, add:
```typescript
import { ANTI_PATTERNS } from "../knowledge/antipatterns";
import { SECTION_TEMPLATES } from "../knowledge/section-templates";
import type { ProjectType } from "../knowledge/section-templates";
```

- [ ] **Step 2: Replace DIMENSION_WEIGHTS**

Replace:
```typescript
const DIMENSION_WEIGHTS: Record<ScoreDimension, number> = {
  completeness: 0.25,
  clarity: 0.25,
  technical_accuracy: 0.2,
  scope_alignment: 0.15,
  structure: 0.1,
  constraint_quality: 0.05,
};
```

With:
```typescript
const DIMENSION_WEIGHTS: Record<ScoreDimension, number> = {
  actionability: 0.30,
  conciseness: 0.25,
  specificity: 0.20,
  completeness: 0.15,
  consistency: 0.10,
};
```

- [ ] **Step 3: Replace REQUIRED_SECTIONS**

Replace the `REQUIRED_SECTIONS` constant with one derived from `SECTION_TEMPLATES`:
```typescript
function getRequiredSections(projectType: ProjectType): SectionType[] {
  const templates = SECTION_TEMPLATES[projectType];
  const headingToSection: Partial<Record<string, SectionType>> = {
    "## Commands": "commands",
    "## Code style": "code_style",
    "## Workflow": "workflow",
    "## Architecture": "architecture",
    "## Constraints": "constraints",
    "## Testing": "testing",
    "## Gotchas": "gotchas",
    "## Environment": "env_setup",
    "## Verification": "verification",
  };
  return templates
    .filter((t) => t.required)
    .map((t) => headingToSection[t.heading])
    .filter((s): s is SectionType => s !== undefined);
}
```

- [ ] **Step 4: Remove inline VAGUE_PATTERNS / HEDGE_PATTERNS / PASSIVE_PATTERNS**

Delete lines 61-89 (the three pattern arrays). These will be replaced by `ANTI_PATTERNS` usage.

- [ ] **Step 5: Replace all 6 scoring functions with 5 new ones**

The current functions (scoreCompleteness, scoreClarity, scoreTechnicalAccuracy, scoreScopeAlignment, scoreStructure, scoreConstraintQuality) are replaced by:

```typescript
// ─── Scoring Functions ───────────────────────────────────────────────

function scoreActionability(doc: ClaudeMdDocument): DimensionScore {
  const raw = doc.raw;
  const issues: string[] = [];
  let score = 0;

  const hasCommands = /```|\`[^`]+\`/.test(raw) && /(pnpm|npm|yarn|pip|cargo|go |make|npx)\s+\w+/.test(raw);
  if (hasCommands) score += 40;
  else issues.push("No runnable commands (build/dev/start) found");

  const hasTest = /(pnpm|npm|yarn|pip|pytest|cargo|go)\s+(test|run test|run spec)\b/i.test(raw);
  if (hasTest) score += 25;
  else issues.push("No test command found — Claude can't verify its own changes");

  const hasLint = /(pnpm|npm|yarn)\s+(lint|run lint)\b/i.test(raw) || /eslint|ruff|pylint/.test(raw);
  if (hasLint) score += 15;
  else issues.push("No lint command found");

  const hasTypecheck = /tsc\s+--noEmit|pnpm\s+typecheck|mypy|pyright/.test(raw);
  if (hasTypecheck) score += 10;

  const hasExamples = doc.sections.some((s) => s.type === "verification" || /example|e\.g\.|for instance/i.test(s.content));
  if (hasExamples) score += 10;

  return {
    dimension: "actionability",
    score: Math.min(100, score),
    weight: DIMENSION_WEIGHTS.actionability,
    explanation:
      score >= 80
        ? "Strong verification criteria. Claude can check its own work."
        : score >= 50
        ? "Some runnable commands present, but gaps remain (test, lint, typecheck)."
        : "Missing runnable commands. Per Anthropic: giving Claude a way to verify is the highest-leverage improvement.",
    issues,
  };
}

function scoreConciseness(doc: ClaudeMdDocument): DimensionScore {
  const lineCount = doc.raw.split("\n").length;
  const issues: string[] = [];
  let score = 100;

  if (lineCount > 300) {
    score -= 50;
    issues.push(`${lineCount} lines — severely over the 200-line limit`);
  } else if (lineCount > 200) {
    score -= 30;
    issues.push(`${lineCount} lines — over Anthropic's 200-line recommendation`);
  }

  const selfEvidentPatterns = ANTI_PATTERNS.filter(
    (ap) => !ap.programmatic && ap.severity === "critical" && ap.id.startsWith("self-evident")
  );
  for (const ap of selfEvidentPatterns) {
    const matches = doc.raw.match(new RegExp(ap.pattern, "gi"));
    if (matches) {
      score -= matches.length * 15;
      issues.push(`"${matches[0]}" — self-evident instruction (wastes context)`);
    }
  }

  const bloatPatterns = ANTI_PATTERNS.filter((ap) => !ap.programmatic && (ap.id.startsWith("api-docs") || ap.id.startsWith("file-by-file")));
  for (const ap of bloatPatterns) {
    const matches = doc.raw.match(new RegExp(ap.pattern, "gi"));
    if (matches) {
      score -= matches.length * 5;
      issues.push(`Inline content that should be linked: ${matches[0]}`);
    }
  }

  return {
    dimension: "conciseness",
    score: Math.max(0, score),
    weight: DIMENSION_WEIGHTS.conciseness,
    explanation:
      score >= 90
        ? "File is tight. No bloat detected."
        : score >= 60
        ? "Some bloat present — self-evident instructions or over-length."
        : "File is too long or contains self-evident padding. Claude will skip instructions.",
    issues,
  };
}

function scoreSpecificity(doc: ClaudeMdDocument): DimensionScore {
  const fullContent = doc.raw;
  const issues: string[] = [];
  let penaltyPoints = 0;

  const vaguePatterns = ANTI_PATTERNS.filter((ap) => !ap.programmatic && ap.id.startsWith("vague-"));
  for (const ap of vaguePatterns) {
    const matches = fullContent.match(new RegExp(ap.pattern, "gi"));
    if (matches) {
      penaltyPoints += matches.length * 5;
      issues.push(`"${matches[0]}" — ${ap.message.split(".")[0]}`);
    }
  }

  const hedgePatterns = ANTI_PATTERNS.filter((ap) => !ap.programmatic && ap.id.startsWith("hedge-"));
  for (const ap of hedgePatterns) {
    const matches = fullContent.match(new RegExp(ap.pattern, "gi"));
    if (matches) {
      penaltyPoints += matches.length * 3;
      issues.push(`"${matches[0]}" — hedge word weakens instruction`);
    }
  }

  const score = Math.max(0, 100 - penaltyPoints);

  return {
    dimension: "specificity",
    score,
    weight: DIMENSION_WEIGHTS.specificity,
    explanation:
      score >= 90
        ? "Instructions are concrete and direct."
        : score >= 60
        ? "Several vague qualifiers or hedge words — Claude will have to guess intent."
        : "Many ambiguous instructions. Per Anthropic: '2-space indentation' not 'format code properly'.",
    issues,
  };
}

function scoreCompleteness(doc: ClaudeMdDocument): DimensionScore {
  const required = getRequiredSections(doc.detectedProjectType);
  const present = new Set(doc.sections.map((s) => s.type));
  const missing = required.filter((t) => !present.has(t));
  const score = required.length === 0 ? 100 : Math.round((required.filter((t) => present.has(t)).length / required.length) * 100);
  const issues = missing.map((t) => `Missing "${t}" section`);

  return {
    dimension: "completeness",
    score,
    weight: DIMENSION_WEIGHTS.completeness,
    explanation:
      score >= 90
        ? "All required sections present for this project type."
        : score >= 60
        ? `${missing.length} required section(s) missing: ${missing.join(", ")}.`
        : `Significant gaps: ${missing.length} of ${required.length} required sections absent.`,
    issues,
  };
}

function scoreConsistency(doc: ClaudeMdDocument): DimensionScore {
  const issues: string[] = [];
  let score = 100;

  // Contradiction: "always X" vs "never X"
  const alwaysMatches = [...doc.raw.matchAll(/always\s+(\w+(?:\s+\w+){0,3})/gi)];
  const neverMatches = [...doc.raw.matchAll(/never\s+(\w+(?:\s+\w+){0,3})/gi)];

  for (const a of alwaysMatches) {
    for (const n of neverMatches) {
      const overlap = a[1].split(" ").filter((w) => n[1].includes(w));
      if (overlap.length >= 2) {
        score -= 25;
        issues.push(`Possible contradiction: "always ${a[1]}" vs "never ${n[1]}"`);
      }
    }
  }

  // Duplicate instructions (Jaccard > 0.7)
  const sentences = doc.raw.split(/[.!?\n]/).map((s) => s.trim()).filter((s) => s.length > 25);
  const seen: string[] = [];
  for (const sent of sentences) {
    const isDupe = seen.some((s) => {
      const wordsA = new Set(s.toLowerCase().split(/\s+/));
      const wordsB = new Set(sent.toLowerCase().split(/\s+/));
      const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
      const union = new Set([...wordsA, ...wordsB]).size;
      return intersection / union > 0.7;
    });
    if (isDupe) {
      score -= 10;
      issues.push(`Duplicate instruction detected: "${sent.slice(0, 60)}..."`);
    } else {
      seen.push(sent);
    }
  }

  return {
    dimension: "consistency",
    score: Math.max(0, score),
    weight: DIMENSION_WEIGHTS.consistency,
    explanation:
      score >= 90 ? "No contradictions or duplicates found." : `${issues.length} consistency issue(s) found.`,
    issues,
  };
}
```

- [ ] **Step 6: Update the evaluate() function to use new scoring functions**

Replace the current `evaluate()` call to use the new 5 functions:
```typescript
export function evaluate(doc: ClaudeMdDocument, _analysis: AnalysisResult): EvaluationResult {
  const dimensionScores = [
    scoreActionability(doc),
    scoreConciseness(doc),
    scoreSpecificity(doc),
    scoreCompleteness(doc),
    scoreConsistency(doc),
  ];

  const compositeScore = Math.round(
    dimensionScores.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  const grade: Grade =
    compositeScore >= 90 ? "A" :
    compositeScore >= 75 ? "B" :
    compositeScore >= 60 ? "C" :
    compositeScore >= 40 ? "D" : "F";

  const summary =
    grade === "A" ? "CLAUDE.md is tight, actionable, and ready to ship." :
    grade === "B" ? "CLAUDE.md is solid with minor improvements possible." :
    grade === "C" ? "CLAUDE.md is functional but has notable issues." :
    grade === "D" ? "CLAUDE.md has significant problems affecting Claude's performance." :
    "CLAUDE.md needs a rewrite — too much bloat, ambiguity, or missing essentials.";

  return { dimensions: dimensionScores, compositeScore, grade, summary };
}
```

- [ ] **Step 7: Run typecheck for evaluation engine**

```bash
pnpm typecheck 2>&1 | grep "evaluation-engine" | head -10
```

Expected: no errors.

- [ ] **Step 8: Smoke test**

```bash
cat > /tmp/test-eval.ts << 'EOF'
import { evaluate } from "./src/engines/evaluation-engine";
import { analyze } from "./src/engines/analysis-engine";
const content = `# Project\n## Commands\n- Dev: \`pnpm dev\`\n- Test: \`pnpm test\`\n- Lint: \`pnpm lint\`\n## Code style\n- 2-space indent\n## Workflow\n- Typecheck: \`pnpm typecheck\``;
const analysis = analyze(content);
const result = evaluate(analysis.document, analysis);
console.log("Grade:", result.grade, "Score:", result.compositeScore);
console.log("PASS");
EOF
cd "/Users/c_mdevillele/Documents/Documents - L062N6GVX9/Claude Md optimizer" && npx tsx /tmp/test-eval.ts
```

Expected: `Grade: B` or better, `PASS`.

- [ ] **Step 9: Commit**

```bash
git add src/engines/evaluation-engine.ts
git commit -m "refactor(evaluation): replace 6-dim model with 5 Anthropic-aligned dimensions; use ANTI_PATTERNS"
```

---

## Task 5: Migrate enhancement engine

**Files:**
- Modify: `src/engines/enhancement-engine.ts`

**Context:** The enhancement engine maps `ruleId` strings to suggestion generators. The inline `replacements` and `directReplacements` maps largely overlap with `ANTI_PATTERNS[].fix` fields. Migrate by: (1) adding knowledge imports; (2) updating generators to use `ANTI_PATTERNS.find(ap => ap.id === ruleId)?.fix` for reasoning; (3) adding generators for the new rule IDs introduced by the anti-pattern detection.

- [ ] **Step 1: Add knowledge imports**

After the existing imports, add:
```typescript
import { ANTI_PATTERNS } from "../knowledge/antipatterns";
```

- [ ] **Step 2: Add helper to get AntiPattern fix text**

After the imports, add:
```typescript
function getAntiPatternFix(ruleId: string): string | null {
  return ANTI_PATTERNS.find((ap) => ap.id === ruleId)?.fix ?? null;
}
```

- [ ] **Step 3: Update the "vague-qualifier" generator reasoning**

In the `"vague-qualifier"` generator, update the `reasoning` field to reference Anthropic:
```typescript
reasoning: getAntiPatternFix("vague-" + matched.replace(/\s+/g, "-").toLowerCase()) ??
  "Anthropic: 'Use 2-space indentation' not 'Format code properly.' Vague instructions produce inconsistent output.",
```

- [ ] **Step 4: Add generators for new rule IDs**

Add new entries to `GENERATORS` for the rules introduced by the knowledge-layer anti-patterns:

```typescript
"self-evident-clean-code": (issue, _section) => ({
  id: generateId(),
  category: "enhancement",
  severity: "critical",
  relatedIssueId: issue.id,
  sectionId: null,
  title: "Remove self-evident instruction",
  description: issue.description,
  currentText: issue.matchedText,
  suggestedText: "← Remove this line entirely",
  impact: 9,
  reasoning: getAntiPatternFix("self-evident-clean-code") ??
    "Claude already writes clean code. This wastes context tokens per Anthropic's official guidance.",
}),

"over-200-lines": (_issue, _section) => ({
  id: generateId(),
  category: "gap",
  severity: "critical",
  relatedIssueId: _issue.id,
  sectionId: null,
  title: "Split CLAUDE.md into focused files",
  description: _issue.description,
  currentText: undefined,
  suggestedText:
    "Move detailed content to `.claude/rules/` files.\n" +
    "Reference them in CLAUDE.md with: `@.claude/rules/testing.md`",
  impact: 8,
  reasoning: "Anthropic: under 200 lines. Longer files reduce adherence.",
}),

"no-verification-criteria": (_issue, _section) => ({
  id: generateId(),
  category: "gap",
  severity: "critical",
  relatedIssueId: _issue.id,
  sectionId: null,
  title: "Add verification commands",
  description: _issue.description,
  currentText: undefined,
  suggestedText:
    "## Commands\n- Dev: `pnpm dev`\n- Build: `pnpm build`\n- Test: `pnpm test`\n- Lint: `pnpm lint`\n- Type check: `pnpm tsc --noEmit`",
  impact: 10,
  reasoning:
    "Per Anthropic: 'Give Claude a way to verify its work — this is the single highest-leverage thing you can do.'",
}),
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck 2>&1 | grep "enhancement-engine" | head -10
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/engines/enhancement-engine.ts
git commit -m "refactor(enhancement): use ANTI_PATTERNS.fix for reasoning; add generators for new anti-pattern rule IDs"
```

---

## Task 6: Migrate recommendation engine

**Files:**
- Modify: `src/engines/recommendation-engine.ts`

**Context:** The recommendation engine uses `SectionType` values from the old taxonomy (role, context, examples, error_handling, etc.) and `ProjectType` values from the old 6-type model. Both need updating. The `applicableTo` arrays use old project types. Replace inline recommendation templates with ones that cover the new 9 `SectionType` values.

- [ ] **Step 1: Add knowledge imports**

After existing imports, add:
```typescript
import { SECTION_TEMPLATES } from "../knowledge/section-templates";
import type { ProjectType } from "../knowledge/section-templates";
```

- [ ] **Step 2: Update all `applicableTo` arrays**

The old values: `"code-focused"`, `"content-creation"`, `"data-analysis"`, `"design"`, `"operations"`, `"mixed"`.

Replace ALL occurrences of old project types in `applicableTo` arrays:

```typescript
// Old → New mapping:
// "code-focused" → "react-nextjs", "python-backend", "fullstack", "api-backend", "mobile"
// "content-creation" → "content-creation"
// "data-analysis" → "data-analysis"
// "design" → "design-system"
// "operations" → "devops-infra"
// "mixed" → "generic", "fullstack"

// Universal (all types):
applicableTo: ["react-nextjs", "python-backend", "fullstack", "data-analysis", "content-creation", "design-system", "devops-infra", "mobile", "api-backend", "generic"]
```

- [ ] **Step 3: Update sectionType fields to new taxonomy**

The old `SectionType` values used in templates (`"role"`, `"context"`, `"examples"`, `"error_handling"`, `"brand_voice"`, `"testing"`, `"workflow"`, `"dependencies"`, `"accessibility"`, `"output_format"`, `"code_conventions"`) must map to the new types. Update each `RecommendationTemplate.sectionType` field:

| Old | New |
|-----|-----|
| `"examples"` | `"verification"` |
| `"error_handling"` | `"constraints"` |
| `"testing"` | `"testing"` |
| `"workflow"` | `"workflow"` |
| `"code_conventions"` | `"code_style"` |
| `"dependencies"` | `"architecture"` |
| `"brand_voice"` | `"constraints"` |
| `"role"` | `"commands"` (remove — role is an anti-pattern per spec) |
| `"context"` | `"architecture"` |
| `"output_format"` | `"workflow"` |
| `"accessibility"` | `"constraints"` |
| `"security"` | `"constraints"` |

Add new high-priority recommendation for the `"commands"` section (the #1 most impactful addition per spec):

```typescript
{
  sectionType: "commands",
  title: "Add Commands Section",
  description: "Bash commands Claude can't guess: build, test, lint, typecheck, dev server.",
  baseImpact: 10,
  template: `## Commands
- Dev: \`pnpm dev\`
- Build: \`pnpm build\`
- Test: \`pnpm test [filename]\`
- Lint: \`pnpm lint\`
- Type check: \`pnpm tsc --noEmit\``,
  reasoning:
    "Anthropic: 'The #1 thing you can add to CLAUDE.md. Give Claude a way to verify its work.' Commands are the highest-leverage section.",
  applicableTo: ["react-nextjs", "python-backend", "fullstack", "data-analysis", "design-system", "devops-infra", "mobile", "api-backend", "generic"],
},
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck 2>&1 | grep "recommendation-engine" | head -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/engines/recommendation-engine.ts
git commit -m "refactor(recommendation): update to 10 project types, 9 section types; add commands recommendation"
```

---

## Task 7: Create generator engine

**Files:**
- Create: `src/engines/generator-engine.ts`

**Context:** The generator engine is the core new feature. It takes a lazy prompt ("React dashboard with Supabase") and produces a complete, tight CLAUDE.md using `SECTION_TEMPLATES` from the knowledge layer. Algorithm: detect project type → select template → fill placeholders from prompt → apply best practices → output markdown string.

Key design rules from spec:
- Concise by default: every line must answer "would removing this cause Claude to make mistakes?"
- No self-evident padding
- Actionable commands always present
- Unfilled items marked `[PLACEHOLDER]`
- Target under 60 lines for output

- [ ] **Step 1: Create src/engines/generator-engine.ts**

```typescript
/**
 * Generator Engine
 *
 * Converts a lazy natural-language prompt into a complete, tight CLAUDE.md.
 * Uses SECTION_TEMPLATES as the structural backbone.
 * Never adds self-evident instructions. Always includes runnable commands.
 */

import type { GeneratorInput, GeneratorOutput } from "../types";
import type { ProjectType } from "../knowledge/section-templates";
import { SECTION_TEMPLATES } from "../knowledge/section-templates";
import { ANTI_PATTERNS } from "../knowledge/antipatterns";

// ─── Technology Detection ─────────────────────────────────────────────

interface TechSignal {
  keyword: RegExp;
  tech: string;
  projectType: ProjectType;
  section: "architecture" | "code_style" | "commands";
  content: string; // what to inject
}

const TECH_SIGNALS: TechSignal[] = [
  // Package managers / runtime
  { keyword: /\bpnpm\b/i, tech: "pnpm", projectType: "react-nextjs", section: "commands", content: "- Package manager: `pnpm`" },
  { keyword: /\bnpm\b/i, tech: "npm", projectType: "react-nextjs", section: "commands", content: "- Package manager: `npm`" },

  // Frontend frameworks
  { keyword: /\bnext\.?js\b|\bnextjs\b/i, tech: "Next.js", projectType: "react-nextjs", section: "architecture", content: "- Framework: Next.js (App Router)" },
  { keyword: /\breact\b/i, tech: "React", projectType: "react-nextjs", section: "architecture", content: "- Frontend: React with hooks — no class components" },
  { keyword: /\bvue\b/i, tech: "Vue", projectType: "react-nextjs", section: "architecture", content: "- Frontend: Vue 3 (Composition API)" },

  // Styling
  { keyword: /\btailwind\b/i, tech: "Tailwind", projectType: "react-nextjs", section: "code_style", content: "- Styling: Tailwind CSS — no CSS modules or styled-components" },

  // Databases / BaaS
  { keyword: /\bsupabase\b/i, tech: "Supabase", projectType: "react-nextjs", section: "architecture", content: "- Database: Supabase (auth + database)" },
  { keyword: /\bprisma\b/i, tech: "Prisma", projectType: "api-backend", section: "architecture", content: "- ORM: Prisma" },
  { keyword: /\bpostgres\b|\bpostgresql\b/i, tech: "PostgreSQL", projectType: "api-backend", section: "architecture", content: "- Database: PostgreSQL" },
  { keyword: /\bmongo\b|\bmongodb\b/i, tech: "MongoDB", projectType: "api-backend", section: "architecture", content: "- Database: MongoDB" },

  // Python stack
  { keyword: /\bfastapi\b/i, tech: "FastAPI", projectType: "python-backend", section: "architecture", content: "- Framework: FastAPI" },
  { keyword: /\bflask\b/i, tech: "Flask", projectType: "python-backend", section: "architecture", content: "- Framework: Flask" },
  { keyword: /\bdjango\b/i, tech: "Django", projectType: "python-backend", section: "architecture", content: "- Framework: Django" },
  { keyword: /\bpython\b/i, tech: "Python", projectType: "python-backend", section: "commands", content: "- Runtime: Python 3.x+" },

  // Data
  { keyword: /\bdbt\b/i, tech: "dbt", projectType: "data-analysis", section: "architecture", content: "- Transform: dbt" },
  { keyword: /\bsnowflake\b/i, tech: "Snowflake", projectType: "data-analysis", section: "architecture", content: "- Warehouse: Snowflake" },
  { keyword: /\bbigquery\b/i, tech: "BigQuery", projectType: "data-analysis", section: "architecture", content: "- Warehouse: BigQuery" },

  // DevOps
  { keyword: /\bterraform\b/i, tech: "Terraform", projectType: "devops-infra", section: "commands", content: "- IaC: Terraform" },
  { keyword: /\bkubernetes\b|\bk8s\b/i, tech: "Kubernetes", projectType: "devops-infra", section: "architecture", content: "- Orchestration: Kubernetes" },
  { keyword: /\bdocker\b/i, tech: "Docker", projectType: "devops-infra", section: "commands", content: "- Container: Docker" },
];

// ─── Project Type Detection ────────────────────────────────────────────

const TYPE_SIGNALS: Record<ProjectType, RegExp> = {
  "react-nextjs": /\b(react|next\.?js|nextjs|tailwind|shadcn|vercel)\b/i,
  "python-backend": /\b(python|fastapi|flask|django|pydantic|uvicorn)\b/i,
  "fullstack": /\b(fullstack|full.?stack|trpc|monorepo|turbo)\b/i,
  "data-analysis": /\b(data.?analysis|analytics|pandas|dbt|snowflake|bigquery|looker)\b/i,
  "content-creation": /\b(blog|article|newsletter|content|copywriting|editorial|social.?media)\b/i,
  "design-system": /\b(design.?system|storybook|figma|component.?library|ui.?kit)\b/i,
  "devops-infra": /\b(devops|terraform|kubernetes|k8s|docker|infra|ci.?cd)\b/i,
  "mobile": /\b(mobile|react.?native|expo|flutter|swift|kotlin|ios|android)\b/i,
  "api-backend": /\b(api|rest|graphql|grpc|express|fastify|nestjs|hono)\b/i,
  "generic": /./,
};

function detectProjectType(prompt: string): ProjectType {
  for (const [type, signal] of Object.entries(TYPE_SIGNALS) as [ProjectType, RegExp][]) {
    if (type === "generic") continue;
    if (signal.test(prompt)) return type;
  }
  return "generic";
}

// ─── Default Commands by Project Type ─────────────────────────────────

const DEFAULT_COMMANDS: Record<ProjectType, string> = {
  "react-nextjs": `- Dev: \`pnpm dev\`
- Build: \`pnpm build\`
- Test: \`pnpm test [filename]\`
- Lint: \`pnpm lint\`
- Type check: \`pnpm tsc --noEmit\``,
  "python-backend": `- Dev: \`uvicorn main:app --reload\`
- Test: \`pytest tests/ -v\`
- Lint: \`ruff check .\`
- Type check: \`mypy .\`
- Format: \`black .\``,
  "fullstack": `- Dev: \`pnpm dev\`
- Test: \`pnpm test\`
- Lint: \`pnpm lint\`
- Type check: \`pnpm typecheck\``,
  "data-analysis": `- Run notebook: \`jupyter notebook\`
- Test: \`pytest tests/ -v\`
- Lint: \`ruff check .\``,
  "content-creation": `- Lint: \`vale .\` (if configured)
- Preview: \`[your preview command]\``,
  "design-system": `- Dev: \`pnpm storybook\`
- Build: \`pnpm build-storybook\`
- Test: \`pnpm test\``,
  "devops-infra": `- Plan: \`terraform plan\`
- Apply: \`terraform apply\`
- Lint: \`tflint\`
- Validate: \`terraform validate\``,
  "mobile": `- Dev: \`pnpm start\`
- iOS: \`pnpm ios\`
- Android: \`pnpm android\`
- Test: \`pnpm test\``,
  "api-backend": `- Dev: \`pnpm dev\`
- Test: \`pnpm test\`
- Lint: \`pnpm lint\`
- Type check: \`pnpm tsc --noEmit\`
- Migrate: \`pnpm db:migrate\``,
  "generic": `- Build: \`[your build command]\`
- Test: \`[your test command]\`
- Lint: \`[your lint command]\``,
};

// ─── Main Generator ────────────────────────────────────────────────────

export function generate(input: GeneratorInput): GeneratorOutput {
  const { lazyPrompt } = input;
  const projectType = detectProjectType(lazyPrompt);
  const template = SECTION_TEMPLATES[projectType];

  // Detect technologies mentioned in prompt
  const detectedTechs = TECH_SIGNALS
    .filter((s) => s.keyword.test(lazyPrompt))
    .map((s) => s.tech);

  // Build sections from template
  const sections: string[] = [];

  for (const section of template) {
    let content = section.content;

    // Replace technology placeholders based on detected techs
    for (const tech of TECH_SIGNALS.filter((s) => s.keyword.test(lazyPrompt))) {
      if (tech.section === "architecture" && section.heading.toLowerCase().includes("architecture")) {
        content = content + "\n" + tech.content;
      }
      if (tech.section === "code_style" && section.heading.toLowerCase().includes("code style")) {
        content = content + "\n" + tech.content;
      }
    }

    // Inject default commands for commands section
    if (section.heading === "## Commands") {
      content = DEFAULT_COMMANDS[projectType];
    }

    sections.push(`${section.heading}\n${content}`);
  }

  const output = sections.join("\n\n");

  // Extract remaining [PLACEHOLDER] markers
  const placeholderRegex = /\[([A-Z_:]+)\]/g;
  const placeholders = [...output.matchAll(placeholderRegex)].map((m) => m[0]);
  const uniquePlaceholders = [...new Set(placeholders)];

  // Ensure output is under 200 lines
  const lines = output.split("\n");

  return {
    content: output,
    detectedProjectType: projectType,
    detectedTechnologies: detectedTechs,
    placeholders: uniquePlaceholders,
    lineCount: lines.length,
  };
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck 2>&1 | grep "generator-engine" | head -10
```

Expected: no errors.

- [ ] **Step 3: Smoke test with the 4 canonical prompts from spec**

```bash
cat > /tmp/test-generator.ts << 'EOF'
import { generate } from "./src/engines/generator-engine";

const tests = [
  { prompt: "React dashboard with Supabase and Tailwind", expectType: "react-nextjs" },
  { prompt: "Python FastAPI backend with PostgreSQL", expectType: "python-backend" },
  { prompt: "data pipeline with dbt and Snowflake", expectType: "data-analysis" },
  { prompt: "blog content creation tool", expectType: "content-creation" },
];

let pass = true;
for (const t of tests) {
  const result = generate({ lazyPrompt: t.prompt });
  if (result.detectedProjectType !== t.expectType) {
    console.error(`FAIL: "${t.prompt}" → ${result.detectedProjectType} (expected ${t.expectType})`);
    pass = false;
  }
  if (result.lineCount > 80) {
    console.error(`FAIL: "${t.prompt}" output is ${result.lineCount} lines (max 80 for initial output)`);
    pass = false;
  }
  // Must include commands section
  if (!result.content.includes("## Commands")) {
    console.error(`FAIL: "${t.prompt}" output missing ## Commands section`);
    pass = false;
  }
  // Must not contain self-evident phrases
  if (/write clean code|follow best practices|good quality/i.test(result.content)) {
    console.error(`FAIL: "${t.prompt}" output contains self-evident instruction`);
    pass = false;
  }
}
if (pass) console.log("PASS — all 4 canonical prompts generate valid CLAUDE.md");
EOF
cd "/Users/c_mdevillele/Documents/Documents - L062N6GVX9/Claude Md optimizer" && npx tsx /tmp/test-generator.ts
```

Expected: `PASS — all 4 canonical prompts generate valid CLAUDE.md`

- [ ] **Step 4: Commit**

```bash
git add src/engines/generator-engine.ts
git commit -m "feat(generator): add lazy prompt → CLAUDE.md generator using SECTION_TEMPLATES"
```

---

## Task 8: Update barrel exports

**Files:**
- Modify: `src/engines/index.ts`

**Context:** Add `generate` export from the new generator engine. Also verify the full typecheck passes across the entire project.

- [ ] **Step 1: Update src/engines/index.ts**

Replace the file content with:
```typescript
/**
 * Barrel export for all engines.
 */

export { analyze, parseDocument, detectProjectType, detectLanguage } from "./analysis-engine";
export { evaluate } from "./evaluation-engine";
export { generateSuggestions } from "./enhancement-engine";
export { generateRecommendations } from "./recommendation-engine";
export { run, clearCache, hasCachedResult } from "./orchestrator";
export { generate } from "./generator-engine";
```

- [ ] **Step 2: Run full typecheck — must be zero errors**

```bash
pnpm typecheck
```

Expected: exits with code 0, no errors.

- [ ] **Step 3: Run all smoke tests end-to-end**

```bash
cat > /tmp/test-full.ts << 'EOF'
import { analyze } from "./src/engines/analysis-engine";
import { evaluate } from "./src/engines/evaluation-engine";
import { generateSuggestions } from "./src/engines/enhancement-engine";
import { generateRecommendations } from "./src/engines/recommendation-engine";
import { generate } from "./src/engines/generator-engine";

// Test 1: Generator + full pipeline
const generated = generate({ lazyPrompt: "React dashboard with Supabase and Tailwind" });
const analysis = analyze(generated.content);
const evaluation = evaluate(analysis.document, analysis);
const suggestions = generateSuggestions(analysis);
const recommendations = generateRecommendations(analysis, evaluation);

console.log("Test 1 — Generator → Pipeline:");
console.log("  ProjectType:", generated.detectedProjectType);
console.log("  Technologies:", generated.detectedTechnologies.join(", "));
console.log("  Grade:", evaluation.grade, evaluation.compositeScore);
console.log("  Suggestions:", suggestions.length);
console.log("  Recommendations:", recommendations.length);

// Test 2: Optimizer on self-evident bloat (should get F)
const bloat = "# Instructions\nYou are a helpful coding assistant. Write good quality code and follow best practices. Handle errors properly.";
const bloatAnalysis = analyze(bloat);
const bloatEval = evaluate(bloatAnalysis.document, bloatAnalysis);
console.log("\nTest 2 — Self-evident bloat:");
console.log("  Grade:", bloatEval.grade, "(expect D or F)");
if (bloatEval.compositeScore > 40) {
  console.error("  FAIL: bloated file scored too high:", bloatEval.compositeScore);
  process.exit(1);
}

// Test 3: Good CLAUDE.md (should get B or better)
const good = `# Project\n## Commands\n- Dev: \`pnpm dev\`\n- Test: \`pnpm test\`\n- Lint: \`pnpm lint\`\n- Type check: \`pnpm tsc --noEmit\`\n## Code style\n- Use 2-space indentation\n- ES modules only\n## Workflow\n- Typecheck after changes\n- Run single file tests`;
const goodAnalysis = analyze(good);
const goodEval = evaluate(goodAnalysis.document, goodAnalysis);
console.log("\nTest 3 — Good CLAUDE.md:");
console.log("  Grade:", goodEval.grade, "(expect B or A)");
if (goodEval.compositeScore < 60) {
  console.error("  FAIL: good file scored too low:", goodEval.compositeScore);
  process.exit(1);
}

console.log("\n✓ All tests passed");
EOF
cd "/Users/c_mdevillele/Documents/Documents - L062N6GVX9/Claude Md optimizer" && npx tsx /tmp/test-full.ts
```

Expected: all 3 tests pass.

- [ ] **Step 4: Final commit**

```bash
git add src/engines/index.ts
git commit -m "feat: export generate from engines barrel; verify full engine pipeline"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm dev` — Next.js starts without errors
- [ ] Generator test: `generate({ lazyPrompt: "React dashboard with Supabase" })` returns content under 80 lines with Commands section, no self-evident phrases
- [ ] Bloat test: analyze `"Write good quality code and follow best practices"` → grade D or F
- [ ] Good file test: analyze a tight CLAUDE.md with Commands/Code style/Workflow → grade B or A
- [ ] All 5 engines import from `src/knowledge/` — no duplicated anti-pattern/project-type data
