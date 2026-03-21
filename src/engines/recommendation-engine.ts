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
  // ── Universal high-impact ──
  {
    sectionType: "examples",
    title: "Add Few-Shot Examples",
    description:
      "Show Claude exactly what good output looks like with 1–3 input/output pairs.",
    baseImpact: 9,
    template: `## Examples

### Example 1: [Describe the scenario]

**Input:**
\`\`\`
[User request or input data]
\`\`\`

**Expected output:**
\`\`\`
[The response Claude should produce]
\`\`\`

### Example 2: Edge case

**Input:**
\`\`\`
[An ambiguous or tricky request]
\`\`\`

**Expected output:**
\`\`\`
[How Claude should handle it]
\`\`\``,
    reasoning:
      "Few-shot examples are the single most effective technique for aligning output quality. They communicate expectations that words often can't.",
    applicableTo: [
      "code-focused", "content-creation", "data-analysis", "design", "operations", "mixed",
    ],
  },

  {
    sectionType: "error_handling",
    title: "Define Ambiguity Handling",
    description:
      "Tell Claude what to do when the request is unclear, incomplete, or conflicts with other instructions.",
    baseImpact: 7,
    template: `## Handling Ambiguity

- If a request is unclear, ask ONE focused clarifying question before proceeding
- If a request contradicts the constraints above, explain the conflict and ask for direction
- If you don't know something, say "I don't know" rather than guessing
- If multiple valid approaches exist, briefly describe the trade-offs and recommend one`,
    reasoning:
      "Without explicit ambiguity guidance, Claude either guesses (producing wrong output) or over-asks (disrupting flow). This section calibrates the threshold.",
    applicableTo: [
      "code-focused", "content-creation", "data-analysis", "design", "operations", "mixed",
    ],
  },

  // ── Code-specific ──
  {
    sectionType: "security",
    title: "Add Security Guardrails",
    description:
      "Prevent Claude from generating code with common security vulnerabilities.",
    baseImpact: 8,
    template: `## Security Requirements

- Never hardcode secrets, API keys, or credentials — use environment variables
- Parameterize all database queries (no string concatenation for SQL)
- Validate and sanitize all user-facing inputs
- Use HTTPS for all external API calls
- Apply principle of least privilege for file system and network access
- Flag any code that handles PII or financial data for review`,
    reasoning:
      "Security flaws in generated code can reach production if not caught. Explicit guardrails are cheaper than post-hoc audits.",
    applicableTo: ["code-focused", "operations"],
  },

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
    applicableTo: ["code-focused"],
  },

  {
    sectionType: "code_conventions",
    title: "Document Code Style",
    description:
      "Ensure Claude matches your project's naming, formatting, and architectural patterns.",
    baseImpact: 7,
    template: `## Code Conventions

- **Language**: [TypeScript / Python / etc.]
- **Naming**: camelCase for variables and functions, PascalCase for types and components
- **Formatting**: [Prettier defaults / Black / project-specific rules]
- **Imports**: [absolute from @/ / relative / barrel exports]
- **Components**: [functional only / class components / hooks pattern]
- **Error handling**: [throw custom errors / Result<T,E> pattern / error codes]
- **Comments**: explain *why*, not *what* — the code should be self-documenting for the *what*`,
    reasoning:
      "Style inconsistency is the most common complaint about AI-generated code. This section eliminates the guesswork.",
    applicableTo: ["code-focused"],
  },

  // ── Content-specific ──
  {
    sectionType: "brand_voice",
    title: "Define Brand Voice",
    description:
      "Give Claude a personality and vocabulary that matches your brand.",
    baseImpact: 8,
    template: `## Brand Voice

- **Tone**: [professional but warm / casual and direct / authoritative and reassuring]
- **Audience**: [developers / marketers / enterprise buyers / general public]
- **Personality**: [helpful expert / trusted advisor / friendly peer]
- **Use these words**: [list preferred terms]
- **Avoid these words**: [list terms that clash with your brand]
- **Sentence style**: [short and punchy / long-form and detailed / conversational]`,
    reasoning:
      "Content without voice consistency feels generic. This section turns Claude from 'an AI that writes' into a voice the reader recognizes.",
    applicableTo: ["content-creation"],
  },

  // ── Design-specific ──
  {
    sectionType: "accessibility",
    title: "Add Accessibility Standards",
    description:
      "Ensure Claude considers accessibility in all design and UI decisions.",
    baseImpact: 7,
    template: `## Accessibility

- Target: WCAG 2.1 AA compliance
- All interactive elements must be reachable by keyboard (Tab, Enter, Escape)
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text
- Every image needs meaningful alt text (or empty alt="" if decorative)
- Form fields need visible labels — never rely solely on placeholder text
- Test with screen reader (VoiceOver/NVDA) before shipping`,
    reasoning:
      "Accessibility requirements are easy to forget in the design phase but expensive to retrofit. Including them in the prompt prevents accessibility debt.",
    applicableTo: ["design"],
  },

  // ── Data-specific ──
  {
    sectionType: "dependencies",
    title: "List Data Sources and Tools",
    description:
      "Tell Claude which databases, APIs, and libraries are available.",
    baseImpact: 6,
    template: `## Data Sources & Tools

- **Primary database**: [Snowflake / BigQuery / PostgreSQL]
- **Schema**: [warehouse.schema.table — list key tables]
- **Query language**: [SQL dialect + any extensions]
- **Visualization**: [matplotlib / plotly / Chart.js]
- **Notebooks**: [Jupyter / Colab / Hex]
- **Constraints**: [query timeout, max rows, PII restrictions]`,
    reasoning:
      "Data analysis prompts that don't specify the available tools produce generic SQL that won't run against your actual warehouse.",
    applicableTo: ["data-analysis"],
  },

  // ── Operations-specific ──
  {
    sectionType: "workflow",
    title: "Define Operational Workflow",
    description:
      "Document the step-by-step process for common operational tasks.",
    baseImpact: 7,
    template: `## Workflow

### Standard Change
1. Create change request with impact analysis
2. Get peer review and approval
3. Schedule maintenance window (if needed)
4. Execute change with monitoring
5. Verify success criteria
6. Update documentation

### Incident Response
1. Acknowledge and classify severity
2. Assemble response team
3. Diagnose and mitigate
4. Communicate status to stakeholders
5. Post-incident review within 48 hours`,
    reasoning:
      "Operations prompts without workflows produce ad-hoc responses. Documented processes ensure Claude follows your organization's procedures.",
    applicableTo: ["operations"],
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

  for (const template of RECOMMENDATION_TEMPLATES) {
    // Skip if section already exists
    if (presentTypes.has(template.sectionType)) continue;

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
  }

  // Sort by impact, highest first
  recommendations.sort((a, b) => b.impact - a.impact);

  return recommendations;
}
