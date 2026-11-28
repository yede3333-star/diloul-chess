import { Mascot } from "@/components/brand/Mascot";

/** Page heading with a short intro and a coach note next to the mascot. Placeholder content until each phase lands. */
export function PageIntro({ title, intro, coach, soon }: { title: string; intro: string; coach: string; soon: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="max-w-[60ch] text-fg-muted">{intro}</p>
      </div>
      <div className="card flex items-end gap-3 p-4">
        <Mascot size={56} className="shrink-0" />
        <div className="flex min-w-0 flex-col items-start gap-2">
          <span className="chip">{soon}</span>
          <p className="text-[15px] leading-relaxed">{coach}</p>
        </div>
      </div>
    </div>
  );
}
