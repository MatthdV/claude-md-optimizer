/**
 * Recommendation Engine
 *
 * Suggests sections the document is missing based on detected project type.
 * Provides prioritized, templated recommendations the user can apply with one click.
 */

import type {
  AnalysisResult,
  EvaluationResult,
  SectionRecommendation,
  SectionType,
  ProjectType,
} from "../types";

// ─── Section Recommendations by Project Type ─────────────────────────

interface RecommendationTemplate {
  sectionType: SectionType;
  title: string;
  description: string;
  baseImpact: number;
  template: string;
  reasoning: string;
  applicableTo: ProjectType[];
}

const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  // ── Highest priority: commands ──
  {
    sectionType: "commands",
    title: "Add Commands Section",
    description:
      "Bash commands Claude can't guess: build, test, lint, typecheck, dev server.",
    baseImpact: 10,
    template: `## Commands
- Dev: \`pnpm dev\`
- Build: \`pnpm build\`
- Test: \`pnpm test [filename]\`
- Lint: \`pnpm lint\`
- Type check: \`pnpm tsc --noEmit\``,
    reasoning:
      "Anthropic: 'The #1 thing you can add to CLAUDE.md. Give Claude a way to verify its work.' Commands are the highest-leverage section.",
    applicableTo: [
      "react-nextjs",
      "python-backend",
      "fullstack",
      "data-analysis",
      "design-system",
      "devops-infra",
      "mobile",
      "api-backend",
      "generic",
    ],
  },

  // ── Universal high-impact ──
  {
    sectionType: "verification",
    title: "Add Verification Criteria",
    description:
      "Show Claude exactly what good output looks like — runnable commands and expected results.",
    baseImpact: 9,
    template: `## Verification

After making changes, verify with:
\`\`\`
pnpm test [filename]
pnpm lint
pnpm tsc --noEmit
\`\`\`

Expected: all commands exit 0 with no errors.`,
    reasoning:
      "Few-shot examples and verification criteria are the single most effective technique for aligning output quality. They communicate expectations that words often can't.",
    applicableTo: [
      "react-nextjs",
      "python-backend",
      "fullstack",
      "data-analysis",
      "content-creation",
      "design-system",
      "devops-infra",
      "mobile",
      "api-backend",
      "generic",
    ],
  },

  {
    sectionType: "constraints",
    title: "Define Constraints",
    description:
      "Tell Claude what NOT to do — ambiguity handling, security guardrails, hard limits.",
    baseImpact: 7,
    template: `## Constraints

- If a request is unclear, ask ONE focused clarifying question before proceeding
- If a request contradicts the constraints above, explain the conflict and ask for direction
- Never hardcode secrets, API keys, or credentials — use environment variables
- Parameterize all database queries (no string concatenation for SQL)
- Validate and sanitize all user-facing inputs`,
    reasoning:
      "Without explicit constraint guidance, Claude either guesses (producing wrong output) or over-asks (disrupting flow). Security flaws in generated code can reach production if not caught.",
    applicableTo: [
      "react-nextjs",
      "python-backend",
      "fullstack",
      "data-analysis",
      "content-creation",
      "design-system",
      "devops-infra",
      "mobile",
      "api-backend",
      "generic",
    ],
  },

  // ── Code-specific ──
  {
    sectionType: "testing",
    title: "Define Testing Expectations",
    description:
      "Tell Claude when and how to write tests alongside code changes.",
    baseImpact: 6,
    template: `## Testing

- Write unit tests for every new function or method
- Use [Jest/Vitest/pytest] as the test framework
- Test naming convention: \`describe('functionName', () => { it('should verb when condition', ...) })\`
- Cover: happy path, edge cases, error conditions
- Mock external dependencies; don't mock the module under test
- Target: [80%+] branch coverage for new code`,
    reasoning:
      "Without test guidance, Claude either skips tests entirely or writes superficial ones. Explicit expectations produce tests worth running.",
    applicableTo: ["react-nextjs", "python-backend", "fullstack", "api-backend", "mobile"],
  },

  {
    sectionType: "code_style",
    title: "Document Code Style",
    description:
      "Ensure Claude matches your project's naming, formatting, and architectural patterns.",
    baseImpact: 7,
    template: `## Code style
- **Language**: [TypeScript / Python / etc.]
- **Naming**: camelCase for variables and functions, PascalCase for types and components
- **Formatting**: [Prettier defaults / Black / project-specific rules]
- **Imports**: [absolute from @/ / relative / barrel exports]
- **Components**: [functional only / class components / hooks pattern]
- **Error handling**: [throw custom errors / Result<T,E> pattern / error codes]
- **Comments**: explain *why*, not *what* — the code should be self-documenting for the *what*`,
    reasoning:
      "Style inconsistency is the most common complaint about AI-generated code. This section eliminates the guesswork.",
    applicableTo: ["react-nextjs", "python-backend", "fullstack", "api-backend", "mobile"],
  },

  // ── Architecture ──
  {
    sectionType: "architecture",
    title: "List Data Sources and Architecture",
    description:
      "Tell Claude which databases, APIs, frameworks, and libraries are available.",
    baseImpact: 6,
    template: `## Architecture

- **Framework**: [Next.js App Router / FastAPI / Express]
- **Database**: [PostgreSQL via Prisma / Snowflake / MongoDB]
- **Auth**: [NextAuth / JWT / OAuth provider]
- **State**: [Zustand / Redux / React Query]
- **Key constraints**: [query timeout, max rows, PII restrictions]`,
    reasoning:
      "Analysis prompts that don't specify the available tools and architecture produce generic code that won't run against your actual stack.",
    applicableTo: [
      "react-nextjs",
      "python-backend",
      "fullstack",
      "data-analysis",
      "api-backend",
      "mobile",
    ],
  },

  // ── Workflow ──
  {
    sectionType: "workflow",
    title: "Define Operational Workflow",
    description:
      "Document the step-by-step process for common tasks and change management.",
    baseImpact: 7,
    template: `## Workflow

- Typecheck after making code changes: \`pnpm tsc --noEmit\`
- Run relevant tests after changes: \`pnpm test [filename]\`
- Prefer single test files over full suite for speed
- Commit with descriptive messages following [COMMIT_CONVENTION]

### Incident Response
1. Acknowledge and classify severity
2. Diagnose and mitigate
3. Communicate status to stakeholders
4. Post-incident review within 48 hours`,
    reasoning:
      "Operations prompts without workflows produce ad-hoc responses. Documented processes ensure Claude follows your organization's procedures.",
    applicableTo: ["devops-infra", "generic", "fullstack"],
  },

  // ── Design-specific ──
  {
    sectionType: "constraints",
    title: "Add Accessibility and Brand Constraints",
    description:
      "Ensure Claude considers accessibility standards and brand voice in all design and content decisions.",
    baseImpact: 7,
    template: `## Constraints

### Accessibility
- Target: WCAG 2.1 AA compliance
- All interactive elements must be reachable by keyboard (Tab, Enter, Escape)
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text
- Every image needs meaningful alt text (or empty alt="" if decorative)

### Brand Voice
- **Tone**: [professional but warm / casual and direct / authoritative]
- **Audience**: [developers / marketers / enterprise buyers / general public]
- **Avoid these words**: [list terms that clash with your brand]`,
    reasoning:
      "Accessibility requirements are easy to forget in the design phase but expensive to retrofit. Voice consistency turns Claude from 'an AI that writes' into a recognizable brand voice.",
    applicableTo: ["design-system", "content-creation"],
  },
];

