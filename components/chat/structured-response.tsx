"use client";

export type StructuredResponse = {
  intent?: string;
  lang?: "en" | "hi" | "gu";
  title?: string;
  summary?: string;
  sections?: { heading: string; type: "bullets" | "predictions"; items: (string | { name: string; confidence: number })[] }[];
  urgency?: "routine" | "seek_care_soon" | "emergency";
  follow_up?: string;
  disclaimer?: string;
  text?: string;
};

export function StructuredResponse({ response }: { response: StructuredResponse }) {
  if (!response.sections?.length) return <p className="whitespace-pre-line leading-relaxed">{response.text || response.summary}</p>;
  return (
    <div className="space-y-3">
      {response.title && <h3 className="text-base font-semibold">{response.title}</h3>}
      {response.summary && <p className="leading-relaxed">{response.summary}</p>}
      {response.urgency && <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${response.urgency === "emergency" ? "bg-red-500/20 text-red-300" : response.urgency === "seek_care_soon" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>{response.urgency.replaceAll("_", " ")}</span>}
      {response.sections.map((section, index) => (
        <section key={`${section.heading}-${index}`} className="space-y-1.5">
          <h4 className="font-semibold text-[var(--ink)]">{section.heading}</h4>
          <ul className="list-disc space-y-1 pl-5 text-[var(--ink-muted)]">
            {section.items.map((item, itemIndex) => {
              if (typeof item === "string") return <li key={itemIndex}>{item}</li>;
              return <li key={itemIndex} className="list-none -ml-5"><div className="flex items-center gap-2"><span className="min-w-0 flex-1">{item.name}</span><span className="text-[10px] text-[var(--ink-muted)]">{item.confidence.toFixed(1)}%</span><span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.max(0, item.confidence))}%` }} /></span></div></li>;
            })}
          </ul>
        </section>
      ))}
      {response.follow_up && <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-sm">{response.follow_up}</div>}
      {response.disclaimer && <p className="pt-1 text-[10px] text-[var(--ink-muted)]">{response.disclaimer}</p>}
    </div>
  );
}
