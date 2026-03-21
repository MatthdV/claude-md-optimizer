/**
 * Evaluation Engine
 *
 * Scores a parsed claude.md document across 6 dimensions,
 * produces a composite score, letter grade, and per-dimension explanations.
 */

import type {
  ClaudeMdDocument,
  AnalysisResult,
  EvaluationResult,
  DimensionScore,
  ScoreDimension,
  Grade,
  SectionType,
  ProjectType,
} from "../types";

// ─── Weight Configuration ────────────────────────────────────────────

const DIMENSION_WEIGHTS: Record<ScoreDimension, number> = {
  completeness: 0.25,
  clarity: 0.25,
  technical_accuracy: 0.2,
  scope_alignment: 0.15,
  structure: 0.1,
  constraint_quality: 0.05,
};

// ─── Required Sections per Project Type ──────────────────────────────

const REQUIRED_SECTIONS: Record<ProjectType, SectionType[]> = {
  "code-focused": [
    "role", "context", "constraints", "code_conventions",
    "output_format", "error_handling",
  ],
  "content-creation": [
    "role", "context", "constraints", "brand_voice",
    "output_format", "examples",
  ],
  "data-analysis": [
    "role", "context", "constraints", "output_format",
    "dependencies", "examples",
  ],
  design: [
    "role", "context", "constraints", "accessibility",
    "output_format",
  ],
  operations: [
    "role", "context", "constraints", "workflow",
    "error_handling", "dependencies",
  ],
  mixed: [
    "role", "context", "constraints", "output_format",
    "error_handling",
  ],
};

// ─── Vague / Hedge Patterns ──────────────────────────────────────────

const VAGUE_PATTERNS = [
  /\bas needed\b/gi,
  /\bif appropriate\b/gi,
  /\bwhen necessary\b/gi,
  /\betc\.?\b/gi,
  /\band so on\b/gi,
  /\bvarious\b/gi,
  /\bproperly\b/gi,
  /\bcorrectly\b/gi,
  /\bgood quality\b/gi,
  /\bhigh quality\b/gi,
  /\bbest practices\b/gi,
];

const HEDGE_PATTERNS = [
  /\bmaybe\b/gi,
  /\bperhaps\b/gi,
  /\bpossibly\b/gi,
  /\bmight want to\b/gi,
  /\bcould consider\b/gi,
  /\btry to\b/gi,
];

const PASSIVE_PATTERNS = [
  /\bshould be\s+\w+ed\b/gi,
  /\bwill be\s+\w+ed\b/gi,
  /\bcan be\s+\w+ed\b/gi,
  /\bis\s+\w+ed\b/gi,
];

// ─── Scoring Functions ───────────────────────────────────────────────

function scoreCompleteness(doc: ClaudeMdDocument): DimensionScore {
  const required = REQUIRED_SECTIONS[doc.detectedProjectType];
  const present = new Set(doc.sections.map((s) => s.type));

  const requiredPresent = required.filter((t) => present.has(t)).length;
  const requiredTotal = required.length;
  const baseScore = (requiredPresent / requiredTotal) * 80;

  const hasExamples = doc.sections.some((s) => s.type === "examples") ? 10 : 0;
  const hasErrorHandling = doc.sections.some((s) => s.type === "error_handling") ? 10 : 0;

  const score = Math.min(100, Math.round(baseScore + hasExamples + hasErrorHandling));
  const missing = required.filter((t) => !present.has(t));

  const issues: string[] = [];
  if (missing.length > 0) {
    issues.push(`Missing required sections: ${missing.join(", ")}`);
  }
  if (!hasExamples) issues.push("No examples section found");
  if (!hasErrorHandling) issues.push("No error handling guidance");

  return {
    dimension: "completeness",
    score,
    weight: DIMENSION_WEIGHTS.completeness,
    explanation:
      score >= 90
        ? "All critical sections are present. The prompt covers the dimensions Claude needs."
        : score >= 60
        ? `Most sections are present, but ${missing.length} required section(s) are missing.`
        : `Significant gaps: ${missing.length} of ${requiredTotal} required sections are absent.`,
    issues,
  };
}

function scoreClarity(doc: ClaudeMdDocument): DimensionScore {
  const fullContent = doc.sections.map((s) => s.content).join(" ");
  const issues: string[] = [];
  let issueCount = 0;

  for (const pattern of VAGUE_PATTERNS) {
    const matches = fullContent.match(pattern);
    if (matches) {
      issueCount += matches.length;
      issues.push(`Found "${matches[0]}" (vague qualifier) × ${matches.length}`);
    }
  }

  for (const pattern of HEDGE_PATTERNS) {
    const matches = fullContent.match(pattern);
    if (matches) {
      issueCount += matches.length;
      issues.push(`Found "${matches[0]}" (hedge word) × ${matches.length}`);
    }
  }

  for (const pattern of PASSIVE_PATTERNS) {
    const matches = fullContent.match(pattern);
    if (matches) {
      issueCount += Math.ceil(matches.length / 2); // passive is less severe
    }
  }

  const penalty = Math.min(issueCount * 3, 60);
  const score = Math.max(0, 100 - penalty);

  return {
    dimension: "clarity",
    score,
    weight: DIMENSION_WEIGHTS.clarity,
    explanation:
      score >= 90
        ? "Instructions are clear and direct. Minimal ambiguity."
        : score >= 60
        ? "Several vague or hedging phrases dilute the instructions."
        : "Many instructions are ambiguous. Claude will have to guess intent frequently.",
    issues,
  };
}

