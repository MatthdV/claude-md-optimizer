import { analyze } from "./engines/analysis-engine";
import { evaluate } from "./engines/evaluation-engine";
import { generateSuggestions } from "./engines/enhancement-engine";
import { generateRecommendations } from "./engines/recommendation-engine";
import { generate } from "./engines/generator-engine";

// Test 1: Generator + full pipeline
const generated = generate({ lazyPrompt: "React dashboard with Supabase and Tailwind" });
const analysis = analyze(generated.content);
const evaluation = evaluate(analysis.document, analysis);
const suggestions = generateSuggestions(analysis);
const recommendations = generateRecommendations(analysis, evaluation);

console.log("Test 1 — Generator → Pipeline:");
console.log("  ProjectType:", generated.detectedProjectType);
console.log("  Technologies:", generated.detectedTechnologies.join(", "));
console.log("  Grade:", evaluation.grade, evaluation.compositeScore);
console.log("  Suggestions:", suggestions.length);
console.log("  Recommendations:", recommendations.length);

// Test 2: Optimizer on self-evident bloat (should get D or F)
const bloat = "# Instructions\nYou are a helpful coding assistant. Write good quality code and follow best practices. Handle errors properly.";
const bloatAnalysis = analyze(bloat);
const bloatEval = evaluate(bloatAnalysis.document, bloatAnalysis);
console.log("\nTest 2 — Self-evident bloat:");
console.log("  Grade:", bloatEval.grade, bloatEval.compositeScore, "(expect D or F)");
if (bloatEval.compositeScore > 59) {
  console.error("  FAIL: bloated file scored too high:", bloatEval.compositeScore);
  process.exit(1);
}

// Test 3: Good CLAUDE.md (should get B or better)
const good = `# Project\n## Commands\n- Dev: \`pnpm dev\`\n- Test: \`pnpm test\`\n- Lint: \`pnpm lint\`\n- Type check: \`pnpm tsc --noEmit\`\n## Code style\n- Use 2-space indentation\n- ES modules only\n## Workflow\n- Typecheck after changes\n- Run single file tests`;
const goodAnalysis = analyze(good);
const goodEval = evaluate(goodAnalysis.document, goodAnalysis);
console.log("\nTest 3 — Good CLAUDE.md:");
console.log("  Grade:", goodEval.grade, goodEval.compositeScore, "(expect B or A)");
if (goodEval.compositeScore < 60) {
  console.error("  FAIL: good file scored too low:", goodEval.compositeScore);
  process.exit(1);
}

console.log("\n✓ All tests passed");
