import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  const h = await headers(); // <-- FIX: await it
  const country =
    h.get("x-edge-ipcountry") ||
    h.get("cf-ipcountry") ||
    "US";

  return NextResponse.json({ country });
}
