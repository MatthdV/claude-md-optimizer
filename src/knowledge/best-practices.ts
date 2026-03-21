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
