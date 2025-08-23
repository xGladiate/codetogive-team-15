"use client";
export default function Poster({
  title, summary, highlights, cta, primaryColor,
}: {
  title: string; summary?: string; highlights?: string[]; cta?: string; primaryColor?: string;
}) {
  const bg = primaryColor
    ? { background: `linear-gradient(135deg, ${primaryColor}22, white 50%, ${primaryColor}33)` } // light tint
    : undefined;

  return (
    <div className="w-[840px] h-[1188px] rounded-3xl shadow-xl border overflow-hidden text-gray-900"
         style={bg}>
      <div className="p-10 h-full flex flex-col justify-between">
        <header className="space-y-3">
          <div className="inline-block rounded-full bg-amber-200 text-amber-900 px-4 py-1 text-sm font-semibold">Project REACH</div>
          <h1 className="text-6xl font-extrabold tracking-tight">{title}</h1>
          {summary && <p className="text-xl opacity-80">{summary}</p>}
        </header>

        {highlights?.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Highlights</h2>
            <ul className="grid gap-2 list-disc pl-6">
              {highlights.map((h, i) => <li key={i} className="text-lg">{h}</li>)}
            </ul>
          </section>
        ) : <div />}

        {cta && (
          <footer className="mt-6">
            <div className="bg-amber-900 text-amber-50 inline-block px-7 py-3 rounded-2xl text-xl font-semibold shadow">
              {cta}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
