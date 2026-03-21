# Claude.md Optimizer — Technical Specification

## 1. Architecture Overview

The system is four engines coordinated by a central orchestrator, surfaced through a React sidebar UI.

```
┌─────────────────────────────────────────────────────────┐
│                    React UI Layer                        │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Sidebar  │  │ Diff Viewer  │  │ Score Dashboard   │  │
│  │ Panel    │  │ (before/     │  │ (radar chart +    │  │
│  │          │  │  after)      │  │  dimension cards) │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       │               │                   │              │
│       └───────────────┼───────────────────┘              │
│                       │                                  │
│              ┌────────▼────────┐                         │
│              │  Orchestrator   │  ← debounced trigger    │
│              │  (useOptimizer) │    or manual invoke      │
│              └────────┬────────┘                         │
└───────────────────────┼─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
  ┌─────▼─────┐  ┌──────▼──────┐  ┌────▼──────┐
  │  Analysis  │  │ Enhancement │  │ Evaluation│
  │  Engine    │  │ Engine      │  │ Engine    │
  │            │  │             │  │           │
  │ • parse    │  │ • suggest   │  │ • score   │
  │ • detect   │  │ • rephrase  │  │ • explain │
  │ • flag     │  │ • recommend │  │ • rank    │
  └─────┬──────┘  └──────┬──────┘  └────┬──────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
               ┌────────▼────────┐
               │ Recommendation  │
               │ Engine          │
               │                 │
               │ • missing       │
               │   sections      │
               │ • priority sort │
               │ • templates     │
               └─────────────────┘
```

### Data Flow

1. User edits claude.md content in the main editor
2. Orchestrator receives content (debounced 800ms for real-time, immediate for on-demand)
3. Analysis Engine parses the markdown into an AST, detects project type, flags issues
4. Results feed into Enhancement Engine (generates suggestions) and Evaluation Engine (scores) in parallel
5. Recommendation Engine receives analysis + evaluation results, produces prioritized missing-section suggestions
6. UI renders everything as a hierarchical sidebar: score dashboard at top, critical issues, enhancements, optional additions

### Caching Strategy

Each engine caches results keyed by a content hash (first 16 chars of SHA-256). When the user makes a small edit, only the changed sections are re-analyzed — the orchestrator diffs the previous and current section-level hashes to determine what needs reprocessing.

---

## 2. Core Data Model

The system operates on a `ClaudeMdDocument` — a parsed, structured representation of the raw markdown.

### Section Taxonomy

Every claude.md is decomposed into typed sections:

| Section Type          | Description                                    | Required? |
|-----------------------|------------------------------------------------|-----------|
| `role`                | Who Claude should be / persona definition       | Always    |
| `behavior`            | Behavioral instructions and tone                | Always    |
| `constraints`         | What Claude should NOT do                       | Always    |
| `context`             | Background info, project description            | Always    |
| `output_format`       | How responses should be structured              | Usually   |
| `code_conventions`    | Language-specific standards, linting, patterns  | If code   |
| `security`            | Auth, data handling, secrets management          | If code   |
| `testing`             | Test expectations, coverage, frameworks          | If code   |
| `accessibility`       | A11y standards, WCAG targets                     | If design |
| `brand_voice`         | Tone, vocabulary, messaging pillars              | If content|
| `error_handling`      | How to handle ambiguity, edge cases              | Recommended|
| `examples`            | Input/output examples, few-shot demonstrations   | Recommended|
| `dependencies`        | External tools, APIs, libraries in scope          | Optional  |
| `workflow`            | Multi-step processes, decision trees              | Optional  |

### Project Type Detection

The Analysis Engine classifies projects into one of these archetypes based on keyword density, section presence, and file-path references found in the content:

- **code-focused**: mentions of languages, frameworks, linters, tests, APIs
- **content-creation**: brand voice, tone, audience, messaging, editorial
- **data-analysis**: SQL, datasets, charts, statistical methods, dashboards
- **design**: Figma, components, accessibility, responsive, tokens
- **operations**: runbooks, deployments, monitoring, incident response
- **mixed**: significant signals from 2+ categories (uses the top-2 for recommendations)

---

## 3. Evaluation Scoring Framework

### Dimensions

Each dimension is scored 0–100. The composite score is a weighted average.

