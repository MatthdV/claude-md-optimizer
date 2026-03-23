"use client";

/**
 * OptimizerSidebar
 *
 * Shows scores, issues, suggestions, and recommendations.
 * Reads from and writes to the Zustand store directly.
 */

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useOptimizerStore } from "../store/optimizer-store";
import { t } from "../lib/i18n";
import type {
  IssueSeverity,
  Suggestion,
  SectionRecommendation,
  DimensionScore,
} from "../types";

// ─── SeverityBadge ───────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: IssueSeverity }): React.ReactElement {
  const config = {
    critical: { label: "Critical", className: "bg-red-50 text-red-600 ring-red-200" },
    warning:  { label: "Warning",  className: "bg-amber-50 text-amber-600 ring-amber-200" },
    suggestion: { label: "Tip",   className: "bg-blue-50 text-blue-600 ring-blue-200" },
  }[severity];

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ${config.className}`}>
      {config.label}
    </span>
  );
}

// ─── DimensionBar ─────────────────────────────────────────────────────

function DimensionBar({ dimension }: { dimension: DimensionScore }): React.ReactElement {
  const label = dimension.dimension
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const barColor =
    dimension.score >= 80
      ? "bg-emerald-500"
      : dimension.score >= 60
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">{dimension.score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${dimension.score}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{dimension.explanation}</p>
    </div>
  );
}

// ─── ScoreDashboard ──────────────────────────────────────────────────

function ScoreDashboard(): React.ReactElement | null {
  const result = useOptimizerStore((s) => s.result);
  if (!result) return null;

  const { evaluation } = result;
  const gradeColor = {
    A: "text-emerald-500",
    B: "text-lime-500",
    C: "text-amber-500",
    D: "text-orange-500",
    F: "text-red-500",
  }[evaluation.grade];

  const gradeBorder = {
    A: "border-emerald-200",
    B: "border-lime-200",
    C: "border-amber-200",
    D: "border-orange-200",
    F: "border-red-200",
  }[evaluation.grade];

  return (
    <div className="space-y-6">
      {/* Grade + score */}
      <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${gradeBorder} bg-white`}>
        <span className={`text-6xl font-black leading-none ${gradeColor}`}>
          {evaluation.grade}
        </span>
        <div>
          <div className="text-2xl font-bold text-slate-800">
            {evaluation.compositeScore}<span className="text-slate-400 text-base">/100</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{evaluation.summary}</p>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Dimensions (Anthropic-aligned)
        </h3>
        {evaluation.dimensions.map((dim) => (
          <DimensionBar key={dim.dimension} dimension={dim} />
        ))}
      </div>

      {/* Detected metadata */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
        <span className="text-[11px] text-slate-400">
          Type: <strong className="text-slate-600">{result.analysis.document.detectedProjectType}</strong>
        </span>
        <span className="text-[11px] text-slate-400">
          Lang: <strong className="text-slate-600">{result.analysis.document.language.toUpperCase()}</strong>
        </span>
        <span className="text-[11px] text-slate-400">
          {result.processingTimeMs}ms
        </span>
      </div>
    </div>
  );
}

