"use client";

import { Check, Lightbulb, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";

export type CoachTone = "default" | "success" | "danger" | "hint";

const TONE: Record<CoachTone, { box: string; fill: string; stroke: string; title: string }> = {
  default: { box: "border-border bg-surface-2", fill: "var(--surface-2)", stroke: "var(--border)", title: "text-fg" },
  success: { box: "border-success bg-success-tint", fill: "var(--success-tint)", stroke: "var(--success)", title: "text-success" },
  danger: { box: "border-danger bg-danger-tint", fill: "var(--danger-tint)", stroke: "var(--danger)", title: "text-danger" },
  hint: { box: "border-warning bg-warning-tint", fill: "var(--warning-tint)", stroke: "var(--warning)", title: "text-warning" },
};

/**
 * The explanation bubble next to the mascot (SPEC §4.4).
 * Text appears progressively; `animate={false}` (setting "animated text" off) or
 * prefers-reduced-motion shows it at once. Screen readers get the full text immediately.
 */
export function CoachBubble({
  text,
  title,
  tone = "default",
  animate = true,
  speed = 28,
  mascotSize = 56,
  className = "",
}: {
  text: string;
  /** Bold first line (slide title, or the feedback in a lesson). */
  title?: string;
  /** Feedback tone: the icon next to the title carries the meaning too (colorblind mode). */
  tone?: CoachTone;
  animate?: boolean;
  speed?: number;
  mascotSize?: number;
  className?: string;
}) {
  const look = TONE[tone];
  const Icon = tone === "success" ? Check : tone === "danger" ? X : tone === "hint" ? Lightbulb : null;
  const [shown, setShown] = useState(animate ? 0 : text.length);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show the full text when animation is off
      setShown(text.length);
      return;
    }
    setShown(0);
    // Reveal word by word: smoother for Arabic, whose letters join.
    const words = text.split(/(\s+)/);
    let i = 0;
    let count = 0;
    const id = window.setInterval(() => {
      count += words[i]?.length ?? 0;
      i++;
      setShown(count);
      if (i >= words.length) window.clearInterval(id);
    }, speed * 3);
    return () => window.clearInterval(id);
  }, [text, animate, speed]);

  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <Mascot size={mascotSize} className="shrink-0" />
      <div className={`relative min-w-0 flex-1 rounded-md border px-4 py-3 text-[15px] leading-relaxed shadow-pop ${look.box}`}>
        {/* Tail pointing at the mascot (inline-start side); mirrored in RTL. */}
        <svg
          viewBox="0 0 12 18"
          aria-hidden="true"
          className="absolute -start-[11px] bottom-3 h-[18px] w-3 rtl:-scale-x-100"
        >
          <path d="M12 1 L1 15 L12 11" fill={look.fill} stroke={look.stroke} strokeWidth="1" strokeLinejoin="round" />
          <rect x="11" y="0" width="2" height="18" fill={look.fill} />
        </svg>
        {title && (
          <p className={`flex items-center gap-1.5 font-heading text-base font-extrabold leading-snug ${look.title}`}>
            {Icon && <Icon className="size-[1.1em] shrink-0" strokeWidth={3} aria-hidden="true" />}
            {title}
          </p>
        )}
        <p className="sr-only">{text}</p>
        {/* The full text reserves the space (invisible), the revealed part is drawn on top: no layout jump. */}
        <p aria-hidden="true" className="relative">
          <span className="invisible">{text}</span>
          <span className="absolute inset-0">{text.slice(0, shown)}</span>
        </p>
      </div>
    </div>
  );
}
