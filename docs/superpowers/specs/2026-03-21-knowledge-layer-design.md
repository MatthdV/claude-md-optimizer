# Knowledge Layer — Design Spec
*Date: 2026-03-21*

## Context

The Claude.md Generator & Optimizer app includes a knowledge layer (`src/knowledge/`) that powers both the generator engine (lazy prompt → CLAUDE.md) and the optimizer engines (analysis, evaluation, enhancement, recommendation).

The existing spec defines the structure but leaves the content sparse. This document defines the enriched knowledge layer incorporating the latest Anthropic Claude Code documentation (March 2026), including modern features: path-scoped rules, skills, hooks, subagents, and `@` imports.

## Scope

Four files:
```
src/knowledge/
├── best-practices.ts      ← +1 category "features", ~12 new rules
├── antipatterns.ts        ← +8 new patterns
├── section-templates.ts   ← 9 missing project type templates + universal modern_claude_code section
└── thinking-levels.ts     ← unchanged (spec already complete)
```

Out of scope: engines, UI, store. This spec covers knowledge data only.

---

## 1. `best-practices.ts`

### Interface (unchanged)
```typescript
export interface BestPractice {
  id: string;
  rule: string;
  source: string;
  category: "include" | "exclude" | "structure" | "style" | "features";
  severity: "critical" | "warning" | "suggestion";
}
```

### New rules added to existing categories

**`include` category:**
- `include-at-imports` (warning): Use `@README.md`, `@package.json` imports to give Claude project context from files it can read directly — don't inline their content.
- `include-verification-criteria` (critical): Include runnable verification criteria (test commands, lint commands, expected outputs) so Claude can check its own work. Per Anthropic: "This is the single highest-leverage thing you can do."

**`exclude` category:**
- `exclude-path-specific-in-main` (warning): Do NOT put path-specific instructions (e.g., "for .ts files", "in the API directory") in the main CLAUDE.md — use `.claude/rules/` with `paths:` frontmatter instead.

**`structure` category:**
- `use-imports-to-split` (warning): When CLAUDE.md grows large, split with `@path/to/import` rather than inlining all content. Imported files load at launch alongside the main file.

**`style` category:**
- `treat-like-code` (warning): Treat CLAUDE.md like code — review when things go wrong, prune regularly, test that behavior actually changes when you add or remove a rule.
- `limit-emphasis` (suggestion): Reserve `IMPORTANT` and `YOU MUST` for ≤ 2 truly critical rules. Over-emphasis dilutes adherence.

### New `"features"` category

These rules teach the optimizer to recommend the right Claude Code feature for each type of instruction. Note: `use-imports-for-reference` and `verification-is-highest-leverage` are intentionally kept in the `include` category only — they are not duplicated here to avoid double-counting in the evaluation engine.

| ID | Rule | Severity |
|----|------|----------|
| `use-hooks-for-mandatory` | If an action MUST happen every time with zero exceptions, use a hook (`.claude/settings.json`), not a CLAUDE.md instruction. Hooks are deterministic; CLAUDE.md is advisory. | critical |
| `use-skills-for-domain` | Domain-specific knowledge or repeatable workflows belong in a skill (`.claude/skills/<topic>/SKILL.md`), not CLAUDE.md. Skills load on demand without consuming context every session. | warning |
| `use-rules-for-path-scoped` | Instructions that only apply to specific file types or directories belong in `.claude/rules/` with `paths:` frontmatter, not in the main CLAUDE.md. They load only when matching files are opened. | warning |
| `use-subagents-for-isolation` | Tasks that read many files or need focused, isolated context should be delegated to a subagent (`.claude/agents/`), not described as instructions in CLAUDE.md. | suggestion |

---

## 2. `antipatterns.ts`

### Interface (unchanged)
```typescript
export interface AntiPattern {
  id: string;
  pattern: RegExp; // use /.^/ (never-matches sentinel) for programmatically-detected patterns
  message: string;
  severity: "critical" | "warning" | "suggestion";
  fix: string;
}
```

Note: The original interface uses `pattern: RegExp`. To avoid a breaking change, programmatic patterns use the sentinel `/.^/` (a regex that never matches). The analysis engine checks for this sentinel and switches to structural detection logic. This preserves the interface contract.

### 8 new anti-patterns

