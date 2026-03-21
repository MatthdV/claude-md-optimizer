# Example Analyses — Weak → Improved claude.md

These five examples demonstrate how the optimizer would analyze real claude.md files and produce actionable suggestions.

---

## Example 1: Vague Code-Focused Prompt

### Input (weak)

```markdown
# Claude Instructions

You are a helpful coding assistant. Write good quality code and follow best practices. Use TypeScript when appropriate. Handle errors properly. Don't do anything bad.
```

### Optimizer Output

**Score: 31/100 (Grade F)**

| Dimension          | Score | Key Issue                                    |
|--------------------|-------|----------------------------------------------|
| Completeness       | 13    | Missing 5 of 6 required sections             |
| Clarity            | 40    | 5 vague qualifiers ("good quality", etc.)    |
| Technical Accuracy | 85    | TypeScript mention is valid                   |
| Scope Alignment    | 70    | Detected code-focused, but too thin to assess |
| Structure          | 30    | Single section, no organization               |
| Constraint Quality | 10    | "Don't do anything bad" is not actionable      |

**Critical suggestions (sorted by impact):**

1. **Add a role definition (impact 9/10)**
   - Current: `You are a helpful coding assistant.`
   - Suggested: `You are a senior TypeScript engineer working on [project name]. You specialize in [React/Node/etc.] and follow the team's established patterns.`
   - Why: "Helpful coding assistant" gives Claude no identity. A specific role produces code that matches your actual project.

2. **Add project context (impact 9/10)**
   - Missing entirely. Template provided:
   ```markdown
   ## Project Context
   - Project: [name and brief description]
   - Tech stack: TypeScript, [frameworks], [database]
   - Repository structure: [brief overview]
   ```

3. **Replace "good quality" (impact 6/10)**
   - Current: `Write good quality code`
   - Suggested: `Write code that passes ESLint strict mode, includes JSDoc for public functions, and handles the error cases listed below`

4. **Replace "handle errors properly" (impact 6/10)**
   - Current: `Handle errors properly`
   - Suggested: `Wrap async operations in try/catch. Return typed error objects (never throw raw strings). Log errors with context: the function name, input params, and error message.`

5. **Replace "don't do anything bad" (impact 5/10)**
   - Current: `Don't do anything bad.`
   - Suggested: Remove entirely and replace with specific constraints:
   ```markdown
   ## Constraints
   - Do not modify database schemas without explicit approval
   - Never commit secrets or API keys
   - Do not add new dependencies without discussing the trade-off
   ```

---

## Example 2: Content-Creation Prompt Missing Voice

### Input (weak)

```markdown
# Blog Writer

## Role
You write blog posts for our company.

## Output
Write in markdown. Keep it professional. Use headers and bullet points.

## Rules
- Don't write anything offensive
- Keep posts under 1500 words
- Use SEO keywords when appropriate
```

### Optimizer Output

**Score: 52/100 (Grade D)**

| Dimension          | Score | Key Issue                                   |
|--------------------|-------|---------------------------------------------|
| Completeness       | 40    | Missing brand_voice, examples, context      |
| Clarity            | 64    | "when appropriate" is vague                 |
| Technical Accuracy | 95    | No technical issues                         |
| Scope Alignment    | 85    | Content-creation detected, stays focused    |
| Structure          | 70    | Reasonable but thin                         |
| Constraint Quality | 50    | Constraints are too generic                 |

**Top suggestions:**

1. **Add brand voice definition (impact 8/10)**
   - Your content-creation prompt has no voice section. Every blog post will sound generically "professional." Template:
   ```markdown
   ## Voice & Tone
   - Tone: conversational expert — like explaining to a smart colleague over coffee
   - We say "we" not "the company." We use contractions.
   - Avoid: corporate jargon ("leverage", "synergy"), filler ("it's worth noting")
   - Audience: mid-level marketers who know the basics but want advanced strategies
   ```

