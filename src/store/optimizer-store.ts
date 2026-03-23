/**
 * Zustand store — single source of truth for the optimizer app.
 * Manages phase transitions, generator state, editor content, and sidebar state.
 */

import { create } from "zustand";
import type {
  OptimizerResult,
  OptimizerMode,
  SidebarTab,
  IssueSeverity,
  Suggestion,
  SectionRecommendation,
  Question,
  Answer,
} from "../types";
import type { Language } from "../lib/i18n";
import { generate as generatorRun } from "../engines/generator-engine";
import { run as orchestratorRun } from "../engines/orchestrator";

// ─── Store Interface ──────────────────────────────────────────────────

interface OptimizerStore {
  // Phase
  phase: "input" | "questions" | "editor";

  // Generator
  lazyPrompt: string;
  setLazyPrompt: (p: string) => void;
  detectedTechnologies: string[];

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // LLM
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  questions: Question[];
  isLoadingQuestions: boolean;
  isGeneratingLLM: boolean;
  llmError: string | null;

  // Actions
  fetchQuestions: () => Promise<void>;
  generateWithLLM: (answers: Answer[]) => Promise<void>;
  generateWithTemplates: () => void;

  // Editor
  content: string;
  setContent: (c: string) => void;

  // Optimizer
  mode: OptimizerMode;
  setMode: (m: OptimizerMode) => void;
  isAnalyzing: boolean;
  result: OptimizerResult | null;
  error: string | null;
  analyze: () => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: SidebarTab;
  setActiveTab: (t: SidebarTab) => void;
  filterSeverity: IssueSeverity | "all";
  setFilterSeverity: (s: IssueSeverity | "all") => void;
  expandedCardId: string | null;
  setExpandedCardId: (id: string | null) => void;

  applySuggestion: (s: Suggestion) => void;
  applyRecommendation: (r: SectionRecommendation) => void;
  reset: () => void;
}

// ─── Store Implementation ─────────────────────────────────────────────

export const useOptimizerStore = create<OptimizerStore>((set, get) => ({
  // ── Phase ──
  phase: "input",

  // ── Generator ──
  lazyPrompt: "",
  setLazyPrompt: (p) => set({ lazyPrompt: p }),
  detectedTechnologies: [],

  // ── Language ──
  language: 'en',
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('claude-md-lang', lang);
    }
    set({ language: lang });
  },

  // ── LLM ──
  selectedModel: "claude-sonnet-4-20250514",
  setSelectedModel: (model) => set({ selectedModel: model }),
  questions: [],
  isLoadingQuestions: false,
  isGeneratingLLM: false,
  llmError: null,

  fetchQuestions: async () => {
    const { lazyPrompt, selectedModel, generateWithTemplates } = get();
    if (!lazyPrompt.trim()) return;

    set({ isLoadingQuestions: true, llmError: null });

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lazyPrompt, model: selectedModel, language: get().language }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { questions?: Question[]; error?: string };

      if (!data.questions) throw new Error(data.error ?? 'No questions returned');

      set({
        questions: data.questions,
        isLoadingQuestions: false,
        phase: "questions",
      });
    } catch {
      // Fallback gracieux : passer directement aux templates
      set({ isLoadingQuestions: false, llmError: 'LLM unavailable — using template mode' });
      generateWithTemplates();
    }
  },

  generateWithLLM: async (answers) => {
    const { lazyPrompt, selectedModel, generateWithTemplates } = get();

    set({ isGeneratingLLM: true, llmError: null });

    try {
      const res = await fetch('/api/generate-claude-md', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lazyPrompt, answers, model: selectedModel, language: get().language }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { content?: string; error?: string };

      if (!data.content) throw new Error(data.error ?? 'No content returned');

      set({
        content: data.content,
        phase: "editor",
        result: null,
        error: null,
        sidebarOpen: false,
        isGeneratingLLM: false,
      });
    } catch {
      // Fallback gracieux sur templates
      set({ isGeneratingLLM: false, llmError: 'LLM generation failed — using template mode' });
      generateWithTemplates();
    }
  },

  generateWithTemplates: () => {
    const { lazyPrompt } = get();
    if (!lazyPrompt.trim()) return;

    try {
      const output = generatorRun({ lazyPrompt });
      set({
        content: output.content,
        phase: "editor",
        result: null,
        error: null,
        detectedTechnologies: output.detectedTechnologies,
        sidebarOpen: false,
        isLoadingQuestions: false,
        isGeneratingLLM: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Generation failed" });
    }
  },

  // ── Editor ──
  content: "",
  setContent: (c) => set({ content: c }),

  // ── Optimizer ──
  mode: "on-demand",
  setMode: (m) => set({ mode: m }),
  isAnalyzing: false,
  result: null,
  error: null,

  analyze: () => {
    const { content } = get();
    if (!content.trim()) return;

    set({ isAnalyzing: true, error: null });

    try {
      const result = orchestratorRun(content);
      set({ result, isAnalyzing: false, sidebarOpen: true });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Analysis failed",
        isAnalyzing: false,
      });
    }
  },

  // ── Sidebar ──
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeTab: "score",
  setActiveTab: (t) => set({ activeTab: t }),
  filterSeverity: "all",
  setFilterSeverity: (s) => set({ filterSeverity: s }),
  expandedCardId: null,
  setExpandedCardId: (id) => set({ expandedCardId: id }),

  // ── Actions ──
  applySuggestion: (suggestion) => {
    const { content } = get();
    let newContent: string;

    if (suggestion.currentText && content.includes(suggestion.currentText)) {
      newContent = content.replace(suggestion.currentText, suggestion.suggestedText);
    } else {
      newContent = content.trimEnd() + "\n\n" + suggestion.suggestedText;
    }

    set({ content: newContent });
    get().analyze();
  },

  applyRecommendation: (rec) => {
    const { content } = get();
    set({ content: content.trimEnd() + "\n\n" + rec.template });
    get().analyze();
  },

  reset: () =>
    set({
      phase: "input",
      lazyPrompt: "",
      content: "",
      result: null,
      error: null,
      sidebarOpen: false,
      activeTab: "score",
      filterSeverity: "all",
      expandedCardId: null,
      detectedTechnologies: [],
      questions: [],
      isLoadingQuestions: false,
      isGeneratingLLM: false,
      llmError: null,
      // language preserved intentionally — user preference survives reset
    }),
}));
