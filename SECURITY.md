# Security Policy

## API Key Handling

Your API keys **never leave your browser to our servers for storage**.

- Keys are stored locally in your browser (`localStorage`)
- Keys are sent to the Next.js server **only to proxy the request** to your chosen LLM provider (OpenAI, Anthropic, etc.) — this is necessary because LLM APIs block direct browser requests due to CORS
- Keys are **never logged, stored, or persisted** server-side
- The server acts as a transparent proxy: it receives your key, forwards the request to the provider, and returns the response

**On shared computers:** clear your browser's localStorage or use an incognito window.

## Reporting a Vulnerability

If you discover a security vulnerability, please open a [GitHub Issue](https://github.com/MatthdV/claude-md-optimizer/issues) with the label `security`, or contact the maintainer directly.

Please **do not** disclose security vulnerabilities publicly before they have been addressed.
