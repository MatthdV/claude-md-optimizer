// src/knowledge/section-templates.ts

export type ProjectType =
  | "react-nextjs"
  | "python-backend"
  | "fullstack"
  | "data-analysis"
  | "content-creation"
  | "design-system"
  | "devops-infra"
  | "mobile"
  | "api-backend"
  | "generic";

export interface SectionTemplate {
  heading: string;
  content: string;      // markdown string with [PLACEHOLDER] markers
  required: boolean;
  priority: number;     // 1 = most important
}

const MODERN_CLAUDE_CODE_SECTION: SectionTemplate = {
  heading: "## Modern Claude Code",
  content: `<!-- Hooks — mandatory actions (configure in .claude/settings.json): -->
<!-- - [MANDATORY_ACTION e.g., run lint after every file edit] -->

<!-- Skills — domain knowledge (.claude/skills/<topic>/SKILL.md): -->
<!-- - [DOMAIN_TOPIC e.g., api-conventions, db-schema] -->

<!-- Path-scoped rules (.claude/rules/<topic>.md with paths: frontmatter): -->
<!-- - [FILE_TYPE_RULE e.g., src/api/**/*.ts -> api validation rules] -->`,
  required: false,
  priority: 6,
};

export const REACT_NEXTJS_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# Project",
    content: "[PROJECT_NAME] — [ONE_LINE_DESCRIPTION]\n\nSee @README.md and @package.json for project overview.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Dev: \`pnpm dev\`
- Build: \`pnpm build\`
- Test: \`pnpm test\`
- Lint: \`pnpm lint\`
- Type check: \`pnpm tsc --noEmit\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- Use ES modules (import/export), not CommonJS (require)
- Destructure imports when possible
- Functional components with hooks only — no class components
- [NAMING_CONVENTION: e.g., camelCase for vars, PascalCase for components]
- [FORMATTING: e.g., Prettier defaults, 2-space indent]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Workflow",
    content: `- Be sure to typecheck when done making a series of code changes
- Prefer running single tests, not the whole suite, for performance
- Commit with descriptive messages following [COMMIT_CONVENTION: e.g., conventional commits]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- [ROUTER: e.g., App Router with /app directory]
- [STATE_MANAGEMENT: e.g., Zustand for client state, React Query for server state]
- [DATABASE: e.g., PostgreSQL via Prisma]
- [AUTH: e.g., NextAuth.js with Google OAuth]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Testing",
    content: `- Framework: [TEST_FRAMEWORK: e.g., Vitest + React Testing Library]
- Test behavior, not implementation details
- Every new component needs: renders without crashing, handles empty/loading/error states
- Run: \`pnpm test [filename]\` for single files`,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: `- [NON_OBVIOUS_BEHAVIOR_1]
- [NON_OBVIOUS_BEHAVIOR_2]`,
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const PYTHON_BACKEND_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @pyproject.toml for project overview and dependencies.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Install: \`poetry install\`
- Dev server: \`[DEV_COMMAND e.g., uvicorn app.main:app --reload]\`
- Test: \`pytest [filename]\` (single file preferred over full suite)
- Test all: \`pytest\`
- Type check: \`mypy .\`
- Lint/format: \`ruff check . && ruff format .\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- All functions and methods must have type annotations
- snake_case for variables, functions, modules; PascalCase for classes
- Black-compatible formatting (ruff format enforces this)
- No \`Any\` types unless documented with a comment explaining why
- [ADDITIONAL_STYLE_RULE]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- Framework: [FRAMEWORK e.g., FastAPI, Django, Flask]
- ORM: [ORM e.g., SQLAlchemy, Django ORM, Tortoise]
- Database: [DB e.g., PostgreSQL, SQLite]
- Cache: [CACHE e.g., Redis, none]
- [ADDITIONAL_ARCH_DECISION]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Workflow",
    content: `- Run \`mypy .\` and \`pytest\` before committing
- Prefer single test files: \`pytest tests/test_auth.py\`
- Commit format: [COMMIT_CONVENTION e.g., conventional commits]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Testing",
    content: `- Framework: pytest with [FIXTURES e.g., pytest-asyncio, factory_boy]
