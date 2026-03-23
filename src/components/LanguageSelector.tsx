"use client";

import { useOptimizerStore } from "../store/optimizer-store";

export function LanguageSelector(): React.ReactElement {
  const language = useOptimizerStore((s) => s.language);
  const setLanguage = useOptimizerStore((s) => s.setLanguage);

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          language === 'en'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('fr')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          language === 'fr'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        FR
      </button>
    </div>
  );
}
