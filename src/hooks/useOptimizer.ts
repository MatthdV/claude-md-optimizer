/**
 * useOptimizer Hook
 *
 * React hook that connects the editor's content state to the
 * optimization pipeline. Supports both real-time and on-demand modes.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { OptimizerResult, OptimizerMode, OptimizerState } from "../types";
import { run, hasCachedResult } from "../engines/orchestrator";
import { debounce } from "../utils/helpers";

const DEBOUNCE_MS = 800;

interface UseOptimizerOptions {
  initialMode?: OptimizerMode;
}

interface UseOptimizerReturn {
  state: OptimizerState;
  /** Manually trigger a full analysis */
  analyzeNow: (content: string) => void;
  /** Feed content changes (only triggers analysis in realtime mode) */
  onContentChange: (content: string) => void;
  /** Toggle between realtime and on-demand modes */
  setMode: (mode: OptimizerMode) => void;
  /** Reset state to initial */
  reset: () => void;
}

const INITIAL_STATE: OptimizerState = {
  mode: "on-demand",
  isAnalyzing: false,
  result: null,
  error: null,
  lastAnalyzedHash: null,
};

export function useOptimizer(
  options: UseOptimizerOptions = {}
): UseOptimizerReturn {
  const [state, setState] = useState<OptimizerState>({
    ...INITIAL_STATE,
    mode: options.initialMode ?? "on-demand",
  });

  const debouncedRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Run the analysis pipeline
  const runAnalysis = useCallback((content: string) => {
    if (!content.trim()) {
      setState((prev) => ({
        ...prev,
        result: null,
        error: null,
        isAnalyzing: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Run synchronously — the engines are fast enough for client-side.
      // For very large documents, this could be moved to a Web Worker.
      const result = run(content);

      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        result,
        lastAnalyzedHash: result.analysis.document.contentHash,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: err instanceof Error ? err.message : "Analysis failed",
      }));
    }
  }, []);

  // Set up debounced version for realtime mode
  useEffect(() => {
    debouncedRef.current = debounce(runAnalysis, DEBOUNCE_MS);
    return () => debouncedRef.current?.cancel();
  }, [runAnalysis]);

  // Manual trigger
  const analyzeNow = useCallback(
    (content: string) => {
      debouncedRef.current?.cancel();
      runAnalysis(content);
    },
    [runAnalysis]
  );

  // Content change handler — only auto-analyzes in realtime mode
  const onContentChange = useCallback(
    (content: string) => {
      if (state.mode === "realtime") {
        debouncedRef.current?.call(content);
      }
    },
    [state.mode]
  );

  const setMode = useCallback((mode: OptimizerMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const reset = useCallback(() => {
    debouncedRef.current?.cancel();
    setState({ ...INITIAL_STATE });
  }, []);

  return { state, analyzeNow, onContentChange, setMode, reset };
}