| ID | Detection | Message | Severity | Fix |
|----|-----------|---------|----------|-----|
| `mandatory-action-not-hook` | Regex: `/\b(always run\|after every\|before each\|run .* after every\|must run)\b/i` | This mandatory action belongs in a hook, not an advisory instruction. Claude may ignore CLAUDE.md — hooks never do. | critical | Configure a hook in `.claude/settings.json`. Ask Claude: "Write a hook that runs [action] after every file edit." |
| `skill-content-in-claude-md` | Programmatic: section > 15 lines on a single domain topic (API conventions, DB schema, etc.) | This domain-specific block belongs in a skill, not CLAUDE.md. It loads context every session even when irrelevant. | warning | Create `.claude/skills/<topic>/SKILL.md` with this content. Reference it as "Use the api-conventions skill for API patterns." |
| `missing-at-imports` | Programmatic: no `@` imports found AND file > 50 lines AND a `README.md` or `package.json` exists in the project root | Missing `@` imports. Claude can read README and package.json directly — reference them instead of duplicating. Only flagged for code projects (not content-creation) with substantial content where a README exists. | warning | Add to top of CLAUDE.md: `See @README.md and @package.json for project overview and commands.` |
| `path-agnostic-rule` | Regex: `/\bfor \.(ts\|js\|py\|tsx)\s+files\b\|\bin the .* (directory\|folder)\b/i` | This rule is scoped to specific files/directories. Put it in `.claude/rules/` with `paths:` frontmatter so it only loads when relevant. | warning | Create `.claude/rules/<topic>.md` with `---\npaths:\n  - "src/api/**/*.ts"\n---` frontmatter. |
| `no-verification-criteria` | Programmatic: no backtick commands matching test/lint patterns | No verification criteria found. Claude can't check its own work without runnable commands. | critical | Add: `- Test: \`pnpm test [filename]\`\n- Lint: \`pnpm lint\`\n- Type check: \`pnpm tsc --noEmit\`` |
| `contradictory-emphasis` | Programmatic: count of `IMPORTANT\|YOU MUST` occurrences > 2 | Too many emphasized rules dilutes the effect. Claude treats everything as equally critical. | suggestion | Keep ≤ 2 rules with strong emphasis. Reserve for genuinely critical constraints only. |
| `dense-paragraph` | Programmatic: paragraph > 5 lines without headers or bullets | Dense paragraphs are harder for Claude to scan. Claude reads structure the same way humans do. | warning | Break into bullets under a clear markdown header. |
| `subagent-worthy-instruction` | Regex: `/\b(explore the codebase\|read all files\|investigate\|scan all\|review everything in)\b/i` | This investigation should be delegated to a subagent. Doing it inline fills your main context with file reads. | suggestion | Remove from CLAUDE.md and use: "Use a subagent to [investigate X]" in your prompts, or create `.claude/agents/<name>.md`. |

---

## 3. `section-templates.ts`

### New universal section added to all templates

Every project type template gets a `modern_claude_code` section (optional, priority 6):

```typescript
{
  heading: "## Modern Claude Code",
  content: `<!-- Hooks — mandatory actions (configure in .claude/settings.json): -->
<!-- - [MANDATORY_ACTION e.g., run lint after every file edit] -->

<!-- Skills — domain knowledge (.claude/skills/<topic>/SKILL.md): -->
<!-- - [DOMAIN_TOPIC e.g., api-conventions, db-schema] -->

<!-- Path-scoped rules (.claude/rules/<topic>.md with paths: frontmatter): -->
<!-- - [FILE_TYPE_RULE e.g., src/api/**/*.ts -> api validation rules] -->`,
  required: false,
  priority: 6,
}
```

Notes:
- HTML comments (`<!-- -->`) are used instead of `#` to avoid producing unintended markdown headings.
- The `@` imports line (`See @README.md and @package.json...`) belongs in the **file header** (first section of each template), NOT in `modern_claude_code`. This avoids duplication.

### Rendered size constraint

Code project templates (all except `content-creation`) must render between **100–150 lines** (hard max: 200).
`content-creation` targets **60–90 lines** (no Commands or Architecture sections).

Rules for all templates:
- Each section: 8–15 lines of content
- Placeholders are short: `[FRAMEWORK]` not `[e.g., specify your framework here]`
- No inline examples longer than 3 lines
- `modern_claude_code` section: max 10 lines

### Fully-rendered reference example: `python-backend`

The following shows the exact rendered output the generator must produce for a Python backend project. All 9 templates follow this format — actual markdown strings, not prose descriptions.

