import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "nvidia/Nemotron-3.5-Lightning";

export async function GET() {
  const configured = Boolean(process.env.NEBIUS_API_KEY);
  return NextResponse.json({
    provider: "Nebius Token Factory",
    model: process.env.NEBIUS_MODEL || DEFAULT_MODEL,
    liveConfigured: configured,
    mode: configured ? "live-ready" : "demo",
    keyLocation: "server environment only",
    endpoint: "https://api.tokenfactory.nebius.com/v1"
  });
}