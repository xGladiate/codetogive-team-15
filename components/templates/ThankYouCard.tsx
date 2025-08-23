"use client";
export default function ThankYouCard({
  subject, body, primaryColor,
}:{ subject: string; body: string; primaryColor?: string }) {
  const bg = primaryColor
    ? { background: `linear-gradient(135deg, ${primaryColor}22, white 60%, ${primaryColor}33)` }
    : undefined;

  return (
    <div className="w-[1100px] h-[620px] rounded-3xl shadow-xl border overflow-hidden"
         style={bg}>
      <div className="p-14 h-full flex flex-col justify-center text-rose-950">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight">{subject}</h1>
        <p className="text-xl leading-8 whitespace-pre-wrap">{body}</p>
        <div className="mt-10 text-sm opacity-60">With gratitude, Project REACH</div>
      </div>
    </div>
  );
}
