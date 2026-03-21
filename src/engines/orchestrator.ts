/**
 * Orchestrator
 *
 * Coordinates the four engines, manages caching, and exposes
 * a single `run()` function that produces a complete OptimizerResult.
 */

import type { OptimizerResult, AnalysisResult, EvaluationResult } from "../types";
import { analyze } from "./analysis-engine";
import { evaluate } from "./evaluation-engine";
import { generateSuggestions } from "./enhancement-engine";
import { generateRecommendations } from "./recommendation-engine";
import { hashContent } from "../utils/helpers";

// ─── Cache ───────────────────────────────────────────────────────────

const cache = new Map<string, OptimizerResult>();
const MAX_CACHE_SIZE = 20;

function getCacheKey(content: string): string {
  return hashContent(content);
}

function evictOldest(): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Run the full optimization pipeline on a raw claude.md string.
 * Returns cached result if the content hasn't changed.
 */
export function run(rawContent: string): OptimizerResult {
  const key = getCacheKey(rawContent);

  // Cache hit
  const cached = cache.get(key);
  if (cached) return cached;

  const start = performance.now();

  // Step 1: Analysis
  const analysisResult: AnalysisResult = analyze(rawContent);

  // Step 2: Evaluation (depends on analysis)
  const evaluationResult: EvaluationResult = evaluate(analysisResult);

  // Step 3: Enhancement suggestions (depends on analysis)
  const suggestions = generateSuggestions(analysisResult);

  // Step 4: Recommendations (depends on analysis + evaluation)
  const recommendations = generateRecommendations(analysisResult, evaluationResult);

  const result: OptimizerResult = {
    analysis: analysisResult,
    evaluation: evaluationResult,
    suggestions,
    recommendations,
    processingTimeMs: Math.round(performance.now() - start),
  };

  // Cache result
  evictOldest();
  cache.set(key, result);

  return result;
}

/**
 * Clear the cache (useful when the user changes analysis settings).
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Check if a result exists in cache without running analysis.
 */
export function hasCachedResult(rawContent: string): boolean {
  return cache.has(getCacheKey(rawContent));
}