- Test behavior via public API, not implementation details
- Every endpoint needs: happy path, validation error, auth error tests
- Run: \`pytest tests/[filename]\``,
    required: false,
    priority: 4,
  },
  {
    heading: "## Constraints",
    content: `- Do not expose secrets in logs or error responses
- [CONSTRAINT_1 e.g., all DB queries must be parameterized]
- [CONSTRAINT_2]`,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: `- [NON_OBVIOUS_BEHAVIOR_1]
- [NON_OBVIOUS_BEHAVIOR_2]`,
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const API_BACKEND_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @package.json for project overview.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Dev: \`[DEV_COMMAND]\`
- Test: \`[TEST_COMMAND e.g., pnpm test]\` (single file preferred)
- Lint: \`[LINT_COMMAND]\`
- Migrate: \`[MIGRATE_COMMAND e.g., pnpm db:migrate]\`
- Type check: \`[TYPECHECK_COMMAND]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- [NAMING_CONVENTION e.g., camelCase for variables, PascalCase for types]
- Error response format: [ERROR_RESPONSE_FORMAT e.g., { error: { code, message } }]
- [ADDITIONAL_STYLE_RULE]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- Framework: [FRAMEWORK e.g., Express, Fastify, Hono]
- Auth: [AUTH e.g., JWT with refresh tokens]
- Database: [DB e.g., PostgreSQL via Drizzle]
- Cache: [CACHE e.g., Redis]
- Rate limiting: [RATE_LIMITING e.g., per-IP, 100 req/min]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## API conventions",
    content: `- Versioning: [VERSIONING_STRATEGY e.g., /v1/ prefix in URL]
- Pagination: [PAGINATION_FORMAT e.g., cursor-based, { data, nextCursor }]
- Error schema: [ERROR_SCHEMA e.g., { error: { code: string, message: string } }]
- [ADDITIONAL_API_CONVENTION]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Testing",
    content: `- Framework: [TEST_FRAMEWORK e.g., Vitest, Jest]
- Every endpoint: happy path, validation error, auth error, not found
- Run: \`[TEST_COMMAND] [filename]\``,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const FULLSTACK_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @package.json for project overview.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands — Frontend",
    content: `- Dev: \`[FE_DEV e.g., pnpm dev]\`
- Build: \`[FE_BUILD e.g., pnpm build]\`
- Test: \`[FE_TEST e.g., pnpm test]\`
- Lint: \`[FE_LINT e.g., pnpm lint]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands — Backend",
    content: `- Dev: \`[BE_DEV]\`
- Test: \`[BE_TEST]\`
- Lint: \`[BE_LINT]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style — Frontend",
    content: `- Framework: [FE_FRAMEWORK e.g., React, Vue, Svelte]
- Styling: [STYLING_APPROACH e.g., Tailwind CSS, CSS Modules]
- [FE_NAMING_CONVENTION]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Code style — Backend",
    content: `- Language: [BE_LANGUAGE e.g., TypeScript, Python]
- [BE_NAMING_CONVENTION e.g., snake_case for Python, camelCase for TS]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- Frontend: [FE_FRAMEWORK] with [STATE_MANAGEMENT]
- Backend: [BE_FRAMEWORK e.g., Express, FastAPI]
- Database: [DB]
- API type: [API_TYPE e.g., REST, GraphQL, tRPC]
- Auth: [AUTH]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## API boundary",
    content: `- Contract: [API_CONTRACT e.g., OpenAPI spec at docs/api.yaml]
- Never access the database from the frontend directly`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Workflow",
    content: `- Typecheck both sides: \`[FE_TYPECHECK]\` and \`[BE_TYPECHECK]\`
- Commit format: [COMMIT_CONVENTION]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const DATA_ANALYSIS_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @docs/schema.md for project overview and data schemas.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Notebook: \`[NOTEBOOK_COMMAND e.g., jupyter lab]\`
- Tests: \`[TEST_COMMAND e.g., pytest]\`
- Format: \`[FORMAT_COMMAND e.g., ruff format .]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Data sources",
    content: `- Warehouse: [WAREHOUSE e.g., Snowflake, BigQuery, Redshift]
- Key tables: [KEY_TABLES e.g., events, users, sessions]
- Schema location: [SCHEMA_LOCATION e.g., @docs/schema.md]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## SQL conventions",
    content: `- Dialect: [SQL_DIALECT e.g., BigQuery SQL, Snowflake SQL]
- Always use CTEs over nested subqueries
- Use parameterized queries — never string interpolation
- [JOIN_STYLE e.g., explicit JOINs, not implicit comma joins]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Code style",
    content: `- [PANDAS_CONVENTIONS e.g., use .assign() for chaining, avoid inplace=True]
- Type hints required on all functions
- [ADDITIONAL_STYLE_RULE]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Constraints",
    content: `- PII: [PII_RULES e.g., never log user emails, anonymize before export]
- Query timeout: [QUERY_TIMEOUT e.g., 30 seconds]
- Max rows returned: [MAX_ROW_LIMIT e.g., 10,000 without explicit override]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const CONTENT_CREATION_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "[ONE_LINE_DESCRIPTION]",
    required: true,
    priority: 1,
  },
  {
    heading: "## Voice & tone",
    content: `- Tone: [TONE e.g., direct and confident, warm but professional]
- Formality: [FORMALITY_LEVEL e.g., semi-formal, avoid jargon]
- Personality traits: [TRAITS e.g., honest, curious, never hyperbolic]`,
    required: true,
    priority: 1,
  },
  {
    heading: "## Audience",
    content: `- Primary audience: [PRIMARY_AUDIENCE e.g., senior engineers, startup founders]
- Assumed knowledge: [ASSUMED_KNOWLEDGE_LEVEL e.g., knows how to code, no marketing background]`,
    required: true,
    priority: 1,
  },
  {
    heading: "## Vocabulary",
    content: `- Preferred terms: [PREFERRED_TERMS e.g., "build" not "construct", "use" not "utilize"]
- Forbidden terms: [FORBIDDEN_TERMS e.g., "synergy", "holistic", "leverage" as a verb]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Output format",
    content: `- Length: [TARGET_LENGTH e.g., 800–1200 words for articles]
- Structure: [STRUCTURE e.g., H2 sections, no more than 3 bullet points per section]
- SEO: [SEO_REQUIREMENTS e.g., keyword in first paragraph, meta description ≤ 155 chars]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Review criteria",
    content: `- Done when: [DONE_DEFINITION e.g., passes Hemingway app grade 8, no passive voice]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Gotchas",
    content: `- [BRAND_RULE e.g., never compare to competitor X]
- [SENSITIVE_TOPIC e.g., avoid political commentary]`,
    required: false,
    priority: 5,
  },
  {
    ...MODERN_CLAUDE_CODE_SECTION,
    content: `<!-- Skills — domain knowledge (.claude/skills/<topic>/SKILL.md): -->
<!-- - [DOMAIN_TOPIC e.g., brand-voice, editorial-guidelines] -->`,
  },
];

