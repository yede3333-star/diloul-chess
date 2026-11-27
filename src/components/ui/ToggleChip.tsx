"use client";

import { Check } from "lucide-react";

/** An on/off option shown as a pill: accent fill and a ✓ when on, outlined and empty when off. */
export function ToggleChip({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border-2 ps-2 pe-3.5 text-sm font-semibold transition-colors duration-[var(--dur-fast)] ${
        on ? "border-accent bg-accent text-on-accent" : "border-border bg-surface-2 text-fg-muted hover:text-fg"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid size-5 shrink-0 place-items-center rounded-full ${on ? "bg-on-accent text-accent" : "border-2 border-fg-muted"}`}
      >
        {on && <Check className="size-3.5" strokeWidth={3.5} />}
      </span>
      {label}
    </button>
  );
}