function scoreTechnicalAccuracy(doc: ClaudeMdDocument): DimensionScore {
  const issues: string[] = [];
  let failedChecks = 0;

  // Check for conflicting conventions
  const content = doc.raw.toLowerCase();

  // Example: mentions both camelCase and snake_case as "the" naming convention
  const mentionsCamel = /camelcase/i.test(content);
  const mentionsSnake = /snake_case/i.test(content);
  const mentionsPascal = /pascalcase/i.test(content);
  if (
    [mentionsCamel, mentionsSnake, mentionsPascal].filter(Boolean).length > 1
  ) {
    // Only a problem if they don't clarify which is for what
    const hasClarification = /for\s+(variables|functions|classes|types|files)/i.test(content);
    if (!hasClarification) {
      failedChecks++;
      issues.push(
        "Multiple naming conventions mentioned without clarifying which applies where"
      );
    }
  }

  // Check for references to potentially outdated or nonexistent tools
  const suspiciousRefs = [
    { pattern: /tslint/i, issue: "TSLint is deprecated — ESLint is the successor" },
    { pattern: /create-react-app/i, issue: "Create React App is deprecated — consider Vite or Next.js references" },
    { pattern: /moment\.js/i, issue: "Moment.js is in maintenance mode — date-fns or dayjs are preferred" },
  ];

  for (const ref of suspiciousRefs) {
    if (ref.pattern.test(content)) {
      failedChecks++;
      issues.push(ref.issue);
    }
  }

  // Check for version conflicts
  const versionMentions = content.match(/(\w+)\s*v?(\d+(?:\.\d+)*)/g);
  if (versionMentions) {
    const toolVersions: Record<string, Set<string>> = {};
    for (const mention of versionMentions) {
      const [tool, version] = mention.split(/\s+v?/);
      if (tool && version) {
        if (!toolVersions[tool]) toolVersions[tool] = new Set();
        toolVersions[tool].add(version);
        if (toolVersions[tool].size > 1) {
          failedChecks++;
          issues.push(`Conflicting versions for "${tool}": ${[...toolVersions[tool]].join(", ")}`);
        }
      }
    }
  }

  const score = Math.max(0, 100 - failedChecks * 15);

  return {
    dimension: "technical_accuracy",
    score,
    weight: DIMENSION_WEIGHTS.technical_accuracy,
    explanation:
      score >= 90
        ? "Technical references are consistent and current."
        : `${failedChecks} technical issue(s) found that could confuse Claude or produce outdated output.`,
    issues,
  };
}

function scoreScopeAlignment(doc: ClaudeMdDocument): DimensionScore {
  const issues: string[] = [];

  // For each section, compute relevance to the primary project type
  const typeKeywords: Record<ProjectType, string[]> = {
    "code-focused": ["code", "function", "api", "database", "test", "deploy", "git", "component"],
    "content-creation": ["brand", "audience", "tone", "copy", "headline", "seo", "editorial"],
    "data-analysis": ["data", "query", "metric", "chart", "dashboard", "analysis", "sql"],
    design: ["design", "figma", "component", "layout", "spacing", "responsive", "accessibility"],
    operations: ["deploy", "monitor", "incident", "runbook", "infrastructure", "kubernetes"],
    mixed: [],
  };

  const primaryKeywords = typeKeywords[doc.detectedProjectType] || [];
  let offTopicSections = 0;

  if (primaryKeywords.length > 0) {
    for (const section of doc.sections) {
      const words = section.content.toLowerCase().split(/\s+/);
      const relevantWordCount = words.filter((w) =>
        primaryKeywords.some((kw) => w.includes(kw))
      ).length;
      const relevance = words.length > 0 ? relevantWordCount / words.length : 0;

      if (relevance < 0.01 && section.type !== "role" && section.type !== "constraints") {
        offTopicSections++;
        issues.push(
          `"${section.title}" has low relevance to ${doc.detectedProjectType} — possible scope creep`
        );
      }
    }
  }

  const ratio = doc.sections.length > 0 ? offTopicSections / doc.sections.length : 0;
  const score = Math.max(0, Math.round(100 - ratio * 100));

  return {
    dimension: "scope_alignment",
    score,
    weight: DIMENSION_WEIGHTS.scope_alignment,
    explanation:
      score >= 90
        ? "The prompt stays focused on its project type throughout."
        : `${offTopicSections} section(s) may be off-topic for a ${doc.detectedProjectType} project.`,
    issues,
  };
}

