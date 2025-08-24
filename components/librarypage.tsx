// components/librarypage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Row = {
  id: number;
  title: string | null;
  story: string | null;                  // plain text content
  content_type: "text" | "image";
  content_url: string | null;            // full public/signed URL (new saves) or raw path (legacy)
  metadata: any;                         // { kind, template, lang, owner, ... }
  created_at: string;
};

function sb() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  );
}

const KIND_ORDER = ["donor_report", "newsletter", "thank_you", "student_story", "other"] as const;

export default function LibraryPage() {
  const supabase = sb();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const myId = user?.id || null;
      setMe(myId);

      const base = supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });

      const q = myId ? base.eq("metadata->>owner", myId) : base;

      const { data, error } = await q;
      if (error) {
        console.error("[library] fetch error:", error);
        setRows([]);
      } else {
        setRows((data as Row[]) || []);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    const out: Record<string, Row[]> = {};
    for (const r of rows) {
      const k = r.metadata?.kind ?? "other";
      (out[k] ||= []).push(r);
    }
    return out;
  }, [rows]);

  // Normalize a content URL:
  // - if already full http(s) URL, use as-is
  // - if legacy raw path, wrap with getPublicUrl
  const getImgUrl = (maybeUrl: string | null): string | null => {
    if (!maybeUrl) return null;
    if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
    return supabase.storage.from("stories").getPublicUrl(maybeUrl).data.publicUrl ?? null;
  };

  const dash = (s: string | null | undefined) => (s && s.trim() ? s : "—");

  const onDownload = async (r: Row) => {
    try {
      if (r.content_type === "image") {
        const url = getImgUrl(r.content_url);
        if (!url) throw new Error("Missing image URL");
        const resp = await fetch(url);
        const blob = await resp.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${(r.title || "story").replace(/[^\w.-]+/g, "_")}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      } else {
        const text = r.story || "";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${(r.title || "story").replace(/[^\w.-]+/g, "_")}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      }
    } catch (e) {
      console.error("[library] download failed:", e);
      alert("Download failed. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Library</h1>
        <Link href="/writer" className="underline">← Back to Writer</Link>
      </div>

      {loading && <div className="opacity-70">Loading…</div>}

      {!loading && KIND_ORDER.map((k) =>
        groups[k]?.length ? (
          <section key={k} className="space-y-3">
            <h2 className="text-xl font-bold capitalize">
              {k.replaceAll("_", " ")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {groups[k].map((r) => {
                const isImage = r.content_type === "image";
                const img = isImage ? getImgUrl(r.content_url) : null;

                return (
                  <article
                    key={r.id}
                    className="border rounded-xl bg-white p-3 space-y-2 hover:shadow-sm transition-shadow"
                  >
                    <div className="text-sm opacity-60">
                      {new Date(r.created_at).toLocaleString()}
                    </div>

                    <div className="font-semibold">{dash(r.title)}</div>

                    {/* Preview */}
                    {isImage && img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap line-clamp-6 min-h-24">
                        {dash(r.story)}
                      </div>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
                      <span className="px-2 py-0.5 rounded-full border">{r.content_type}</span>
                      <span className="px-2 py-0.5 rounded-full border">
                        {dash(r.metadata?.lang)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border">
                        {dash(r.metadata?.template)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border">
                        {dash(r.metadata?.kind)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {isImage && img ? (
                        <a
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 text-sm underline"
                          title="Open in new tab"
                        >
                          View
                        </a>
                      ) : (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 underline">
                            View
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap text-xs border rounded p-2 bg-gray-50 max-h-56 overflow-auto">
                            {r.story || ""}
                          </pre>
                        </details>
                      )}

                      <button
                        onClick={() => onDownload(r)}
                        className="text-blue-600 text-sm underline"
                        title="Download"
                      >
                        Download
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null
      )}

      {!loading && !rows.length && (
        <div className="opacity-70">
          Nothing saved yet. Go create something in the Writer ✨
        </div>
      )}
    </div>
  );
}
