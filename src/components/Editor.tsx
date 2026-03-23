"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { useOptimizerStore } from "../store/optimizer-store";
import { t } from "../lib/i18n";

// ─── Placeholder highlighting ─────────────────────────────────────────

const SHARED_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  margin: 0,
  padding: "1rem 1.25rem",
  fontFamily: "'Geist Mono', 'Fira Mono', 'Menlo', monospace",
  fontSize: "13px",
  lineHeight: "1.65",
  letterSpacing: "0",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  tabSize: 2,
};

function renderHighlighted(text: string): React.ReactNode[] {
  const parts = text.split(/(\[[A-Z][A-Z0-9_]*\])/g);
  return parts.map((part, i) => {
    if (/^\[[A-Z][A-Z0-9_]*\]$/.test(part)) {
      return (
        <mark
          key={i}
          style={{
            backgroundColor: "#fde68a",
            color: "rgb(120, 53, 15)",
            borderRadius: "3px",
            padding: "0 2px",
          }}
        >
          {part}
        </mark>
      );
    }
    return <span key={i} style={{ color: "transparent" }}>{part}</span>;
  });
}

// ─── Toolbar ──────────────────────────────────────────────────────────

function EditorToolbar(): React.ReactElement {
  const mode = useOptimizerStore((s) => s.mode);
  const setMode = useOptimizerStore((s) => s.setMode);
  const analyze = useOptimizerStore((s) => s.analyze);
  const isAnalyzing = useOptimizerStore((s) => s.isAnalyzing);
  const content = useOptimizerStore((s) => s.content);
  const reset = useOptimizerStore((s) => s.reset);
  const result = useOptimizerStore((s) => s.result);
  const language = useOptimizerStore((s) => s.language);

  const [copied, setCopied] = useState(false);

  const lineCount = content.split("\n").length;
  const placeholderCount = (content.match(/\[[A-Z][A-Z0-9_]*\]/g) ?? []).length;

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (): void => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CLAUDE.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
      {/* Left: metadata */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{lineCount} {t(language, 'lines')}</span>
        {lineCount > 200 && (
          <span className="text-amber-600 font-medium">⚠ Over 200 lines</span>
        )}
        {placeholderCount > 0 && (
          <span className="text-amber-700 font-medium">
            {placeholderCount} {t(language, 'placeholdersToFill')}
          </span>
        )}
        {result && (
          <span className="text-slate-400">
            Score: <strong className="text-slate-700">{result.evaluation.grade} ({result.evaluation.compositeScore}/100)</strong>
          </span>
        )}
      </div>

      {/* Right: actions + mode */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          {copied ? t(language, 'copied') : t(language, 'copy')}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title="Download CLAUDE.md"
        >
          <Download size={13} />
          {t(language, 'download')}
        </button>

        <div className="h-4 w-px bg-slate-200" />

        <button
          onClick={reset}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {t(language, 'newProject')}
        </button>

        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
          {t(language, 'realtime')}
          <button
            role="switch"
            aria-checked={mode === "realtime"}
            onClick={() => setMode(mode === "realtime" ? "on-demand" : "realtime")}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
              mode === "realtime" ? "bg-indigo-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                mode === "realtime" ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>

        {mode === "on-demand" && (
          <button
            onClick={analyze}
            disabled={isAnalyzing || !content.trim()}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? t(language, 'analyzing') : t(language, 'analyzeButton')}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────

export function Editor(): React.ReactElement {
  const content = useOptimizerStore((s) => s.content);
  const setContent = useOptimizerStore((s) => s.setContent);
  const mode = useOptimizerStore((s) => s.mode);
  const analyze = useOptimizerStore((s) => s.analyze);
  const isAnalyzing = useOptimizerStore((s) => s.isAnalyzing);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLPreElement>(null);

  const handleScroll = (): void => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (mode !== "realtime" || !content.trim()) return;
    const timer = setTimeout(() => analyze(), 800);
    return () => clearTimeout(timer);
  }, [content, mode, analyze]);

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar />

      {isAnalyzing && (
        <div className="h-0.5 bg-slate-100 overflow-hidden">
          <div className="h-full bg-indigo-400 animate-[loading_1s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <pre
          ref={backdropRef}
          aria-hidden
          style={{
            ...SHARED_STYLE,
            overflow: "hidden",
            pointerEvents: "none",
            color: "transparent",
            userSelect: "none",
          }}
        >
          {renderHighlighted(content)}
        </pre>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className="absolute inset-0 w-full h-full resize-none outline-none border-none bg-transparent text-slate-800"
          style={{
            ...SHARED_STYLE,
            caretColor: "#1e293b",
            color: "#1e293b",
            position: "absolute",
          }}
          placeholder="# My Project&#10;&#10;## Commands&#10;- Dev: `pnpm dev`&#10;…"
        />
      </div>
    </div>
  );
}
