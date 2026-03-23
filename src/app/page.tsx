"use client";

import { useEffect } from "react";
import { useOptimizerStore } from "../store/optimizer-store";
import { LazyPromptInput } from "../components/LazyPromptInput";
import { QuestionsPanel } from "../components/QuestionsPanel";
import { Editor } from "../components/Editor";
import { OptimizerSidebar } from "../components/OptimizerSidebar";
import type { Language } from "../lib/i18n";

export default function Home(): React.ReactElement {
  const phase = useOptimizerStore((s) => s.phase);
  const sidebarOpen = useOptimizerStore((s) => s.sidebarOpen);
  const setLanguage = useOptimizerStore((s) => s.setLanguage);

  const lazyPrompt = useOptimizerStore((s) => s.lazyPrompt);
  const questions = useOptimizerStore((s) => s.questions);
  const selectedModel = useOptimizerStore((s) => s.selectedModel);
  const generateWithLLM = useOptimizerStore((s) => s.generateWithLLM);
  const generateWithTemplates = useOptimizerStore((s) => s.generateWithTemplates);
  const isGeneratingLLM = useOptimizerStore((s) => s.isGeneratingLLM);

  // Hydrate language preference from localStorage (SSR-safe)
  useEffect(() => {
    const saved = localStorage.getItem('claude-md-lang') as Language | null;
    if (saved === 'en' || saved === 'fr') {
      setLanguage(saved);
    }
  }, [setLanguage]);

  if (phase === "input") {
    return <LazyPromptInput />;
  }

  if (phase === "questions") {
    return (
      <QuestionsPanel
        lazyPrompt={lazyPrompt}
        questions={questions}
        selectedModel={selectedModel}
        onGenerate={(answers) => void generateWithLLM(answers)}
        onSkip={generateWithTemplates}
        isGenerating={isGeneratingLLM}
      />
    );
  }

  // Phase: editor (+ optional sidebar)
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div
        className={`flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? "flex-1" : "w-full"
        }`}
      >
        <Editor />
      </div>

      {sidebarOpen && (
        <div className="w-80 xl:w-96 shrink-0 flex flex-col">
          <OptimizerSidebar />
        </div>
      )}
    </div>
  );
}
