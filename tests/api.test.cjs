const test = require("node:test");
const assert = require("node:assert/strict");
const run = require("../api/run.js");
const health = require("../api/health.js");

function responseMock() {
  return {
    code: 200,
    headers: {},
    data: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; }
  };
}
async function invoke(handler, req) {
  const res = responseMock();
  await handler(req, res);
  return res;
}
function saved(name) { return process.env[name]; }
function restore(name, value) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }

test("health reports demo mode without exposing credentials", async () => {
  const key = saved("NEBIUS_API_KEY"); delete process.env.NEBIUS_API_KEY;
  try {
    const res = await invoke(health, { method: "GET" });
    assert.equal(res.code, 200);
    assert.equal(res.data.ok, true);
    assert.equal(res.data.provider, "Nebius Token Factory");
    assert.equal(res.data.configured, false);
    assert.equal(res.data.live, false);
    assert.equal(res.data.mode, "demo");
    assert.equal(Object.hasOwn(res.data, "apiKey"), false);
    assert.equal(res.headers["cache-control"], "no-store");
  } finally { restore("NEBIUS_API_KEY", key); }
});

test("health never treats key presence as verified inference", async () => {
  const key = saved("NEBIUS_API_KEY"), model = saved("NEBIUS_MODEL");
  process.env.NEBIUS_API_KEY = "unit-test-secret"; process.env.NEBIUS_MODEL = "nvidia/test-nemotron";
  try {
    const res = await invoke(health, { method: "GET" });
    assert.equal(res.data.configured, true); assert.equal(res.data.live, false);
    assert.equal(res.data.mode, "configured_not_tested");
    assert.equal(res.data.modelName, "nvidia/test-nemotron");
    assert.equal(JSON.stringify(res.data).includes("unit-test-secret"), false);
  } finally { restore("NEBIUS_API_KEY", key); restore("NEBIUS_MODEL", model); }
});

test("run rejects non-POST requests", async () => {
  const res = await invoke(run, { method: "GET", body: {} });
  assert.equal(res.code, 405); assert.equal(res.headers.allow, "POST");
  assert.match(res.data.error, /POST/i);
});

test("run validates minimum task length", async () => {
  const res = await invoke(run, { method: "POST", body: { task: "short" } });
  assert.equal(res.code, 400); assert.match(res.data.error, /engineering task/i);
});

test("run provides clearly labeled demo output with the expected report shape", async () => {
  const key = saved("NEBIUS_API_KEY"); delete process.env.NEBIUS_API_KEY;
  try {
    const res = await invoke(run, { method: "POST", body: {
      task: "Improve retry safety for API requests", stack: "TypeScript · Node.js", depth: "balanced",
      context: "Do not change public API behavior"
    }});
    assert.equal(res.code, 200); assert.equal(res.data.live, false); assert.equal(res.data.mode, "demo");
    assert.match(res.data.warning, /NEBIUS_API_KEY/i);
    assert.ok(Array.isArray(res.data.result.plan)); assert.equal(typeof res.data.result.patch, "string");
    assert.ok(Array.isArray(res.data.result.review)); assert.ok(Array.isArray(res.data.result.verify));
    assert.match(res.data.result.plan[0].detail, /TypeScript/);
    assert.equal(JSON.stringify(res.data).includes("unit-test-secret"), false);
  } finally { restore("NEBIUS_API_KEY", key); }
});

test("successful model response is parsed and labeled live", async () => {
  const key = saved("NEBIUS_API_KEY"), model = saved("NEBIUS_MODEL"), endpoint = saved("NEBIUS_BASE_URL");
  const originalFetch = global.fetch;
  const wanted = { summary: "Mock live result", confidence: 91, risk: "Low", estimatedImpact: "Focused change",
    plan: [{ title: "Inspect", detail: "Read the contract." }], patch: "diff --git a/a.js b/a.js",
    review: [{ severity: "INFO", title: "Review", detail: "Check semantics." }],
    verify: [{ title: "Test", detail: "Run the suite." }] };
  let captured;
  process.env.NEBIUS_API_KEY = "unit-test-key"; process.env.NEBIUS_MODEL = "nvidia/test-nemotron";
  process.env.NEBIUS_BASE_URL = "https://test.invalid/v1/chat/completions";
  global.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(wanted) } }] }),
      { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const res = await invoke(run, { method: "POST", body: { task: "Review a request retry handler", depth: "deep" } });
    assert.equal(res.code, 200); assert.equal(res.data.live, true); assert.equal(res.data.mode, "live");
    assert.equal(res.data.model, "nvidia/test-nemotron"); assert.deepEqual(res.data.result, wanted);
    assert.equal(captured.url, "https://test.invalid/v1/chat/completions");
    assert.equal(captured.options.headers.Authorization, "Bearer unit-test-key");
    assert.equal(captured.options.body.includes("Review a request retry handler"), true);
  } finally {
    global.fetch = originalFetch; restore("NEBIUS_API_KEY", key); restore("NEBIUS_MODEL", model); restore("NEBIUS_BASE_URL", endpoint);
  }
});

test("provider errors fall back to demo instead of claiming live inference", async () => {
  const key = saved("NEBIUS_API_KEY"), originalFetch = global.fetch; process.env.NEBIUS_API_KEY = "unit-test-key";
  global.fetch = async () => new Response("unauthorized", { status: 401 });
  try {
    const res = await invoke(run, { method: "POST", body: { task: "Inspect authentication failure behavior" } });
    assert.equal(res.code, 200); assert.equal(res.data.live, false); assert.equal(res.data.mode, "demo");
    assert.match(res.data.error, /401/); assert.match(res.data.result.summary, /HTTP 401/);
  } finally { global.fetch = originalFetch; restore("NEBIUS_API_KEY", key); }
});

test("malformed model output cannot pass as a live result", async () => {
  const key = saved("NEBIUS_API_KEY"), originalFetch = global.fetch; process.env.NEBIUS_API_KEY = "unit-test-key";
  global.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: "not valid JSON" } }] }),
    { status: 200, headers: { "content-type": "application/json" } });
  try {
    const res = await invoke(run, { method: "POST", body: { task: "Generate a structured patch plan" } });
    assert.equal(res.code, 200); assert.equal(res.data.live, false); assert.equal(res.data.mode, "demo");
    assert.match(res.data.error, /inference/i); assert.ok(Array.isArray(res.data.result.plan));
  } finally { global.fetch = originalFetch; restore("NEBIUS_API_KEY", key); }
});