function scoreStructure(doc: ClaudeMdDocument): DimensionScore {
  const issues: string[] = [];
  let penalties = 0;

  // Check heading level consistency
  const headingLevels = doc.sections.map((s) => s.headingLevel);
  const hasSkippedLevels = headingLevels.some((level, i) => {
    if (i === 0) return false;
    return level > headingLevels[i - 1] + 1;
  });
  if (hasSkippedLevels) {
    penalties += 5;
    issues.push("Heading levels skip (e.g., ## to #### without ###)");
  }

  // Check for empty sections
  const emptySections = doc.sections.filter((s) => s.content.trim().length < 10);
  if (emptySections.length > 0) {
    penalties += emptySections.length * 5;
    issues.push(
      `${emptySections.length} near-empty section(s): ${emptySections
        .map((s) => `"${s.title}"`)
        .join(", ")}`
    );
  }

  // Ideal ordering: role → context → behavior → constraints → specifics → examples
  const idealOrder: SectionType[] = [
    "role", "context", "behavior", "constraints",
    "code_conventions", "output_format", "error_handling", "examples",
  ];
  const presentOrder = doc.sections.map((s) => s.type);
  let orderViolations = 0;
  for (let i = 0; i < presentOrder.length - 1; i++) {
    const idxA = idealOrder.indexOf(presentOrder[i]);
    const idxB = idealOrder.indexOf(presentOrder[i + 1]);
    if (idxA >= 0 && idxB >= 0 && idxA > idxB) {
      orderViolations++;
    }
  }
  if (orderViolations > 0) {
    penalties += orderViolations * 5;
    issues.push(
      `${orderViolations} section(s) out of recommended order (role → context → constraints → specifics → examples)`
    );
  }

  // Check for very long document without sub-sections
  if (doc.sections.length <= 2 && doc.raw.split("\n").length > 50) {
    penalties += 10;
    issues.push("Long document with very few sections — consider breaking it up");
  }

  const score = Math.max(0, 100 - penalties);

  return {
    dimension: "structure",
    score,
    weight: DIMENSION_WEIGHTS.structure,
    explanation:
      score >= 90
        ? "Well-organized with logical section flow."
        : `Structural issues found: ${issues.length} problem(s) affecting readability.`,
    issues,
  };
}

function scoreConstraintQuality(doc: ClaudeMdDocument): DimensionScore {
  const issues: string[] = [];
  let score = 100;

  const constraintSections = doc.sections.filter(
    (s) => s.type === "constraints" || /constraint|must not|do not|don't|never/i.test(s.content)
  );

  if (constraintSections.length === 0) {
    return {
      dimension: "constraint_quality",
      score: 40,
      weight: DIMENSION_WEIGHTS.constraint_quality,
      explanation: "No constraints found. Without explicit boundaries, Claude may produce unwanted outputs.",
      issues: ["No constraint section present"],
    };
  }

  const allConstraintText = constraintSections.map((s) => s.content).join(" ");

  // Check for vague constraints
  const vagueConstraints = allConstraintText.match(
    /don't\s+do\s+anything\s+(?:bad|wrong|inappropriate)/gi
  );
  if (vagueConstraints) {
    score -= 10 * vagueConstraints.length;
    issues.push("Constraint is too vague to be actionable");
  }

  // Check for contradictions within constraints
  const dontPatterns = [...allConstraintText.matchAll(/(?:don't|do not|never)\s+(\w+(?:\s+\w+){0,3})/gi)];
  const doPatterns = [...allConstraintText.matchAll(/(?:always|must)\s+(\w+(?:\s+\w+){0,3})/gi)];

  for (const dont of dontPatterns) {
    for (const doP of doPatterns) {
      if (dont[1].toLowerCase() === doP[1].toLowerCase()) {
        score -= 20;
        issues.push(`Contradiction: "don't ${dont[1]}" vs "always ${doP[1]}"`);
      }
    }
  }

  score = Math.max(0, score);

  return {
    dimension: "constraint_quality",
    score,
    weight: DIMENSION_WEIGHTS.constraint_quality,
    explanation:
      score >= 90
        ? "Constraints are specific, non-contradictory, and actionable."
        : `${issues.length} issue(s) found in constraint definitions.`,
    issues,
  };
}

// ─── Grade Calculation ───────────────────────────────────────────────

function computeGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

// ─── Main Evaluation Function ────────────────────────────────────────

export function evaluate(analysisResult: AnalysisResult): EvaluationResult {
  const { document } = analysisResult;

  const dimensions: DimensionScore[] = [
    scoreCompleteness(document),
    scoreClarity(document),
    scoreTechnicalAccuracy(document),
    scoreScopeAlignment(document),
    scoreStructure(document),
    scoreConstraintQuality(document),
  ];

  const compositeScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  const grade = computeGrade(compositeScore);

  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];

  const summary =
    grade === "A"
      ? "This claude.md is well-structured and comprehensive. Minor refinements possible."
      : grade === "B"
      ? `Solid foundation. The biggest opportunity is improving ${weakest.dimension.replace("_", " ")}.`
      : `Several areas need attention. Start with ${weakest.dimension.replace("_", " ")} (scored ${weakest.score}/100).`;

  return { dimensions, compositeScore, grade, summary };
}
