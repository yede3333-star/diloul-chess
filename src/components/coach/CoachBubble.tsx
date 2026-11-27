"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";

/**
 * The explanation bubble next to the mascot (SPEC §4.4).
 * Text appears progressively; `animate={false}` (setting "animated text" off) or
 * prefers-reduced-motion shows it at once. Screen readers get the full text immediately.
 */
export function CoachBubble({ text, animate = true, speed = 28, className = "" }: { text: string; animate?: boolean; speed?: number; className?: string }) {
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
      <Mascot size={56} className="shrink-0" />
      <div className="relative min-w-0 flex-1 rounded-md rounded-es-[4px] border border-border bg-surface-2 px-4 py-3 text-[15px] leading-relaxed shadow-pop">
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
