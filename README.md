# PatchPilot ✳

**A review-first agentic engineering workbench powered by NVIDIA Nemotron through Nebius Token Factory.**

PatchPilot converts a plain-English engineering task into four reviewable artifacts: an implementation plan, a proposed unified diff, risk-oriented review notes, and a manual verification checklist. The UI makes each stage visible and keeps a human in control. It never automatically writes to a repository or claims tests ran when they did not.

## Hackathon fit

Built for the **Coding & Agentic Engineering** track of the Nebius × NVIDIA Global AI Hackathon 2026.

- **Nebius Token Factory:** server-side OpenAI-compatible Chat Completions API.
- **NVIDIA Nemotron:** selected through the NEBIUS_MODEL configuration.
- **Vercel Functions:** inference credentials stay on the server.
- **Responsive web workbench:** no front-end package install or build step required.

When NEBIUS_API_KEY is configured, /api/run calls Token Factory. Without a key, a clearly labeled demo report keeps the interactive experience usable. Demo content is not live model output.

## Features

- Four-stage pipeline: planning, patch generation, risk review, and verification planning.
- Task presets, stack selection, review depth, and optional source/context input.
- Unified diff viewer with copy and download.
- Review findings with severity and an interactive manual verification checklist.
- Run history and exportable Markdown/diff artifacts.
- Live/demo status and server-side health endpoint.
- API key is never placed in client code or browser storage.
- No automatic patch application, arbitrary code execution, or false test-pass claims.

## Deploy on Vercel

1. Import this public repository into Vercel and use the repository root as the project root.
2. Vercel serves index.html and the static assets, and deploys the functions in api/.
3. In Project Settings → Environment Variables, add NEBIUS_API_KEY as a server-side variable for the environments you use. Do not commit the credential.
4. Optionally override NEBIUS_MODEL (model ID enabled for your Token Factory account) and NEBIUS_BASE_URL (OpenAI-compatible chat-completions URL, defaults to https://api.tokenfactory.nebius.com/v1/chat/completions).
5. Redeploy after changing environment variables.
6. Verify /api/health shows live: true, then run a task. Only label a run as a live Nebius result when the dashboard shows LIVE INFERENCE.

Suggested environment values:

    NEBIUS_API_KEY=your_token_factory_api_key
    NEBIUS_MODEL=nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B
    NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1/chat/completions

The model ID is configurable; select a currently available NVIDIA Nemotron model from your Token Factory account if the default is not enabled.

## Run locally

Node.js 20+ is recommended. The UI is plain HTML/CSS/JavaScript; use the Vercel CLI for the local Functions runtime:

    npx vercel dev

Create .env.local for local live inference if needed, and never commit it.

## API

### GET /api/health

Returns non-secret configuration metadata: provider, configured/live flags, mode, and model label. It does not return the API key.

### POST /api/run

Example request:

    {
      "task": "Add request correlation IDs and preserve compatibility",
      "stack": "TypeScript · Node.js",
      "depth": "balanced",
      "context": "Optional constraints, source snippets, or acceptance criteria"
    }

A response contains summary, confidence, risk, estimatedImpact, plan[], patch, review[], and verify[]. Missing credentials and provider errors result in an explicitly labeled demo response with live: false; a run is labeled live only after successful inference and structured report parsing.

## Feedback to capture

During use, evaluate model availability, output quality, JSON reliability, inference latency, patch usefulness, review precision, and how easily environment setup can be completed.

## Limitations and engineering honesty

- The prototype does not clone a GitHub repository, apply a patch, run arbitrary user code, or execute tests.
- Verification entries are recommendations, not evidence of test execution.
- The diff is a proposal and must be checked against the actual repository.
- Live inference requires valid Token Factory credentials and access to the chosen model.
- Confirm current model IDs and API details in the Token Factory console/docs when configuring a deployment.

## License

MIT — see LICENSE.
