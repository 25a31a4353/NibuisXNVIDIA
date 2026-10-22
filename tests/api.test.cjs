const test = require("node:test");
const assert = require("node:assert/strict");
const run = require("../lib/run-handler.js");
const { getHealthStatus } = require("../lib/health-status.js");

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

test("health reports demo mode without exposing credentials", () => {
  const result = getHealthStatus({});
  assert.equal(result.ok, true);
  assert.equal(result.provider, "Nebius Token Factory");
  assert.equal(result.configured, false);
  assert.equal(result.live, false);
  assert.equal(result.mode, "demo");
  assert.equal(Object.hasOwn(result, "apiKey"), false);
});

test("health never treats key presence as verified inference", () => {
  const result = getHealthStatus({ NEBIUS_API_KEY: "test-only-secret", NEBIUS_MODEL: "nvidia/test-nemotron" });
  assert.equal(result.configured, true);
  assert.equal(result.live, false);
  assert.equal(result.mode, "configured_not_tested");
  assert.equal(result.modelName, "nvidia/test-nemotron");
  assert.equal(JSON.stringify(result).includes("test-only-secret"), false);
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
  process.env.NEBIUS_BASE_URL = "https://api.tokenfactory.nebius.com/v1/chat/completions";
  global.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(wanted) } }] }),
      { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const res = await invoke(run, { method: "POST", body: { task: "Review a request retry handler", depth: "deep" } });
    assert.equal(res.code, 200); assert.equal(res.data.live, true); assert.equal(res.data.mode, "live");
    assert.equal(res.data.model, "nvidia/test-nemotron"); assert.deepEqual(res.data.result, wanted);
    assert.equal(captured.url, "https://api.tokenfactory.nebius.com/v1/chat/completions");
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


test("request-size guard rejects oversized payloads before inference", async () => {
  const res = await invoke(run, { method: "POST", body: { task: "x".repeat(100 * 1024) } });
  assert.equal(res.code, 413);
  assert.match(res.data.error, /96 KiB/i);
});

test("arbitrary endpoints are rejected before the API key is sent", async () => {
  const key = saved("NEBIUS_API_KEY"), endpoint = saved("NEBIUS_BASE_URL"), originalFetch = global.fetch;
  process.env.NEBIUS_API_KEY = "unit-test-key";
  process.env.NEBIUS_BASE_URL = "https://attacker.example/collect";
  global.fetch = async () => { throw new Error("fetch must not be called for an untrusted endpoint"); };
  try {
    const res = await invoke(run, { method: "POST", headers: { "x-forwarded-for": "192.0.2.80" }, body: { task: "Check safe endpoint handling" } });
    assert.equal(res.code, 503);
    assert.equal(res.data.live, false);
    assert.match(res.data.error, /official HTTPS Token Factory/i);
  } finally { global.fetch = originalFetch; restore("NEBIUS_API_KEY", key); restore("NEBIUS_BASE_URL", endpoint); }
});

test("live requests are best-effort rate limited per forwarded IP", async () => {
  const key = saved("NEBIUS_API_KEY"), endpoint = saved("NEBIUS_BASE_URL"), originalFetch = global.fetch;
  process.env.NEBIUS_API_KEY = "unit-test-key";
  process.env.NEBIUS_BASE_URL = "https://api.tokenfactory.nebius.com/v1/chat/completions";
  run._resetLiveRunLimit();
  let calls = 0;
  global.fetch = async () => { calls++; return new Response("unauthorized", { status: 401 }); };
  try {
    for (let i = 0; i < 10; i++) {
      const res = await invoke(run, { method: "POST", headers: { "x-forwarded-for": "192.0.2.81" }, body: { task: "Check API retry safety" } });
      assert.equal(res.code, 200);
    }
    const limited = await invoke(run, { method: "POST", headers: { "x-forwarded-for": "192.0.2.81" }, body: { task: "Check API retry safety" } });
    assert.equal(limited.code, 429);
    assert.ok(Number(limited.headers["retry-after"]) > 0);
    assert.equal(calls, 10);
  } finally { global.fetch = originalFetch; restore("NEBIUS_API_KEY", key); restore("NEBIUS_BASE_URL", endpoint); run._resetLiveRunLimit(); }
});

test("model output normalization clamps bounds and preserves a zero self-rating", () => {
  const parsed = run.parseModelText(JSON.stringify({
    summary: "Safe structured result", confidence: 0, risk: "unexpected", estimatedImpact: "x".repeat(600),
    plan: [null, { title: "A".repeat(200), detail: "detail" }], patch: "p".repeat(31000),
    review: [null], verify: [{ title: "Verify", detail: "Run checks." }]
  }));
  assert.equal(parsed.confidence, 0);
  assert.equal(parsed.risk, "Medium");
  assert.equal(parsed.estimatedImpact.length, 400);
  assert.equal(parsed.plan[0].title, "Step");
  assert.equal(parsed.plan[1].title.length, 160);
  assert.equal(parsed.patch.length, 30000);
  assert.equal(parsed.review[0].title, "Review note");
});

test("model output without non-empty review and verification is rejected", () => {
  assert.throws(() => run.parseModelText(JSON.stringify({
    summary: "Incomplete", confidence: 80, risk: "Low", plan: [{ title: "A", detail: "B" }], patch: "",
    review: [], verify: []
  })), /required report fields/i);
});