```markdown
# [PROJECT_NAME]

See @README.md and @pyproject.toml for project overview and dependencies.

## Commands
- Install: `poetry install`
- Dev server: `[DEV_COMMAND e.g., uvicorn app.main:app --reload]`
- Test: `pytest [filename]` (single file preferred over full suite)
- Test all: `pytest`
- Type check: `mypy .`
- Lint/format: `ruff check . && ruff format .`

## Code style
- All functions and methods must have type annotations
- snake_case for variables, functions, modules; PascalCase for classes
- Black-compatible formatting (ruff format enforces this)
- No `Any` types unless documented with a comment explaining why
- [ADDITIONAL_STYLE_RULE]

## Architecture
- Framework: [FRAMEWORK e.g., FastAPI, Django, Flask]
- ORM: [ORM e.g., SQLAlchemy, Django ORM, Tortoise]
- Database: [DB e.g., PostgreSQL, SQLite]
- Cache: [CACHE e.g., Redis, none]
- [ADDITIONAL_ARCH_DECISION]

## Workflow
- Run `mypy .` and `pytest` before committing
- Prefer single test files: `pytest tests/test_auth.py`
- Commit format: [COMMIT_CONVENTION e.g., conventional commits]

## Testing
- Framework: pytest with [FIXTURES e.g., pytest-asyncio, factory_boy]
- Test behavior via public API, not implementation details
- Every endpoint needs: happy path, validation error, auth error tests
- Run: `pytest tests/[filename]`

## Constraints
- Do not expose secrets in logs or error responses
- [CONSTRAINT_1 e.g., all DB queries must be parameterized]
- [CONSTRAINT_2]

## Gotchas
- [NON_OBVIOUS_BEHAVIOR_1]
- [NON_OBVIOUS_BEHAVIOR_2]

## Modern Claude Code
<!-- Hooks — mandatory actions (configure in .claude/settings.json): -->
<!-- - [MANDATORY_ACTION e.g., run ruff after every file edit] -->

<!-- Skills — domain knowledge (.claude/skills/<topic>/SKILL.md): -->
<!-- - [DOMAIN_TOPIC e.g., db-schema, api-conventions] -->

<!-- Path-scoped rules (.claude/rules/<topic>.md with paths: frontmatter): -->
<!-- - [FILE_TYPE_RULE e.g., tests/**/*.py -> test naming conventions] -->
```

*Line count: ~72 lines rendered. User adds project-specific gotchas and constraints to reach 100–120 lines.*
*Note: `@` imports appear in the file header only, not repeated in `modern_claude_code`.*

All 9 templates follow this same format. The sections vary by project type but the structure (heading, content as markdown string, required, priority) is identical.

### The 9 missing project type templates

#### `python-backend`
See fully-rendered example above.

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` + `@` imports | true | 1 | `[PROJECT_NAME]`, `@pyproject.toml` |
| `## Commands` | true | 1 | `[DEV_COMMAND]` |
| `## Code style` | true | 2 | `[ADDITIONAL_STYLE_RULE]` |
| `## Architecture` | true | 3 | `[FRAMEWORK]`, `[ORM]`, `[DB]`, `[CACHE]` |
| `## Workflow` | true | 2 | `[COMMIT_CONVENTION]` |
| `## Testing` | false | 4 | `[FIXTURES]` |
| `## Constraints` | false | 4 | `[CONSTRAINT_1]`, `[CONSTRAINT_2]` |
| `## Gotchas` | false | 5 | `[NON_OBVIOUS_BEHAVIOR_1]` |
| `## Modern Claude Code` | false | 6 | — |

#### `api-backend`

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` + `@` imports | true | 1 | `[PROJECT_NAME]`, `@README.md`, `@package.json` or `@pyproject.toml` |
| `## Commands` | true | 1 | `[DEV_COMMAND]`, `[MIGRATE_COMMAND]` |
| `## Code style` | true | 2 | `[NAMING_CONVENTION]`, `[ERROR_RESPONSE_FORMAT]` |
| `## Architecture` | true | 3 | `[FRAMEWORK]`, `[AUTH]`, `[DB]`, `[CACHE]`, `[RATE_LIMITING]` |
| `## API conventions` | true | 2 | `[VERSIONING_STRATEGY e.g., /v1/]`, `[PAGINATION_FORMAT]`, `[ERROR_SCHEMA]` |
| `## Testing` | false | 4 | `[TEST_FRAMEWORK]` |
| `## Gotchas` | false | 5 | `[NON_OBVIOUS_BEHAVIOR_1]` |
| `## Modern Claude Code` | false | 6 | — |

