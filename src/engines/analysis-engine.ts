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
  ProjectType,
  AnalysisIssue,
  AnalysisResult,
  IssueSeverity,
} from "../types";
import { hashContent, generateId } from "../utils/helpers";

// ─── Section Detection ───────────────────────────────────────────────

const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  role: [
    /\b(role|persona|you are|act as|behave as|identity)\b/i,
    /\b(assistant|expert|specialist|engineer|advisor)\b/i,
  ],
  behavior: [
    /\b(tone|style|approach|manner|communicate|respond)\b/i,
    /\b(friendly|formal|concise|verbose|helpful)\b/i,
  ],
  constraints: [
    /\b(do not|don't|never|avoid|must not|prohibited|forbidden)\b/i,
    /\b(constraint|limitation|restriction|boundary)\b/i,
  ],
  context: [
    /\b(project|background|overview|about|description|purpose)\b/i,
    /\b(tech stack|architecture|codebase|repository)\b/i,
  ],
  output_format: [
    /\b(format|output|response structure|markdown|json|template)\b/i,
    /\b(code block|heading|bullet|numbered list)\b/i,
  ],
  code_conventions: [
    /\b(naming convention|style guide|lint|prettier|eslint|formatting)\b/i,
    /\b(camelCase|snake_case|PascalCase|indentation|semicolon)\b/i,
  ],
  security: [
    /\b(security|auth|authentication|authorization|secret|token|api key)\b/i,
    /\b(sanitize|validate|encrypt|csrf|xss|injection)\b/i,
  ],
  testing: [
    /\b(test|spec|coverage|jest|vitest|pytest|unit test|integration test)\b/i,
    /\b(mock|stub|fixture|assertion|expect)\b/i,
  ],
  accessibility: [
    /\b(accessibility|a11y|wcag|aria|screen reader|keyboard nav)\b/i,
    /\b(contrast|focus|alt text|semantic html)\b/i,
  ],
  brand_voice: [
    /\b(brand|voice|tone of voice|messaging|tagline|slogan)\b/i,
    /\b(audience|persona|target market|brand pillar)\b/i,
  ],
  error_handling: [
    /\b(error handling|edge case|fallback|ambiguity|unclear|unknown)\b/i,
    /\b(when unsure|if unclear|default behavior)\b/i,
  ],
  examples: [
    /\b(example|sample|demonstration|input.*output|few-shot)\b/i,
    /\b(here is|for instance|such as|e\.g\.|like this)\b/i,
  ],
  dependencies: [
    /\b(dependency|dependencies|library|framework|package|api|tool)\b/i,
    /\b(import|require|install|version)\b/i,
  ],
  workflow: [
    /\b(workflow|step|pipeline|process|sequence|first.*then|phase)\b/i,
    /\b(decision tree|flowchart|checklist)\b/i,
  ],
};

// ─── Project Type Detection ──────────────────────────────────────────

const PROJECT_TYPE_SIGNALS: Record<ProjectType, RegExp[]> = {
  "code-focused": [
    /\b(typescript|javascript|python|rust|go|java|c\+\+|react|vue|angular|svelte)\b/i,
    /\b(api|endpoint|database|sql|graphql|rest|grpc)\b/i,
    /\b(git|commit|branch|pull request|deploy|ci\/cd)\b/i,
    /\b(function|class|interface|module|component|hook)\b/i,
  ],
  "content-creation": [
    /\b(blog|article|newsletter|social media|linkedin|twitter|post)\b/i,
    /\b(headline|copy|editorial|SEO|keyword|audience)\b/i,
    /\b(brand voice|tone|messaging|storytelling)\b/i,
  ],
  "data-analysis": [
    /\b(data|dataset|csv|sql|query|dashboard|chart|graph)\b/i,
    /\b(metric|kpi|trend|anomaly|correlation|regression)\b/i,
    /\b(pandas|numpy|matplotlib|tableau|looker|bigquery|snowflake)\b/i,
  ],
  design: [
    /\b(figma|sketch|design system|component library|UI|UX)\b/i,
    /\b(wireframe|mockup|prototype|layout|spacing|typography)\b/i,
    /\b(responsive|breakpoint|token|color palette)\b/i,
  ],
  operations: [
    /\b(runbook|deployment|monitoring|incident|alert|SLA|SLO)\b/i,
    /\b(kubernetes|docker|terraform|aws|gcp|azure|infra)\b/i,
    /\b(on-?call|escalation|rollback|canary)\b/i,
  ],
  mixed: [], // detected when 2+ types tie
};