export const DESIGN_SYSTEM_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @tokens.json for project overview and design tokens.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Build tokens: \`[BUILD_TOKENS_CMD e.g., pnpm build:tokens]\`
- Test: \`[TEST_CMD e.g., pnpm test]\`
- Storybook: \`[STORYBOOK_CMD e.g., pnpm storybook]\`
- Lint: \`[LINT_CMD]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Component conventions",
    content: `- Naming: [NAMING_CONVENTION e.g., PascalCase, Button not button]
- Props API: [PROPS_API_STYLE e.g., variant prop over individual boolean props]
- Composition: [COMPOSITION_PATTERN e.g., compound components, render props]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Design tokens",
    content: `- Colors: [COLOR_SCALE e.g., gray-50 through gray-900, see @tokens.json]
- Spacing: [SPACING_SCALE e.g., 4px base unit, t-shirt sizes sm/md/lg]
- Typography: [TYPOGRAPHY_SCALE e.g., 3 font sizes: sm/base/lg]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Accessibility",
    content: `- Standard: [WCAG_LEVEL e.g., WCAG 2.1 AA minimum]
- [SPECIFIC_A11Y_REQUIREMENTS e.g., all interactive elements keyboard-navigable]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Documentation format",
    content: `- [DOC_STYLE e.g., JSDoc for props, Storybook story per variant]`,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const DEVOPS_INFRA_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md for project overview and runbook.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Plan: \`[TERRAFORM_PLAN e.g., terraform plan -out=plan.tfplan]\`
- Apply: \`[TERRAFORM_APPLY e.g., terraform apply plan.tfplan]\`
- Kubernetes: \`[KUBECTL_CMDS e.g., kubectl apply -f k8s/]\`
- Validate: \`[VALIDATE_CMD e.g., terraform validate && tflint]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Architecture",
    content: `- Cloud provider: [CLOUD_PROVIDER e.g., AWS, GCP, Azure]
- Key services: [KEY_SERVICES e.g., EKS, RDS, ElastiCache, S3]
- Networking: [NETWORKING e.g., VPC with private subnets, NAT gateway]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Workflow",
    content: `- Run \`terraform plan\` and review output before every \`terraform apply\`
- Rollback: [ROLLBACK_PROCEDURE e.g., revert commit and apply previous state]
- Change process: [CHANGE_PROCESS e.g., PR required, reviewed by ops team]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Constraints",
    content: `- Blast radius rules: [BLAST_RADIUS_RULES e.g., max 1 AZ change per deploy]