#### `fullstack`

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` + `@` imports | true | 1 | `[PROJECT_NAME]`, `@package.json`, optional `@requirements.txt` |
| `## Commands — Frontend` | true | 1 | `[FE_DEV]`, `[FE_BUILD]`, `[FE_TEST]`, `[FE_LINT]` |
| `## Commands — Backend` | true | 1 | `[BE_DEV]`, `[BE_TEST]`, `[BE_LINT]` |
| `## Code style — Frontend` | true | 2 | `[FE_FRAMEWORK]`, `[STYLING_APPROACH]` |
| `## Code style — Backend` | true | 2 | `[BE_LANGUAGE]`, `[NAMING_CONVENTION]` |
| `## Architecture` | true | 3 | `[FE_FRAMEWORK]`, `[BE_FRAMEWORK]`, `[DB]`, `[API_TYPE e.g., REST/GraphQL]`, `[AUTH]` |
| `## API boundary` | true | 3 | `[API_CONTRACT e.g., OpenAPI spec at docs/api.yaml]` |
| `## Workflow` | true | 2 | `[TYPECHECK_COMMANDS]`, `[COMMIT_CONVENTION]` |
| `## Gotchas` | false | 5 | `[NON_OBVIOUS_BEHAVIOR_1]` |
| `## Modern Claude Code` | false | 6 | — |

#### `data-analysis`

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` + `@` imports | true | 1 | `[PROJECT_NAME]`, `@docs/schema.md` or `@schema.sql` |
| `## Commands` | true | 1 | `[NOTEBOOK_COMMAND]`, `[TEST_COMMAND]`, `[FORMAT_COMMAND]` |
| `## Data sources` | true | 2 | `[WAREHOUSE e.g., Snowflake, BigQuery]`, `[KEY_TABLES]`, `[SCHEMA_LOCATION]` |
| `## SQL conventions` | true | 2 | `[SQL_DIALECT]`, `[JOIN_STYLE]`, `[CTE_PREFERENCE]` |
| `## Code style` | true | 3 | `[PANDAS_CONVENTIONS]`, `[TYPE_HINT_REQUIREMENT]` |
| `## Constraints` | true | 2 | `[PII_RULES]`, `[QUERY_TIMEOUT]`, `[MAX_ROW_LIMIT]` |
| `## Workflow` | false | 4 | `[COMMIT_CONVENTION]` |
| `## Gotchas` | false | 5 | `[NON_OBVIOUS_BEHAVIOR_1]` |
| `## Modern Claude Code` | false | 6 | — |

#### `content-creation`
Target: **60–90 rendered lines** (exception — no Commands or Architecture sections by design).

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` | true | 1 | `[PROJECT_NAME]` |
| `## Voice & tone` | true | 1 | `[TONE e.g., direct, conversational]`, `[FORMALITY_LEVEL]` |
| `## Audience` | true | 1 | `[PRIMARY_AUDIENCE]`, `[ASSUMED_KNOWLEDGE_LEVEL]` |
| `## Vocabulary` | true | 2 | `[PREFERRED_TERMS]`, `[FORBIDDEN_TERMS]` |
| `## Output format` | true | 2 | `[TARGET_LENGTH]`, `[STRUCTURE e.g., H2 sections]`, `[SEO_REQUIREMENTS]` |
| `## Review criteria` | true | 2 | `[DONE_DEFINITION]` |
| `## Gotchas` | false | 5 | `[BRAND_RULE]`, `[SENSITIVE_TOPIC]` |
| `## Modern Claude Code` | false | 6 | — (skills only — no hooks/rules for content projects) |

#### `design-system`

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` + `@` imports | true | 1 | `[PROJECT_NAME]`, `@tokens.json` or `@src/tokens.ts` |
| `## Commands` | true | 1 | `[BUILD_TOKENS_CMD]`, `[TEST_CMD]`, `[STORYBOOK_CMD]`, `[LINT_CMD]` |
| `## Component conventions` | true | 2 | `[NAMING_CONVENTION]`, `[PROPS_API_STYLE]`, `[COMPOSITION_PATTERN]` |
| `## Design tokens` | true | 2 | `[COLOR_SCALE]`, `[SPACING_SCALE]`, `[TYPOGRAPHY_SCALE]` |
| `## Accessibility` | true | 2 | `[WCAG_LEVEL e.g., AA]`, `[SPECIFIC_A11Y_REQUIREMENTS]` |
| `## Documentation format` | false | 4 | `[DOC_STYLE e.g., JSDoc, Storybook stories]` |
| `## Gotchas` | false | 5 | `[NON_OBVIOUS_BEHAVIOR_1]` |
| `## Modern Claude Code` | false | 6 | — |

