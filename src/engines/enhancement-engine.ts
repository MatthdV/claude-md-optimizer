/**
 * Enhancement Engine
 *
 * Takes analysis issues and generates actionable suggestions with
 * before/after text, impact scores, and reasoning.
 */

import type {
  AnalysisResult,
  AnalysisIssue,
  Suggestion,
  SuggestionCategory,
  IssueSeverity,
  ParsedSection,
} from "../types";
import { generateId } from "../utils/helpers";
import { ANTI_PATTERNS } from "../knowledge/antipatterns";

function getAntiPatternFix(ruleId: string): string | null {
  return ANTI_PATTERNS.find((ap) => ap.id === ruleId)?.fix ?? null;
}

// ─── Suggestion Generators ───────────────────────────────────────────

type SuggestionGenerator = (
  issue: AnalysisIssue,
  section: ParsedSection | null,
  context: AnalysisResult
) => Suggestion | null;

/**
 * Maps rule IDs from the Analysis Engine to suggestion generators.
 * Each generator knows how to turn a specific type of issue
 * into a concrete, actionable suggestion.
 */
const GENERATORS: Record<string, SuggestionGenerator> = {
  // ── Vague qualifier anti-patterns ────────────────────────────────────
  "vague-as-needed": (issue, section) => {
    if (!section || !issue.matchedText) return null;
    return {
      id: generateId(),
      category: "enhancement" as const,
      severity: "warning" as const,
      relatedIssueId: issue.id,
      sectionId: section.id,
      title: `Replace "${issue.matchedText}" with specific condition`,
      description: issue.description,
      currentText: issue.matchedText,
      suggestedText: "when [specific condition — describe when this applies]",
      impact: 6,
      reasoning:
        getAntiPatternFix("vague-as-needed") ??
        "Anthropic: 'Use 2-space indentation' not 'Format code properly.' Vague instructions produce inconsistent output.",
    };
  },

  "vague-etc": (issue, section) => {
    if (!section || !issue.matchedText) return null;
    return {
      id: generateId(),
      category: "enhancement" as const,
      severity: "warning" as const,
      relatedIssueId: issue.id,
      sectionId: section.id,
      title: `Replace "${issue.matchedText}" with explicit list`,
      description: issue.description,
      currentText: issue.matchedText,
      suggestedText: "[list all items explicitly, or write 'including X, Y, and Z']",
      impact: 5,
      reasoning:
        getAntiPatternFix("vague-etc") ??
        "Anthropic: 'Use 2-space indentation' not 'Format code properly.' Vague instructions produce inconsistent output.",
    };
  },

  "vague-best-practices": (issue, section) => {
    if (!section || !issue.matchedText) return null;
    return {
      id: generateId(),
      category: "enhancement" as const,
      severity: "warning" as const,
      relatedIssueId: issue.id,
      sectionId: section.id,
      title: "Name specific practices instead of 'best practices'",
      description: issue.description,
      currentText: issue.matchedText,
      suggestedText: "[name the specific practices: e.g., 'parameterized queries, input validation, error boundaries']",
      impact: 6,
      reasoning:
        getAntiPatternFix("vague-best-practices") ??
        "Anthropic: 'Use 2-space indentation' not 'Format code properly.' Vague instructions produce inconsistent output.",
    };
  },

  "vague-properly": (issue, section) => {
    if (!section || !issue.matchedText) return null;
    return {
      id: generateId(),
      category: "enhancement" as const,
      severity: "suggestion" as const,
      relatedIssueId: issue.id,
      sectionId: section.id,
      title: `Define what "${issue.matchedText}" means`,
      description: issue.description,
      currentText: issue.matchedText,
      suggestedText: "[describe the expected behavior: e.g., 'return a 400 JSON error body with code and message fields']",
      impact: 5,
      reasoning:
        getAntiPatternFix("vague-properly") ??
        "Anthropic: 'Use 2-space indentation' not 'Format code properly.' Vague instructions produce inconsistent output.",
    };
  },

  // ── Self-evident anti-patterns ────────────────────────────────────────
  "self-evident-clean-code": (issue, _section) => ({
    id: generateId(),
    category: "enhancement" as const,
    severity: "critical" as const,
    relatedIssueId: issue.id,
    sectionId: null,
    title: "Remove self-evident instruction",
    description: issue.description,
    currentText: issue.matchedText,
    suggestedText: "← Remove this line entirely",
    impact: 9,
    reasoning:
      getAntiPatternFix("self-evident-clean-code") ??
      "Claude already writes clean code. This wastes context tokens per Anthropic's official guidance.",
  }),

  "self-evident-quality": (issue, _section) => ({
    id: generateId(),
    category: "enhancement" as const,
    severity: "warning" as const,
    relatedIssueId: issue.id,
    sectionId: null,
    title: "Replace quality claim with measurable criteria",
    description: issue.description,
    currentText: issue.matchedText,
    suggestedText: "[define quality criteria: e.g., 'Passes ESLint strict, >80% test coverage, no any types']",
    impact: 7,
    reasoning:
      getAntiPatternFix("self-evident-quality") ??
      "'Quality' without definition is meaningless. Specify what quality means for your project.",
  }),

  // ── Over 200 lines ────────────────────────────────────────────────────
  "over-200-lines": (_issue, _section) => ({
    id: generateId(),
    category: "gap" as const,
    severity: "critical" as const,
    relatedIssueId: _issue.id,
    sectionId: null,
    title: "Split CLAUDE.md into focused files",
    description: _issue.description,
    currentText: undefined,
    suggestedText:
      "Move detailed content to `.claude/rules/` files.\n" +
      "Reference them in CLAUDE.md with: `@.claude/rules/testing.md`",
    impact: 8,
    reasoning:
      getAntiPatternFix("over-200-lines") ??
      "Anthropic: under 200 lines. Longer files reduce adherence.",
  }),

  // ── No verification criteria ──────────────────────────────────────────
  "no-verification-criteria": (_issue, _section) => ({
    id: generateId(),
    category: "gap" as const,
    severity: "critical" as const,
    relatedIssueId: _issue.id,
    sectionId: null,
    title: "Add verification commands",
    description: _issue.description,
    currentText: undefined,
    suggestedText:
      "## Commands\n- Dev: `pnpm dev`\n- Build: `pnpm build`\n- Test: `pnpm test`\n- Lint: `pnpm lint`\n- Type check: `pnpm tsc --noEmit`",
    impact: 10,
    reasoning:
      getAntiPatternFix("no-verification-criteria") ??
      "Per Anthropic: 'Give Claude a way to verify its work — this is the single highest-leverage thing you can do.'",
  }),

  // ── Other anti-patterns ───────────────────────────────────────────────
  "api-docs-inline": (issue, section) => ({
    id: generateId(),
    category: "enhancement" as const,
    severity: "warning" as const,
    relatedIssueId: issue.id,
    sectionId: section?.id ?? null,
    title: "Link to API docs instead of inlining",
    description: issue.description,
    currentText: issue.matchedText,
    suggestedText: "API documentation: @docs/api.md",
    impact: 6,
    reasoning:
      getAntiPatternFix("api-docs-inline") ??
      "API documentation in CLAUDE.md bloats context. Link to docs instead.",
  }),

  "file-by-file": (issue, section) => ({
    id: generateId(),
    category: "enhancement" as const,
    severity: "warning" as const,
    relatedIssueId: issue.id,
    sectionId: section?.id ?? null,
    title: "Remove file-by-file description",
    description: issue.description,
    currentText: issue.matchedText,
    suggestedText: "[Remove — Claude reads files directly. Describe patterns and conventions instead.]",
    impact: 6,
    reasoning:
      getAntiPatternFix("file-by-file") ??
      "File descriptions don't belong in CLAUDE.md. Claude can read the files.",
  }),

  "mandatory-action-not-hook": (issue, section) => ({
    id: generateId(),
    category: "enhancement" as const,
    severity: "critical" as const,
    relatedIssueId: issue.id,
    sectionId: section?.id ?? null,
    title: "Move mandatory action to a hook",
    description: issue.description,
    currentText: issue.matchedText,
    suggestedText:
      "Configure a hook in .claude/settings.json:\n" +
      "Ask Claude: 'Write a hook that runs [action] after every file edit.'",
    impact: 8,
    reasoning:
      getAntiPatternFix("mandatory-action-not-hook") ??
      "CLAUDE.md instructions may be ignored. Hooks are guaranteed to run.",
  }),

  "path-agnostic-rule": (issue, section) => ({
    id: generateId(),
    category: "enhancement" as const,
    severity: "warning" as const,
    relatedIssueId: issue.id,
    sectionId: section?.id ?? null,
    title: "Scope rule to a .claude/rules/ file",
    description: issue.description,
    currentText: issue.matchedText,
    suggestedText:
      "Create .claude/rules/<topic>.md with frontmatter:\n---\npaths:\n  - \"src/api/**/*.ts\"\n---",
    impact: 5,
    reasoning:
      getAntiPatternFix("path-agnostic-rule") ??
      "Path-scoped rules should only load when relevant, not every session.",
  }),

  "subagent-worthy-instruction": (issue, section) => ({
    id: generateId(),
    category: "enhancement" as const,
    severity: "suggestion" as const,
    relatedIssueId: issue.id,
    sectionId: section?.id ?? null,
    title: "Delegate investigation to a subagent",
    description: issue.description,
    currentText: issue.matchedText,
    suggestedText:
      "Remove from CLAUDE.md. Use in prompts: 'Use a subagent to [investigate X]'\nor create .claude/agents/<name>.md.",
    impact: 4,
    reasoning:
      getAntiPatternFix("subagent-worthy-instruction") ??
      "Open-ended exploration fills main context with file reads. Subagents keep context clean.",
  }),

  "hedge-word": (issue, section) => {
    if (!section || !issue.matchedText) return null;

    const directReplacements: Record<string, string> = {
      "maybe": "→ Remove, or state the condition: 'If X, then do Y'",
      "perhaps": "→ Remove, or state the condition explicitly",
      "possibly": "→ State when this applies: 'When X happens, do Y'",
      "might want to": "→ Use 'should' or 'must' with a clear condition",
      "could consider": "→ Use 'do X when Y' or remove if optional",
      "try to": "→ Use 'do' — Claude doesn't need permission to try",
    };

    const replacement =
      directReplacements[issue.matchedText.toLowerCase()] ||
      "→ Replace with a direct instruction";

    return {
      id: generateId(),
      category: "enhancement",
      severity: "suggestion",
      relatedIssueId: issue.id,
      sectionId: section.id,
      title: `Strengthen: "${issue.matchedText}"`,
      description: `Hedge words make instructions feel optional. Claude responds better to direct guidance.`,
      currentText: issue.matchedText,
      suggestedText: replacement,
      impact: 4,
      reasoning:
        "When you say 'try to do X', Claude treats it as a soft preference. When you say 'do X', it treats it as a requirement. If something is truly optional, say 'optionally, do X when [condition]'.",
    };
  },

  "hedge-try-to": (issue, section) => {
    if (!section || !issue.matchedText) return null;
    return {
      id: generateId(),
      category: "enhancement" as const,
      severity: "suggestion" as const,
      relatedIssueId: issue.id,
      sectionId: section.id,
      title: `Strengthen: "${issue.matchedText}"`,
      description: issue.description,
      currentText: issue.matchedText,
      suggestedText: "→ Use 'do' — Claude doesn't need permission to try",
      impact: 4,
      reasoning:
        getAntiPatternFix("hedge-try-to") ??
        "When you say 'try to do X', Claude treats it as a soft preference. Use 'do X' for a requirement.",
    };
  },

  "hedge-maybe": (issue, section) => {
    if (!section || !issue.matchedText) return null;
    return {
      id: generateId(),
      category: "enhancement" as const,
      severity: "suggestion" as const,
      relatedIssueId: issue.id,
      sectionId: section.id,
      title: `Strengthen: "${issue.matchedText}"`,
      description: issue.description,
      currentText: issue.matchedText,
      suggestedText: "→ State the condition: 'If X, then do Y' — or remove if truly optional",
      impact: 4,
      reasoning:
        getAntiPatternFix("hedge-maybe") ??
        "Hedge words make instructions feel optional. Be direct.",
    };
  },

  "missing-section": (issue, _section, context) => {
    // Extract the section type from the issue title
    const match = issue.title.match(/"(\w+)"/);
    if (!match) return null;

    const sectionType = match[1];
    const projectType = context.document.detectedProjectType;

    const templates: Record<string, { title: string; template: string; impact: number }> = {
      role: {
        title: "Add a role/persona definition",
        template: `## Role\n\nYou are a [specific role] specializing in [domain]. Your primary responsibility is [main task]. You have deep expertise in [list 2-3 specific areas].`,
        impact: 9,
      },
      constraints: {
        title: "Add explicit constraints",
        template: `## Constraints\n\n- Do NOT [specific prohibited action]\n- Never [another boundary]\n- If you're unsure about [ambiguous area], [what to do instead]\n- Keep responses under [length limit] unless asked for more detail`,
        impact: 8,
      },
      code_conventions: {
        title: "Add code conventions",
        template: `## Code Conventions\n\n- Language: [TypeScript/Python/etc.]\n- Naming: [camelCase for variables, PascalCase for types]\n- Style: [Prettier defaults, 2-space indent]\n- Imports: [absolute paths from @/]\n- Error handling: [use Result<T, E> pattern / throw custom errors / etc.]`,
        impact: 7,
      },
      output_format: {
        title: "Define output format expectations",
        template: `## Output Format\n\n- Use markdown formatting for responses\n- Code should be in fenced blocks with language tags\n- When suggesting changes, show the diff or before/after\n- Keep explanations to [1-2 paragraphs / a brief summary] unless asked for detail`,
        impact: 7,
      },
      error_handling: {
        title: "Add error handling guidance",
        template: `## When You're Unsure\n\n- If the request is ambiguous, ask a clarifying question before proceeding\n- If you don't know something, say so — don't guess\n- If a request conflicts with the constraints above, explain the conflict and ask for direction`,
        impact: 6,
      },
      examples: {
        title: "Add input/output examples",
        template: `## Examples\n\n**Good response:**\n[Show an example of the kind of output you want]\n\n**Bad response:**\n[Show an example of what you don't want, and explain why]`,
        impact: 8,
      },
      security: {
        title: "Add security considerations",
        template: `## Security\n\n- Never expose API keys, secrets, or credentials in code or responses\n- Use parameterized queries for all database operations\n- Validate and sanitize all user inputs\n- [Add project-specific security requirements]`,
        impact: 7,
      },
      brand_voice: {
        title: "Add brand voice definition",
        template: `## Voice & Tone\n\n- Tone: [professional but approachable / casual and direct / etc.]\n- Audience: [developers / marketers / executives]\n- Vocabulary: use [these terms], avoid [those terms]\n- Personality: [helpful expert / friendly colleague / authoritative advisor]`,
        impact: 7,
      },
      accessibility: {
        title: "Add accessibility standards",
        template: `## Accessibility\n\n- Target WCAG 2.1 AA compliance\n- All interactive elements must be keyboard-navigable\n- Provide alt text for images, aria-labels for icons\n- Maintain minimum 4.5:1 contrast ratio for text`,
        impact: 6,
      },
      context: {
        title: "Add project context",
        template: `## Project Context\n\n- Project: [name and brief description]\n- Tech stack: [list main technologies]\n- Repository structure: [brief overview]\n- Current focus: [what the team is working on]`,
        impact: 9,
      },
      testing: {
        title: "Add testing expectations",
        template: `## Testing\n\n- Framework: [Jest/Vitest/pytest]\n- Write tests for [all new functions / critical paths / edge cases]\n- Minimum coverage: [80% / whatever your target is]\n- Test naming: [describe_what_it_does / should_verb_when_condition]`,
        impact: 5,
      },
      behavior: {
        title: "Add behavioral instructions",
        template: `## Behavior\n\n- Be concise — don't over-explain unless asked\n- Ask clarifying questions when the request is ambiguous\n- Explain your reasoning when making non-obvious choices\n- [Add specific behavioral preferences]`,
        impact: 7,
      },
      dependencies: {
        title: "List key dependencies",
        template: `## Dependencies & Tools\n\n- [Tool/library]: used for [purpose]\n- [API]: [what it does, any rate limits or auth notes]\n- [External service]: [how it's accessed, any constraints]`,
        impact: 4,
      },
      workflow: {
        title: "Define workflow steps",
        template: `## Workflow\n\n1. [First step — e.g., understand the request]\n2. [Second step — e.g., check existing patterns in the codebase]\n3. [Third step — e.g., implement the change]\n4. [Fourth step — e.g., verify it works]\n5. [Final step — e.g., explain what was done and why]`,
        impact: 5,
      },
    };

    const tmpl = templates[sectionType];
    if (!tmpl) return null;

    return {
      id: generateId(),
      category: "gap",
      severity: "critical",
      relatedIssueId: issue.id,
      sectionId: null,
      title: tmpl.title,
      description: `A ${projectType} project should include a "${sectionType}" section. Here's a starter template you can customize.`,
      suggestedText: tmpl.template,
      impact: tmpl.impact,
      reasoning: issue.description,
    };
  },

  contradiction: (issue, section) => {
    return {
      id: generateId(),
      category: "enhancement",
      severity: "critical",
      relatedIssueId: issue.id,
      sectionId: section?.id ?? null,
      title: "Resolve contradictory instructions",
      description: issue.description,
      suggestedText:
        "[Review both instructions and keep only one, or add a condition that explains when each applies]",
      impact: 9,
      reasoning:
        "Contradictions are the most damaging issue in a prompt. Claude will pick one at random or try to satisfy both, producing inconsistent output. Resolve by either removing one instruction or adding explicit conditions.",
    };
  },

  duplicate: (issue, section) => {
    return {
      id: generateId(),
      category: "enhancement",
      severity: "warning",
      relatedIssueId: issue.id,
      sectionId: section?.id ?? null,
      title: "Remove or consolidate duplicate instruction",
      description: issue.description,
      suggestedText:
        "[Keep this instruction in one place only. If it applies to multiple sections, reference it from a shared 'General Rules' section]",
      impact: 5,
      reasoning:
        "Duplicate instructions create maintenance risk — updating one without the other leads to contradictions over time. Consolidate in a single location.",
    };
  },

  "no-examples": (issue) => {
    return {
      id: generateId(),
      category: "gap",
      severity: "warning",
      relatedIssueId: issue.id,
      sectionId: null,
      title: "Add at least one input/output example",
      description:
        "Examples are the single most effective way to calibrate Claude's output. Even one good example is worth more than several paragraphs of instructions.",
      suggestedText: `## Examples\n\n### Good response\nUser: [example input]\nAssistant: [the kind of output you want]\n\n### What to avoid\nUser: [same or similar input]\nAssistant: [output you don't want — explain why it's wrong]`,
      impact: 8,
      reasoning:
        "Research consistently shows that few-shot examples improve LLM output quality more than additional instructions. Show, don't just tell.",
    };
  },

  "section-too-long": (issue, section) => {
    return {
      id: generateId(),
      category: "enhancement",
      severity: "suggestion",
      relatedIssueId: issue.id,
      sectionId: section?.id ?? null,
      title: `Break up "${section?.title ?? "this section"}"`,
      description: issue.description,
      suggestedText:
        "[Split into 2-3 sub-sections with clear headings. Move secondary details to an appendix or reference section.]",
      impact: 4,
      reasoning:
        "Very long sections reduce Claude's attention to individual instructions. Shorter, focused sections with clear headings improve instruction-following.",
    };
  },
};

// ─── Main Enhancement Function ───────────────────────────────────────

export function generateSuggestions(analysisResult: AnalysisResult): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const sectionMap = new Map(
    analysisResult.document.sections.map((s) => [s.id, s])
  );

  for (const issue of analysisResult.issues) {
    const generator = GENERATORS[issue.ruleId];
    if (!generator) continue;

    const section = issue.sectionId ? sectionMap.get(issue.sectionId) ?? null : null;
    const suggestion = generator(issue, section, analysisResult);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  // Sort by impact (highest first), then by severity
  const severityOrder: Record<IssueSeverity, number> = {
    critical: 0,
    warning: 1,
    suggestion: 2,
  };

  suggestions.sort((a, b) => {
    if (a.impact !== b.impact) return b.impact - a.impact;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return suggestions;
}
