/**
 * EditorIntegration
 *
 * Example showing how to wire the OptimizerSidebar into an existing
 * editor page. This is the integration pattern — adapt it to your
 * actual editor component.
 */

import React, { useState, useCallback, useRef } from "react";
import { useOptimizer } from "../hooks/useOptimizer";
import { OptimizerSidebar } from "./OptimizerSidebar";
import type { Suggestion, SectionRecommendation } from "../types";

interface EditorIntegrationProps {
  initialContent?: string;
}

export function EditorIntegration({ initialContent = "" }: EditorIntegrationProps) {
  const [content, setContent] = useState(initialContent);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const { state, analyzeNow, onContentChange, setMode, reset } = useOptimizer({
    initialMode: "on-demand",
  });

  // ── Content change handler ──
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      onContentChange(newContent); // feeds into optimizer (debounced in realtime mode)
    },
    [onContentChange]
  );

  // ── Apply a suggestion (text replacement) ──
  const handleApplySuggestion = useCallback(
    (suggestion: Suggestion) => {
      if (!suggestion.currentText) {
        // It's a new section to append
        setContent((prev) => prev + "\n\n" + suggestion.suggestedText);
        return;
      }

      // Replace the first occurrence of currentText with suggestedText
      setContent((prev) => {
        const idx = prev.indexOf(suggestion.currentText!);
        if (idx === -1) return prev; // text was already changed

        return (
          prev.slice(0, idx) +
          suggestion.suggestedText +
          prev.slice(idx + suggestion.currentText!.length)
        );
      });
    },
    []
  );

  // ── Apply a recommendation (append new section) ──
  const handleApplyRecommendation = useCallback(
    (recommendation: SectionRecommendation) => {
      setContent((prev) => prev + "\n\n" + recommendation.template);
    },
    []
  );

  // ── Scroll editor to a section ──
  const handleScrollToSection = useCallback(
    (sectionId: string) => {
      if (!state.result || !editorRef.current) return;

      const section = state.result.analysis.document.sections.find(
        (s) => s.id === sectionId
      );
      if (!section) return;

      // Approximate: scroll to the line number
      const textarea = editorRef.current;
      const lines = textarea.value.split("\n");
      const charOffset = lines
        .slice(0, section.startLine)
        .reduce((sum, line) => sum + line.length + 1, 0);

      textarea.focus();
      textarea.setSelectionRange(charOffset, charOffset);
      // Scroll the textarea so the line is visible
      const lineHeight = 20; // approximate
      textarea.scrollTop = section.startLine * lineHeight;
    },
    [state.result]
  );

  return (
    <div className="editor-layout" style={{ display: "flex", height: "100vh" }}>
      {/* ── Editor pane ── */}
      <div className="editor-pane" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="editor-toolbar">
          <h1>claude.md Editor</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide Optimizer" : "Show Optimizer"}
          </button>
        </div>
        <textarea
          ref={editorRef}
          className="editor-textarea"
          value={content}
          onChange={handleContentChange}
          placeholder="Paste or write your claude.md content here..."
          style={{
            flex: 1,
            fontFamily: "monospace",
            fontSize: 14,
            padding: 16,
            border: "none",
            resize: "none",
            outline: "none",
          }}
        />
      </div>

      {/* ── Optimizer sidebar ── */}
      {sidebarOpen && (
        <div style={{ width: 400, borderLeft: "1px solid #e5e7eb", overflow: "auto" }}>
          <OptimizerSidebar
            result={state.result}
            isAnalyzing={state.isAnalyzing}
            mode={state.mode}
            onModeChange={setMode}
            onAnalyzeClick={() => analyzeNow(content)}
            onApplySuggestion={handleApplySuggestion}
            onApplyRecommendation={handleApplyRecommendation}
            onScrollToSection={handleScrollToSection}
          />
        </div>
      )}
    </div>
  );
}
