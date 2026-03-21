/**
 * Analysis Engine
 *
 * Parses raw claude.md content into structured sections, detects project type,
 * and identifies issues (gaps, ambiguities, contradictions, redundancies).
 */

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

// ─── Section Detection ───────────────────────────────────────────────

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

// ─── Project Type Detection ──────────────────────────────────────────

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

export function detectProjectType(content: string): {
  primary: ProjectType;
  secondary?: ProjectType;
} {
  const scores: Record<ProjectType, number> = {
    "react-nextjs": 0,
    "python-backend": 0,
    fullstack: 0,
    "data-analysis": 0,
    "content-creation": 0,
    "design-system": 0,
    "devops-infra": 0,
    mobile: 0,
    "api-backend": 0,
    generic: 0,
  };

  for (const [type, patterns] of Object.entries(PROJECT_TYPE_SIGNALS)) {
    if (type === "generic") continue;
    for (const pattern of patterns) {
      const matches = content.match(new RegExp(pattern, "gi"));
      if (matches) {
        scores[type as ProjectType] += matches.length;
      }
    }
  }

  const sorted = Object.entries(scores)
    .filter(([k]) => k !== "generic")
    .sort((a, b) => b[1] - a[1]);

  const [first, second] = sorted;

  // If top two are close (within 30% of each other), return both
  if (first[1] > 0 && second[1] > 0 && second[1] / first[1] > 0.7) {
    return {
      primary: first[0] as ProjectType,
      secondary: second[0] as ProjectType,
    };
  }

  return {
    primary: first[1] > 0 ? (first[0] as ProjectType) : "generic",
    secondary: second[1] > 0 ? (second[0] as ProjectType) : undefined,
  };
}

// ─── Language Detection ──────────────────────────────────────────────

const LANGUAGE_MARKERS: Record<string, RegExp[]> = {
  fr: [/\b(vous|nous|être|avoir|fait|dans|avec|pour|sur|mais|donc|les|des|une)\b/i],
  es: [/\b(usted|nosotros|estar|tener|hacer|pero|porque|para|sobre|como|los|las)\b/i],
  de: [/\b(Sie|wir|sein|haben|nicht|aber|oder|wenn|über|auch|können|werden)\b/i],
  en: [/\b(the|you|should|must|will|have|with|that|this|from|your|when)\b/i],
};

export function detectLanguage(content: string): string {
  const scores: Record<string, number> = {};
  for (const [lang, patterns] of Object.entries(LANGUAGE_MARKERS)) {
    scores[lang] = 0;
    for (const p of patterns) {
      const matches = content.match(new RegExp(p, "gi"));
      if (matches) scores[lang] += matches.length;
    }
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "en";
}

// ─── Markdown Parser ─────────────────────────────────────────────────

export function parseDocument(raw: string): ClaudeMdDocument {
  const lines = raw.split("\n");
  const sections: ParsedSection[] = [];
  let currentSection: Partial<ParsedSection> | null = null;
  let contentBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headingMatch) {
      // Flush previous section
      if (currentSection?.title) {
        const content = contentBuffer.join("\n").trim();
        const sectionType = classifySection(currentSection.title!, content);
        sections.push({
          id: generateId(),
          type: sectionType,
          title: currentSection.title!,
          content,
          startLine: currentSection.startLine!,
          endLine: i - 1,
          headingLevel: currentSection.headingLevel!,
        });
      }

      currentSection = {
        title: headingMatch[2].trim(),
        startLine: i,
        headingLevel: headingMatch[1].length,
      };
      contentBuffer = [];
    } else {
      contentBuffer.push(line);
    }
  }

  // Flush last section
  if (currentSection?.title) {
    const content = contentBuffer.join("\n").trim();
    const sectionType = classifySection(currentSection.title!, content);
    sections.push({
      id: generateId(),
      type: sectionType,
      title: currentSection.title!,
      content,
      startLine: currentSection.startLine!,
      endLine: lines.length - 1,
      headingLevel: currentSection.headingLevel!,
    });
  }

  const { primary, secondary } = detectProjectType(raw);

  return {
    raw,
    sections,
    detectedProjectType: primary,
    secondaryProjectType: secondary,
    language: detectLanguage(raw),
    contentHash: hashContent(raw),
  };
}

