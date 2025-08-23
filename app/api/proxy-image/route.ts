// app/api/proxy-image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    // Only allow http/https and basic validation
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }

    const upstream = await fetch(u.toString(), {
      // No credentials, just a straight fetch
      redirect: "follow",
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream ${upstream.status}` }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = await upstream.arrayBuffer();

    const resp = new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache a bit so repeated exports are faster
        "Cache-Control": "public, max-age=3600",
      },
    });

    return resp;
  } catch (e) {
    return NextResponse.json({ error: "Proxy fetch failed" }, { status: 502 });
  }
}
