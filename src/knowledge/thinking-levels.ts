// src/knowledge/thinking-levels.ts

export interface ThinkingLevel {
  name: string;
  triggers: string[];
  budget: string;
  useFor: string;
}

export interface ThinkingLevelsConfig {
  description: string;
  levels: ThinkingLevel[];
  note: string;
}

export const THINKING_LEVELS: ThinkingLevelsConfig = {
  description: "Claude Code maps specific phrases to thinking budget levels",
  levels: [
    {
      name: "think",
      triggers: ["think"],
      budget: "~10K tokens",
      useFor: "Routine tasks, simple bug fixes, small feature additions",
    },
    {
      name: "think hard / megathink",
      triggers: ["think about it", "think a lot", "think deeply", "think hard", "think more"],
      budget: "~20K tokens",
      useFor: "API design, moderate architecture decisions, multi-file changes",
    },
    {
      name: "ultrathink",
      triggers: [
        "think harder",
        "think intensely",
        "think longer",
        "think really hard",
        "think super hard",
        "think very hard",
        "ultrathink",
      ],
      budget: "~32K tokens (maximum)",
      useFor: "Complex architecture, critical migrations, deep debugging, system design",
    },
  ],
  note: "These triggers only work in Claude Code CLI — not in claude.ai web or the API.",
};

export const THINKING_TEMPLATE = `## Thinking guidance
- For routine changes: use default thinking
- For architecture and API design: use "think hard"
- For complex refactors and critical decisions: use "ultrathink"`;
