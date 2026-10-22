# PatchPilot ✳

**A review-first agentic engineering workbench powered by NVIDIA Nemotron through Nebius Token Factory.**

Built for the **Coding & Agentic Engineering** track of the Nebius × NVIDIA Global AI Hackathon 2026. PatchPilot turns an engineering task into a structured plan, a proposed unified diff, risk findings, and manual verification steps. It keeps a human in control: it does not automatically modify a repository or claim tests ran when they did not.

## Product features

- A clear four-stage plan → patch → review → verify pipeline.
- Task presets, stack/review-depth selectors, and optional source/context input.
- Unified diff viewer with copy and download, risk-review cards, and a manual verification checklist.
- Exportable Markdown reports, artifact download, run history, mobile navigation, and responsive UI.
- Server-side API key handling, honest `demo` versus successfully parsed `live` inference statuses, and a health endpoint.
- Automated API/UI regression tests and GitHub Actions checks.

## Hackathon stack

- **NVIDIA Nemotron** selected with `NEBIUS_MODEL`.
- **Nebius Token Factory** OpenAI-compatible Chat Completions endpoint.
- **Next.js App Router** for the deployable application and API routes.
- **Vercel** for hosting/serverless execution; **GitHub Actions** for continuous checks.
- **Figma** editable dashboard design: https://www.figma.com/design/xVr1511orOTLU2GwwpONGP

## Run locally

Requirements: Node.js 20 or later.

    npm ci
    npm run dev

The UI is available at `http://localhost:3000`. For live calls, copy `.env.example` to `.env.local` and add your own Token Factory API key; never commit `.env.local` or place credentials in client-side code.

## Configure live inference

Set these environment variables in Vercel **Project Settings → Environment Variables** (server-side only):

- `NEBIUS_API_KEY` — your Token Factory API key.
- `NEBIUS_MODEL` — an NVIDIA Nemotron model ID available to your account. The current default is `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`.
- `NEBIUS_BASE_URL` — optional OpenAI-compatible chat-completions endpoint; defaults to `https://api.tokenfactory.nebius.com/v1/chat/completions`.

Redeploy after configuration. `/api/health` intentionally reports a configured key separately from a verified inference request. Only a successful model call with valid structured output is labeled live. Without a key or when inference fails, PatchPilot returns a clearly marked demo result.

## API

### `GET /api/health`

Returns non-secret configuration metadata. It never returns the API key and never claims live inference has succeeded merely because a key exists.

### `POST /api/run`

Example body:

    {
      "task": "Improve retry safety for API requests",
      "stack": "TypeScript · Node.js",
      "depth": "balanced",
      "context": "Optional constraints or source snippets"
    }

The response includes `summary`, `confidence`, `risk`, `estimatedImpact`, `plan[]`, `patch`, `review[]`, `verify[]`, and explicit `live`/`mode` fields.

## Verification

    npm run verify

The verification command runs TypeScript checks, Node built-in unit/regression tests, and the production Next.js build. GitHub Actions runs the same stages on pushes and pull requests to `main`.

## Limitations and safety

- PatchPilot does not clone repositories, apply diffs, execute arbitrary submitted code, or run the generated project tests.
- Its verification checklist is a suggested plan, not evidence that a test has passed.
- Proposed diffs are not guaranteed to match the actual source tree; review names, types, context, and behavior before use.
- Live inference requires a valid Token Factory key and access to the configured model.

## License

MIT — see [LICENSE](LICENSE).
