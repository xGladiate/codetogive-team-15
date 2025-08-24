"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type AIResult = {
  keywords: { primary: string[]; alternates: string[] };
  boolean: { people: string; company: string };
  filters: { location: string; seniority: string[] };
  interests: string[];
  outreach: {
    inmail_subject: string; inmail_body: string;
    email_subject: string; email_body: string;
  };
};

type SearchItem = { title: string; link: string; snippet: string; displayLink?: string };

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
  const [mode, setMode] = useState<"people"|"company">("people");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [queries, setQueries] = useState<string[]>([]);

  const runAI = async () => {
    setLoadingAI(true); setError(null); setAI(null);
    setResults([]); setQueries([]);
    try {
      const r = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal, persona, industry, location, seniority,
          mustHave: mustHave.split(";").map(s=>s.trim()).filter(Boolean),
          interests: interests.split(";").map(s=>s.trim()).filter(Boolean),
          exclude: exclude.split(";").map(s=>s.trim()).filter(Boolean),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to generate");
      setAI(j.result);
      setPeopleBoolean(j.result?.boolean?.people || "");
      setCompanyBoolean(j.result?.boolean?.company || "");
      setInterestList(j.result?.interests || []);
    } catch (e:any) { setError(e.message); }
    finally { setLoadingAI(false); }
  };

  const runSearch = async () => {
    setLoadingSearch(true); setError(null); setResults([]); setQueries([]);
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
    } catch (e:any) { setError(e.message); }
    finally { setLoadingSearch(false); }
  };

  const copy = (t: string) => navigator.clipboard.writeText(t || "");

  return (
    <div className="max-w-6xl min-h-screen mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Prospect Finder (Google CSE, compliant)</h1>
      <p className="text-sm opacity-80">
        Describe who you want. AI turns it into keywords & boolean. Then we use Google Custom Search to find public LinkedIn pages (bios/posts).
      </p>

      {/* STEP 1: Brief */}
      <div className="rounded-xl border p-4 grid md:grid-cols-2 gap-6">
        <div className="grid gap-3">
          <div className="grid gap-1"><Label>Goal</Label><input className="border rounded p-2" value={goal} onChange={e=>setGoal(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Persona</Label><input className="border rounded p-2" value={persona} onChange={e=>setPersona(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Industry</Label><input className="border rounded p-2" value={industry} onChange={e=>setIndustry(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Location</Label><input className="border rounded p-2" value={location} onChange={e=>setLocation(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Seniority</Label><input className="border rounded p-2" value={seniority} onChange={e=>setSeniority(e.target.value)} /></div>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-1"><Label>Must-have keywords (use “;”)</Label><input className="border rounded p-2" value={mustHave} onChange={e=>setMustHave(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Interest themes (use “;”)</Label><input className="border rounded p-2" value={interests} onChange={e=>setInterests(e.target.value)} /></div>
          <div className="grid gap-1"><Label>Exclude keywords (use “;”)</Label><input className="border rounded p-2" value={exclude} onChange={e=>setExclude(e.target.value)} /></div>
          <div><Button onClick={runAI} disabled={loadingAI}>{loadingAI ? "Thinking…" : "Generate targeting"}</Button></div>
        </div>
      </div>

      {/* STEP 2: Edit AI output */}
      {ai && (
        <div className="rounded-xl border p-4 grid md:grid-cols-2 gap-6">
          <div className="grid gap-3">
            <div className="text-sm opacity-80">Keywords (edit if needed)</div>
            <div className="text-sm"><strong>Primary:</strong> {ai.keywords?.primary?.join(", ")}</div>
            <div className="text-sm"><strong>Alternates:</strong> {ai.keywords?.alternates?.join(", ")}</div>
            <div className="text-sm"><strong>Interests:</strong> {interestList.join(", ")}</div>
          </div>
          <div className="grid gap-3">
            <Label>People boolean</Label>
            <textarea className="border rounded p-2 h-24" value={peopleBoolean} onChange={e=>setPeopleBoolean(e.target.value)} />
            <Button variant="secondary" onClick={()=>copy(peopleBoolean)}>Copy</Button>
            <Label>Company boolean</Label>
            <textarea className="border rounded p-2 h-24" value={companyBoolean} onChange={e=>setCompanyBoolean(e.target.value)} />
            <Button variant="secondary" onClick={()=>copy(companyBoolean)}>Copy</Button>
          </div>
        </div>
      )}

      {/* STEP 3: Google results */}
      {ai && (
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === "people"} onChange={()=>setMode("people")} />
              <span>People</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === "company"} onChange={()=>setMode("company")} />
              <span>Companies</span>
            </label>
            <Button className="ml-auto" onClick={runSearch} disabled={loadingSearch}>
              {loadingSearch ? "Searching…" : "Search public web (Google)"}
            </Button>
          </div>

          {queries.length > 0 && (
            <div className="text-xs opacity-60">
              Queries used: {queries.map((q,i) => <code key={i} className="mr-2">{q}</code>)}
            </div>
          )}

          <div className="grid gap-3">
            {results.length === 0 ? (
              <div className="text-sm opacity-70">No results yet. Try refining your boolean or interests.</div>
            ) : results.map((r, i) => (
              <a key={i} href={r.link} target="_blank" rel="noreferrer" className="rounded-lg border p-3 hover:bg-gray-50">
                <div className="text-sm text-gray-500">{r.displayLink || r.link}</div>
                <div className="font-medium">{r.title}</div>
                <div className="text-sm opacity-80">{r.snippet}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {ai && (
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="font-medium">Outreach drafts</h2>
          <div className="text-sm opacity-80">Personalize placeholders before sending.</div>
          <div>
            <div className="font-medium mt-2">InMail Subject</div>
            <pre className="bg-white border rounded p-3 whitespace-pre-wrap text-sm">{ai.outreach?.inmail_subject}</pre>
          </div>
          <div>
            <div className="font-medium mt-2">InMail Body</div>
            <pre className="bg-white border rounded p-3 whitespace-pre-wrap text-sm">{ai.outreach?.inmail_body}</pre>
          </div>
          <div>
            <div className="font-medium mt-2">Email Subject</div>
            <pre className="bg-white border rounded p-3 whitespace-pre-wrap text-sm">{ai.outreach?.email_subject}</pre>
          </div>
          <div>
            <div className="font-medium mt-2">Email Body</div>
            <pre className="bg-white border rounded p-3 whitespace-pre-wrap text-sm">{ai.outreach?.email_body}</pre>
          </div>
        </div>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="text-xs opacity-60">
        Compliance: We never scrape or auto-message. We generate queries and use Google’s API to show public pages/snippets for you to review.
      </div>
    </div>
  );
}