- Approval requirements: [APPROVAL_REQUIREMENTS e.g., 2 approvals for prod]
- Environments: [ENVIRONMENT_LIST e.g., dev, staging, prod — never cross-apply]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Security",
    content: `- Least privilege: [LEAST_PRIVILEGE_RULES e.g., no wildcard IAM policies]
- Secrets: [SECRETS_MANAGEMENT e.g., AWS Secrets Manager, never in code or env files]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  {
    ...MODERN_CLAUDE_CODE_SECTION,
    content: `<!-- Hooks — mandatory actions (configure in .claude/settings.json): -->
<!-- - run terraform validate after every .tf file edit -->

<!-- Skills — domain knowledge (.claude/skills/<topic>/SKILL.md): -->
<!-- - [DOMAIN_TOPIC e.g., incident-runbook, scaling-playbook] -->

<!-- Path-scoped rules (.claude/rules/<topic>.md with paths: frontmatter): -->
<!-- - [FILE_TYPE_RULE e.g., **/*.tf -> terraform style rules] -->`,
  },
];

export const MOBILE_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "See @README.md and @package.json for project overview.",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Build: \`[BUILD_CMD e.g., pnpm ios / pnpm android]\`
- Test: \`[TEST_CMD e.g., pnpm test]\`
- Emulator: \`[EMULATOR_CMD e.g., pnpm start]\`
- Lint: \`[LINT_CMD]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- Platform: [PLATFORM e.g., React Native, iOS Swift, Android Kotlin]
- [NAMING_CONVENTION e.g., camelCase for RN, Swift conventions for iOS]
- [ADDITIONAL_STYLE_RULE]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Architecture",
    content: `- Navigation: [NAVIGATION_LIBRARY e.g., React Navigation, UIKit]
- State management: [STATE_MANAGEMENT e.g., Zustand, Redux Toolkit]
- API layer: [API_LAYER e.g., React Query, Alamofire]
- Offline strategy: [OFFLINE_STRATEGY e.g., SQLite cache, optimistic updates]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Performance budgets",
    content: `- Bundle size: [BUNDLE_SIZE_LIMIT e.g., < 50MB]
- Frame rate target: [FRAME_RATE_TARGET e.g., 60fps on mid-range devices]
- Startup time: [STARTUP_TIME_LIMIT e.g., cold start < 2s]`,
    required: true,
    priority: 3,
  },
  {
    heading: "## Constraints",
    content: `- Offline: [OFFLINE_REQUIREMENTS e.g., core features work without internet]
- Permissions: [PERMISSIONS_POLICY e.g., request at point of use, explain why]`,
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]\n- [NON_OBVIOUS_BEHAVIOR_2]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const GENERIC_TEMPLATE: SectionTemplate[] = [
  {
    heading: "# [PROJECT_NAME]",
    content: "[ONE_LINE_DESCRIPTION]",
    required: true,
    priority: 1,
  },
  {
    heading: "## Commands",
    content: `- Dev: \`[DEV_COMMAND]\`
- Build: \`[BUILD_COMMAND]\`
- Test: \`[TEST_COMMAND]\`
- Lint: \`[LINT_COMMAND]\``,
    required: true,
    priority: 1,
  },
  {
    heading: "## Code style",
    content: `- Language: [LANGUAGE]
- Naming: [NAMING_CONVENTION]
- Formatting: [FORMATTING_TOOL e.g., Prettier, Black, gofmt]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Workflow",
    content: `- Typecheck: \`[TYPECHECK_COMMAND]\`
- Commit format: [COMMIT_CONVENTION]`,
    required: true,
    priority: 2,
  },
  {
    heading: "## Constraints",
    content: "- [CONSTRAINT_1]\n- [CONSTRAINT_2]",
    required: false,
    priority: 4,
  },
  {
    heading: "## Gotchas",
    content: "- [NON_OBVIOUS_BEHAVIOR_1]",
    required: false,
    priority: 5,
  },
  MODERN_CLAUDE_CODE_SECTION,
];

export const SECTION_TEMPLATES: Record<ProjectType, SectionTemplate[]> = {
  "react-nextjs": REACT_NEXTJS_TEMPLATE,
  "python-backend": PYTHON_BACKEND_TEMPLATE,
  "api-backend": API_BACKEND_TEMPLATE,
  fullstack: FULLSTACK_TEMPLATE,
  "data-analysis": DATA_ANALYSIS_TEMPLATE,
  "content-creation": CONTENT_CREATION_TEMPLATE,
  "design-system": DESIGN_SYSTEM_TEMPLATE,
  "devops-infra": DEVOPS_INFRA_TEMPLATE,
  mobile: MOBILE_TEMPLATE,
  generic: GENERIC_TEMPLATE,
};
