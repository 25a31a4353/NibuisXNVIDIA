# PatchPilot ✳

**A review-first agentic engineering workbench powered by NVIDIA Nemotron through Nebius Token Factory.**

Built for the **Coding & Agentic Engineering** track of the Nebius × NVIDIA Global AI Hackathon 2026. PatchPilot turns an engineering task into a structured plan, a proposed unified diff, risk findings, and manual verification steps. It keeps a human in control: it does not automatically modify a repository or claim tests ran when they did not.

## Product features

- Four distinct sequential model roles: task planner, implementation engineer, independent reviewer, and test planner. Each role makes a separate Token Factory call with a role-specific schema and receives the previous stage’s outputs.
- Task presets, stack/review-depth selectors, and optional source/context input.
- Source-file upload (up to 6 files / 45 KiB total), unified diff viewer with copy/download, risk-review cards, and a manual verification checklist. Generated patches are displayed only if their file paths and old hunk context match the uploaded snapshot.
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
- `NEBIUS_MODEL` — an NVIDIA Nemotron model ID available to your account. The default is `nvidia/Nemotron-3_5-Lightning`; verify that the selected model is enabled for the account before judging live calls.
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

The verification command runs a dependency audit, 25 Node built-in API/UI/body-validation/agent-orchestration regression tests, the production Next.js build, and TypeScript checks. It synchronizes the canonical UI sources into `public/` before testing/building. GitHub Actions runs the audit and the same test/build/type-check stages on pushes and pull requests to `main`.

## Limitations and safety

- PatchPilot does not clone repositories, apply diffs, execute arbitrary submitted code, or run the generated project tests.
- Its verification checklist is a suggested plan, not evidence that a test has passed.
- Proposed diffs are not guaranteed to match the actual source tree; review names, types, context, and behavior before use.
- Live inference requires a valid Token Factory key and access to the configured model. A successful provider call has not yet been verified in production until `NEBIUS_API_KEY` is configured and a live run is observed.
- The API enforces a 96 KiB body limit. Each live run makes four sequential model calls (53-second overall budget), and the endpoint uses a best-effort limit of 4 runs per IP per minute per warm serverless instance; this is **not** a shared, durable rate limiter. Before making a keyed endpoint widely public, add a shared rate limiter (Vercel Firewall or a durable store) and usage/budget alerts.
- PatchPilot now performs four independent role-specific model requests. It still does not clone/index a whole repository, apply a patch, or execute the suggested tests. Source-grounded diffs require the user to upload the relevant source files; hunk matching is a non-executing dry run, not proof of semantic correctness or a successful build.

## License

MIT — see [LICENSE](LICENSE).


## Agent pipeline and source-grounded patch contract

Each live run calls four specialists in order: (1) planner creates ordered steps and acceptance criteria, (2) engineer proposes a diff, (3) reviewer independently critiques the source/patch, and (4) test planner produces targeted regression checks. The entire run is bounded by a 53-second orchestration budget. Every stage must return valid structured JSON; a failed stage cancels the live report rather than combining partial model output with a success label.

Upload only the focused text files needed for the change. Source files are held in the request/runtime for that run and are not written back to the repository. Diff validation checks safe paths, file membership, hunk counts, and old-line context against the uploaded snapshot. It does not execute code, guarantee semantic correctness, or apply the diff.
