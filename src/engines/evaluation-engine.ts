/**
 * Evaluation Engine
 *
 * Scores a parsed claude.md document across 5 Anthropic-aligned dimensions,
 * produces a composite score, letter grade, and per-dimension explanations.
 *
 * Dimensions (weights):
 *   actionability  30% — can Claude execute/verify?
 *   conciseness    25% — under 200 lines, no bloat?
 *   specificity    20% — no vague qualifiers?
 *   completeness   15% — required sections present?
 *   consistency    10% — no contradictions or duplicates?
 */

import type {
  ClaudeMdDocument,
  AnalysisResult,
  EvaluationResult,
  DimensionScore,
  ScoreDimension,
  Grade,
  SectionType,
} from "../types";
import { ANTI_PATTERNS } from "../knowledge/antipatterns";
import { SECTION_TEMPLATES } from "../knowledge/section-templates";
import type { ProjectType } from "../knowledge/section-templates";

// ─── Weight Configuration ────────────────────────────────────────────

const DIMENSION_WEIGHTS: Record<ScoreDimension, number> = {
  actionability: 0.30,
  conciseness: 0.25,
  specificity: 0.20,
  completeness: 0.15,
  consistency: 0.10,
};

// ─── Required Sections Helper ────────────────────────────────────────

function getRequiredSections(projectType: ProjectType): SectionType[] {
  const templates = SECTION_TEMPLATES[projectType];
  const headingToSection: Partial<Record<string, SectionType>> = {
    // Universal
    "## Commands": "commands",
    "## Code style": "code_style",
    "## Workflow": "workflow",
    "## Architecture": "architecture",
    "## Constraints": "constraints",
    "## Testing": "testing",
    "## Gotchas": "gotchas",
    "## Environment": "env_setup",
    "## Verification": "verification",
    // Fullstack command variants
    "## Commands — Frontend": "commands",
    "## Commands — Backend": "commands",
    // Fullstack / API code style variants
    "## Code style — Frontend": "code_style",
    "## Code style — Backend": "code_style",
    // API backend
    "## API conventions": "architecture",
    "## API boundary": "constraints",
    // DevOps/Infra
    "## Security": "constraints",
    "## Change management": "workflow",
    // Mobile
    "## Performance budgets": "constraints",
    // Data analysis
    "## Data sources": "architecture",
    "## SQL conventions": "code_style",
    "## Output format": "verification",
    // Content creation
    "## Voice & tone": "constraints",
    "## Audience": "constraints",
    "## Vocabulary": "constraints",
    "## Review criteria": "verification",
    // Design system
    "## Component conventions": "code_style",
    "## Design tokens": "architecture",
    "## Accessibility": "constraints",
  };
  return templates
    .filter((t) => t.required)
    .map((t) => headingToSection[t.heading])
    .filter((s): s is SectionType => s !== undefined);
}

// ─── Scoring Functions ───────────────────────────────────────────────