function classifySection(title: string, content: string): SectionType {
  let bestMatch: SectionType = "architecture";
  let bestScore = 0;

  for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
    let score = 0;
    for (const p of patterns) {
      // Title matches are worth 3x content matches
      if (p.test(title)) score += 3;
      const contentMatches = content.match(new RegExp(p, "gi"));
      if (contentMatches) score += contentMatches.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type as SectionType;
    }
  }

  return bestMatch;
}

// ─── Required Sections by Project Type ───────────────────────────────

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

// ─── Issue Detection Rules ───────────────────────────────────────────

interface DetectionRule {
  id: string;
  severity: IssueSeverity;
  title: string;
  test: (doc: ClaudeMdDocument) => AnalysisIssue[];
}

const DETECTION_RULES: DetectionRule[] = [
  // ── Missing required sections ──
  {
    id: "missing-section",
    severity: "critical",
    title: "Missing required section",
    test(doc) {
      const required = REQUIRED_FOR_PROJECT_TYPE[doc.detectedProjectType];
      const present = new Set(doc.sections.map((s) => s.type));
      return required
        .filter((type) => !present.has(type))
        .map((type) => ({
          id: generateId(),
          sectionId: null,
          severity: "critical" as IssueSeverity,
          title: `Missing "${type}" section`,
          description: `This ${doc.detectedProjectType} project should include a "${type}" section. Without it, Claude lacks critical guidance for this dimension.`,
          ruleId: "missing-section",
        }));
    },
  },

  // ── Anti-pattern detection (from knowledge layer) ──
  {
    id: "anti-pattern",
    severity: "warning" as IssueSeverity,
    title: "Anti-pattern detected",
    test(doc: ClaudeMdDocument): AnalysisIssue[] {
      const issues: AnalysisIssue[] = [];
      const fullContent = doc.sections.map((s) => `${s.title} ${s.content}`).join("\n");

      for (const ap of ANTI_PATTERNS) {
        if (ap.programmatic) continue; // handled by dedicated rules below
        const regex = new RegExp(ap.pattern.source, "gi");
        const matches = [...fullContent.matchAll(regex)];
        for (const match of matches) {
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
    severity: "critical" as IssueSeverity,
    title: "CLAUDE.md exceeds 200 lines",
    test(doc: ClaudeMdDocument): AnalysisIssue[] {
      const lineCount = doc.raw.split("\n").length;
      if (lineCount <= 200) return [];
      return [{
        id: generateId(),
        sectionId: null,
        severity: "critical" as IssueSeverity,
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
    severity: "critical" as IssueSeverity,
    title: "No verification criteria",
    test(doc: ClaudeMdDocument): AnalysisIssue[] {
      const hasRunnable = /`(?:pnpm|npm|yarn|pytest|cargo|go|make|npx)\s+\w[^`]*`/.test(doc.raw);
      if (hasRunnable) return [];
      return [{
        id: generateId(),
        sectionId: null,
        severity: "critical" as IssueSeverity,
        title: "No runnable verification commands found",
        description:
          "Per Anthropic: 'Give Claude a way to verify its work — this is the single highest-leverage thing you can do.' Add a Commands section with build/test/lint commands.",
        ruleId: "no-verification-criteria",
      }];
    },
  },

  // ── Contradictions ──
  {
    id: "contradiction",
    severity: "critical",
    title: "Contradictory instructions",
    test(doc) {
      const issues: AnalysisIssue[] = [];
      const allInstructions = doc.sections.map((s) => ({
        id: s.id,
        text: s.content.toLowerCase(),
      }));

      // Simple contradiction patterns: "always X" in one section vs "never X" in another
      const alwaysPatterns = /always\s+(\w+(?:\s+\w+){0,3})/gi;
      const neverPatterns = /never\s+(\w+(?:\s+\w+){0,3})/gi;

      const alwaysRules: { sectionId: string; action: string }[] = [];
      const neverRules: { sectionId: string; action: string }[] = [];

      for (const inst of allInstructions) {
        for (const match of inst.text.matchAll(alwaysPatterns)) {
          alwaysRules.push({ sectionId: inst.id, action: match[1] });
        }
        for (const match of inst.text.matchAll(neverPatterns)) {
          neverRules.push({ sectionId: inst.id, action: match[1] });
        }
      }

      for (const always of alwaysRules) {
        for (const never of neverRules) {
          // Fuzzy match: if the "always" action overlaps significantly with a "never" action
          const overlapWords = always.action.split(" ").filter((w) =>
            never.action.includes(w)
          );
          if (overlapWords.length >= 1) {
            issues.push({
              id: generateId(),
              sectionId: always.sectionId,
              severity: "critical",
              title: "Possible contradiction",
              description: `"always ${always.action}" conflicts with "never ${never.action}" found in another section. Claude will be confused about which to follow.`,
              ruleId: "contradiction",
            });
          }
        }
      }

      return issues;
    },
  },

  // ── Duplicate instructions ──
  {
    id: "duplicate",
    severity: "warning",
    title: "Repeated instruction",
    test(doc) {
      const issues: AnalysisIssue[] = [];
      const sentences: { sectionId: string; text: string }[] = [];

      for (const section of doc.sections) {
        const sectionSentences = section.content
          .split(/[.!?\n]/)
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 20);

        for (const sent of sectionSentences) {
          const existing = sentences.find((s) => {
            // Jaccard similarity on words
            const wordsA = new Set(s.text.split(/\s+/));
            const wordsB = new Set(sent.split(/\s+/));
            const intersection = [...wordsA].filter((w) => wordsB.has(w));
            const union = new Set([...wordsA, ...wordsB]);
            return intersection.length / union.size > 0.7;
          });

          if (existing && existing.sectionId !== section.id) {
            issues.push({
              id: generateId(),
              sectionId: section.id,
              severity: "warning",
              title: "Duplicate instruction detected",
              description: `This instruction appears in both the "${section.title}" and another section. Redundancy adds noise and risks contradictions if you later update one but not the other.`,
              ruleId: "duplicate",
            });
          }

          sentences.push({ sectionId: section.id, text: sent });
        }
      }

      return issues;
    },
  },

  // ── Overly long sections ──
  {
    id: "section-too-long",
    severity: "suggestion",
    title: "Section may be too long",
    test(doc) {
      return doc.sections
        .filter((s) => s.content.split("\n").length > 80)
        .map((s) => ({
          id: generateId(),
          sectionId: s.id,
          severity: "suggestion" as IssueSeverity,
          title: `"${s.title}" is very long (${s.content.split("\n").length} lines)`,
          description:
            "Long sections are harder for Claude to follow reliably. Consider breaking this into focused sub-sections or extracting secondary details into a separate reference section.",
          ruleId: "section-too-long",
        }));
    },
  },
];

// ─── Main Analysis Function ──────────────────────────────────────────

export function analyze(raw: string): AnalysisResult {
  const document = parseDocument(raw);
  const issues: AnalysisIssue[] = [];

  for (const rule of DETECTION_RULES) {
    issues.push(...rule.test(document));
  }

  // Sort: critical first, then warning, then suggestion
  const severityOrder: Record<IssueSeverity, number> = {
    critical: 0,
    warning: 1,
    suggestion: 2,
  };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const presentTypes = new Set(document.sections.map((s) => s.type));
  const required = REQUIRED_FOR_PROJECT_TYPE[document.detectedProjectType];
  const missingSections = required.filter((t) => !presentTypes.has(t));

  return {
    document,
    issues,
    missingSections,
    timestamp: Date.now(),
  };
}
