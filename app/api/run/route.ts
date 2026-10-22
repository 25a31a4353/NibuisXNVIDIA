import { NextResponse } from "next/server";
import legacyHandler from "../../../lib/run-handler.js";
import readJsonBody from "../../../lib/read-json-body.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type LegacyResponse = {
  statusCode: number;
  headers: Record<string, string>;
  payload: unknown;
  setHeader: (name: string, value: string) => LegacyResponse;
  status: (code: number) => LegacyResponse;
  json: (value: unknown) => LegacyResponse;
};

function makeResponse(): LegacyResponse {
  const output: LegacyResponse = {
    statusCode: 200,
    headers: {},
    payload: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; },
  };
  return output;
}

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, {
      status: parsed.status,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  }
  const response = makeResponse();
  const headers = Object.fromEntries(request.headers.entries());
  await legacyHandler({ method: "POST", body: parsed.body, headers }, response);
  return NextResponse.json(response.payload, {
    status: response.statusCode,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(response.headers["retry-after"] ? { "Retry-After": response.headers["retry-after"] } : {}),
    },
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
  );
}
