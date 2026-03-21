# Claude.md Optimizer — Implementation Blueprint

A client-side prompt optimization engine for React/Next.js that analyzes, scores, and improves `claude.md` files in real-time.

## Project Structure

```
claude-md-optimizer/
├── SPECIFICATION.md          ← Architecture, data flow, scoring rubric
├── EXAMPLES.md               ← 5 concrete weak → improved analyses
├── README.md                 ← This file
└── src/
    ├── types/
    │   └── index.ts          ← All TypeScript interfaces and type definitions
    ├── utils/
    │   └── helpers.ts        ← Hashing, debounce, ID generation, similarity
    ├── engines/
    │   ├── index.ts          ← Barrel export
    │   ├── analysis-engine.ts    ← Parses markdown, detects project type, flags issues
    │   ├── evaluation-engine.ts  ← 6-dimension scoring with weighted composite
    │   ├── enhancement-engine.ts ← Generates before/after suggestions from issues
    │   ├── recommendation-engine.ts ← Suggests missing sections with templates
    │   └── orchestrator.ts       ← Coordinates engines, manages cache
    ├── hooks/
    │   └── useOptimizer.ts   ← React hook: debounced analysis, mode toggling
    └── components/
        ├── OptimizerSidebar.tsx    ← Main sidebar UI with tabs and suggestion cards
        └── EditorIntegration.tsx   ← Example wiring into an editor page
```

## How It Works

### Pipeline

1. **User edits** claude.md content in the main editor
2. **Orchestrator** receives content (debounced 800ms in realtime mode, immediate on-demand)
3. **Analysis Engine** parses into sections, detects project type, runs 7 detection rules
4. **Evaluation Engine** scores across 6 dimensions (completeness, clarity, technical accuracy, scope alignment, structure, constraint quality)
5. **Enhancement Engine** maps each issue to a concrete suggestion with before/after text
6. **Recommendation Engine** suggests missing sections with starter templates
7. **UI** renders everything in a sidebar: score dashboard → issues → suggestions → add sections

### Scoring Dimensions

| Dimension          | Weight | What it measures                              |
|--------------------|--------|-----------------------------------------------|
| Completeness       | 25%    | Required sections present for project type     |
| Clarity            | 25%    | No vague qualifiers, hedges, or passive voice  |
| Technical Accuracy | 20%    | Tools, conventions, versions are correct        |
| Scope Alignment    | 15%    | Content stays focused on the project type       |
| Structure          | 10%    | Logical ordering, no empty or bloated sections  |
| Constraint Quality | 5%     | Boundaries are specific and non-contradictory   |

### Detection Rules

The analysis engine runs these checks:
- **missing-section**: flags required sections that aren't present
- **vague-qualifier**: catches "as needed", "best practices", "properly", etc.
- **hedge-word**: catches "maybe", "try to", "could consider"
- **contradiction**: detects "always X" conflicting with "never X"
- **duplicate**: finds near-identical instructions across sections (Jaccard similarity > 0.7)
- **no-examples**: warns when no input/output examples exist
- **section-too-long**: flags sections over 80 lines

## Integration

### Minimal setup

```tsx
import { EditorIntegration } from "./components/EditorIntegration";

export default function Page() {
  return <EditorIntegration initialContent={existingClaudeMd} />;
}
```

### Custom integration

```tsx
import { useOptimizer } from "./hooks/useOptimizer";
import { OptimizerSidebar } from "./components/OptimizerSidebar";

function MyEditor() {
  const { state, analyzeNow, onContentChange, setMode } = useOptimizer();

  return (
    <>
      <YourEditorComponent onChange={(text) => onContentChange(text)} />
      <OptimizerSidebar
        result={state.result}
        isAnalyzing={state.isAnalyzing}
        mode={state.mode}
        onModeChange={setMode}
        onAnalyzeClick={() => analyzeNow(editorContent)}
        onApplySuggestion={(s) => { /* apply diff to editor */ }}
        onApplyRecommendation={(r) => { /* append template */ }}
        onScrollToSection={(id) => { /* scroll editor */ }}
      />
    </>
  );
}
```

### Suggestion application contract

When the user clicks "Apply" on a suggestion, the sidebar emits:
- `currentText` (string | undefined): what to find in the document
- `suggestedText` (string): what to replace it with, or what to append

Your editor is responsible for applying this patch and preserving undo history.

## Design Decisions

**Why client-side?** The analysis is pattern matching and counting — no LLM call needed. Running it in the browser means zero latency, no API costs, and no data leaves the user's machine.

**Why not auto-apply suggestions?** This is an advisory system. Users know their project better than any heuristic. Every suggestion requires explicit confirmation.

**Why cache by content hash?** Users edit iteratively. If they undo a change or re-type the same content, we skip reprocessing. The cache holds up to 20 results and evicts oldest-first.

**Why debounce at 800ms?** Shorter delays trigger too often during active typing, producing distracting UI updates. 800ms balances responsiveness with calm.

## Extending the System

### Add a new detection rule

In `analysis-engine.ts`, add an entry to `DETECTION_RULES`:

```ts
{
  id: "my-new-rule",
  severity: "warning",
  title: "Description for the issues list",
  test(doc) {
    // Return AnalysisIssue[] — empty array if no issues found
  },
}
```

Then add a matching generator in `enhancement-engine.ts` under `GENERATORS["my-new-rule"]`.

### Add a new project type

1. Add the type to `ProjectType` in `types/index.ts`
2. Add signal patterns in `PROJECT_TYPE_SIGNALS` (analysis-engine.ts)
3. Add required sections in `REQUIRED_FOR_PROJECT_TYPE` (analysis-engine.ts)
4. Add recommendation templates in `RECOMMENDATION_TEMPLATES` (recommendation-engine.ts)

### Swap the scoring weights

Edit `DIMENSION_WEIGHTS` in `evaluation-engine.ts`. Weights must sum to 1.0.
