import { NextResponse } from "next/server";
import { getHealthStatus } from "../../../lib/health-status.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getHealthStatus(), {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
