const DEFAULT_MAX_BYTES = 96 * 1024;

module.exports = async function readJsonBody(request, maxBytes = DEFAULT_MAX_BYTES) {
  const contentType = request.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    return { ok: false, status: 415, error: "Content-Type must be application/json." };
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large. Limit is 96 KiB." };
  }
  if (!request.body) return { ok: false, status: 400, error: "Request body must be valid JSON." };

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, status: 413, error: "Request body is too large. Limit is 96 KiB." };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "Unable to read request body." };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let source;
  try { source = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return { ok: false, status: 400, error: "Request body must be UTF-8 JSON." }; }
  try {
    const body = JSON.parse(source);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false, status: 400, error: "Request body must be a JSON object." };
    }
    return { ok: true, body };
  } catch {
    return { ok: false, status: 400, error: "Request body must be valid JSON." };
  }
};
