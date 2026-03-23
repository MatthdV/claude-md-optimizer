// ─── Re-exported from knowledge layer ────────────────────────────────
import type { ProjectType } from "../knowledge/section-templates";
export type { ProjectType };

// ─── Section Types (Anthropic taxonomy) ──────────────────────────────

export type SectionType =
  | "commands"       // bash commands: build, test, lint, dev
  | "code_style"     // rules that differ from defaults only
  | "workflow"       // how to work: typecheck, commit, test single files
  | "architecture"   // project-specific decisions not inferrable from code
  | "constraints"    // what NOT to do — explicit boundaries
  | "testing"        // runner, conventions, coverage expectations
  | "gotchas"        // non-obvious behaviors and common pitfalls
  | "env_setup"      // required env vars, setup steps
  | "verification";  // how Claude checks its own work

export type IssueSeverity = "critical" | "warning" | "suggestion";

export type SuggestionCategory = "gap" | "enhancement" | "addition";

// Anthropic-aligned 5-dimension scoring model
export type ScoreDimension =
  | "actionability"  // can Claude execute/verify? (30%)
  | "conciseness"    // under 200 lines, no bloat? (25%)
  | "specificity"    // no vague qualifiers? (20%)
  | "completeness"   // required sections present? (15%)
  | "consistency";   // no contradictions or duplicates? (10%)

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
  language: string;
  contentHash: string;
}

// ─── Analysis Engine Output ──────────────────────────────────────────

export interface AnalysisIssue {
  id: string;
  sectionId: string | null;
  severity: IssueSeverity;
  title: string;
  description: string;
  line?: number;
  matchedText?: string;
  ruleId: string;
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
  relatedIssueId?: string;
  sectionId: string | null;
  title: string;
  description: string;
  currentText?: string;
  suggestedText: string;
  impact: number;
  reasoning: string;
}

// ─── Evaluation Engine Output ────────────────────────────────────────

export interface DimensionScore {
  dimension: ScoreDimension;
  score: number;  // 0–100
  weight: number; // 0.0–1.0
  explanation: string;
  issues: string[];
}

export interface EvaluationResult {
  dimensions: DimensionScore[];
  compositeScore: number;
  grade: Grade;
  summary: string;
}

// ─── Recommendation Engine Output ────────────────────────────────────

export interface SectionRecommendation {
  sectionType: SectionType;
  title: string;
  description: string;
  impact: number;
  template: string;
  reasoning: string;
}

// ─── Generator Engine ─────────────────────────────────────────────────

export interface GeneratorInput {
  lazyPrompt: string;
}

export interface GeneratorOutput {
  content: string;
  detectedProjectType: ProjectType;
  detectedTechnologies: string[];
  placeholders: string[];
  lineCount: number;
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

// ─── LLM Flow ────────────────────────────────────────────────────────

export interface Question {
  id: string;
  question: string;
  type: 'choice' | 'text';
  options?: string[];
  placeholder?: string;
}

export interface Answer {
  questionId: string;
  answer: string;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  speed: string;
  quality: string;
}

// ─── UI State ────────────────────────────────────────────────────────

export type SidebarTab = "score" | "issues" | "suggestions" | "recommendations";

export interface SidebarState {
  isOpen: boolean;
  activeTab: SidebarTab;
  expandedSuggestionId: string | null;
  filterSeverity: IssueSeverity | "all";
}