2. **Add input/output examples (impact 8/10)**
   - Show one paragraph written the way you want it, and one written the way you don't. Claude will extrapolate far better from a concrete example than from abstract instructions.

3. **Replace "when appropriate" in SEO rule (impact 6/10)**
   - Current: `Use SEO keywords when appropriate`
   - Suggested: `Include the primary keyword in the title, first paragraph, and 2–3 subheadings. Use related keywords naturally — never force them.`

---

## Example 3: Over-Specified Operations Prompt

### Input (weak)

```markdown
# DevOps Assistant

## Role
You are a DevOps engineer who is an expert in Kubernetes, Docker, Terraform, AWS, GCP, Azure, Ansible, Puppet, Chef, Jenkins, CircleCI, GitHub Actions, GitLab CI, ArgoCD, Flux, Helm, Kustomize, Prometheus, Grafana, Datadog, PagerDuty, OpsGenie, Splunk, ELK stack, Jaeger, Zipkin, Consul, Vault, and all other DevOps tools.

## Instructions
Always write production-ready code. Never write code that could cause downtime. Always follow the principle of least privilege. Always use infrastructure as code. Never make manual changes. Always document everything. Always test in staging first. Never skip code review. Always use semantic versioning. Always follow the 12-factor app methodology.

## Constraints
- Must be compatible with all cloud providers
- Must work with any CI/CD system
- Must support any container orchestration platform
- Must handle any scale from 1 to 1 million requests per second
```

### Optimizer Output

**Score: 48/100 (Grade D)**

| Dimension          | Score | Key Issue                                      |
|--------------------|-------|-------------------------------------------------|
| Completeness       | 53    | Missing workflow, error_handling, examples       |
| Clarity            | 55    | "Always/never" pairs create contradictions      |
| Technical Accuracy | 40    | Claims expertise in 30+ tools simultaneously    |
| Scope Alignment    | 60    | Scope is too broad — tries to be everything     |
| Structure          | 55    | Three sections, but instructions are a wall of text |
| Constraint Quality | 20    | Constraints are unreasonable (any scale, any provider) |

**Critical suggestions:**

1. **Narrow the tool scope (impact 9/10)**
   - Current: lists 30+ tools
   - Suggested: `You are a DevOps engineer specializing in our stack: Kubernetes (EKS), Terraform, GitHub Actions, and Datadog. You're familiar with the broader ecosystem but default to these tools.`
   - Why: A prompt that claims expertise in everything gives Claude no useful signal. It'll spread attention thin instead of going deep on your actual stack.

2. **Fix contradictory "always/never" rules (impact 9/10)**
   - "Never write code that could cause downtime" contradicts reality — any infrastructure change carries some risk. Reframe as: `Assess downtime risk for every change. For anything that could affect production traffic, include a rollback plan and a canary deployment step.`

3. **Make constraints realistic (impact 8/10)**
   - "Must be compatible with all cloud providers" and "any scale" are impossible constraints. Reframe:
   ```markdown
   ## Constraints
   - Primary target: AWS (EKS). Note when a solution is AWS-specific.
   - Design for our current scale (~10K RPS) with headroom to 50K.
   - If a request requires multi-cloud, flag it and ask for prioritization.
   ```

4. **Add workflow for common tasks (impact 7/10)**
   - Template provided for incident response and standard change workflows.

---

## Example 4: Good Foundation, Missing Precision

### Input (decent but improvable)

```markdown
# Frontend Engineer

## Role
You are a senior React/TypeScript engineer working on a SaaS dashboard application. You have deep expertise in React 18, TypeScript 5, Tailwind CSS, and Zustand for state management.

## Project Context
- Next.js 14 app with App Router
- PostgreSQL database accessed via Prisma
- Authentication via NextAuth.js
- Deployed on Vercel

## Code Standards
- Use functional components with hooks
- Prefer composition over prop drilling
- All components should be typed — no `any`
- Use Tailwind for styling, no CSS modules

## Output Format
- Provide complete, runnable code
- Include import statements
- Add brief comments for non-obvious logic
```