// ─── SuggestionCard ──────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: Suggestion;
  onApply: (s: Suggestion) => void;
}): React.ReactElement {
  const expandedCardId = useOptimizerStore((s) => s.expandedCardId);
  const setExpandedCardId = useOptimizerStore((s) => s.setExpandedCardId);
  const language = useOptimizerStore((s) => s.language);
  const expanded = expandedCardId === suggestion.id;

  const borderColor = {
    critical: "border-l-red-400",
    warning: "border-l-amber-400",
    suggestion: "border-l-blue-400",
  }[suggestion.severity];

  return (
    <div className={`rounded-lg border border-slate-200 border-l-4 ${borderColor} bg-white overflow-hidden`}>
      <button
        className="w-full flex items-start gap-2 p-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpandedCardId(expanded ? null : suggestion.id)}
      >
        <SeverityBadge severity={suggestion.severity} />
        <span className="flex-1 text-xs font-medium text-slate-700 leading-relaxed">
          {suggestion.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-slate-400">+{suggestion.impact}</span>
          <span className="text-slate-300 text-sm">{expanded ? "▾" : "▸"}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">{suggestion.description}</p>

          {suggestion.currentText && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Current</p>
                <pre className="text-[11px] bg-red-50 text-red-800 rounded p-2 overflow-auto max-h-24 leading-relaxed">
                  {suggestion.currentText}
                </pre>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Suggested</p>
                <pre className="text-[11px] bg-emerald-50 text-emerald-800 rounded p-2 overflow-auto max-h-24 leading-relaxed">
                  {suggestion.suggestedText}
                </pre>
              </div>
            </div>
          )}

          {!suggestion.currentText && suggestion.suggestedText && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Add this</p>
              <pre className="text-[11px] bg-slate-50 text-slate-700 rounded p-2 overflow-auto max-h-32 leading-relaxed">
                {suggestion.suggestedText}
              </pre>
            </div>
          )}

          <p className="text-[11px] text-slate-400 italic leading-relaxed">{suggestion.reasoning}</p>

          <button
            onClick={() => onApply(suggestion)}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            {t(language, 'applyFix')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── RecommendationCard ──────────────────────────────────────────────

function RecommendationCard({
  recommendation,
  onApply,
}: {
  recommendation: SectionRecommendation;
  onApply: (r: SectionRecommendation) => void;
}): React.ReactElement {
  const expandedCardId = useOptimizerStore((s) => s.expandedCardId);
  const setExpandedCardId = useOptimizerStore((s) => s.setExpandedCardId);
  const language = useOptimizerStore((s) => s.language);
  const id = `rec-${recommendation.sectionType}`;
  const expanded = expandedCardId === id;

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpandedCardId(expanded ? null : id)}
      >
        <span className="flex-1 text-xs font-medium text-slate-700">
          {recommendation.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-slate-400">+{recommendation.impact}</span>
          <span className="text-slate-300 text-sm">{expanded ? "▾" : "▸"}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">{recommendation.description}</p>
          <pre className="text-[11px] bg-slate-50 text-slate-700 rounded p-2 overflow-auto max-h-40 leading-relaxed">
            {recommendation.template}
          </pre>
          <p className="text-[11px] text-slate-400 italic leading-relaxed">{recommendation.reasoning}</p>
          <button
            onClick={() => onApply(recommendation)}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            {t(language, 'addSection')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Issues List ──────────────────────────────────────────────────────

function IssuesList(): React.ReactElement | null {
  const result = useOptimizerStore((s) => s.result);
  if (!result) return null;

  const { issues } = result.analysis;
  const criticalCount = issues.filter((i) => i.severity === "critical").length;

  if (issues.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-8">
        No issues found — looks clean!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {criticalCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
          <span>⚠</span>
          {criticalCount} critical issue{criticalCount > 1 ? "s" : ""} found
        </div>
      )}
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="rounded-lg border border-slate-200 bg-white p-3 space-y-1"
        >
          <div className="flex items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            <span className="text-xs font-semibold text-slate-700">{issue.title}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{issue.description}</p>
          {issue.matchedText && (
            <code className="block text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded mt-1 break-all">
              {issue.matchedText}
            </code>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────

function TabBar(): React.ReactElement {
  const activeTab = useOptimizerStore((s) => s.activeTab);
  const setActiveTab = useOptimizerStore((s) => s.setActiveTab);
  const result = useOptimizerStore((s) => s.result);

  const issueCount = result?.analysis.issues.length ?? 0;
  const suggCount = result?.suggestions.length ?? 0;
  const recCount = result?.recommendations.length ?? 0;

  const tabs = [
    { id: "score" as const, label: "Score" },
    { id: "issues" as const, label: "Issues", count: issueCount },
    { id: "suggestions" as const, label: "Fixes", count: suggCount },
    { id: "recommendations" as const, label: "Add", count: recCount },
  ];

  return (
    <div className="flex border-b border-slate-200 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors relative ${
            activeTab === tab.id
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`ml-1 px-1 rounded-full text-[9px] font-bold ${
              activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
            }`}>
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────

export function OptimizerSidebar(): React.ReactElement {
  const result = useOptimizerStore((s) => s.result);
  const isAnalyzing = useOptimizerStore((s) => s.isAnalyzing);
  const isOptimizing = useOptimizerStore((s) => s.isOptimizing);
  const optimizeError = useOptimizerStore((s) => s.optimizeError);
  const optimizeWithLLM = useOptimizerStore((s) => s.optimizeWithLLM);
  const apiKey = useOptimizerStore((s) => s.apiKey);
  const content = useOptimizerStore((s) => s.content);
  const lineCount = content.split('\n').length;
  const activeTab = useOptimizerStore((s) => s.activeTab);
  const filterSeverity = useOptimizerStore((s) => s.filterSeverity);
  const setFilterSeverity = useOptimizerStore((s) => s.setFilterSeverity);
  const applySuggestion = useOptimizerStore((s) => s.applySuggestion);
  const applyRecommendation = useOptimizerStore((s) => s.applyRecommendation);
  const language = useOptimizerStore((s) => s.language);

  const filteredSuggestions = useMemo(() => {
    if (!result) return [];
    if (filterSeverity === "all") return result.suggestions;
    return result.suggestions.filter((s) => s.severity === filterSeverity);
  }, [result, filterSeverity]);

  return (
    <aside className="flex flex-col h-full bg-slate-50 border-l border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <h2 className="text-sm font-bold text-slate-800">Optimizer</h2>
        <span className="text-[10px] text-slate-400 font-medium">{t(language, 'bestPractices')}</span>
      </div>

      {/* Loading */}
      {isAnalyzing && (
        <div className="px-4 py-3 text-xs text-indigo-600 font-medium animate-pulse">
          {t(language, 'analyzing')}
        </div>
      )}

      {/* Empty state */}
      {!result && !isAnalyzing && (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-3xl mb-3">📋</div>
            <p className="text-sm text-slate-500">
              Click <strong>{t(language, 'analyzeButton')}</strong> to evaluate your CLAUDE.md
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Or enable {t(language, 'realtime').toLowerCase()} mode for live feedback
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <TabBar />

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === "score" && (
              <>
                <ScoreDashboard />
                {lineCount > 200 && (
                  <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                    ⚠️ {lineCount} lignes — l&apos;optimisation peut prendre jusqu&apos;à 60 secondes
                  </div>
                )}
                <button
                  onClick={() => void optimizeWithLLM()}
                  disabled={isOptimizing || !apiKey}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                    isOptimizing
                      ? 'bg-indigo-100 text-indigo-400 cursor-wait'
                      : apiKey
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
                  {isOptimizing
                    ? t(language, 'optimizing')
                    : t(language, 'optimizeButton')
                  }
                </button>
                {optimizeError && (
                  <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                    {optimizeError}
                  </div>
                )}
              </>
            )}

            {activeTab === "issues" && <IssuesList />}

            {activeTab === "suggestions" && (
              <div className="space-y-3">
                <div className="flex gap-1.5">
                  {(["all", "critical", "warning", "suggestion"] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setFilterSeverity(sev)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                        filterSeverity === sev
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </button>
                  ))}
                </div>

                {filteredSuggestions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No suggestions match this filter.
                  </p>
                ) : (
                  filteredSuggestions.map((s) => (
                    <SuggestionCard key={s.id} suggestion={s} onApply={applySuggestion} />
                  ))
                )}
              </div>
            )}

            {activeTab === "recommendations" && (
              <div className="space-y-3">
                {result.recommendations.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    All recommended sections are present.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-slate-500">
                      Sections to add for a{" "}
                      <strong className="text-slate-700">
                        {result.analysis.document.detectedProjectType}
                      </strong>{" "}
                      project:
                    </p>
                    {result.recommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.sectionType}
                        recommendation={rec}
                        onApply={applyRecommendation}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