export function detectProjectType(content: string): {
  primary: ProjectType;
  secondary?: ProjectType;
} {
  const scores: Record<ProjectType, number> = {
    "code-focused": 0,
    "content-creation": 0,
    "data-analysis": 0,
    design: 0,
    operations: 0,
    mixed: 0,
  };

  for (const [type, patterns] of Object.entries(PROJECT_TYPE_SIGNALS)) {
    if (type === "mixed") continue;
    for (const pattern of patterns) {
      const matches = content.match(new RegExp(pattern, "gi"));
      if (matches) {
        scores[type as ProjectType] += matches.length;
      }
    }
  }

  const sorted = Object.entries(scores)
    .filter(([k]) => k !== "mixed")
    .sort((a, b) => b[1] - a[1]);

  const [first, second] = sorted;

  // If top two are close (within 30% of each other), classify as mixed
  if (first[1] > 0 && second[1] > 0 && second[1] / first[1] > 0.7) {
    return {
      primary: "mixed",
      secondary: second[0] as ProjectType,
    };
  }

  return {
    primary: first[1] > 0 ? (first[0] as ProjectType) : "code-focused",
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
  const combined = `${title} ${content}`;
  let bestMatch: SectionType = "context";
  let bestScore = 0;

  for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
    let score = 0;
    for (const p of patterns) {
      // Title matches are worth 3x content matches
      if (p.test(title)) score += 3;
      const contentMatches = combined.match(new RegExp(p, "gi"));
      if (contentMatches) score += contentMatches.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type as SectionType;
    }
  }

  return bestMatch;
}

// ─── Issue Detection Rules ───────────────────────────────────────────

interface DetectionRule {
  id: string;
  severity: IssueSeverity;
  title: string;
  test: (doc: ClaudeMdDocument) => AnalysisIssue[];
}

const VAGUE_QUALIFIERS = [
  "as needed",
  "if appropriate",
  "when necessary",
  "as applicable",
  "where relevant",
  "etc",
  "and so on",
  "things like that",
  "stuff like",
  "various",
  "several",
  "some kind of",
  "basically",
  "generally",
  "usually",
  "properly",
  "correctly",
  "good quality",
  "high quality",
  "best practices",
];

const HEDGE_WORDS = [
  "maybe",
  "perhaps",
  "possibly",
  "might want to",
  "could consider",
  "you may want",
  "it would be nice",
  "try to",
  "attempt to",
];

const REQUIRED_FOR_PROJECT_TYPE: Record<ProjectType, SectionType[]> = {
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

  // ── Vague qualifiers ──
  {
    id: "vague-qualifier",
    severity: "warning",
    title: "Vague qualifier detected",
    test(doc) {
      const issues: AnalysisIssue[] = [];
      for (const section of doc.sections) {
        for (const qualifier of VAGUE_QUALIFIERS) {
          const regex = new RegExp(`\\b${qualifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
          const matches = section.content.matchAll(regex);
          for (const match of matches) {
            issues.push({
              id: generateId(),
              sectionId: section.id,
              severity: "warning",
              title: `Vague qualifier: "${qualifier}"`,
              description: `The phrase "${qualifier}" leaves Claude to guess what you mean. Replace it with a specific instruction — what exactly should Claude do in this case?`,
              matchedText: match[0],
              ruleId: "vague-qualifier",
            });
          }
        }
      }
      return issues;
    },
  },

  // ── Hedge words ──
  {
    id: "hedge-word",
    severity: "suggestion",
    title: "Hedge word weakens instruction",
    test(doc) {
      const issues: AnalysisIssue[] = [];
      for (const section of doc.sections) {
        for (const hedge of HEDGE_WORDS) {
          const regex = new RegExp(`\\b${hedge.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
          if (regex.test(section.content)) {
            issues.push({
              id: generateId(),
              sectionId: section.id,
              severity: "suggestion",
              title: `Hedge word: "${hedge}"`,
              description: `"${hedge}" softens the instruction. If you want Claude to do something, tell it directly. If it's conditional, state the condition explicitly.`,
              matchedText: hedge,
              ruleId: "hedge-word",
            });
          }
        }
      }
      return issues;
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
          if (overlapWords.length >= 2) {
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

  // ── No examples section ──
  {
    id: "no-examples",
    severity: "warning",
    title: "No examples provided",
    test(doc) {
      const hasExamples = doc.sections.some(
        (s) => s.type === "examples" || /example|sample|e\.g\./i.test(s.content)
      );
      if (!hasExamples) {
        return [{
          id: generateId(),
          sectionId: null,
          severity: "warning",
          title: "No examples found",
          description:
            "Few-shot examples are one of the most effective ways to guide Claude's behavior. Even 1–2 input/output pairs dramatically improve output consistency.",
          ruleId: "no-examples",
        }];
      }
      return [];
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
