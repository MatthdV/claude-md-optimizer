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
  let commandsInjected = false;

  for (const section of template) {
    let content = section.content;

    // Replace technology placeholders based on detected techs
    const detectedSignals = TECH_SIGNALS.filter((s) => s.keyword.test(lazyPrompt));
    for (const tech of detectedSignals) {
      if (tech.section === "architecture" && section.heading.toLowerCase().includes("architecture")) {
        // Try to replace a [DATABASE:...] or [FRAMEWORK:...] placeholder line if present
        const replaced = content.replace(/^- \[(?:DATABASE|FRAMEWORK|ORM|AUTH)[^\]]*\]\s*$/im, `- ${tech.content.replace(/^- /, "")}`);
        if (replaced !== content) {
          content = replaced;
        } else {
          content = content + "\n" + tech.content;
        }
      }
      if (tech.section === "code_style" && section.heading.toLowerCase().includes("code style")) {
        const replaced = content.replace(/^- \[(?:NAMING_CONVENTION|FORMATTING|STYLING)[^\]]*\]\s*$/im, `- ${tech.content.replace(/^- /, "")}`);
        if (replaced !== content) {
          content = replaced;
        } else {
          content = content + "\n" + tech.content;
        }
      }
    }

    // Inject default commands — only on the first Commands heading; skip subsequent ones
    if (section.heading.includes("Commands")) {
      if (commandsInjected) continue;
      content = DEFAULT_COMMANDS[projectType];
      commandsInjected = true;
      // Normalise the heading to plain "## Commands" regardless of suffix (e.g. "— Frontend")
      sections.push(`## Commands\n${content}`);
      continue;
    }

    sections.push(`${section.heading}\n${content}`);
  }

  // For templates with no Commands section at all (e.g. content-creation), inject one
  if (!commandsInjected) {
    sections.splice(1, 0, `## Commands\n${DEFAULT_COMMANDS[projectType]}`);
  }

  const output = sections.join("\n\n");

  // Extract remaining [PLACEHOLDER] markers
  const placeholderRegex = /\[[A-Z][^\]]*\]/g;
  const placeholders = (output.match(placeholderRegex) ?? []);
  const uniquePlaceholders = [...new Set(placeholders)];

  // Count lines
  const lines = output.split("\n");

  return {
    content: output,
    detectedProjectType: projectType,
    detectedTechnologies: detectedTechs,
    placeholders: uniquePlaceholders,
    lineCount: lines.length,
  };
}
