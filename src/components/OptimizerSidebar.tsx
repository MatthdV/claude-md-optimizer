/**
 * OptimizerSidebar
 *
 * Main UI component — a collapsible sidebar that shows scores,
 * issues, suggestions, and recommendations. Integrates with the
 * editor via callbacks.
 */

import React, { useState, useMemo } from "react";
import type {
  OptimizerResult,
  OptimizerMode,
  SidebarTab,
  IssueSeverity,
  Suggestion,
  SectionRecommendation,
  DimensionScore,
} from "../types";

// ─── Props ───────────────────────────────────────────────────────────

interface OptimizerSidebarProps {
  result: OptimizerResult | null;
  isAnalyzing: boolean;
  mode: OptimizerMode;
  onModeChange: (mode: OptimizerMode) => void;
  onAnalyzeClick: () => void;
  onApplySuggestion: (suggestion: Suggestion) => void;
  onApplyRecommendation: (recommendation: SectionRecommendation) => void;
  onScrollToSection: (sectionId: string) => void;
}

// ─── Subcomponents ───────────────────────────────────────────────────

function ScoreDashboard({ result }: { result: OptimizerResult }) {
  const { evaluation } = result;
  const gradeColor = {
    A: "#22c55e",
    B: "#84cc16",
    C: "#eab308",
    D: "#f97316",
    F: "#ef4444",
  }[evaluation.grade];

  return (
    <div className="score-dashboard">
      <div className="composite-score" style={{ borderColor: gradeColor }}>
        <span className="grade" style={{ color: gradeColor }}>
          {evaluation.grade}
        </span>
        <span className="score-number">{evaluation.compositeScore}/100</span>
      </div>
      <p className="summary">{evaluation.summary}</p>
      <div className="dimension-bars">
        {evaluation.dimensions.map((dim) => (
          <DimensionBar key={dim.dimension} dimension={dim} />
        ))}
      </div>
    </div>
  );
}

