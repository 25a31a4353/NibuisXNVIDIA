# PatchPilot ✳

**A review-first agentic engineering workbench powered by NVIDIA Nemotron through Nebius Token Factory.**

Built for the **Coding & Agentic Engineering** track of the Nebius × NVIDIA Global AI Hackathon 2026. PatchPilot turns an engineering task into a structured plan, a proposed unified diff, risk findings, and manual verification steps. It keeps a human in control: it does not automatically modify a repository or claim tests ran when they did not.

## Product features

- A four-step report pipeline: task intake, one model inference request, report validation, and human verification. These are workflow stages, not four separately running autonomous agents.
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
- `NEBIUS_MODEL` — an NVIDIA Nemotron model ID available to your account. The current default is `nvidia/Nemotron-3_5-Lightning`, Nebius’s current published Nemotron model ID for agentic reasoning and coding.
- `NEBIUS_BASE_URL` — optional endpoint override, restricted to the official HTTPS `api.tokenfactory.nebius.com/v1/chat/completions` URL so the server-side bearer token cannot be forwarded to an arbitrary host.

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

The response includes `summary`, model-reported `confidence`, `risk`, `estimatedImpact`, `plan[]`, `patch`, `review[]`, `verify[]`, and explicit `live`/`mode` fields. Confidence is an uncalibrated model self-rating, not a measured probability of correctness.

## Verification

    npm run verify

The verification command runs a dependency audit, 22 Node built-in API/UI/body-validation regression tests, the production Next.js build, and TypeScript checks. It synchronizes the canonical UI sources into `public/` before testing/building. GitHub Actions runs the audit and the same test/build/type-check stages on pushes and pull requests to `main`.

## Limitations and safety

- PatchPilot does not clone repositories, apply diffs, execute arbitrary submitted code, or run the generated project tests.
- Its verification checklist is a suggested plan, not evidence that a test has passed.
- Proposed diffs are not guaranteed to match the actual source tree; review names, types, context, and behavior before use.
- Live inference requires a valid Token Factory key and access to the configured model. A successful provider call has not yet been verified in production until `NEBIUS_API_KEY` is configured and a live run is observed.
- The API enforces a 96 KiB body limit. Live runs have a best-effort limit of 10 requests per IP per minute per warm serverless instance; this is **not** a shared, durable rate limiter. Before making a keyed endpoint widely public, add a shared rate limiter (Vercel Firewall or a durable store) and usage/budget alerts.
- PatchPilot performs one structured model request per run; the report sections are produced in that single response. It does not yet implement independent sub-agents, repository cloning/indexing, tool calling against a real codebase, patch application, or test execution.

## License

MIT — see [LICENSE](LICENSE).