#### `devops-infra`

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` + `@` imports | true | 1 | `[PROJECT_NAME]`, `@README.md` |
| `## Commands` | true | 1 | `[TERRAFORM_CMDS]`, `[KUBECTL_CMDS]`, `[DOCKER_CMDS]`, `[VALIDATE_CMD]` |
| `## Architecture` | true | 3 | `[CLOUD_PROVIDER]`, `[KEY_SERVICES]`, `[NETWORKING]` |
| `## Workflow` | true | 2 | `[CHANGE_PROCESS e.g., always plan before apply]`, `[ROLLBACK_PROCEDURE]` |
| `## Constraints` | true | 2 | `[BLAST_RADIUS_RULES]`, `[APPROVAL_REQUIREMENTS]`, `[ENVIRONMENT_LIST]` |
| `## Security` | true | 2 | `[LEAST_PRIVILEGE_RULES]`, `[SECRETS_MANAGEMENT]` |
| `## Gotchas` | false | 5 | `[NON_OBVIOUS_BEHAVIOR_1]` |
| `## Modern Claude Code` | false | 6 | Hook candidate: "never apply without plan review" |

#### `mobile`

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` + `@` imports | true | 1 | `[PROJECT_NAME]`, `@package.json` (RN) or `@Podfile` (iOS) |
| `## Commands` | true | 1 | `[BUILD_CMD]`, `[TEST_CMD]`, `[EMULATOR_CMD]`, `[LINT_CMD]` |
| `## Code style` | true | 2 | `[PLATFORM e.g., React Native / iOS Swift / Android Kotlin]`, `[NAMING_CONVENTION]` |
| `## Architecture` | true | 3 | `[NAVIGATION_LIBRARY]`, `[STATE_MANAGEMENT]`, `[API_LAYER]`, `[OFFLINE_STRATEGY]` |
| `## Performance budgets` | true | 3 | `[BUNDLE_SIZE_LIMIT]`, `[FRAME_RATE_TARGET]`, `[STARTUP_TIME_LIMIT]` |
| `## Constraints` | false | 4 | `[OFFLINE_REQUIREMENTS]`, `[PERMISSIONS_POLICY]` |
| `## Gotchas` | false | 5 | `[NON_OBVIOUS_BEHAVIOR_1]` |
| `## Modern Claude Code` | false | 6 | — |

#### `generic`
Most conservative template — maximum placeholders, minimum assumptions. Used when project type can't be detected.

| Heading | required | priority | Key placeholders |
|---------|----------|----------|-----------------|
| `# [PROJECT_NAME]` | true | 1 | `[PROJECT_NAME]` |
| `## Commands` | true | 1 | `[DEV_COMMAND]`, `[BUILD_COMMAND]`, `[TEST_COMMAND]`, `[LINT_COMMAND]` |
| `## Code style` | true | 2 | `[LANGUAGE]`, `[NAMING_CONVENTION]`, `[FORMATTING_TOOL]` |
| `## Workflow` | true | 2 | `[TYPECHECK_COMMAND]`, `[COMMIT_CONVENTION]` |
| `## Constraints` | false | 4 | `[CONSTRAINT_1]`, `[CONSTRAINT_2]` |
| `## Gotchas` | false | 5 | `[NON_OBVIOUS_BEHAVIOR_1]` |
| `## Modern Claude Code` | false | 6 | All three options (hooks, skills, rules) fully templated |

---

## 4. `thinking-levels.ts`

No changes. The existing spec is complete and accurate.

---

## Key Design Decisions

**Why `"features"` as a new category (not a separate file):**
The optimizer engines iterate over `BEST_PRACTICES` as a single array. Adding a new category keeps the interface consistent and lets the evaluation engine weight feature-awareness separately without changing the engine contracts.

**Why anti-pattern detection is a mix of regex and programmatic:**
Regex covers textual patterns (hedge words, mandatory action phrases). Programmatic detection covers structural issues (density, line count, import absence) that regex can't reliably capture.

**Why `modern_claude_code` is `required: false` in all templates:**
The section contains commented-out placeholders by design — it's a checklist, not instructions. Making it optional means the generator includes it as a starting point without the optimizer penalizing its absence.

**Why templates target 100–150 rendered lines:**
Anthropic's docs state adherence degrades past 200 lines. 100–150 gives headroom for the user to add project-specific gotchas and constraints without immediately breaching the limit.
