"use client";

import { BookOpen, Check, Dumbbell, HandFist, Lock, Play, Star, Trophy, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { Link } from "@/i18n/navigation";

export type PathNodeType = "lesson" | "drill" | "spar" | "play" | "test" | "review";
export type PathNodeState = "done" | "current" | "open" | "locked";

export type PathNode = {
  id: string;
  type: PathNodeType;
  state: PathNodeState;
  /** Where the node leads. Locked nodes are never links. */
  href?: string;
};

export type PathSection = {
  id: string;
  /** Small line above the title, e.g. the opening name. */
  eyebrow?: string;
  /** e.g. "Amateur · Section 1" */
  title: string;
  /** e.g. "Learn the 50 key positions" */
  subtitle: string;
  /** Section color 1–6 (cycles through --section-*). */
  color: 1 | 2 | 3 | 4 | 5 | 6;
  nodes: PathNode[];
};

const ICONS: Record<PathNodeType, LucideIcon> = {
  lesson: BookOpen,
  drill: Dumbbell,
  spar: HandFist,
  play: Play,
  test: Trophy,
  review: Star,
};

// Gentle zigzag (in px), like a winding trail. Repeats every 8 nodes.
const WAVE = [0, -40, -62, -40, 0, 40, 62, 40];

/**
 * The winding path of nodes (SPEC §4.4).
 * - One pinned header (opaque, above the nodes) shows the section currently on screen;
 *   its content follows the scroll. Sections are separated by plain, non-sticky dividers.
 * - All nodes of a section share its color; the icon tells the type; a corner badge marks done/locked.
 * - `stickyTop`: where the header pins (below the app's top bar by default).
 * - The header background uses `--path-bg` (defaults to the page background) so nodes scrolling
 *   under it are fully hidden; set it when the map sits on a card.
 */
export function PathMap({
  sections,
  stickyTop = "calc(3.5rem + env(safe-area-inset-top) + 8px)",
  className = "",
}: {
  sections: PathSection[];
  stickyTop?: string;
  className?: string;
}) {
  const t = useTranslations("components.path");
  const headerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // The active section is the last one whose top has passed a line a third of the way down
  // the visible area under the pinned header (so the last section also activates at the page end).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const headBottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
      const line = headBottom + (window.innerHeight - headBottom) * 0.35;
      let next = 0;
      sectionRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) next = i;
      });
      setActive(next);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections.length]);

  const current = sections[Math.min(active, sections.length - 1)];
  let index = 0;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Pinned header: opaque strip + section card, above every node. */}
      <div
        ref={headerRef}
        className="sticky z-20 -mt-2 pt-2 pb-2"
        style={{ top: stickyTop, background: "var(--path-bg, var(--bg))", ["--sec" as string]: `var(--section-${current.color})` }}
      >
        <div className="section-card flex items-center justify-between gap-3 px-4 py-3.5 shadow-pop" aria-live="polite">
          <div className="min-w-0">
            {current.eyebrow && <p className="text-sm font-semibold text-accent-text">{current.eyebrow}</p>}
            <p className="font-heading text-lg leading-snug font-extrabold">{current.title}</p>
            <p className="text-[15px] font-medium">{current.subtitle}</p>
          </div>
        </div>
      </div>

      {sections.map((section, si) => (
        <section
          key={section.id}
          ref={(el) => {
            sectionRefs.current[si] = el;
          }}
          aria-label={`${section.title} · ${section.subtitle}`}
          style={{ ["--sec" as string]: `var(--section-${section.color})` }}
        >
          {si > 0 && (
            <div className="flex items-center gap-3 pt-4 text-sm font-semibold text-fg-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="flex min-w-0 items-center gap-2 text-center">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: "var(--sec)" }} />
                {section.title} · {section.subtitle}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          )}

          <ol className={`relative z-0 flex flex-col items-center gap-[22px] pt-12 ${si === sections.length - 1 ? "pb-24" : "pb-8"}`}>
            {section.nodes.map((node) => {
              const offset = WAVE[index++ % WAVE.length];
              const Icon = ICONS[node.type];
              const name = `${t(`types.${node.type}`)} · ${t(`states.${node.state}`)}`;
              const disc = (
                <>
                  {node.state === "current" && <span className="path-bubble">{t("start")}</span>}
                  <Icon aria-hidden="true" />
                  {node.state === "done" && (
                    <span className="path-node-badge">
                      <Check aria-hidden="true" />
                    </span>
                  )}
                  {node.state === "locked" && (
                    <span className="path-node-badge">
                      <Lock aria-hidden="true" />
                    </span>
                  )}
                </>
              );
              return (
                <li
                  key={node.id}
                  className={`relative ${node.state === "current" ? "mt-10" : ""}`}
                  style={{ transform: `translateX(${offset}px)`, ["--node" as string]: "var(--sec)" }}
                >
                  {node.href && node.state !== "locked" ? (
                    <Link href={node.href} className="path-node" data-state={node.state} aria-label={name}>
                      {disc}
                    </Link>
                  ) : (
                    <span className="path-node" data-state={node.state} role="img" aria-label={name}>
                      {disc}
                    </span>
                  )}
                  {node.state === "current" && (
                    <Mascot
                      size={58}
                      className={`pointer-events-none absolute top-0 ${offset <= 0 ? "left-[calc(100%+48px)]" : "right-[calc(100%+48px)]"}`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
