"use client";

import { useState } from "react";
import { useOptimizerStore } from "../store/optimizer-store";
import { t } from "../lib/i18n";
import type { Question, Answer } from "../types";

interface QuestionsPanelProps {
  lazyPrompt: string;
  questions: Question[];
  selectedModel: string;
  onGenerate: (answers: Answer[]) => void;
  onSkip: () => void;
  isGenerating: boolean;
}

export function QuestionsPanel({
  lazyPrompt,
  questions,
  selectedModel,
  onGenerate,
  onSkip,
  isGenerating,
}: QuestionsPanelProps): React.ReactElement {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const language = useOptimizerStore((s) => s.language);

  const setAnswer = (questionId: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleGenerate = (): void => {
    const answerList: Answer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? '',
    }));
    onGenerate(answerList);
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 text-slate-600">
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-base font-medium">{t(language, 'generating')} {selectedModel}…</span>
          </div>
          <div className="space-y-2 w-80 mx-auto">
            {[80, 60, 70].map((w, i) => (
              <div key={i} className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            {t(language, 'questionsTitle')}
          </p>
          <p className="text-slate-700 text-sm font-medium truncate">{lazyPrompt}</p>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {t(language, 'questionsSubtitle')}
          </h2>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                {idx + 1}. {q.question}
              </label>

              {q.type === 'choice' && q.options ? (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(q.id, opt)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        answers[q.id] === opt
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  {answers[q.id] && !q.options.includes(answers[q.id]) ? (
                    <input
                      type="text"
                      value={answers[q.id]}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className="px-3 py-1.5 rounded-full text-sm border border-indigo-400 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder={language === 'fr' ? 'Autre…' : 'Other…'}
                    />
                  ) : (
                    <button
                      onClick={() => setAnswer(q.id, ' ')}
                      className="px-3 py-1.5 rounded-full text-sm border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {language === 'fr' ? 'Autre…' : 'Other…'}
                    </button>
                  )}
                </div>
              ) : (
                <textarea
                  rows={2}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder ?? ''}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 resize-none outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            {t(language, 'skipButton')}
          </button>
          <button
            onClick={handleGenerate}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            {t(language, 'generateClaude')}
          </button>
        </div>
      </div>
    </div>
  );
}
