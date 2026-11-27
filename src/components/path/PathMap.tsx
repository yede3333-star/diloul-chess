import { BookOpen, Check, Dumbbell, HandFist, Lock, Play, Star, Trophy, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
 * All nodes of a section share its color; the icon tells the type; a corner badge marks done/locked.
 * Each section card is sticky, so the card at the top changes as you scroll, with no JavaScript.
 */
export function PathMap({ sections, className = "" }: { sections: PathSection[]; className?: string }) {
  const t = useTranslations("components.path");
  let index = 0;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`sec-${section.id}`} style={{ ["--sec" as string]: `var(--section-${section.color})` }}>
          <header className="sticky top-[calc(3.5rem+env(safe-area-inset-top)+8px)] z-10">
            <div className="section-card flex items-center justify-between gap-3 px-4 py-3.5 shadow-pop">
              <div className="min-w-0">
                {section.eyebrow && <p className="text-sm font-semibold text-accent-text">{section.eyebrow}</p>}
                <h2 id={`sec-${section.id}`} className="text-lg font-extrabold">
                  {section.title}
                </h2>
                <p className="text-[15px] font-medium">{section.subtitle}</p>
              </div>
            </div>
          </header>

          <ol className="flex flex-col items-center gap-[22px] pt-12 pb-10">
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