function scoreActionability(doc: ClaudeMdDocument): DimensionScore {
  const raw = doc.raw;
  const issues: string[] = [];
  let score = 0;

  const hasCommands =
    /```|\`[^`]+\`/.test(raw) &&
    /(pnpm|npm|yarn|pip|cargo|go |make|npx)\s+\w+/.test(raw);
  if (hasCommands) score += 40;
  else issues.push("No runnable commands (build/dev/start) found");

  const hasTest =
    /(pnpm|npm|yarn|pip|pytest|cargo|go)\s+(test|run test|run spec)\b/i.test(raw);
  if (hasTest) score += 25;
  else issues.push("No test command found — Claude can't verify its own changes");

  const hasLint =
    /(pnpm|npm|yarn)\s+(lint|run lint)\b/i.test(raw) ||
    /eslint|ruff|pylint/.test(raw);
  if (hasLint) score += 15;
  else issues.push("No lint command found");

  const hasTypecheck = /tsc\s+--noEmit|pnpm\s+typecheck|mypy|pyright/.test(raw);
  if (hasTypecheck) score += 10;

  const hasExamples = doc.sections.some(
    (s) =>
      s.type === "verification" ||
      /example|e\.g\.|for instance/i.test(s.content)
  );
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
    (ap) => !ap.programmatic && ap.id.startsWith("self-evident")
  );
  for (const ap of selfEvidentPatterns) {
    const matches = doc.raw.match(new RegExp(ap.pattern.source, "gi"));
    if (matches) {
      score -= matches.length * 15;
      issues.push(`"${matches[0]}" — self-evident instruction (wastes context)`);
    }
  }

  const bloatPatterns = ANTI_PATTERNS.filter(
    (ap) =>
      !ap.programmatic &&
      (ap.id.startsWith("api-docs") || ap.id.startsWith("file-by-file"))
  );
  for (const ap of bloatPatterns) {
    const matches = doc.raw.match(new RegExp(ap.pattern.source, "gi"));
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

  const vaguePatterns = ANTI_PATTERNS.filter(
    (ap) => !ap.programmatic && ap.id.startsWith("vague-")
  );
  for (const ap of vaguePatterns) {
    const matches = fullContent.match(new RegExp(ap.pattern.source, "gi"));
    if (matches) {
      penaltyPoints += matches.length * 5;
      issues.push(`"${matches[0]}" — ${ap.message.split(".")[0]}`);
    }
  }

  const hedgePatterns = ANTI_PATTERNS.filter(
    (ap) => !ap.programmatic && ap.id.startsWith("hedge-")
  );
  for (const ap of hedgePatterns) {
    const matches = fullContent.match(new RegExp(ap.pattern.source, "gi"));
    if (matches) {
      penaltyPoints += matches.length * 3;
      issues.push(`"${matches[0]}" — hedge word weakens instruction`);
    }
  }

  const placeholders = fullContent.match(/\[[A-Z][A-Z_0-9]{2,}\]/g) ?? [];
  if (placeholders.length > 0) {
    penaltyPoints += placeholders.length * 12;
    issues.push(`${placeholders.length} unfilled placeholder${placeholders.length > 1 ? "s" : ""} — replace with concrete values`);
  }

  const score = Math.max(0, 100 - penaltyPoints);

  return {
    dimension: "specificity",
    score,
    weight: DIMENSION_WEIGHTS.specificity,
    explanation:
      placeholders.length > 0
        ? `${placeholders.length} unfilled placeholder${placeholders.length > 1 ? "s" : ""} need concrete values`
        : score >= 90
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
  let score =
    required.length === 0
      ? 100
      : Math.round(
          (required.filter((t) => present.has(t)).length / required.length) * 100
        );
  const issues = missing.map((t) => `Missing "${t}" section`);

  const placeholders = doc.raw.match(/\[[A-Z][A-Z_0-9]{2,}\]/g) ?? [];
  if (placeholders.length > 0) {
    score = Math.max(0, score - placeholders.length * 8);
    issues.push(`${placeholders.length} placeholder${placeholders.length > 1 ? "s" : ""} still need filling`);
  }

  return {
    dimension: "completeness",
    score,
    weight: DIMENSION_WEIGHTS.completeness,
    explanation:
      placeholders.length > 0
        ? `${placeholders.length} placeholder${placeholders.length > 1 ? "s" : ""} still need filling`
        : score >= 90
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
  const sentences = doc.raw
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);
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
      score >= 90
        ? "No contradictions or duplicates found."
        : `${issues.length} consistency issue(s) found.`,
    issues,
  };
}

// ─── Main Evaluation Function ────────────────────────────────────────

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
    compositeScore >= 90
      ? "A"
      : compositeScore >= 75
      ? "B"
      : compositeScore >= 60
      ? "C"
      : compositeScore >= 40
      ? "D"
      : "F";

  const summary =
    grade === "A"
      ? "CLAUDE.md is tight, actionable, and ready to ship."
      : grade === "B"
      ? "CLAUDE.md is solid with minor improvements possible."
      : grade === "C"
      ? "CLAUDE.md is functional but has notable issues."
      : grade === "D"
      ? "CLAUDE.md has significant problems affecting Claude's performance."
      : "CLAUDE.md needs a rewrite — too much bloat, ambiguity, or missing essentials.";

  return { dimensions: dimensionScores, compositeScore, grade, summary };
}
