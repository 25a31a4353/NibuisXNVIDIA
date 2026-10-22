const test = require("node:test");
const assert = require("node:assert/strict");
const readJsonBody = require("../lib/read-json-body.js");

const makeRequest = (body, headers = { "content-type": "application/json" }) =>
  new Request("https://example.invalid/api/run", { method: "POST", headers, body });

test("bounded JSON reader accepts valid object payloads", async () => {
  const result = await readJsonBody(makeRequest(JSON.stringify({ task: "Review retry logic" })));
  assert.equal(result.ok, true);
  assert.equal(result.body.task, "Review retry logic");
});

test("bounded JSON reader rejects unsupported content types", async () => {
  const result = await readJsonBody(makeRequest("task=hello", { "content-type": "application/x-www-form-urlencoded" }));
  assert.equal(result.ok, false);
  assert.equal(result.status, 415);
});

test("bounded JSON reader rejects large declared bodies", async () => {
  const result = await readJsonBody(makeRequest("{}", { "content-type": "application/json", "content-length": "999999" }));
  assert.equal(result.status, 413);
});

test("bounded JSON reader rejects actual streamed bodies above the limit", async () => {
  const result = await readJsonBody(makeRequest(JSON.stringify({ task: "x".repeat(2_000) })), 1024);
  assert.equal(result.ok, false);
  assert.equal(result.status, 413);
});

test("bounded JSON reader rejects malformed JSON and non-object roots", async () => {
  const malformed = await readJsonBody(makeRequest("{broken"));
  assert.equal(malformed.status, 400);
  const array = await readJsonBody(makeRequest("[1,2,3]"));
  assert.equal(array.status, 400);
});