### Optimizer Output

**Score: 72/100 (Grade C)**

| Dimension          | Score | Key Issue                                   |
|--------------------|-------|---------------------------------------------|
| Completeness       | 67    | Missing constraints, error_handling, testing |
| Clarity            | 85    | Clear and specific instructions              |
| Technical Accuracy | 90    | Stack references are accurate and current    |
| Scope Alignment    | 95    | Tightly focused on frontend code             |
| Structure          | 75    | Good but missing section ordering notes      |
| Constraint Quality | 40    | No constraints section at all                |

**Suggestions (enhancements, not rewrites):**

1. **Add constraints section (impact 8/10)**
   ```markdown
   ## Constraints
   - Do not install new npm packages without discussing the trade-off first
   - Do not modify the database schema or Prisma models — ask before touching those
   - Keep components under 150 lines — extract sub-components if longer
   - No direct DOM manipulation — use refs only when React APIs are insufficient
   ```

2. **Add error handling guidance (impact 6/10)**
   ```markdown
   ## Error Handling
   - Wrap data fetching in error boundaries at the page level
   - Use React Query's error states for API calls — don't catch and swallow
   - Show user-facing errors via the toast system (components/ui/toast)
   - Log errors to Sentry with component context
   ```

3. **Add testing expectations (impact 5/10)**
   ```markdown
   ## Testing
   - Use Vitest + React Testing Library
   - Test user behavior, not implementation details
   - Every new component needs at least: renders without crashing, handles empty/loading/error states
   - Don't mock Zustand — use the real store with test data
   ```

---

## Example 5: Non-English Prompt (French) with Detected Issues

### Input

```markdown
# Assistant de Rédaction

## Rôle
Tu es un rédacteur web professionnel. Tu écris du contenu de qualité pour notre blog tech.

## Instructions
- Utilise un ton professionnel mais accessible
- Écris en français correct
- Fais des articles de bonne qualité
- Utilise les mots-clés SEO quand c'est approprié
- Essaie de rendre le contenu engageant
```

### Optimizer Output

**Language detected: FR**
**Score: 45/100 (Grade D)**

| Dimension          | Score | Key Issue                                    |
|--------------------|-------|----------------------------------------------|
| Completeness       | 33    | Missing brand_voice, examples, output_format |
| Clarity            | 52    | "bonne qualité", "quand c'est approprié"     |
| Technical Accuracy | 90    | No tech issues                               |
| Scope Alignment    | 80    | Content-creation, stays on topic             |
| Structure          | 50    | Two thin sections                            |
| Constraint Quality | 30    | No real constraints defined                  |

**Suggestions (in French, matching detected language):**

1. **Remplacer « bonne qualité » (impact 6/10)**
   - Actuel : `Fais des articles de bonne qualité`
   - Suggéré : `Écris des articles de 800–1200 mots, structurés avec des sous-titres, incluant au moins un exemple concret et une conclusion actionnable.`

2. **Remplacer « quand c'est approprié » (impact 6/10)**
   - Actuel : `Utilise les mots-clés SEO quand c'est approprié`
   - Suggéré : `Place le mot-clé principal dans le titre, le premier paragraphe, et 2 sous-titres. Utilise les mots-clés secondaires naturellement dans le corps du texte.`

3. **Renforcer « essaie de » (impact 4/10)**
   - Actuel : `Essaie de rendre le contenu engageant`
   - Suggéré : `Commence chaque article par une accroche — une question, une statistique surprenante, ou une affirmation forte. Utilise des exemples concrets plutôt que des généralités.`

4. **Ajouter une section voix de marque (impact 8/10)**
   - Template fourni en français avec registre de langue, vocabulaire préféré, et exemples de ton.
