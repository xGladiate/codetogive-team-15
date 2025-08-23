import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      input,
      type = "donor_report",            // donor_report | newsletter | thank_you | student_story
      languages = ["en", "zh-Hant"],
      anonymize = true,
      tone = "warm, professional, donor-friendly",
      readingLevel = "Grade 8",
    } = body;

    if (!process.env.OPENAI_API_KEY) return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    if (!input || typeof input !== "string") return Response.json({ error: "'input' (string) is required" }, { status: 400 });

    // Tell the model to return structured JSON we can render nicely
    const shape =
      type === "donor_report"
        ? `{"title": string, "executive_summary": string, "highlights": string[], "impact_story": string, "whats_next": string, "cta": string}`
        : type === "newsletter"
        ? `{"title": string, "subtitle": string, "sections": [{"heading": string, "body": string}] (3-5 items), "cta": string}`
        : type === "thank_you"
        ? `{"subject": string, "body": string}`
        : /* student_story */ `{"title": string, "body": string}`;

    const system = [
      `You help a nonprofit craft donor-facing content.`,
      `Expand bullets into polished ${type} content.`,
      anonymize
        ? `STRICTLY ANONYMIZE: remove names/PII; use placeholders like "Student A", "Teacher B".`
        : `Keep real names as provided.`,
      `Do not invent numbers. If missing, write without fabricating.`,
      `Return a JSON object per requested language code; each value must match this shape: ${shape}.`,
      `Allowed language keys: ${languages.join(", ")}. No markdown in JSON.`
    ].join("\n");

    const user = [
      `Output type: ${type}`,
      `Languages: ${languages.join(", ")}`,
      `Tone: ${tone} | Reading level ~ ${readingLevel}.`,
      `Input bullets/notes:\n${input}`,
      type === "thank_you"
        ? `Keep the body to 2–4 sentences.`
        : type === "student_story"
        ? `120–200 words; emotional but respectful.`
        : `Concise, skimmable paragraphs; short sentences.`
    ].join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let outputJson: any = {};
    try { outputJson = JSON.parse(text); } catch { outputJson = { en: { title: "Draft", body: text } }; }

    return Response.json({ ok: true, output: outputJson });
  } catch (err: any) {
    console.error(err);
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
