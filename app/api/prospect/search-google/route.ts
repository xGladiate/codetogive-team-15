import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const GOOGLE_CX = process.env.GOOGLE_CX || "";

const mask = (s: string) => (s ? s.slice(0, 4) + "…" + s.slice(-4) : "(empty)");

export type SearchItem = {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  sourceQuery?: string;
};

async function googleSearch(q: string, num = 10): Promise<SearchItem[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.error("[CSE] Missing envs", {
      GOOGLE_API_KEY_present: !!GOOGLE_API_KEY,
      GOOGLE_CX_present: !!GOOGLE_CX,
    });
    throw new Error("Missing GOOGLE_API_KEY or GOOGLE_CX");
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("cx", GOOGLE_CX);
  url.searchParams.set("q", q);
  url.searchParams.set("num", String(Math.min(Math.max(num, 1), 10)));
  url.searchParams.set("gl", "hk"); // geo bias
  url.searchParams.set("hl", "en");

  const logged = new URL(url);
  logged.searchParams.set("key", mask(GOOGLE_API_KEY));
  logged.searchParams.set("cx", mask(GOOGLE_CX));
  console.log("[CSE] Requesting:", logged.toString());

  const r = await fetch(url.toString());
  const bodyText = await r.text();

  if (!r.ok) {
    let msg = bodyText;
    try {
      msg = JSON.parse(bodyText)?.error?.message || bodyText;
    } catch {}
    console.error("[CSE] Error", { status: r.status, msg, query: q });
    throw new Error(`Google CSE ${r.status}: ${msg}`);
  }

  const j = JSON.parse(bodyText);
  const items: SearchItem[] = (j.items || []).map((it: any) => ({
    title: it.title,
    link: it.link,
    snippet: it.snippet,
    displayLink: it.displayLink,
  }));

  console.log("[CSE] OK", { count: items.length });
  return items;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = "people", // "people" | "company"
      location = "Hong Kong",
      boolean = "",
      interests = [] as string[],
    } = body;

    const baseSite =
      mode === "company" ? "site:linkedin.com/company" : "site:linkedin.com/in";
    const interestBlock =
      interests?.length ? `(${interests.map((i:string) => `"${i}"`).join(" OR ")})` : "";
    const probes = `("about" OR "interests" OR "posts" OR "featured")`;

    const queries = [
      `${baseSite} (${boolean}) "${location}" ${interestBlock}`.trim(),
      `${baseSite} (${boolean}) ${probes} ${interestBlock}`.trim(),
      `${baseSite} (${boolean}) ${interestBlock}`.trim(),
    ];

    console.log("[CSE] Built queries:", queries);

    const batches = await Promise.all(
      queries.map(async (q) => ({ q, items: await googleSearch(q, 10) }))
    );

    const seen = new Set<string>();
    const merged: SearchItem[] = [];
    for (const { q, items } of batches) {
      for (const it of items) {
        if (!seen.has(it.link)) {
          seen.add(it.link);
          merged.push({ ...it, sourceQuery: q });
        }
      }
    }

    return Response.json({ ok: true, results: merged.slice(0, 30), queries });
  } catch (e: any) {
    console.error("[CSE] Fatal", e?.message || e);
    return Response.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
