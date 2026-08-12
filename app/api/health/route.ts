import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const { AURA_API_URL, AURA_API_SECRET } = getServerEnv();

  try {
    const upstream = await fetch(`${AURA_API_URL}/health`, {
      method: "GET",
      headers: {
        "X-Aura-Key": AURA_API_SECRET,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      console.error("health upstream status", upstream.status);
      return NextResponse.json(
        { error: "Health check failed" },
        { status: 502 },
      );
    }

    const payload: unknown = await upstream.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("health upstream error", error);
    return NextResponse.json(
      { error: "Health check failed" },
      { status: 502 },
    );
  }
}
