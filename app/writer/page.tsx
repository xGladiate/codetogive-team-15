// app/writer/page.tsx
"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Poster from "@/components/templates/Poster";
import ThankYouCard from "@/components/templates/ThankYouCard";
import Newsletter from "@/components/templates/Newsletter";
import * as htmlToImage from "html-to-image";
import { saveAs } from "file-saver";
import EditorCanvas, { Layer } from "@/components/templates/EditorCanvas";

/* ========= Helpers ========= */

/** Wait for <img> inside node to be loaded (or error) */
async function waitForImages(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      const any = img as any;
      if (any.complete && any.naturalWidth) return;
      return new Promise<void>((res) => {
        img.addEventListener("load", () => res(), { once: true });
        img.addEventListener("error", () => res(), { once: true });
      });
    })
  );
}
async function nextFrame() {
  await new Promise(requestAnimationFrame);
}

/** Fonts + images settle */
async function settle(node: HTMLElement) {
  await waitForImages(node);
  try {
    // @ts-ignore
    if (document?.fonts?.ready) await (document as any).fonts.ready;
  } catch {}
  await nextFrame();
}

/* ===== DataURL utilities for uploads (kept) ===== */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
function fileToDataURL(file: File): Promise<string> {
  return blobToDataURL(file);
}

/* ========= Optional clean export-only renderer (kept for reference) ========= */
function ExportStage({
  width,
  height,
  background,
  layers,
}: {
  width: number;
  height: number;
  background?: React.ReactNode;
  layers: Layer[];
}) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        background: "#fff",
        overflow: "hidden",
        borderRadius: 24,
      }}
    >
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{background}</div>
      {layers.map((layer) => {
        if (layer.type === "image") {
          return (
            <div
              key={layer.id}
              style={{
                position: "absolute",
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                overflow: "hidden",
                borderRadius: 6,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={layer.src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                draggable={false}
              />
            </div>
          );
        }
        return (
          <div
            key={layer.id}
            style={{
              position: "absolute",
              left: layer.x,
              top: layer.y,
              width: layer.width,
              height: layer.height,
              display: "flex",
              alignItems: "center",
              justifyContent:
                layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start",
              color: layer.color ?? "#111827",
              fontSize: layer.fontSize ?? 28,
              fontWeight: layer.fontWeight ?? 700,
              textAlign: layer.align ?? "left",
              whiteSpace: "pre-wrap",
              lineHeight: 1.25,
              padding: 8,
            }}
          >
            {layer.text}
          </div>
        );
      })}
    </div>
  );
}

/* ========= Types ========= */
type DonorReport = {
  title: string;
  executive_summary: string;
  highlights: string[];
  impact_story: string;
  whats_next: string;
  cta: string;
};
type NewsletterT = {
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
  cta: string;
};
type ThankYou = { subject: string; body: string };
type StudentStory = { title: string; body: string };
type OutputShape = {
  en?: DonorReport | NewsletterT | ThankYou | StudentStory;
  "zh-Hant"?: DonorReport | NewsletterT | ThankYou | StudentStory;
};

type Mode = "visual" | "plain";
type TemplateKind = "poster" | "thankyou" | "newsletter";

/* ========= Output → Template binding ========= */
const TEMPLATE_MAP: Record<"donor_report" | "newsletter" | "thank_you" | "student_story", TemplateKind> = {
  donor_report: "poster",
  newsletter: "newsletter",
  thank_you: "thankyou",
  student_story: "poster",
};

/* ========= Template sizes ========= */
const TEMPLATE_SIZES: Record<TemplateKind, { w: number; h: number }> = {
  poster: { w: 840, h: 1188 },
  thankyou: { w: 1100, h: 620 },
  newsletter: { w: 960, h: 1200 },
};

export default function WriterPage() {
  /* ----- Writer state ----- */
  const [input, setInput] = useState("");
  const [type, setType] = useState<"donor_report" | "newsletter" | "thank_you" | "student_story">("donor_report");
  const [anonymize, setAnonymize] = useState(true);
  const [langs, setLangs] = useState<{ en: boolean; zh: boolean }>({ en: true, zh: true });
  const [previewLang, setPreviewLang] = useState<"en" | "zh-Hant">("en");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<OutputShape | null>(null);

  /* ----- View mode (after generate) ----- */
  const [mode, setMode] = useState<Mode>("visual");

  /* ----- Editable layout state ----- */
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{ id: string; src: string }[]>([]);
  const [editingText, setEditingText] = useState<{ id: string; value: string } | null>(null);

  /* ----- Theme color ----- */
  const [themeColor, setThemeColor] = useState<string>("#1f2937"); // slate-800

  const previewRef = useRef<HTMLDivElement>(null); // visible editor
  const exportRef = useRef<HTMLDivElement>(null);  // hidden clean stage (kept but unused for export)

  /* ----- Cleanup data URLs from gallery (no revoke needed for data:) ----- */
  useEffect(() => {
    return () => {
      // nothing to cleanup for data: URLs
    };
  }, []);

  /* ----- Generate content from API ----- */
  const generate = async () => {
    setLoading(true);
    setErrorMsg(null);
    setData(null);
    const languages = [langs.en ? "en" : null, langs.zh ? "zh-Hant" : null].filter(Boolean);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, type, anonymize, languages }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to generate");

      setData(json.output);
      if (json.output?.en) setPreviewLang("en");
      else if (json.output?.["zh-Hant"]) setPreviewLang("zh-Hant");

      setLayers([]);
      setSelectedId(null);
      setGallery([]);
      setMode("visual");
    } catch (e: any) {
      setErrorMsg(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ----- Export PNG (prefer real <canvas>) ----- */
/* ----- Export PNG (exact canvas size) ----- */
const exportPNG = async () => {
  try {
    const host = previewRef.current;
    if (!host) return;

    // Find the <canvas> inside your EditorCanvas
    const canvases = Array.from(host.querySelectorAll("canvas")) as HTMLCanvasElement[];
    const canvas =
      canvases.length === 0
        ? null
        : canvases.reduce((best, cur) => {
            const a = (best?.width || 0) * (best?.height || 0);
            const b = cur.width * cur.height;
            return b > a ? cur : best;
          }, canvases[0] || null);

    if (canvas) {
      await nextFrame(); // wait a frame so latest edits are painted

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
          "image/png",
          0.92
        );
      });

      saveAs(blob, `${type}-${previewLang}.png`);
      return;
    }

    // fallback if no canvas is found (DOM snapshot)
    const blob2 = await htmlToImage.toBlob(host, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
      style: { transform: "none", transformOrigin: "top left" } as any,
      filter: (el: HTMLElement) => !el.classList?.contains("skip-export"),
    });
    if (!blob2) throw new Error("toBlob returned null");
    saveAs(blob2, `${type}-${previewLang}.png`);
  } catch (err) {
    console.error("[exportPNG] failed", err);
    setErrorMsg("Failed to export image.");
  }
};
;

  /* ----- Derived values ----- */
  const current = useMemo(
    () => (data ? (previewLang === "en" ? data.en : data["zh-Hant"]) : null),
    [data, previewLang]
  );

  const activeTemplate: TemplateKind = useMemo(() => TEMPLATE_MAP[type], [type]);
  const canvasSize = TEMPLATE_SIZES[activeTemplate];

  /* ----- Backgrounds (decor only) ----- */
  const TemplateBackground = useMemo(() => {
    if (activeTemplate === "poster") {
      return (
        <div
          className="w-full h-full relative"
          style={{ background: `linear-gradient(135deg, ${themeColor}22, white 55%, ${themeColor}33)` }}
        >
          <div
            className="absolute top-10 left-10 rounded-full px-4 py-1 text-sm font-semibold"
            style={{ backgroundColor: `${themeColor}33`, color: "#111" }}
          >
            Project REACH
          </div>
        </div>
      );
    }
    if (activeTemplate === "thankyou") {
      return (
        <div
          className="w-full h-full relative"
          style={{ background: `linear-gradient(135deg, ${themeColor}22, white 60%, ${themeColor}33)` }}
        >
          <div className="absolute inset-6 rounded-3xl border border-black/10 pointer-events-none" />
        </div>
      );
    }
    if (activeTemplate === "newsletter") {
      return (
        <div className="w-full h-full bg-white relative">
          <div className="w-full h-24" style={{ backgroundColor: themeColor }} />
          <div className="absolute top-6 left-8 text-white/90 text-xs bg-white/15 px-3 py-1 rounded-full">
            Project REACH
          </div>
        </div>
      );
    }
    return <div className="w-full h-full bg-white" />;
  }, [activeTemplate, themeColor]);

  /* ----- Seed text layers from generated content ----- */
  const seedLayersFromCurrent = () => {
    if (!current || !canvasSize) return;
    const any = current as any;
    const { w, h } = canvasSize;
    const pad = 40;

    const titleColor = "#111827";
    const bodyColor = "#374151";
    const accentColor = themeColor;

    const make = (
      text: string,
      x: number,
      y: number,
      width: number,
      height: number,
      size = 28,
      weight: 400 | 600 | 700 | 800 = 700
    ): Layer | null => {
      if (!text) return null;
      const X = Math.max(pad, Math.min(x, w - pad - 120));
      const Y = Math.max(pad, Math.min(y, h - pad - 80));
      const W = Math.max(160, Math.min(width, w - pad - X));
      const H = Math.max(80, Math.min(height, h - pad - Y));
      return {
        id: `txt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "text",
        text,
        x: X,
        y: Y,
        width: W,
        height: H,
        fontSize: size,
        fontWeight: weight,
        align: "left",
        color: bodyColor,
      };
    };

    const out: Layer[] = [];
    const add = (layer: Layer | null, color?: string) => {
      if (layer && layer.type === "text" && color) layer.color = color;
      if (layer) out.push(layer);
    };

    if (activeTemplate === "poster") {
      add(make(any.title || "", pad, pad, w - pad * 2, 100, 48, 800), titleColor);
      add(make(any.executive_summary || any.subtitle || any.body || "", pad, pad + 120, w - pad * 2, 150, 20, 600), bodyColor);
      if (Array.isArray(any.highlights) && any.highlights.length) {
        add(make("Highlights", pad, pad + 290, w - pad * 2, 40, 24, 700), accentColor);
        add(make(`• ${any.highlights.join("\n• ")}`, pad + 20, pad + 334, w - pad * 3, 240, 18, 400), bodyColor);
      }
      if (any.cta) add(make(any.cta, pad, h - pad - 70, Math.min(460, w - pad * 2), 70, 22, 800), accentColor);
    } else if (activeTemplate === "newsletter") {
      add(make(any.title || "", pad, pad, w - pad * 2, 80, 40, 800), titleColor);
      add(make(any.subtitle || "", pad, pad + 90, w - pad * 2, 60, 20, 600), bodyColor);
      let y = pad + 160;
      (any.sections ?? []).forEach((s: any) => {
        add(make(s.heading, pad, y, w - pad * 2, 36, 22, 700), accentColor);
        y += 36;
        add(make(s.body, pad, y, w - pad * 2, 150, 18, 400), bodyColor);
        y += 160;
      });
      if (any.cta) add(make(any.cta, pad, h - pad - 70, w - pad * 2, 70, 20, 700), accentColor);
    } else if (activeTemplate === "thankyou") {
      add(make(any.subject || any.title || "", pad, pad + 20, w - pad * 2, 80, 44, 800), titleColor);
      add(make(any.body || any.executive_summary || "", pad, pad + 110, w - pad * 2, 320, 20, 400), bodyColor);
    }

    setLayers(out);
    setSelectedId(out[0]?.id ?? null);
  };

  /* ----- Auto-seed when content arrives ----- */
  useEffect(() => {
    if (!data) return;
    if (mode !== "visual") return;
    if (layers.length > 0) return;
    seedLayersFromCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode, activeTemplate, previewLang]);

  /* ----- Tray helpers ----- */
  const onUploadToTray = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const items = await Promise.all(
      Array.from(files).map(async (f, i) => ({
        id: `img_${Date.now()}_${i}`,
        // Use DATA URL (not blob:) to stay 100% export-safe
        src: await fileToDataURL(f),
      }))
    );
    setGallery((prev) => [...prev, ...items]);
  };

  const placeFromTray = (id: string) => {
    const item = gallery.find((g) => g.id === id);
    if (!item) return;
    const { w, h } = canvasSize;
    const pad = 40;
    const layer: Layer = {
      id: `layer_${id}`,
      type: "image",
      src: item.src,
      x: Math.floor(w * 0.58),
      y: pad + 40,
      width: Math.floor(w * 0.34),
      height: Math.floor(h * 0.5),
    };
    setLayers((prev) => [...prev, layer]);
    setSelectedId(layer.id);
  };

  /* ----- Inline text editor ----- */
  const onEditText = (layer: Extract<Layer, { type: "text" }>) =>
    setEditingText({ id: layer.id, value: layer.text });
  const applyEditText = () => {
    if (!editingText) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === editingText.id && l.type === "text" ? { ...l, text: editingText.value } : l))
    );
    setEditingText(null);
  };

  /* ----- Delete selected layer ----- */
  const onDeleteSelected = () => {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  };

  /* ----- Text color control ----- */
  const setSelectedTextColor = (color: string) => {
    if (!selectedId) return;
    setLayers((prev) => prev.map((l) => (l.id === selectedId && l.type === "text" ? { ...l, color } : l)));
  };

  /* ----- Static exportable visual (optional) ----- */
  const exportableVisual = (
    <>
      {activeTemplate === "poster" && (
        <Poster
          title={(current as any)?.title || "Project REACH"}
          summary={(current as any)?.executive_summary || (current as any)?.subtitle || (current as any)?.body}
          highlights={(current as any)?.highlights}
          cta={(current as any)?.cta}
          primaryColor={themeColor}
        />
      )}
      {activeTemplate === "thankyou" && (
        <ThankYouCard
          subject={(current as any)?.subject || (current as any)?.title || "Thank you!"}
          body={(current as any)?.body || (current as any)?.executive_summary}
          primaryColor={themeColor}
        />
      )}
      {activeTemplate === "newsletter" && (
        <Newsletter
          title={(current as any)?.title || "Project REACH Newsletter"}
          subtitle={(current as any)?.subtitle}
          sections={
            (current as any)?.sections || [{ heading: "Update", body: (current as any)?.body || (current as any)?.executive_summary }]
          }
          cta={(current as any)?.cta}
          primaryColor={themeColor}
        />
      )}
    </>
  );

  /* ----- Plain text builder ----- */
  const plainText = useMemo(() => {
    if (!current) return "";
    const v: any = current || {};
    if (type === "donor_report") {
      const parts = [
        v.title,
        "",
        v.executive_summary,
        "",
        v.highlights?.length ? `Highlights:\n- ${v.highlights.join("\n- ")}` : "",
        v.impact_story ? `\n\nImpact story:\n${v.impact_story}` : "",
        v.whats_next ? `\n\nWhat’s next:\n${v.whats_next}` : "",
        v.cta ? `\n\nCTA: ${v.cta}` : "",
      ];
      return parts.filter(Boolean).join("\n");
    } else if (type === "newsletter") {
      const sec = v.sections?.map((s: any) => `${s.heading}\n${s.body}`).join("\n\n") || "";
      return [v.title, v.subtitle, "", sec, "", v.cta ? `CTA: ${v.cta}` : ""].filter(Boolean).join("\n");
    } else if (type === "thank_you") {
      return [v.subject, "", v.body].join("\n");
    } else {
      return [v.title, "", v.body].join("\n");
    }
  }, [current, type]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Content Writer → Polished + Visual</h1>

      <div className="grid gap-4">
        {/* Output type */}
        <div className="grid gap-2">
          <Label htmlFor="type">Output type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="border rounded-md p-2"
          >
            <option value="donor_report">Donor Report (Poster)</option>
            <option value="newsletter">Newsletter (Newsletter)</option>
            <option value="thank_you">Thank-you Note (Card)</option>
            <option value="student_story">Student Story (Poster)</option>
          </select>
        </div>

        {/* Input */}
        <div className="grid gap-2">
          <Label htmlFor="input">Bullets / Raw notes</Label>
          <textarea
            id="input"
            rows={6}
            placeholder={`• 3 schools restarted reading circle\n• 24 parents in workshop\n• Student A read 3 lines aloud\n• Need: Traditional Chinese picture books`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border rounded-md p-3 font-mono"
          />
        </div>

        {/* Language + anonymize */}
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={anonymize} onChange={(e) => setAnonymize(e.target.checked)} />
            <span>Anonymize</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Languages:</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={langs.en}
                onChange={(e) => setLangs((s) => ({ ...s, en: e.target.checked }))}
              />
              <span>English</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={langs.zh}
                onChange={(e) => setLangs((s) => ({ ...s, zh: e.target.checked }))}
              />
              <span>中文（繁體）</span>
            </label>
          </div>
        </div>

        {/* Primary actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={generate} disabled={loading || !input.trim()}>
            {loading ? "Generating…" : "Generate"}
          </Button>

          {data && (
            <>
              <div className="ml-2 flex items-center gap-3">
                <span className="opacity-80">View:</span>
                <label className="flex items-center gap-2">
                  <input type="radio" name="mode" checked={mode === "visual"} onChange={() => setMode("visual")} />
                  <span>Template</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="mode" checked={mode === "plain"} onChange={() => setMode("plain")} />
                  <span>Plain text</span>
                </label>
              </div>

              {mode === "visual" && (
                <label className="ml-4 flex items-center gap-2">
                  <span className="opacity-80">Theme color</span>
                  <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
                </label>
              )}

              {mode === "plain" && (
                <div className="ml-auto flex items-center gap-3">
                  <span className="opacity-80">Language:</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="previewLang"
                      checked={previewLang === "en"}
                      onChange={() => setPreviewLang("en")}
                      disabled={!data?.en}
                    />
                    <span>EN</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="previewLang"
                      checked={previewLang === "zh-Hant"}
                      onChange={() => setPreviewLang("zh-Hant")}
                      disabled={!data?.["zh-Hant"]}
                    />
                    <span>繁中</span>
                  </label>
                </div>
              )}

              <Button variant="secondary" onClick={exportPNG}>
                Export PNG
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                Print / PDF
              </Button>
            </>
          )}
        </div>

        {/* Toast */}
        {errorMsg && (
          <div className="fixed bottom-4 right-4 max-w-sm rounded-xl border bg-white shadow-lg p-3 text-sm z-50">
            <div className="font-medium mb-1">Oops</div>
            <div className="opacity-80">{errorMsg}</div>
            <div className="mt-2 text-right">
              <button className="text-blue-600 hover:underline" onClick={() => setErrorMsg(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {data && (
          <div className="grid gap-6">
            {mode === "plain" && (
              <div className="rounded-xl border bg-white p-5">
                <pre className="whitespace-pre-wrap leading-7">{plainText}</pre>
              </div>
            )}

            {mode === "visual" && (
              <div className="space-y-3 relative">
                {/* Edit controls */}
                <div className="rounded-xl border bg-white p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input type="file" accept="image/*" multiple onChange={(e) => onUploadToTray(e.target.files)} />
                      <span>Add images</span>
                    </label>

                    {selectedId && layers.find((l) => l.id === selectedId && l.type === "text") && (
                      <label className="flex items-center gap-2">
                        <span className="opacity-80">Text color</span>
                        <input
                          type="color"
                          value={(layers.find((l) => l.id === selectedId && l.type === "text") as any)?.color ?? "#111827"}
                          onChange={(e) => setSelectedTextColor(e.target.value)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Image tray */}
                  {gallery.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {gallery.map((g) => (
                        <div key={g.id} className="relative border rounded-lg overflow-hidden bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.src} alt="" className="w-full h-28 object-cover" />
                          <div className="flex items-center justify-between p-2">
                            <Button variant="secondary" onClick={() => placeFromTray(g.id)}>
                              Add to canvas
                            </Button>
                            <button
                              title="Remove from tray"
                              className="w-8 h-8 rounded-full border bg-white shadow flex items-center justify-center"
                              onClick={() => setGallery((prev) => prev.filter((x) => x.id !== g.id))}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M3 6h18" strokeWidth="2" />
                                <path d="M8 6V4h8v2" strokeWidth="2" />
                                <path d="M19 6l-1 14H6L5 6" strokeWidth="2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visible interactive canvas */}
                <div ref={previewRef} className="mx-auto">
                  <EditorCanvas
                    width={canvasSize.w}
                    height={canvasSize.h}
                    background={TemplateBackground}
                    layers={layers}
                    setLayers={setLayers}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    editable={true}
                    onDeleteSelected={onDeleteSelected}
                    onEditText={onEditText}
                  />
                </div>

                {/* Hidden clean snapshot (kept but not used by export) */}
                <div
                  ref={exportRef}
                  style={{ position: "absolute", left: -99999, top: -99999, opacity: 0, pointerEvents: "none" }}
                >
                  <ExportStage width={canvasSize.w} height={canvasSize.h} background={TemplateBackground} layers={layers} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline text editor modal */}
      {editingText && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="w-[520px] max-w-[90vw] rounded-xl bg-white border shadow-xl p-4 space-y-3">
            <div className="font-semibold">Edit text</div>
            <textarea
              className="w-full h-40 border rounded p-2"
              value={editingText.value}
              onChange={(e) => setEditingText((s) => (s ? { ...s, value: e.target.value } : s))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingText(null)}>
                Cancel
              </Button>
              <Button onClick={applyEditText}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Hide editor chrome during export (kept for potential DOM fallback) */}
      <style jsx global>{`
        .exporting .selection-outline,
        .exporting .resize-handle,
        .exporting [data-rnd-resize-handle],
        .exporting .editor-guides {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
