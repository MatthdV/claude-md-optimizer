'use client';

import { useState } from 'react';
import { Settings, Eye, EyeOff, X } from 'lucide-react';
import { useOptimizerStore } from '@/store/optimizer-store';
import { providers, getProvider } from '@/lib/providers';
import { t } from '@/lib/i18n';

export function SettingsPanel(): React.ReactElement | null {
  const providerId = useOptimizerStore((s) => s.providerId);
  const apiKey = useOptimizerStore((s) => s.apiKey);
  const customBaseURL = useOptimizerStore((s) => s.customBaseURL);
  const selectedModel = useOptimizerStore((s) => s.selectedModel);
  const customModelName = useOptimizerStore((s) => s.customModelName);
  const settingsOpen = useOptimizerStore((s) => s.settingsOpen);
  const language = useOptimizerStore((s) => s.language);
  const setProviderId = useOptimizerStore((s) => s.setProviderId);
  const setApiKey = useOptimizerStore((s) => s.setApiKey);
  const setCustomBaseURL = useOptimizerStore((s) => s.setCustomBaseURL);
  const setSelectedModel = useOptimizerStore((s) => s.setSelectedModel);
  const setCustomModelName = useOptimizerStore((s) => s.setCustomModelName);
  const setSettingsOpen = useOptimizerStore((s) => s.setSettingsOpen);

  const [showKey, setShowKey] = useState(false);
  const provider = getProvider(providerId);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t(language, 'settingsTitle')}
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider selection */}
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t(language, 'providerLabel')}
        </label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setProviderId(p.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                providerId === p.id
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* API Key */}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t(language, 'apiKeyLabel')}
        </label>
        <div className="relative mb-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider.placeholder}
            className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          {t(language, 'apiKeyHint')}
        </p>

        {/* Model selection — predefined providers */}
        {providerId !== 'custom' && provider.models.length > 0 && (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t(language, 'modelLabel')}
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-indigo-300 outline-none"
            >
              {provider.models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </>
        )}

        {/* Custom provider fields */}
        {providerId === 'custom' && (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Base URL
            </label>
            <input
              type="text"
              value={customBaseURL}
              onChange={(e) => setCustomBaseURL(e.target.value)}
              placeholder="https://litellm.example.com/v1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-indigo-300 outline-none"
            />

            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t(language, 'modelLabel')}
            </label>
            <input
              type="text"
              value={customModelName}
              onChange={(e) => setCustomModelName(e.target.value)}
              placeholder="gpt-4o, claude-sonnet-4, llama-3..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          </>
        )}

        {/* Save button */}
        <button
          onClick={() => setSettingsOpen(false)}
          disabled={!apiKey}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            apiKey
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {t(language, 'saveSettings')}
        </button>
      </div>
    </div>
  );
}
