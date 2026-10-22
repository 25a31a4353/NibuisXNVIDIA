const DEMO = {
  summary: "Demo preview: created a task-aware plan, an illustrative patch, review notes, and a manual verification checklist. This is not live model output.",
  confidence: 82,
  risk: "Medium",
  estimatedImpact: "Focused, reviewable change with explicit acceptance checks",
  plan: [
    { title: "Scope the task", detail: "Identify the entry point, current behavior, and acceptance criteria before changing implementation." },
    { title: "Implement the smallest safe change", detail: "Keep the change bounded and preserve existing interfaces wherever possible." },
    { title: "Review failure modes", detail: "Inspect input validation, error handling, compatibility, and relevant security assumptions." },
    { title: "Prepare regression coverage", detail: "Add checks for the reported issue, expected success, and likely edge cases." }
  ],
  patch: "diff --git a/src/feature.ts b/src/feature.ts\nindex 1b42c10..7ca2e56 100644\n--- a/src/feature.ts\n+++ b/src/feature.ts\n@@ -1,6 +1,10 @@\n export async function handleRequest(input: RequestInput) {\n+  const result = validateRequest(input);\n+  if (!result.ok) {\n+    return { ok: false, error: result.message };\n+  }\n   return processRequest(input);\n }",
  review: [
    { severity: "HIGH", title: "Validate the boundary contract", detail: "Confirm malformed input is rejected before downstream operations begin." },
    { severity: "MEDIUM", title: "Preserve compatibility", detail: "Compare error responses and types with existing API contracts before applying this illustrative diff." },
    { severity: "INFO", title: "Verify against source", detail: "The demo cannot inspect an actual repository. Replace illustrative file and function names with real project code." }
  ],
  verify: [
    { title: "Happy-path behavior remains unchanged", detail: "Submit valid input and compare the result against current acceptance criteria." },
    { title: "Malformed input is rejected", detail: "Cover missing fields, wrong types, empty values, and invalid boundary values." },
    { title: "Regression checks pass", detail: "Run real project tests, linting, and type checking after applying a reviewed patch." },
    { title: "Review error handling", detail: "Make sure error context remains useful without exposing secrets or private data." }
  ]
};
function parseModelText(raw) {
  if (typeof raw !== "string") throw new Error("The model response did not contain text.");
  const cleaned = raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/, "");
  const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model output was not valid JSON.");
  const d = JSON.parse(cleaned.slice(start, end + 1));
  if (!d.summary || !Array.isArray(d.plan) || typeof d.patch !== "string" || !Array.isArray(d.review) || !Array.isArray(d.verify)) throw new Error("Model output missed required report fields.");
  return {
    summary: String(d.summary).slice(0, 1500),
    confidence: Math.max(0, Math.min(100, Number(d.confidence) || 78)),
    risk: ["Low", "Medium", "High"].includes(d.risk) ? d.risk : "Medium",
    estimatedImpact: String(d.estimatedImpact || "See the plan and review notes.").slice(0, 400),
    plan: d.plan.slice(0, 8).map(x => ({ title: String(x.title || "Step").slice(0, 160), detail: String(x.detail || "").slice(0, 1000) })),
    patch: d.patch.slice(0, 30000),
    review: d.review.slice(0, 10).map(x => ({ severity: ["HIGH","MEDIUM","LOW","INFO"].includes(String(x.severity).toUpperCase()) ? String(x.severity).toUpperCase() : "INFO", title: String(x.title || "Review note").slice(0, 180), detail: String(x.detail || "").slice(0, 1200) })),
    verify: d.verify.slice(0, 12).map(x => ({ title: String(x.title || "Verification").slice(0, 180), detail: String(x.detail || "").slice(0, 1200) }))
  };
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed. Use POST." }); }
  const body = req.body || {};
  const task = typeof body.task === "string" ? body.task.trim().slice(0, 8000) : "";
  const stack = typeof body.stack === "string" ? body.stack.slice(0, 160) : "Generic";
  const context = typeof body.context === "string" ? body.context.trim().slice(0, 10000) : "";
  const depth = ["fast", "balanced", "deep"].includes(body.depth) ? body.depth : "balanced";
  if (task.length < 8) return res.status(400).json({ error: "Please provide an engineering task with at least 8 characters." });
  const key = process.env.NEBIUS_API_KEY;
  if (!key) {
    const result = JSON.parse(JSON.stringify(DEMO));
    result.summary = "Demo preview: structured output prepared for the task — " + task.slice(0, 180) + (task.length > 180 ? "…" : "");
    result.plan[0].detail = "Inspect the " + stack + " code path, establish the existing behavior, and define acceptance criteria.";
    result.plan[1].detail = "Make the smallest compatible change for: " + task.slice(0, 240);
    if (context) result.plan[2].detail = "Honor these supplied constraints: " + context.slice(0, 240);
    if (depth === "deep") result.review.push({ severity: "INFO", title: "Validate source-specific assumptions", detail: "This demo cannot inspect the repository. Check identifiers, types, and nearby code before applying any proposed diff." });
    return res.status(200).json({ live: false, mode: "demo", model: "NVIDIA Nemotron · Demo preview", result, warning: "NEBIUS_API_KEY is not configured; this is a demonstration result." });
  }
  const endpoint = process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1/chat/completions";
  const model = process.env.NEBIUS_MODEL || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";
  const prompt = "You are PatchPilot, a careful senior software engineer. Return ONLY a valid JSON object with schema {summary:string, confidence:number 0-100, risk:Low|Medium|High, estimatedImpact:string, plan:[{title:string,detail:string}], patch:string, review:[{severity:HIGH|MEDIUM|LOW|INFO,title:string,detail:string}], verify:[{title:string,detail:string}]}. Produce 3-6 plan steps, a focused proposed unified diff when possible, 2-5 specific review findings and 3-6 verification recommendations. Never claim you inspected a repository, applied code, or ran tests unless source and tools were actually supplied. State assumptions. Do not include secrets. Review depth: " + depth + ". Project stack: " + stack + ". Task: " + task + ". Additional context or source snippets: " + (context || "(none provided)");
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "system", content: "Return strict JSON and never claim unperformed work." }, { role: "user", content: prompt }], temperature: depth === "fast" ? 0.2 : 0.35, max_tokens: depth === "deep" ? 3500 : 2400, stream: false }), signal: controller.signal });
    if (!response.ok) {
      const result = JSON.parse(JSON.stringify(DEMO));
      result.summary = "Live inference was not available (HTTP " + response.status + "). A demo report is shown so the workflow remains usable.";
      return res.status(200).json({ live: false, mode: "demo", model: model, result, error: "Nebius returned HTTP " + response.status + ". Check model access, endpoint, and environment variables." });
    }
    const payload = await response.json();
    const raw = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
    const result = parseModelText(Array.isArray(raw) ? raw.map(x => x.text || "").join("\n") : raw);
    return res.status(200).json({ live: true, mode: "live", model, result });
  } catch (e) {
    const result = JSON.parse(JSON.stringify(DEMO));
    result.summary = e.name === "AbortError" ? "Live inference timed out; a demo report is shown." : "Live inference could not be completed; a demo report is shown.";
    return res.status(200).json({ live: false, mode: "demo", model, result, error: e.name === "AbortError" ? "Nebius inference timed out. Retry after checking the endpoint." : "Could not complete Token Factory inference. Verify the API key, endpoint, and model ID." });
  } finally { clearTimeout(timeout); }
};