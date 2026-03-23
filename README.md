# CLAUDE.md Generator & Optimizer

Generate and optimize [`CLAUDE.md`](https://docs.anthropic.com/en/docs/claude-code/memory) files for your projects — the configuration file that gives Claude Code permanent memory about your codebase.

**Live app → [claude-md-optimizer.vercel.app](https://claude-md-optimizer.vercel.app)**

---

## What it does

**Generator** — Describe your project in one sentence ("React dashboard with Supabase and Tailwind"). The AI asks a few targeted questions, then produces a production-ready `CLAUDE.md` under 200 lines, following Anthropic's official best practices.

**Optimizer** — Paste an existing `CLAUDE.md` and get:
- A score across 5 dimensions (Actionability, Conciseness, Specificity, Completeness, Consistency)
- Specific issues flagged (self-evident instructions, vague qualifiers, missing sections…)
- One-click fixes with before/after diff

Everything runs in your browser. No account required. Bring your own API key.

---

## Supported LLM providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4.1, o3-mini… |
| Anthropic | Claude Sonnet 4, Haiku 4.5, Opus 4 |
| Google | Gemini 2.5 Flash, 2.5 Pro… |
| Groq | Llama 3.3 70B, Mixtral 8x7B |
| Custom | Any OpenAI-compatible endpoint (LiteLLM, Ollama…) |

---

## Running locally

```bash
git clone https://github.com/MatthdV/claude-md-optimizer.git
cd claude-md-optimizer
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Configure your LLM provider via the **⚙ Settings** button — no environment variables needed.

### Optional: server-side fallback

If you want a default LLM key for all users (e.g. a demo deployment), create `.env.local`:

```bash
LLM_API_KEY=sk-...
LLM_API_BASE_URL=https://api.openai.com/v1
LLM_DEFAULT_MODEL=gpt-4o
```

The app falls back to these env vars when no client-side key is configured.

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MatthdV/claude-md-optimizer)

No environment variables required. Users bring their own API key via the Settings panel.

---

## Stack

- **Next.js 15** (App Router)
- **TypeScript** strict mode
- **Zustand** for state
- **Tailwind CSS v4**
- **Recharts** for score visualization
- **OpenAI SDK** (used as OpenAI-compatible client for all providers)

---

## API key privacy

Your API key is stored in your browser's `localStorage` and sent to the Next.js server only to proxy the request to your LLM provider. It is **never logged or stored** server-side. See [SECURITY.md](./SECURITY.md) for details.

---

## License

MIT — see [LICENSE](./LICENSE)
