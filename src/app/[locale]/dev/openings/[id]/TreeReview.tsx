"use client";

import type { Square } from "chess.js";
import { Repeat2, RotateCcw, Swords } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Board } from "@/components/board/Board";
import { San, SanLine } from "@/components/chess/San";
import { RankBadge } from "@/components/rank/RankBadge";
import { BackArrow } from "@/components/ui/icons";
import { RANK_KEYS, type RankKey } from "@/config/rank-keys";
import { fenKey, type Bi, type OpeningNode, type OpeningTree } from "@/lib/openings/types";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Pawns with sign, e.g. "+0.3" (White's point of view). */
function pawns(cp?: number) {
  if (cp === undefined) return "";
  if (Math.abs(cp) > 90000) return cp > 0 ? "+M" : "−M";
  const v = (cp / 100).toFixed(1);
  return cp > 0 ? `+${v}` : v.replace("-", "−");
}

/** Internal review of a built opening tree (checkpoint 1.1). */
export function TreeReview({ tree, name }: { tree: OpeningTree; name: Bi }) {
  const t = useTranslations("devOpenings");
  const tr = useTranslations("ranks");
  const locale = useLocale() as "ar" | "fr";
  const [path, setPath] = useState<OpeningNode[]>([]);
  const [maxTier, setMaxTier] = useState<RankKey>(tree.source.upTo);
  const tierIndex = RANK_KEYS.indexOf(maxTier);

  // First occurrence of every position, to follow transpositions.
  const firstByFen = useMemo(() => {
    const map = new Map<string, OpeningNode[]>();
    const walk = (nodes: OpeningNode[], prefix: OpeningNode[]) => {
      for (const n of nodes) {
        const p = [...prefix, n];
        if (!n.tags?.includes("transposition") && !map.has(fenKey(n.fen))) map.set(fenKey(n.fen), p);
        walk(n.children, p);
      }
    };
    walk(tree.children, []);
    return map;
  }, [tree]);

  const stats = useMemo(() => {
    const all: OpeningNode[] = [];
    const walk = (nodes: OpeningNode[]) => nodes.forEach((n) => (all.push(n), walk(n.children)));
    walk(tree.children);
    const perTier = RANK_KEYS.map((k) => ({ k, user: all.filter((n) => n.tier === k && n.side === "user").length })).filter((x) => x.user);
    return {
      total: all.length,
      user: all.filter((n) => n.side === "user").length,
      traps: all.filter((n) => n.tags?.includes("trap")).length,
      notes: all.filter((n) => n.note).length,
      maxLoss: Math.max(0, ...all.filter((n) => n.side === "user").map((n) => n.loss ?? 0)),
      perTier,
    };
  }, [tree]);

  const current = path[path.length - 1];
  const fen = current?.fen ?? START_FEN;
  const children = (current ? current.children : tree.children).filter((c) => RANK_KEYS.indexOf(c.tier) <= tierIndex);
  const userChild = children.find((c) => c.side === "user");
  const sq = (uci: string, i: 0 | 1) => uci.slice(i * 2, i * 2 + 2) as Square;
  const last: [Square, Square] | undefined = current ? [sq(current.uci, 0), sq(current.uci, 1)] : undefined;

  const open = (n: OpeningNode) => {
    if (n.tags?.includes("transposition")) {
      const target = firstByFen.get(fenKey(n.fen));
      if (target) return setPath(target);
    }
    setPath([...path, n]);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-accent-text">{t("eyebrow")}</p>
        <h1 className="text-2xl font-extrabold">{name[locale]}</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="chip">{t(tree.color === "white" ? "asWhite" : "asBlack")}</span>
          <span className="chip tabular">{t("positions", { count: stats.user })}</span>
          <span className="chip tabular">{t("traps", { count: stats.traps })}</span>
          <span className="chip tabular">{t("notes", { count: stats.notes })}</span>
          <span className="chip tabular">{t("maxLoss", { value: (stats.maxLoss / 100).toFixed(2) })}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {stats.perTier.map(({ k, user }) => (
            <span key={k} className="chip tabular">
              <RankBadge rank={k} size={18} />
              {tr(k)}: {user}
            </span>
          ))}
        </div>
      </header>

      {tree.idea && (
        <section className="card flex flex-col gap-3 p-4">
          <h2 className="text-lg font-bold">{t("idea")}</h2>
          <p className="leading-relaxed">{tree.idea[locale]}</p>
          {tree.plans && (
            <>
              <h3 className="font-bold">{t("plans")}</h3>
              <ul className="list-disc ps-5 leading-relaxed">
                {tree.plans.map((p, i) => (
                  <li key={i}>{p[locale]}</li>
                ))}
              </ul>
            </>
          )}
          {tree.mistakes && (
            <>
              <h3 className="font-bold">{t("mistakes")}</h3>
              <ul className="list-disc ps-5 leading-relaxed">
                {tree.mistakes.map((p, i) => (
                  <li key={i}>{p[locale]}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <Board
            fen={fen}
            orientation={tree.color}
            interactive={false}
            lastMove={last}
            shapes={userChild ? [{ from: sq(userChild.uci, 0), to: sq(userChild.uci, 1), tone: "best" }] : []}
            sounds={false}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-secondary btn-sm" disabled={!path.length} onClick={() => setPath(path.slice(0, -1))}>
              <BackArrow />
              {t("back")}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={!path.length} onClick={() => setPath([])}>
              <RotateCcw aria-hidden="true" />
              {t("start")}
            </button>
            <label className="ms-auto flex items-center gap-2 text-sm">
              <span className="text-fg-muted">{t("upTo")}</span>
              <select
                value={maxTier}
                onChange={(e) => setMaxTier(e.target.value as RankKey)}
                className="min-h-9 rounded-sm border border-border bg-surface px-2 text-fg"
              >
                {RANK_KEYS.slice(0, RANK_KEYS.indexOf(tree.source.upTo) + 1).map((k) => (
                  <option key={k} value={k}>
                    {tr(k)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {path.length > 0 && (
            <div className="min-w-0 rounded-sm bg-surface-2 px-3 py-2 text-sm">
              <SanLine moves={path.map((n) => n.san)} />
            </div>
          )}
        </div>

        <section className="flex min-w-0 flex-col gap-2" aria-label={t("next")}>
          {current?.note && <p className="rounded-md border border-border bg-info-soft px-3 py-2 text-[15px] leading-relaxed">{current.note[locale]}</p>}
          {children.length === 0 && <p className="text-fg-muted">{t("end")}</p>}
          {children.map((c) => (
            <button
              key={c.uci}
              type="button"
              onClick={() => open(c)}
              className="card flex flex-col items-stretch gap-1.5 p-3 text-start transition-colors hover:border-accent"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className={`font-bold ${c.side === "user" ? "text-accent-text" : ""}`}>
                  <San san={c.san} />
                </span>
                <span className="text-xs text-fg-muted">{t(c.side === "user" ? "yourMove" : "reply")}</span>
                {c.freq !== undefined && <span className="chip tabular text-xs">{Math.round(c.freq * 100)}%</span>}
                <span className="chip tabular text-xs" dir="ltr">
                  {pawns(c.eval)}
                </span>
                {c.side === "user" && c.loss !== undefined && c.loss > 0 && (
                  <span className="chip tabular text-xs">{t("loss", { value: (c.loss / 100).toFixed(2) })}</span>
                )}
                <span className="chip text-xs">
                  <RankBadge rank={c.tier} size={16} />
                  {tr(c.tier)}
                </span>
                {c.tags?.includes("trap") && (
                  <span className="chip text-xs !bg-warning-soft !text-fg">
                    <Swords className="size-3.5" aria-hidden="true" />
                    {t("trap")}
                  </span>
                )}
                {c.tags?.includes("transposition") && (
                  <span className="chip text-xs">
                    <Repeat2 className="size-3.5" aria-hidden="true" />
                    {t("transposition")}
                  </span>
                )}
              </span>
              {c.freq !== undefined && (
                <span className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <span className="block h-full rounded-full bg-info" style={{ width: `${Math.round(c.freq * 100)}%` }} />
                </span>
              )}
              {c.name && <span className="text-sm font-semibold">{c.name[locale]}</span>}
              {c.note && <span className="text-sm leading-relaxed text-fg-muted">{c.note[locale]}</span>}
              {c.games !== undefined && <span className="text-xs text-fg-subtle tabular">{t("games", { count: c.games })}</span>}
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
