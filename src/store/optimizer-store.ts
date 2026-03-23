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
import type { ProviderId } from "../lib/providers";
import { getProvider } from "../lib/providers";
import { generate as generatorRun } from "../engines/generator-engine";
import { run as orchestratorRun } from "../engines/orchestrator";

// ─── Store Interface ──────────────────────────────────────────────────

interface OptimizerStore {
  // Phase
  phase: "input" | "questions" | "editor";

  // Input mode (Phase 1 tab)
  inputMode: 'generate' | 'optimize';
  setInputMode: (mode: 'generate' | 'optimize') => void;

  // Generator
  lazyPrompt: string;
  setLazyPrompt: (p: string) => void;
  detectedTechnologies: string[];

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // LLM Settings
  providerId: ProviderId;
  apiKey: string;
  customBaseURL: string;
  selectedModel: string;
  customModelName: string;
  settingsOpen: boolean;
  setProviderId: (id: ProviderId) => void;
  setApiKey: (key: string) => void;
  setCustomBaseURL: (url: string) => void;
  setSelectedModel: (m: string) => void;
  setCustomModelName: (name: string) => void;
  setSettingsOpen: (open: boolean) => void;
  isConfigured: () => boolean;

  // LLM flow
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

  // LLM Optimize
  isOptimizing: boolean;
  optimizeWithLLM: () => Promise<void>;
  startOptimizeExisting: () => void;
}

// ─── Store Implementation ─────────────────────────────────────────────

export const useOptimizerStore = create<OptimizerStore>((set, get) => ({
  // ── Phase ──
  phase: "input",

  // ── Input mode ──
  inputMode: 'generate',
  setInputMode: (mode) => set({ inputMode: mode }),

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

  // ── LLM Settings ──
  providerId: 'openai',
  apiKey: '',
  customBaseURL: '',
  selectedModel: 'gpt-4o',
  customModelName: '',
  settingsOpen: false,

  setProviderId: (id) => {
    const provider = getProvider(id);
    set({
      providerId: id,
      selectedModel: provider.defaultModel,
      customModelName: '',
    });
    if (typeof window !== 'undefined') localStorage.setItem('llm-provider', id);
  },

  setApiKey: (key) => {
    set({ apiKey: key });
    if (typeof window !== 'undefined') localStorage.setItem('llm-api-key', key);
  },

  setCustomBaseURL: (url) => {
    set({ customBaseURL: url });
    if (typeof window !== 'undefined') localStorage.setItem('llm-custom-url', url);
  },

  setSelectedModel: (m) => {
    set({ selectedModel: m });
    if (typeof window !== 'undefined') localStorage.setItem('llm-model', m);
  },

  setCustomModelName: (name) => {
    set({ customModelName: name });
    if (typeof window !== 'undefined') localStorage.setItem('llm-custom-model', name);
  },

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  isConfigured: () => {
    const state = get();
    return state.apiKey.length > 0;
  },

  // ── LLM flow ──
  questions: [],
  isLoadingQuestions: false,
  isGeneratingLLM: false,
  llmError: null,

  fetchQuestions: async () => {
    const state = get();
    const { lazyPrompt, generateWithTemplates } = state;
    if (!lazyPrompt.trim()) return;

    // No API key → open settings
    if (!state.apiKey) {
      set({ settingsOpen: true });
      return;
    }

    const provider = getProvider(state.providerId);
    const baseURL = state.providerId === 'custom' ? state.customBaseURL : provider.baseURL;
    const model = state.providerId === 'custom' ? state.customModelName : state.selectedModel;

    set({ isLoadingQuestions: true, llmError: null });

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lazyPrompt,
          model,
          language: state.language,
          apiKey: state.apiKey,
          baseURL,
        }),
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
      set({ isLoadingQuestions: false, llmError: 'LLM unavailable — using template mode' });
      generateWithTemplates();
    }
  },

  generateWithLLM: async (answers) => {
    const state = get();
    const { generateWithTemplates } = state;

    const provider = getProvider(state.providerId);
    const baseURL = state.providerId === 'custom' ? state.customBaseURL : provider.baseURL;
    const model = state.providerId === 'custom' ? state.customModelName : state.selectedModel;

    set({ isGeneratingLLM: true, llmError: null });

    try {
      const res = await fetch('/api/generate-claude-md', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lazyPrompt: state.lazyPrompt,
          answers,
          model,
          language: state.language,
          apiKey: state.apiKey,
          baseURL,
        }),
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
      inputMode: 'generate',
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
      isOptimizing: false,
      // language and LLM settings preserved — user preferences survive reset
    }),

  // ── LLM Optimize ──
  isOptimizing: false,

  startOptimizeExisting: () => {
    const { lazyPrompt } = get();
    if (!lazyPrompt.trim()) return;

    set({
      content: lazyPrompt,
      phase: 'editor',
      result: null,
      error: null,
      sidebarOpen: false,
    });

    get().analyze();
  },

  optimizeWithLLM: async () => {
    const state = get();

    if (!state.apiKey) {
      set({ settingsOpen: true });
      return;
    }

    set({ isOptimizing: true });

    try {
      const provider = getProvider(state.providerId);
      const baseURL = state.providerId === 'custom' ? state.customBaseURL : provider.baseURL;
      const model = state.providerId === 'custom' ? state.customModelName : state.selectedModel;

      const issues = state.result?.analysis.issues.map((i) => i.description) ?? [];
      const recs = state.result?.recommendations.map((r) => r.description) ?? [];
      const recommendations = [...issues, ...recs];

      const res = await fetch('/api/optimize-claude-md', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: state.content,
          recommendations,
          language: state.language,
          apiKey: state.apiKey,
          baseURL,
          model,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json() as { content?: string; error?: string };

      if (data.content) {
        set({ content: data.content, isOptimizing: false });
        get().analyze();
      } else {
        set({ isOptimizing: false });
      }
    } catch {
      set({ isOptimizing: false });
    }
  },
}));
