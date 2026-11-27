import type { Metadata } from "next";
import { Share2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MiniBoard } from "@/components/board/MiniBoard";
import { PathMap, type PathSection } from "@/components/path/PathMap";
import { RankBadge } from "@/components/rank/RankBadge";
import { RankTrack } from "@/components/rank/RankTrack";
import { DisplaySettings } from "@/components/settings/DisplaySettings";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { NextArrow } from "@/components/ui/icons";
import { RANK_KEYS } from "@/config/rank-keys";
import { CoachDemo, DemoCard, FreePlayDemo, PromotionDemo, SquaresDemo, TaskDemo } from "./Demos";

export const metadata: Metadata = { title: "Components", robots: { index: false, follow: false } };

// Verified with chess.js.
const LONDON_FEN = "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2";
const CARO_FEN = "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3";
const MATE_FEN = "4R1k1/5ppp/8/8/8/8/1qr2PPP/6K1 b - - 1 1";

export default async function ComponentsPage() {
  const t = await getTranslations("devComponents");
  const tr = await getTranslations("ranks");

  const sections: PathSection[] = [
    {
      id: "l1",
      color: 1,
      eyebrow: t("sections.london1.eyebrow"),
      title: t("sections.london1.title"),
      subtitle: t("sections.london1.subtitle"),
      nodes: [
        { id: "a", type: "lesson", state: "done" },
        { id: "b", type: "drill", state: "done" },
        { id: "c", type: "lesson", state: "done" },
        { id: "d", type: "spar", state: "current" },
        { id: "e", type: "drill", state: "locked" },
        { id: "f", type: "test", state: "locked" },
      ],
    },
    {
      id: "l2",
      color: 2,
      eyebrow: t("sections.london2.eyebrow"),
      title: t("sections.london2.title"),
      subtitle: t("sections.london2.subtitle"),
      nodes: [
        { id: "g", type: "lesson", state: "locked" },
        { id: "h", type: "drill", state: "locked" },
        { id: "i", type: "review", state: "locked" },
        { id: "j", type: "spar", state: "locked" },
        { id: "k", type: "test", state: "locked" },
      ],
    },
    {
      id: "l3",
      color: 3,
      eyebrow: t("sections.london3.eyebrow"),
      title: t("sections.london3.title"),
      subtitle: t("sections.london3.subtitle"),
      nodes: [
        { id: "l", type: "lesson", state: "locked" },
        { id: "m", type: "play", state: "locked" },
        { id: "n", type: "test", state: "locked" },
      ],
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-[max(16px,env(safe-area-inset-left))] py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-fg-muted">{t("intro")}</p>
      </header>

      <DisplaySettings />

      <div className="grid items-start gap-6 md:grid-cols-2">
        <FreePlayDemo />
        <TaskDemo />
        <PromotionDemo />
        <SquaresDemo />
      </div>

      <DemoCard title={t("mini.title")}>
        <div className="grid grid-cols-3 gap-3">
          <MiniBoard fen={LONDON_FEN} lastMove={["c1", "f4"]} label={t("miniLabels.london")} />
          <MiniBoard fen={CARO_FEN} orientation="black" label={t("miniLabels.caro")} />
          <MiniBoard fen={MATE_FEN} lastMove={["e1", "e8"]} label={t("miniLabels.mate")} />
        </div>
      </DemoCard>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <DemoCard title={t("rank.title")}>
          <RankTrack rank={2} progress={0.6} goalsDone={3} goalsTotal={5} />
          <p className="text-sm font-semibold text-fg-muted">{t("rank.badges")}</p>
          <div className="grid grid-cols-4 gap-x-1 gap-y-3 sm:grid-cols-7">
            {RANK_KEYS.map((r) => (
              <div key={r} className="flex min-w-0 flex-col items-center gap-1 text-center text-xs font-semibold break-words">
                <RankBadge rank={r} size={38} />
                {tr(r)}
              </div>
            ))}
          </div>
        </DemoCard>

        <div className="flex flex-col gap-6">
          <DemoCard title={t("feedback.title")}>
            <div className="overflow-hidden rounded-md">
              <FeedbackBanner kind="success" title={t("task.good")} message={t("task.goodMessage")}>
                <span className="btn btn-primary">
                  {t("task.next")}
                  <NextArrow />
                </span>
                <span className="btn btn-secondary">
                  <Share2 aria-hidden="true" />
                </span>
              </FeedbackBanner>
            </div>
            <div className="overflow-hidden rounded-md">
              <FeedbackBanner kind="error" title={t("task.wrong")} message={t("task.wrongMessage")}>
                <span className="btn btn-secondary">{t("task.retry")}</span>
              </FeedbackBanner>
            </div>
          </DemoCard>
          <CoachDemo />
        </div>
      </div>

      <DemoCard title={t("path.title")} hint={t("path.hint")}>
        <div className="mx-auto w-full max-w-[420px]" style={{ ["--path-bg" as string]: "var(--surface)" }}>
          <PathMap sections={sections} stickyTop="calc(env(safe-area-inset-top) + 8px)" />
        </div>
      </DemoCard>
    </main>
  );
}
