import { NextResponse } from "next/server";
import legacyHandler from "../../../api/run.js";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const response = makeResponse();
  await legacyHandler({ method: "POST", body }, response);
  return NextResponse.json(response.payload, {
    status: response.statusCode,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
  );
}
