import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      goal = "find potential donors",
      persona = "CSR leads at mid-to-large companies",
      industry = "Banking or Finance",
      location = "Hong Kong",
      seniority = "Manager, Director, VP, Head",
      mustHave = ["early childhood", "literacy", "education"],
      interests = ["children", "community", "reading"],
      exclude = ["intern", "student", "recruiter"],
    } = body;

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const system = [
      "You turn a plain-English targeting brief into boolean queries and concise keywords for prospecting.",
      "Return structured JSON only. No markdown.",
    ].join("\n");

    const user = `
Goal: ${goal}
Persona: ${persona}
Industry: ${industry}
Location: ${location}
Seniority: ${seniority}
Must-have keywords: ${mustHave.join(", ")}
Interest themes: ${interests.join(", ")}
Exclude keywords: ${exclude.join(", ")}

Return JSON with this shape:
{
  "keywords": {"primary": string[], "alternates": string[]},
  "boolean": {
    "people": string,
    "company": string
  },
  "filters": {"location": string, "seniority": string[]},
  "interests": string[],
  "outreach": {
    "inmail_subject": string,
    "inmail_body": string,
    "email_subject": string,
    "email_body": string
  }
}
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    let data: any = {};
    try { data = JSON.parse(resp.choices[0]?.message?.content ?? "{}"); } catch { data = {}; }

    return Response.json({ ok: true, result: data });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
