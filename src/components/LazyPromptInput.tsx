"use client";

import { useOptimizerStore } from "../store/optimizer-store";
import { LanguageSelector } from "./LanguageSelector";
import { SettingsPanel } from "./SettingsPanel";
import { t } from "../lib/i18n";
import { getProvider } from "../lib/providers";
import { Settings } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "React dashboard with Supabase and Tailwind",
  "Python FastAPI backend with PostgreSQL",
  "Full-stack Next.js app with Prisma and Auth.js",
  "Data pipeline with dbt and Snowflake",
  "Design system with Storybook and Figma tokens",
];

export function LazyPromptInput(): React.ReactElement {
  const lazyPrompt = useOptimizerStore((s) => s.lazyPrompt);
  const setLazyPrompt = useOptimizerStore((s) => s.setLazyPrompt);
  const fetchQuestions = useOptimizerStore((s) => s.fetchQuestions);
  const startOptimizeExisting = useOptimizerStore((s) => s.startOptimizeExisting);
  const inputMode = useOptimizerStore((s) => s.inputMode);
  const setInputMode = useOptimizerStore((s) => s.setInputMode);
  const isLoadingQuestions = useOptimizerStore((s) => s.isLoadingQuestions);
  const error = useOptimizerStore((s) => s.error);
  const llmError = useOptimizerStore((s) => s.llmError);
  const language = useOptimizerStore((s) => s.language);
  const providerId = useOptimizerStore((s) => s.providerId);
  const selectedModel = useOptimizerStore((s) => s.selectedModel);
  const customModelName = useOptimizerStore((s) => s.customModelName);
  const apiKey = useOptimizerStore((s) => s.apiKey);
  const setSettingsOpen = useOptimizerStore((s) => s.setSettingsOpen);

  const provider = getProvider(providerId);
  const modelDisplay = providerId === 'custom' ? customModelName : selectedModel;

  const isOptimizeMode = inputMode === 'optimize';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleNext = (): void => {
    if (isOptimizeMode) {
      startOptimizeExisting();
    } else {
      void fetchQuestions();
    }
  };

  const canGenerate = lazyPrompt.trim().length > 0 && !isLoadingQuestions;

  const placeholder = isOptimizeMode
    ? t(language, 'pasteHere')
    : t(language, 'inputPlaceholder');

  const subtitle = isOptimizeMode
    ? t(language, 'optimizeSubtitle')
    : t(language, 'heroSubtitle');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Settings modal */}
      <SettingsPanel />

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
          {t(language, 'heroTitle')}
        </h1>
        <p className="text-slate-500 text-lg max-w-lg">
          {subtitle}
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setInputMode('generate')}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                !isOptimizeMode
                  ? 'text-indigo-600 bg-white border-b-2 border-indigo-600'
                  : 'text-slate-500 bg-slate-50 hover:text-slate-700'
              }`}
            >
              {t(language, 'tabGenerate')}
            </button>
            <button
              onClick={() => setInputMode('optimize')}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                isOptimizeMode
                  ? 'text-indigo-600 bg-white border-b-2 border-indigo-600'
                  : 'text-slate-500 bg-slate-50 hover:text-slate-700'
              }`}
            >
              {t(language, 'tabOptimize')}
            </button>
          </div>

          <textarea
            className="w-full px-6 pt-5 pb-3 text-base text-slate-800 placeholder-slate-400 resize-none outline-none font-sans"
            placeholder={placeholder}
            rows={isOptimizeMode ? 8 : 3}
            value={lazyPrompt}
            onChange={(e) => setLazyPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />

          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {/* Settings button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  apiKey
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                {apiKey
                  ? `${modelDisplay} via ${provider.name}`
                  : t(language, 'configureLLM')}
              </button>

              {/* Language selector */}
              <LanguageSelector />
            </div>

            <button
              onClick={handleNext}
              disabled={!canGenerate}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {isLoadingQuestions ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {language === 'fr' ? 'Analyse…' : 'Analyzing…'}
                </>
              ) : (
                t(language, 'generateButton')
              )}
            </button>
          </div>
        </div>

        {/* Errors (generate mode only) */}
        {!isOptimizeMode && (error || llmError) && (
          <p className="mt-3 text-sm text-amber-600 px-1">{llmError ?? error}</p>
        )}

        {/* Example prompts (generate mode only) */}
        {!isOptimizeMode && (
          <div className="mt-6">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {t(language, 'examplesTitle')}
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setLazyPrompt(ex)}
                  className="px-3 py-1.5 rounded-full text-xs border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-12 text-xs text-slate-400 text-center">
        {t(language, 'apiKeyHint')}
      </p>
    </div>
  );
}