function DimensionBar({ dimension }: { dimension: DimensionScore }) {
  const barColor =
    dimension.score >= 80
      ? "#22c55e"
      : dimension.score >= 60
      ? "#eab308"
      : "#ef4444";

  const label = dimension.dimension
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="dimension-bar">
      <div className="dimension-header">
        <span className="dimension-label">{label}</span>
        <span className="dimension-score">{dimension.score}</span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${dimension.score}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="dimension-explanation">{dimension.explanation}</p>
      {dimension.issues.length > 0 && (
        <ul className="dimension-issues">
          {dimension.issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const config = {
    critical: { label: "Critical", color: "#ef4444", bg: "#fef2f2" },
    warning: { label: "Warning", color: "#f59e0b", bg: "#fffbeb" },
    suggestion: { label: "Tip", color: "#3b82f6", bg: "#eff6ff" },
  }[severity];

  return (
    <span
      className="severity-badge"
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  );
}

function SuggestionCard({
  suggestion,
  onApply,
  onNavigate,
}: {
  suggestion: Suggestion;
  onApply: (s: Suggestion) => void;
  onNavigate: (sectionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`suggestion-card severity-${suggestion.severity}`}>
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <SeverityBadge severity={suggestion.severity} />
        <span className="card-title">{suggestion.title}</span>
        <span className="impact-badge">Impact: {suggestion.impact}/10</span>
        <span className="expand-icon">{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <div className="card-body">
          <p className="card-description">{suggestion.description}</p>

          {suggestion.currentText && (
            <div className="diff-view">
              <div className="diff-before">
                <span className="diff-label">Current</span>
                <code>{suggestion.currentText}</code>
              </div>
              <div className="diff-after">
                <span className="diff-label">Suggested</span>
                <code>{suggestion.suggestedText}</code>
              </div>
            </div>
          )}

          {!suggestion.currentText && suggestion.suggestedText && (
            <div className="template-preview">
              <span className="diff-label">Add this</span>
              <pre>{suggestion.suggestedText}</pre>
            </div>
          )}

          <p className="reasoning">{suggestion.reasoning}</p>

          <div className="card-actions">
            <button
              className="btn-apply"
              onClick={() => onApply(suggestion)}
            >
              Apply
            </button>
            {suggestion.sectionId && (
              <button
                className="btn-navigate"
                onClick={() => onNavigate(suggestion.sectionId!)}
              >
                Go to section
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  onApply,
}: {
  recommendation: SectionRecommendation;
  onApply: (r: SectionRecommendation) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="recommendation-card">
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <span className="card-title">{recommendation.title}</span>
        <span className="impact-badge">Impact: {recommendation.impact}/10</span>
        <span className="expand-icon">{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <div className="card-body">
          <p className="card-description">{recommendation.description}</p>
          <pre className="template-preview">{recommendation.template}</pre>
          <p className="reasoning">{recommendation.reasoning}</p>
          <button className="btn-apply" onClick={() => onApply(recommendation)}>
            Add section
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ────────────────────────────────────────────────────

export function OptimizerSidebar({
  result,
  isAnalyzing,
  mode,
  onModeChange,
  onAnalyzeClick,
  onApplySuggestion,
  onApplyRecommendation,
  onScrollToSection,
}: OptimizerSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("score");
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | "all">("all");

  const filteredSuggestions = useMemo(() => {
    if (!result) return [];
    if (filterSeverity === "all") return result.suggestions;
    return result.suggestions.filter((s) => s.severity === filterSeverity);
  }, [result, filterSeverity]);

  const issueCount = result?.analysis.issues.length ?? 0;
  const criticalCount =
    result?.analysis.issues.filter((i) => i.severity === "critical").length ?? 0;

  return (
    <aside className="optimizer-sidebar">
      {/* ── Header ── */}
      <div className="sidebar-header">
        <h2>Prompt Optimizer</h2>
        <div className="mode-toggle">
          <label>
            <input
              type="checkbox"
              checked={mode === "realtime"}
              onChange={(e) =>
                onModeChange(e.target.checked ? "realtime" : "on-demand")
              }
            />
            Real-time
          </label>
          {mode === "on-demand" && (
            <button
              className="btn-analyze"
              onClick={onAnalyzeClick}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          )}
        </div>
      </div>

      {/* ── Loading state ── */}
      {isAnalyzing && (
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      )}

      {/* ── No results yet ── */}
      {!result && !isAnalyzing && (
        <div className="empty-state">
          <p>
            {mode === "on-demand"
              ? "Click 'Analyze' to evaluate your claude.md"
              : "Start typing to see real-time suggestions"}
          </p>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <>
          {/* Tab bar */}
          <nav className="tab-bar">
            <button
              className={activeTab === "score" ? "active" : ""}
              onClick={() => setActiveTab("score")}
            >
              Score
            </button>
            <button
              className={activeTab === "issues" ? "active" : ""}
              onClick={() => setActiveTab("issues")}
            >
              Issues {issueCount > 0 && <span className="badge">{issueCount}</span>}
            </button>
            <button
              className={activeTab === "suggestions" ? "active" : ""}
              onClick={() => setActiveTab("suggestions")}
            >
              Suggestions
            </button>
            <button
              className={activeTab === "recommendations" ? "active" : ""}
              onClick={() => setActiveTab("recommendations")}
            >
              Add Sections
            </button>
          </nav>

          {/* Tab content */}
          <div className="tab-content">
            {activeTab === "score" && <ScoreDashboard result={result} />}

            {activeTab === "issues" && (
              <div className="issues-list">
                {criticalCount > 0 && (
                  <div className="critical-banner">
                    {criticalCount} critical issue{criticalCount > 1 ? "s" : ""} found
                  </div>
                )}
                {result.analysis.issues.map((issue) => (
                  <div key={issue.id} className={`issue-item severity-${issue.severity}`}>
                    <SeverityBadge severity={issue.severity} />
                    <div>
                      <strong>{issue.title}</strong>
                      <p>{issue.description}</p>
                    </div>
                    {issue.sectionId && (
                      <button
                        className="btn-navigate"
                        onClick={() => onScrollToSection(issue.sectionId!)}
                      >
                        →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "suggestions" && (
              <div className="suggestions-list">
                <div className="filter-bar">
                  {(["all", "critical", "warning", "suggestion"] as const).map(
                    (sev) => (
                      <button
                        key={sev}
                        className={filterSeverity === sev ? "active" : ""}
                        onClick={() => setFilterSeverity(sev)}
                      >
                        {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </button>
                    )
                  )}
                </div>
                {filteredSuggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApply={onApplySuggestion}
                    onNavigate={onScrollToSection}
                  />
                ))}
                {filteredSuggestions.length === 0 && (
                  <p className="empty-filter">No suggestions match this filter.</p>
                )}
              </div>
            )}

            {activeTab === "recommendations" && (
              <div className="recommendations-list">
                <p className="section-intro">
                  Sections you might want to add for a{" "}
                  <strong>{result.analysis.document.detectedProjectType}</strong>{" "}
                  project:
                </p>
                {result.recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.sectionType}
                    recommendation={rec}
                    onApply={onApplyRecommendation}
                  />
                ))}
                {result.recommendations.length === 0 && (
                  <p className="empty-filter">
                    All recommended sections are already present.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer with metadata */}
          <div className="sidebar-footer">
            <span>
              Detected: <strong>{result.analysis.document.detectedProjectType}</strong>
            </span>
            <span>
              Language: <strong>{result.analysis.document.language.toUpperCase()}</strong>
            </span>
            <span>Analyzed in {result.processingTimeMs}ms</span>
          </div>
        </>
      )}
    </aside>
  );
}
