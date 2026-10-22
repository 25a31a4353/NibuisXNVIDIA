import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

export async function GET() {
  const configured = Boolean(process.env.NEBIUS_API_KEY);
  return NextResponse.json(
    {
      ok: true,
      provider: "Nebius Token Factory",
      configured,
      // Key presence is not proof of successful model inference.
      live: false,
      mode: configured ? "configured_not_tested" : "demo",
      modelName: process.env.NEBIUS_MODEL || DEFAULT_MODEL,
      keyLocation: "server environment only",
    },
    { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