| Dimension             | Weight | What it measures                                                |
|-----------------------|--------|-----------------------------------------------------------------|
| **Completeness**      | 25%    | Are all sections present that the project type requires?         |
| **Clarity**           | 25%    | Are instructions unambiguous? Free of vague qualifiers?          |
| **Technical Accuracy**| 20%    | Do code conventions, tool references, and patterns match reality?|
| **Scope Alignment**   | 15%    | Does the prompt stay focused on its declared project type?       |
| **Structure**         | 10%    | Logical flow, no redundancy, consistent formatting               |
| **Constraint Quality**| 5%     | Are boundaries well-defined and non-contradictory?               |

### Scoring Logic per Dimension

**Completeness (0–100)**
```
required_sections = sections_required_for(detected_project_type)
present = count of required_sections found in document
score = (present / total_required) * 80
  + has_examples * 10
  + has_error_handling * 10
```

**Clarity (0–100)**
```
issues = []
for each section:
  issues += count_vague_qualifiers(section)     // "as needed", "if appropriate", "etc."
  issues += count_ambiguous_references(section)  // "it", "this", "that" without clear antecedent
  issues += count_passive_voice(section)         // weakens instructions
  issues += count_hedge_words(section)           // "maybe", "perhaps", "consider"

penalty = min(issues.length * 3, 60)
score = 100 - penalty
```

**Technical Accuracy (0–100)**
```
checks = []
if project_type includes code:
  checks += validate_language_conventions(section)  // e.g., Python style but mentions camelCase
  checks += validate_tool_references(section)       // tools that exist and are spelled correctly
  checks += validate_version_compatibility(section)  // conflicting version requirements

score = 100 - (failed_checks * 15)
```

**Scope Alignment (0–100)**
```
primary_type = detected_project_type
for each section:
  relevance = compute_relevance(section, primary_type)  // 0.0–1.0
  if relevance < 0.3:
    flag as potential scope creep

off_topic_ratio = off_topic_sections / total_sections
score = 100 - (off_topic_ratio * 100)
```

**Structure (0–100)**
```
penalties = 0
penalties += duplicate_instruction_count * 10
penalties += out_of_order_sections * 5       // role should come before constraints, etc.
penalties += inconsistent_heading_levels * 3
penalties += missing_section_separators * 2

score = max(0, 100 - penalties)
```

**Constraint Quality (0–100)**
```
constraints = extract_constraints(document)
score = 100
for each constraint:
  if contradicts(constraint, other_constraints): score -= 20
  if too_vague(constraint): score -= 10
  if unreasonable_scope(constraint): score -= 10
  if duplicates(constraint, other_constraints): score -= 5
```

### Grade Bands

| Score Range | Grade | Meaning                                    |
|-------------|-------|--------------------------------------------|
| 90–100      | A     | Production-ready, minor polish possible     |
| 75–89       | B     | Good foundation, a few gaps to address      |
| 60–74       | C     | Functional but missing important elements   |
| 40–59       | D     | Significant issues that will cause problems |
| 0–39        | F     | Needs substantial rework                    |

---

## 4. Integration Points

### With the Claude.md Generator

The optimizer connects to the existing generator through three hooks:

1. **Content subscription** — the optimizer listens to the editor's content state (via shared React context or a pub/sub event). No coupling to the editor's internals.

2. **Suggestion application** — when the user clicks "Apply" on a suggestion, the optimizer emits a `patch` event containing the old text and new text. The editor applies it as a diff, preserving cursor position and undo history.

3. **Section navigation** — clicking a flagged issue in the sidebar scrolls the editor to the relevant section. This uses a shared `scrollToSection(sectionId)` callback.

### Real-time vs. On-demand Modes

- **Real-time**: content changes are debounced (800ms). Only the score dashboard and critical-issue count update automatically. Full suggestion list refreshes only on pause.
- **On-demand**: user clicks "Analyze" button. Full pipeline runs. Results replace any stale cached results.

The mode is toggled via a switch in the sidebar header. Default: on-demand (to avoid distracting users mid-thought).

### Streaming / Progressive Disclosure

For large documents, the pipeline streams results:
1. Score dashboard appears first (fast — just counting and pattern matching)
2. Critical issues appear next (high-priority flags from Analysis Engine)
3. Enhancement suggestions stream in as the Enhancement Engine processes each section
4. Recommendation Engine results appear last (depends on full analysis completion)

Each stage triggers a React state update, so the UI fills in progressively without blocking.
