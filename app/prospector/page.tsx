"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type AIResult = {
  keywords: { primary: string[]; alternates: string[] };
  boolean: { people: string; company: string };
  filters: { location: string; seniority: string[] };
  interests: string[];
  outreach: {
    inmail_subject: string;
    inmail_body: string;
    email_subject: string;
    email_body: string;
  };
};

type SearchItem = {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  sourceQuery?: string;
};

type EnrichedResult = SearchItem & {
  personName?: string;
  firstName?: string;
  company?: string;
  titleRole?: string;
  locationGuess?: string;
  interestHit?: string;
  score: number; // match score
  proximity: number; // 0..3
  badges: string[];
};

export default function ProspectorPage() {
  // Step 1: user brief
  const [goal, setGoal] = useState("find potential donors for early literacy");
  const [persona, setPersona] = useState("CSR / Philanthropy leaders");
  const [industry, setIndustry] = useState("Banking or Finance");
  const [location, setLocation] = useState("Hong Kong");
  const [seniority, setSeniority] = useState("Manager, Director, VP, Head");
  const [mustHave, setMustHave] = useState("early childhood; literacy; education");
  const [interests, setInterests] = useState("children; community; reading");
  const [exclude, setExclude] = useState("intern; student; recruiter");

  // AI output
  const [loadingAI, setLoadingAI] = useState(false);
  const [ai, setAI] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields from AI
  const [peopleBoolean, setPeopleBoolean] = useState("");
  const [companyBoolean, setCompanyBoolean] = useState("");
  const [interestList, setInterestList] = useState<string[]>([]);

  // Google results
  const [mode, setMode] = useState<"people" | "company">("people");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [queries, setQueries] = useState<string[]>([]);

  // New: sorting & active panel
  const [sortMode, setSortMode] = useState<"best" | "nearest">("best");
  const [active, setActive] = useState<EnrichedResult | null>(null);

  const runAI = async () => {
    setLoadingAI(true);
    setError(null);
    setAI(null);
    setResults([]);
    setQueries([]);
    try {
      const r = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          persona,
          industry,
          location,
          seniority,
          mustHave: mustHave.split(";").map((s) => s.trim()).filter(Boolean),
          interests: interests.split(";").map((s) => s.trim()).filter(Boolean),
          exclude: exclude.split(";").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to generate");
      setAI(j.result);
      setPeopleBoolean(j.result?.boolean?.people || "");
      setCompanyBoolean(j.result?.boolean?.company || "");
      setInterestList(j.result?.interests || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const runSearch = async () => {
    setLoadingSearch(true);
    setError(null);
    setResults([]);
    setQueries([]);
    try {
      const boolean = mode === "people" ? peopleBoolean : companyBoolean;
      const r = await fetch("/api/prospect/search-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          location,
          boolean,
          interests: interestList,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Search failed");
      setResults(j.results || []);
      setQueries(j.queries || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const copy = (t: string) => navigator.clipboard.writeText(t || "");

  // ---------- Helpers: parsing & scoring ----------
  const normalize = (s?: string) => (s || "").toLowerCase();

  const synonymsForLocation = (loc: string) => {
    const L = normalize(loc);
    // Add more synonyms as you need for other regions.
    if (L.includes("hong kong"))
      return [
        "hong kong",
        "hk",
        "hongkong",
        "hong kong sar",
        "kowloon",
        "new territories",
        "hk sar",
      ];
    return [L];
  };

  const extractProfileInfo = (r: SearchItem, isPeople: boolean) => {
    const t = r.title || "";
    const s = r.snippet || "";

    let personName = undefined as string | undefined;
    let company = undefined as string | undefined;
    let titleRole = undefined as string | undefined;

    if (isPeople) {
      // Examples:
      // "John Chan - Head of CSR at XYZ Bank | LinkedIn"
      // "Jane Lee | CSR Director at HSBC | LinkedIn"
      const head = t.replace(/ \| LinkedIn.*/i, "");
      const parts = head.split(/[-|]/).map((x) => x.trim());
      if (parts.length >= 1) {
        personName = parts[0];
      }
      const after = parts.slice(1).join(" - ") || "";
      const mAt = after.match(/\b(?:at|@)\s+([^|–—]+)$/i);
      if (mAt) company = mAt[1].trim();
      // Role: take chunk with 'CSR' or first chunk after name
      const roleChunk =
        parts.find((p) => /\bcsr|community|sustainability|philanthropy|esg\b/i.test(p)) ||
        parts[1] ||
        "";
      titleRole = roleChunk.trim();
    } else {
      // Company page: "XYZ Bank | LinkedIn"
      const head = t.replace(/ \| LinkedIn.*/i, "");
      company = head.trim();
    }

    return { personName, company, titleRole };
  };

  const findLocationHit = (r: SearchItem, locSyns: string[]) => {
    const hay = normalize(`${r.title} ${r.snippet}`);
    for (const syn of locSyns) {
      if (hay.includes(syn)) return syn;
    }
    return undefined;
  };

  const findInterestHit = (r: SearchItem, interests: string[]) => {
    const hay = normalize(`${r.title} ${r.snippet}`);
    for (const i of interests) {
      const x = normalize(i);
      if (x && hay.includes(x)) return i;
    }
    return undefined;
  };

  const proximityScore = (hit?: string, locSyns?: string[]) => {
    if (!hit) return 0;
    if (!locSyns || !locSyns.length) return 1;
    // exact base location string?
    if (hit === normalize(locSyns[0])) return 3;
    // any synonym
    return 2;
  };

  const matchScore = (r: SearchItem, required: string[], mode: "people"|"company") => {
  const hay = normalize(`${r.title} ${r.snippet}`);
  let score = 0;

  // must-haves
  for (const k of required) {
    const x = normalize(k);
    if (x && hay.includes(x)) score += 2;
  }

  // mode-specific boosts
  const COMPANY_BOOST = [
    /corporate social responsibility|csr/i,
    /\besg\b|sustainability|sustainable/i,
    /foundation|philanthropy|donation|grant|giving/i,
    /community (investment|engagement|impact|program)/i,
    /employee (volunteer|volunteering)/i,
  ];
  const PEOPLE_BOOST = [
    /head|director|manager|vp|lead/i,
    /csr|philanthropy|sustainability|esg/i,
  ];

  for (const rx of (mode === "company" ? COMPANY_BOOST : PEOPLE_BOOST)) {
    if (rx.test(hay)) score += 1;
  }

  if (mode === "people" && /linkedin\.com\/in\//i.test(r.link)) score += 1;
  if (mode === "company" && /linkedin\.com\/company\//i.test(r.link)) score += 1;

  return score;
};

  const enriched = useMemo<EnrichedResult[]>(() => {
    const locSyns = synonymsForLocation(location);
    const must = mustHave.split(";").map((s) => s.trim()).filter(Boolean);
    const interestsArr = interestList?.length
      ? interestList
      : interests.split(";").map((s) => s.trim()).filter(Boolean);

    return results.map((r) => {
      const meta = extractProfileInfo(r, mode === "people");
      const locHit = findLocationHit(r, locSyns);
      const intHit = findInterestHit(r, interestsArr);
      const prox = proximityScore(locHit, locSyns);
      const score = matchScore(r, must) + (intHit ? 1 : 0) + prox; // composite
      const firstName = meta.personName?.split(/\s+/)[0];

      const badges: string[] = [];
      if (prox >= 2) badges.push("Nearest");
      if (score >= 4) badges.push("Top match");
      if (intHit) badges.push(intHit);

      return {
        ...r,
        personName: meta.personName,
        firstName,
        company: meta.company,
        titleRole: meta.titleRole,
        locationGuess: locHit,
        interestHit: intHit,
        score,
        proximity: prox,
        badges,
      };
    });
  }, [results, mode, location, interestList, interests, mustHave]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    if (sortMode === "nearest") {
      arr.sort((a, b) => b.proximity - a.proximity || b.score - a.score);
    } else {
      arr.sort((a, b) => b.score - a.score);
    }
    return arr;
  }, [enriched, sortMode]);

  // ---------- Outreach personalization ----------
  const fillTemplate = (tpl: string, r: EnrichedResult) => {
  const first = r.firstName || "there";
  const comp = r.company || "your company";
  const loc = r.locationGuess || location;
  const role = r.titleRole || "";
  const interest = r.interestHit || (interestList[0] || "");

  let out = (tpl || "")
    .replace(/\{\{?\s*first_name\s*\}?\}/gi, first)
    .replace(/\{\{?\s*company\s*\}?\}/gi, comp)
    .replace(/\{\{?\s*location\s*\}?\}/gi, loc)
    .replace(/\{\{?\s*role\s*\}?\}/gi, role)
    .replace(/\{\{?\s*interest\s*\}?\}/gi, interest);

  // If the draft says "as a CSR ..." but we didn't detect a CSR-like role, remove that clause.
  const roleLooksCSR = /\b(csr|corporate social responsibility|sustainability|esg|community|philanthropy)\b/i.test(role);
  if (!roleLooksCSR) {
    out = out.replace(/\bas a\s+csr[^.,;]*([.,;]|$)/gi, "$1");
    out = out.replace(/\bas (?:the )?csr (?:lead|head|manager)[^.,;]*([.,;]|$)/gi, "$1");
  }

  // Expand acronym on first use
  if (/\bCSR\b/.test(out)) {
    out = out.replace(/\bCSR\b/, "Corporate Social Responsibility (CSR)");
  }

  // Friendly opener if missing
  if (!/^(hi|hello|dear)\b/i.test(out.trim())) out = `Hi ${first},\n\n${out}`;
  return out.trim();
};

  const activeDrafts = useMemo(() => {
    if (!ai || !active) return null;
    return {
      inmail_subject: fillTemplate(ai.outreach?.inmail_subject || "", active),
      inmail_body: fillTemplate(ai.outreach?.inmail_body || "", active),
      email_subject: fillTemplate(ai.outreach?.email_subject || "", active),
      email_body: fillTemplate(ai.outreach?.email_body || "", active),
    };
  }, [ai, active]);

  const mailtoHref = (sub: string, body: string) => {
    const u = new URL("mailto:");
    u.searchParams.set("subject", sub || "");
    u.searchParams.set("body", body || "");
    return u.toString();
  };

  // ---------- UI ----------
  return (
    <div className="max-w-6xl min-h-screen mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI-Powered Outreach Tool</h1>
      <p className="text-sm opacity-80">
        Describe who you want. AI turns it into keywords &amp; boolean.
      </p>

      {/* STEP 1: Brief */}
      <div className="rounded-xl border p-4 grid md:grid-cols-2 gap-6">
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Goal</Label>
            <input className="border rounded p-2" value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Persona</Label>
            <input className="border rounded p-2" value={persona} onChange={(e) => setPersona(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Industry</Label>
            <input className="border rounded p-2" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Location (for proximity)</Label>
            <input className="border rounded p-2" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Seniority</Label>
            <input className="border rounded p-2" value={seniority} onChange={(e) => setSeniority(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Must-have keywords (use “;”)</Label>
            <input className="border rounded p-2" value={mustHave} onChange={(e) => setMustHave(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Interest themes (use “;”)</Label>
            <input className="border rounded p-2" value={interests} onChange={(e) => setInterests(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Exclude keywords (use “;”)</Label>
            <input className="border rounded p-2" value={exclude} onChange={(e) => setExclude(e.target.value)} />
          </div>
          <div>
            <Button onClick={runAI} disabled={loadingAI}>
              {loadingAI ? "Thinking…" : "Generate targeting"}
            </Button>
          </div>
        </div>
      </div>

      {/* STEP 2: Edit AI output */}
      {ai && (
        <div className="rounded-xl border p-4 grid md:grid-cols-2 gap-6">
          <div className="grid gap-3">
            <div className="text-sm opacity-80">Keywords (edit if needed)</div>
            <div className="text-sm">
              <strong>Primary:</strong> {ai.keywords?.primary?.join(", ")}
            </div>
            <div className="text-sm">
              <strong>Alternates:</strong> {ai.keywords?.alternates?.join(", ")}
            </div>
            <div className="text-sm">
              <strong>Interests:</strong>{" "}
              {(interestList.length ? interestList : interests.split(";").map((s) => s.trim())).join(", ")}
            </div>
          </div>
          <div className="grid gap-3">
            <Label>People boolean</Label>
            <textarea
              className="border rounded p-2 h-24"
              value={peopleBoolean}
              onChange={(e) => setPeopleBoolean(e.target.value)}
            />
            <Button variant="secondary" onClick={() => copy(peopleBoolean)}>
              Copy
            </Button>
            <Label>Company boolean</Label>
            <textarea
              className="border rounded p-2 h-24"
              value={companyBoolean}
              onChange={(e) => setCompanyBoolean(e.target.value)}
            />
            <Button variant="secondary" onClick={() => copy(companyBoolean)}>
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Google results */}
      {ai && (
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === "people"} onChange={() => setMode("people")} />
              <span>People</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === "company"} onChange={() => setMode("company")} />
              <span>Companies</span>
            </label>

            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm opacity-70">Sort</span>
              <select
                className="border rounded p-2 text-sm"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
              >
                <option value="best">Best match</option>
                <option value="nearest">Nearest</option>
              </select>
            </div>

            <Button className="ml-auto" onClick={runSearch} disabled={loadingSearch}>
              {loadingSearch ? "Searching…" : "Search public web (Google)"}
            </Button>
          </div>

          {queries.length > 0 && (
            <div className="text-xs opacity-60">
              Queries used:{" "}
              {queries.map((q, i) => (
                <code key={i} className="mr-2">
                  {q}
                </code>
              ))}
            </div>
          )}

          <div className="grid gap-3">
            {sorted.length === 0 ? (
              <div className="text-sm opacity-70">No results yet. Try refining your boolean or interests.</div>
            ) : (
              sorted.map((r, i) => (
                <div key={i} className="rounded-lg border p-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">
                        {r.displayLink || r.link}
                        {r.sourceQuery ? (
                          <span className="ml-2 opacity-60">• from query</span>
                        ) : null}
                      </div>
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:underline"
                      >
                        {r.title}
                      </a>
                      <div className="text-sm opacity-80 mt-1">{r.snippet}</div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {r.badges.map((b, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 border rounded px-2 py-0.5"
                          >
                            {b}
                          </span>
                        ))}
                        {r.locationGuess && (
                          <span className="text-xs bg-gray-100 border rounded px-2 py-0.5">
                            {r.locationGuess}
                          </span>
                        )}
                        {typeof r.score === "number" && (
                          <span className="text-xs text-gray-500">score {r.score}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setActive(r)}
                        title="Personalize & copy outreach"
                      >
                        Reach out
                      </Button>
                      <a href={r.link} target="_blank" rel="noreferrer">
                        <Button variant="outline">Open profile</Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Global outreach drafts (unchanged) */}
    

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="text-xs opacity-60">
        Compliance: We never scrape or auto-message. We generate queries and use Google’s API to
        show public pages/snippets for you to review.
      </div>

      {/* Reach-out Drawer */}
      {active && activeDrafts && (
        <div
          className="fixed inset-0 z-40"
          aria-modal="true"
          role="dialog"
          onClick={() => setActive(null)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500">{active.displayLink || active.link}</div>
                <div className="text-lg font-semibold">{active.personName || active.company || active.title}</div>
                <div className="text-sm opacity-80">
                  {active.titleRole ? `${active.titleRole} • ` : ""}
                  {active.company ? active.company : ""}
                  {active.locationGuess ? ` • ${active.locationGuess}` : ""}
                </div>
              </div>
              <Button variant="outline" onClick={() => setActive(null)}>
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-5">
              {/* InMail */}
              <div className="border rounded-lg">
                <div className="px-3 py-2 border-b font-medium">LinkedIn InMail</div>
                <div className="p-3 space-y-2">
                  <div className="text-xs opacity-70">Subject</div>
                  <div className="flex items-center gap-2">
                    <input
                      className="border rounded p-2 w-full"
                      value={activeDrafts.inmail_subject}
                      onChange={(e) =>
                        (activeDrafts.inmail_subject = e.target.value)
                      }
                      readOnly
                    />
                    <Button
                      variant="secondary"
                      onClick={() => copy(activeDrafts.inmail_subject)}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="text-xs opacity-70 mt-2">Body</div>
                  <pre className="bg-white border rounded p-3 whitespace-pre-wrap text-sm">
                    {activeDrafts.inmail_body}
                  </pre>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => copy(activeDrafts.inmail_body)}>
                      Copy body
                    </Button>
                    <a href={active.link} target="_blank" rel="noreferrer">
                      <Button variant="outline">Open LinkedIn</Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="border rounded-lg">
                <div className="px-3 py-2 border-b font-medium">Email</div>
                <div className="p-3 space-y-2">
                  <div className="text-xs opacity-70">Subject</div>
                  <div className="flex items-center gap-2">
                    <input
                      className="border rounded p-2 w-full"
                      value={activeDrafts.email_subject}
                      onChange={(e) =>
                        (activeDrafts.email_subject = e.target.value)
                      }
                      readOnly
                    />
                    <Button
                      variant="secondary"
                      onClick={() => copy(activeDrafts.email_subject)}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="text-xs opacity-70 mt-2">Body</div>
                  <pre className="bg-white border rounded p-3 whitespace-pre-wrap text-sm">
                    {activeDrafts.email_body}
                  </pre>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => copy(activeDrafts.email_body)}>
                      Copy body
                    </Button>
                    <a
                      href={mailtoHref(activeDrafts.email_subject, activeDrafts.email_body)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="outline">Open mail app</Button>
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-xs opacity-60">
                Tip: Tweak names/companies if parsing is imperfect. We never auto-send.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
