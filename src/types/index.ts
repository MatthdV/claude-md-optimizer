// ─── Core Domain Types ───────────────────────────────────────────────

export type ProjectType =
  | "code-focused"
  | "content-creation"
  | "data-analysis"
  | "design"
  | "operations"
  | "mixed";

export type SectionType =
  | "role"
  | "behavior"
  | "constraints"
  | "context"
  | "output_format"
  | "code_conventions"
  | "security"
  | "testing"
  | "accessibility"
  | "brand_voice"
  | "error_handling"
  | "examples"
  | "dependencies"
  | "workflow";

export type IssueSeverity = "critical" | "warning" | "suggestion";

export type SuggestionCategory = "gap" | "enhancement" | "addition";

export type ScoreDimension =
  | "completeness"
  | "clarity"
  | "technical_accuracy"
  | "scope_alignment"
  | "structure"
  | "constraint_quality";

export type Grade = "A" | "B" | "C" | "D" | "F";

// ─── Parsed Document ─────────────────────────────────────────────────

export interface ParsedSection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  headingLevel: number;
}

export interface ClaudeMdDocument {
  raw: string;
  sections: ParsedSection[];
  detectedProjectType: ProjectType;
  secondaryProjectType?: ProjectType;
  language: string; // ISO 639-1 code detected from content
  contentHash: string;
}

// ─── Analysis Engine Output ──────────────────────────────────────────

export interface AnalysisIssue {
  id: string;
  sectionId: string | null; // null = document-level issue
  severity: IssueSeverity;
  title: string;
  description: string;
  line?: number;
  matchedText?: string; // the problematic fragment
  ruleId: string; // e.g., "vague-qualifier", "missing-section", "contradiction"
}

export interface AnalysisResult {
  document: ClaudeMdDocument;
  issues: AnalysisIssue[];
  missingSections: SectionType[];
  timestamp: number;
}

// ─── Enhancement Engine Output ───────────────────────────────────────

export interface Suggestion {
  id: string;
  category: SuggestionCategory;
  severity: IssueSeverity;
  relatedIssueId?: string; // links back to AnalysisIssue
  sectionId: string | null;
  title: string;
  description: string;
  currentText?: string; // what's there now (for diff view)
  suggestedText: string; // what we propose
  impact: number; // 1–10, used for priority sorting
  reasoning: string; // why this change matters
}

// ─── Evaluation Engine Output ────────────────────────────────────────

export interface DimensionScore {
  dimension: ScoreDimension;
  score: number; // 0–100
  weight: number; // 0.0–1.0
  explanation: string;
  issues: string[]; // specific problems that lowered the score
}

export interface EvaluationResult {
  dimensions: DimensionScore[];
  compositeScore: number;
  grade: Grade;
  summary: string; // 1–2 sentence overall assessment
}

// ─── Recommendation Engine Output ────────────────────────────────────

export interface SectionRecommendation {
  sectionType: SectionType;
  title: string;
  description: string;
  impact: number; // 1–10
  template: string; // starter content the user can customize
  reasoning: string;
}

// ─── Orchestrator ────────────────────────────────────────────────────

export interface OptimizerResult {
  analysis: AnalysisResult;
  evaluation: EvaluationResult;
  suggestions: Suggestion[];
  recommendations: SectionRecommendation[];
  processingTimeMs: number;
}

export type OptimizerMode = "realtime" | "on-demand";

export interface OptimizerState {
  mode: OptimizerMode;
  isAnalyzing: boolean;
  result: OptimizerResult | null;
  error: string | null;
  lastAnalyzedHash: string | null;
}

// ─── UI State ────────────────────────────────────────────────────────

export type SidebarTab = "score" | "issues" | "suggestions" | "recommendations";

export interface SidebarState {
  isOpen: boolean;
  activeTab: SidebarTab;
  expandedSuggestionId: string | null;
  filterSeverity: IssueSeverity | "all";
}
