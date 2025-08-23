"use client";
type Section = { heading: string; body: string };
export default function Newsletter({
  title, subtitle, sections, cta, primaryColor,
}: { title: string; subtitle?: string; sections: Section[]; cta?: string; primaryColor?: string }) {
  const hdr = primaryColor ? { backgroundColor: primaryColor } : undefined;

  return (
    <div className="w-[960px] rounded-3xl shadow-xl border overflow-hidden bg-white">
      <div className="text-white p-8" style={hdr}>
        <div className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs">Project REACH</div>
        <h1 className="text-4xl font-bold mt-2 tracking-tight">{title}</h1>
        {subtitle && <p className="opacity-90 mt-2">{subtitle}</p>}
      </div>
      <div className="p-8 space-y-6">
        {sections?.map((s, i) => (
          <section key={i} className="space-y-1">
            <h2 className="text-2xl font-semibold">{s.heading}</h2>
            <p className="leading-7">{s.body}</p>
          </section>
        ))}
        {cta && (
          <div className="pt-4 border-t">
            <strong>Call to action: </strong>{cta}
          </div>
        )}
      </div>
    </div>
  );
}