// ─── Main Recommendation Function ────────────────────────────────────

export function generateRecommendations(
  analysisResult: AnalysisResult,
  evaluationResult: EvaluationResult
): SectionRecommendation[] {
  const { document, missingSections } = analysisResult;
  const presentTypes = new Set(document.sections.map((s) => s.type));

  const recommendations: SectionRecommendation[] = [];
  // Track which sectionTypes have already been added to avoid duplicates
  const addedSectionTypes = new Set<SectionType>();

  for (const template of RECOMMENDATION_TEMPLATES) {
    // Skip if section already exists in document
    if (presentTypes.has(template.sectionType)) continue;

    // Skip if we already have a recommendation for this sectionType
    if (addedSectionTypes.has(template.sectionType)) continue;

    // Skip if not applicable to this project type
    if (!template.applicableTo.includes(document.detectedProjectType)) continue;

    // Boost impact if the section is in the "required" missing list
    const isMissing = missingSections.includes(template.sectionType);
    const impact = isMissing
      ? Math.min(10, template.baseImpact + 1)
      : template.baseImpact;

    recommendations.push({
      sectionType: template.sectionType,
      title: template.title,
      description: template.description,
      impact,
      template: template.template,
      reasoning: template.reasoning,
    });

    addedSectionTypes.add(template.sectionType);
  }

  // Sort by impact, highest first
  recommendations.sort((a, b) => b.impact - a.impact);

  return recommendations;
}
