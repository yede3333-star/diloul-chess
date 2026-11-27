import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  BookOpen,
  Check,
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
  Crown,
  Dumbbell,
  Flame,
  GraduationCap,
  HandFist,
  Lightbulb,
  Lock,
  Minus,
  Play,
  Plus,
  Puzzle,
  Share2,
  Swords,
  Trophy,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { StaticBoard } from "@/components/board/StaticBoard";
import {
  DIRECTIONS,
  LONDON_FEN,
  MOVE_CLASSES,
  PUZZLE_SOLVED_FEN,
  RANK_NAMES,
  type Bi,
  type Direction,
  type ModeTokens,
} from "./directions";
import "./design.css";

export const metadata: Metadata = {
  title: "ديلول · اتجاهات التصميم",
  robots: { index: false, follow: false },
};

/** Verified with chess.js: 1.e4 c6 2.d4 d5 (Caro-Kann). */
const CARO_FEN = "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3";

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Manrope:wght@400..800&family=Noto+Kufi+Arabic:wght@400..800&family=Noto+Sans+Arabic:wght@400..700&family=Noto+Sans:wght@400..700&family=Tajawal:wght@400;500;700;800&display=swap";

/* ---------- helpers ---------- */

/** Bilingual text: both languages are rendered, CSS shows the selected one. */
function T({ ar, fr }: Bi) {
  return (
    <>
      <span lang="ar" data-l="ar">
        {ar}
      </span>
      <span lang="fr" data-l="fr">
        {fr}
      </span>
    </>
  );
}

/** Chess notation and numbers stay left-to-right inside Arabic text. */
function Ltr({ children }: { children: ReactNode }) {
  return <bdi className="ltr">{children}</bdi>;
}

function modeVars(t: ModeTokens) {
  return [
    `--bg:${t.bg}`,
    `--surface:${t.surface}`,
    `--surface2:${t.surface2}`,
    `--border:${t.border}`,
    `--text:${t.text}`,
    `--muted:${t.muted}`,
    `--accent:${t.accent}`,
    `--accent2:${t.accent2}`,
    `--on-accent:${t.onAccent}`,
    `--accent-soft:${t.accentSoft}`,
    `--accent-text:${t.accentText}`,
    `--success:${t.success}`,
    `--danger:${t.danger}`,
    `--warning:${t.warning}`,
    `--info:${t.info}`,
    `--nav-bg:${t.navBg}`,
    ...t.sections.map((c, i) => `--sec${i + 1}:${c}`),
  ].join(";");
}

function tokenCss() {
  return DIRECTIONS.map((d) => {
    const fixed = [
      `--radius-card:${d.radiusCard}`,
      `--ar-h:${d.fonts.arHeading},system-ui,sans-serif`,
      `--ar-b:${d.fonts.arBody},system-ui,sans-serif`,
      `--fr-h:${d.fonts.frHeading},system-ui,sans-serif`,
      `--fr-b:${d.fonts.frBody},system-ui,sans-serif`,
      ...d.ranks.map((c, i) => `--rank${i}:${c}`),
      ...Object.entries(d.moves).map(([k, c]) => `--mv-${k}:${c}`),
      `--arrow-best:${d.moves.best}`,
      ...d.boards.flatMap((b, i) => [`--b${i + 1}-light:${b.light}`, `--b${i + 1}-dark:${b.dark}`, `--b${i + 1}-last:${b.last}`]),
    ].join(";");
    return `.dir-${d.id}{${fixed};${modeVars(d.dark)};color-scheme:dark}
.lab:has(#m-light:checked) .dir-${d.id}{${modeVars(d.light)};color-scheme:light}`;
  }).join("\n");
}

const RANK_ICONS: LucideIcon[] = [ChessPawn, ChessKnight, ChessBishop, ChessRook, ChessQueen, ChessKing, Crown];

function RankBadge({ rank, size = 44 }: { rank: number; size?: number }) {
  const Icon = RANK_ICONS[rank];
  return (
    <span className="rank-badge" style={{ width: size, height: size, ["--rank" as string]: `var(--rank${rank})` }}>
      <svg viewBox="0 0 40 44" aria-hidden="true">
        <path
          className="rb-shield"
          d="M20 2 L36 7.5 V20 C36 31 29.5 38.5 20 42 C10.5 38.5 4 31 4 20 V7.5 Z"
        />
        <path className="rb-shine" d="M20 6 L32 10.2 V20 C32 28.6 27.2 34.6 20 37.6 Z" />
      </svg>
      <Icon className="rb-icon" aria-hidden="true" />
    </span>
  );
}

function Mascot({ className = "" }: { className?: string }) {
  // Original mascot sketch: a round, friendly pawn. Final version comes with the logo in step 2.
  return (
    <svg className={`mascot ${className}`} viewBox="0 0 64 72" aria-hidden="true">
      <ellipse cx="32" cy="66" rx="22" ry="4" className="m-shadow" />
      <path className="m-body" d="M16 60 C16 50 22 44 26 40 H38 C42 44 48 50 48 60 Z" />
      <rect className="m-base" x="11" y="56" width="42" height="9" rx="4.5" />
      <rect className="m-collar" x="21" y="36" width="22" height="7" rx="3.5" />
      <circle className="m-head" cx="32" cy="22" r="15" />
      <circle className="m-eye" cx="26.5" cy="21" r="2.4" />
      <circle className="m-eye" cx="37.5" cy="21" r="2.4" />
      <path className="m-smile" d="M27 28 Q32 32 37 28" />
    </svg>
  );
}

function Phone({ children, label }: { children: ReactNode; label: Bi }) {
  return (
    <figure className="mock">
      <figcaption className="mock-cap">
        <T {...label} />
      </figcaption>
      <div className="phone">{children}</div>
    </figure>
  );
}

/* ---------- mocks ---------- */

type NodeKind = "lesson" | "drill" | "spar" | "play" | "test" | "review";
type NodeState = "done" | "current" | "open" | "locked";

const NODE_ICON: Record<NodeKind, LucideIcon> = {
  lesson: BookOpen,
  drill: Dumbbell,
  spar: HandFist,
  play: Play,
  test: Trophy,
  review: GraduationCap,
};

const NODE_LABEL: Record<NodeKind, Bi> = {
  lesson: { ar: "درس", fr: "Leçon" },
  drill: { ar: "تمرين", fr: "Exercice" },
  spar: { ar: "مواجهة", fr: "Affrontement" },
  play: { ar: "لعب", fr: "Jouer" },
  test: { ar: "اختبار", fr: "Test" },
  review: { ar: "مراجعة", fr: "Révision" },
};

const PATH: { kind: NodeKind; state: NodeState; x: number }[] = [
  { kind: "lesson", state: "done", x: 0 },
  { kind: "drill", state: "done", x: -44 },
  { kind: "lesson", state: "current", x: -58 },
  { kind: "spar", state: "locked", x: -26 },
  { kind: "drill", state: "locked", x: 22 },
  { kind: "test", state: "locked", x: 48 },
];

function PathScreen() {
  return (
    <Phone label={{ ar: "شاشة المسار · افتتاح لندن", fr: "Écran du parcours · Système de Londres" }}>
      <div className="topbar">
        <span className="brand">
          <Mascot className="brand-mark" />
          <T ar="ديلول" fr="Diloul" />
        </span>
        <span className="topbar-end">
          <span className="streak" aria-label="12">
            <Flame aria-hidden="true" />
            <Ltr>12</Ltr>
          </span>
          <span className="avatar" aria-hidden="true">
            <UserRound />
          </span>
        </span>
      </div>

      <div className="subtabs" role="tablist">
        <span role="tab">
          <T ar="الأساسيات" fr="Bases" />
        </span>
        <span role="tab" aria-selected="true" className="on">
          <T ar="الافتتاحات" fr="Ouvertures" />
        </span>
        <span role="tab">
          <T ar="النهايات" fr="Finales" />
        </span>
      </div>

      <div className="unit" style={{ ["--sec" as string]: "var(--sec1)" }}>
        <div>
          <p className="unit-eyebrow">
            <T ar="نظام لندن · بالأبيض" fr="Système de Londres · avec les Blancs" />
          </p>
          <p className="unit-title">
            <T ar="هاوٍ · القسم 1" fr="Amateur · Section 1" />
          </p>
          <p className="unit-sub">
            <T ar="تعلّم أهم 50 موقفًا" fr="Apprendre les 50 positions clés" />
          </p>
        </div>
        <span className="unit-guide" aria-hidden="true">
          <BookOpen />
        </span>
      </div>

      <ol className="path">
        {PATH.map((n, i) => {
          const Icon = n.state === "locked" ? Lock : n.state === "done" ? Check : NODE_ICON[n.kind];
          return (
            <li key={i} className={`node node-${n.state}`} style={{ ["--x" as string]: `${n.x}px` }}>
              {n.state === "current" && (
                <span className="node-bubble">
                  <T ar="ابدأ" fr="Commencer" />
                </span>
              )}
              <span className="node-disc">
                <Icon aria-hidden="true" />
              </span>
              <span className="sr-only">
                <T {...NODE_LABEL[n.kind]} />
              </span>
              {i === 2 && <Mascot className="path-mascot" />}
            </li>
          );
        })}
      </ol>

      <div className="unit-divider">
        <span>
          <T ar="هاوٍ · القسم 2 · الخطوط الجانبية" fr="Amateur · Section 2 · Variantes secondaires" />
        </span>
      </div>

      <div className="fab-zone">
        <span className="btn btn-primary fab">
          <T ar="ابدأ الدرس" fr="Commencer la leçon" />
        </span>
        <nav className="bnav">
          <span className="bnav-item on">
            <GraduationCap aria-hidden="true" />
            <T ar="تعلّم" fr="Apprendre" />
          </span>
          <span className="bnav-item">
            <Swords aria-hidden="true" />
            <T ar="مبارياتي" fr="Mes parties" />
          </span>
          <span className="bnav-item">
            <Puzzle aria-hidden="true" />
            <T ar="ألغاز" fr="Problèmes" />
          </span>
        </nav>
      </div>
    </Phone>
  );
}

function RankRing({ rank, progress }: { rank: number; progress: number }) {
  const c = 2 * Math.PI * 21;
  return (
    <span className="rank-ring" style={{ ["--rank" as string]: `var(--rank${rank})` }}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" className="rr-track" />
        <circle cx="24" cy="24" r="21" className="rr-fill" strokeDasharray={`${c * progress} ${c}`} />
      </svg>
      <RankBadge rank={rank} size={30} />
    </span>
  );
}

function PuzzleScreen() {
  return (
    <Phone label={{ ar: "شاشة اللغز · بعد الحل", fr: "Écran d’un problème · après la solution" }}>
      <div className="pz-top">
        <span className="pz-streak">
          <Zap aria-hidden="true" />
          <Ltr>+3</Ltr>
        </span>
        <RankRing rank={2} progress={0.62} />
        <div className="pz-range">
          <span className="pz-range-label">
            <T ar="الصعوبة" fr="Difficulté" />
          </span>
          <span className="pz-range-ctl">
            <span className="icon-btn" aria-hidden="true">
              <Minus />
            </span>
            <Ltr>600 – 800</Ltr>
            <span className="icon-btn" aria-hidden="true">
              <Plus />
            </span>
          </span>
        </div>
        <div className="pz-rating">
          <Ltr>739</Ltr>
          <span className="delta up">
            <Ltr>+11</Ltr>
          </span>
        </div>
      </div>

      <div className="board-frame" style={{ ["--board-light" as string]: "var(--b1-light)", ["--board-dark" as string]: "var(--b1-dark)", ["--board-last" as string]: "var(--b1-last)" }}>
        <StaticBoard fen={PUZZLE_SOLVED_FEN} lastMove={["e1", "e8"]} check="g8" label="Re8#" />
      </div>

      <div className="turn">
        <span className="turn-dot" aria-hidden="true" />
        <T ar="دور الأبيض" fr="Aux Blancs de jouer" />
      </div>

      <div className="feedback feedback-ok">
        <div className="feedback-head">
          <span className="feedback-icon" aria-hidden="true">
            <Check />
          </span>
          <div>
            <p className="feedback-title">
              <T ar="أحسنت!" fr="Bravo !" />
            </p>
            <p className="feedback-sub">
              <T ar="مات في نقلة واحدة:" fr="Mat en un coup :" /> <Ltr>♖e8#</Ltr>
            </p>
          </div>
        </div>
        <div className="feedback-actions">
          <span className="btn btn-primary">
            <T ar="التالي" fr="Suivant" />
          </span>
          <span className="btn btn-ghost">
            <Share2 aria-hidden="true" />
            <T ar="مشاركة" fr="Partager" />
          </span>
          <span className="btn btn-ghost">
            <Lightbulb aria-hidden="true" />
            <T ar="تحليل" fr="Analyser" />
          </span>
        </div>
      </div>
    </Phone>
  );
}

const SPARK = [1140, 1152, 1149, 1171, 1166, 1190, 1204, 1197, 1231, 1288, 1262, 1249, 1243];

function Sparkline() {
  const min = 1120;
  const max = 1300;
  const w = 100;
  const h = 32;
  const pts = SPARK.map((v, i) => [(i / (SPARK.length - 1)) * w, h - ((v - min) / (max - min)) * h] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  const [px, py] = pts[9];
  return (
    <svg className="spark" viewBox={`-2 -4 ${w + 4} ${h + 8}`} preserveAspectRatio="none" aria-hidden="true">
      <polygon className="spark-area" points={`0,${h} ${line} ${w},${h}`} />
      <polyline className="spark-line" points={line} />
      <circle className="spark-peak" cx={px} cy={py} r="1.6" />
      <circle className="spark-end" cx={lx} cy={ly} r="2" />
    </svg>
  );
}

function StatsCard() {
  return (
    <figure className="mock">
      <figcaption className="mock-cap">
        <T ar="بطاقة إحصائيات" fr="Carte de statistiques" />
      </figcaption>
      <div className="card stats">
        <div className="st-head">
          <span className="st-label">
            <T ar="التصنيف · سريع" fr="Classement · Rapide" />
          </span>
          <span className="chip">
            <T ar="3 أشهر" fr="3 mois" />
          </span>
        </div>
        <div className="st-big">
          <Ltr>1243</Ltr>
          <span className="delta up">
            <Ltr>+103</Ltr>
          </span>
        </div>
        <p className="st-sub">
          <T ar="الذروة" fr="Record" /> <Ltr>1288</Ltr> · <Ltr>14/10/2026</Ltr>
        </p>
        <Sparkline />

        <div className="st-sep" />

        <div className="st-head">
          <span className="st-label">
            <T ar="نسبة الفوز" fr="Taux de victoire" />
          </span>
          <span className="st-muted">
            <T ar="578 مباراة" fr="578 parties" />
          </span>
        </div>
        <div className="st-big">
          <Ltr>54%</Ltr>
        </div>
        <div className="tri" aria-hidden="true">
          <span className="tri-w" style={{ flexGrow: 312 }} />
          <span className="tri-d" style={{ flexGrow: 41 }} />
          <span className="tri-l" style={{ flexGrow: 225 }} />
        </div>
        <div className="tri-legend">
          <span>
            <i className="dot dot-w" />
            <T ar="فوز" fr="Victoires" /> <Ltr>312</Ltr>
          </span>
          <span>
            <i className="dot dot-d" />
            <T ar="تعادل" fr="Nulles" /> <Ltr>41</Ltr>
          </span>
          <span>
            <i className="dot dot-l" />
            <T ar="خسارة" fr="Défaites" /> <Ltr>225</Ltr>
          </span>
        </div>

        <div className="st-sep" />

        <p className="st-label">
          <T ar="أداء الافتتاحات" fr="Performance des ouvertures" />
        </p>
        <div className="op-rows">
          <div className="op-row">
            <div className="op-board" style={{ ["--board-light" as string]: "var(--b1-light)", ["--board-dark" as string]: "var(--b1-dark)" }}>
              <StaticBoard fen={LONDON_FEN} coords={false} label="London" />
            </div>
            <div className="op-text">
              <span className="op-tag up">
                <T ar="الأفضل" fr="Meilleure" />
              </span>
              <span className="op-name">
                <T ar="نظام لندن" fr="Système de Londres" />
              </span>
              <span className="op-meta">
                <T ar="86 مباراة · 58% فوز" fr="86 parties · 58 % de victoires" />
              </span>
            </div>
            <span className="op-impact up">
              <Ltr>+42</Ltr>
            </span>
          </div>
          <div className="op-row">
            <div className="op-board" style={{ ["--board-light" as string]: "var(--b1-light)", ["--board-dark" as string]: "var(--b1-dark)" }}>
              <StaticBoard fen={CARO_FEN} orientation="black" coords={false} label="Caro-Kann" />
            </div>
            <div className="op-text">
              <span className="op-tag down">
                <T ar="الأضعف" fr="Plus faible" />
              </span>
              <span className="op-name">
                <T ar="دفاع كاروكان" fr="Défense Caro-Kann" />
              </span>
              <span className="op-meta">
                <T ar="31 مباراة · 39% فوز" fr="31 parties · 39 % de victoires" />
              </span>
            </div>
            <span className="op-impact down">
              <Ltr>−35</Ltr>
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}

function BoardThemes({ d }: { d: Direction }) {
  return (
    <figure className="mock">
      <figcaption className="mock-cap">
        <T ar="الرقعة بسمتين · قطع cburnett" fr="L’échiquier, deux thèmes · pièces cburnett" />
      </figcaption>
      <div className="boards">
        {d.boards.map((b, i) => (
          <div key={i} className="board-tile">
            <div
              className="board-frame"
              style={{
                ["--board-light" as string]: b.light,
                ["--board-dark" as string]: b.dark,
                ["--board-last" as string]: b.last,
              }}
            >
              <StaticBoard fen={LONDON_FEN} lastMove={["c1", "f4"]} arrows={i === 0 ? [{ from: "e7", to: "e6" }] : []} label="1.d4 d5 2.Bf4" />
            </div>
            <p className="board-name">
              <T {...b.name} />
            </p>
          </div>
        ))}
        <p className="board-note">
          <T ar="الموقف بعد" fr="Position après" /> <Ltr>1. d4 d5 2. ♗f4</Ltr>
        </p>
      </div>
    </figure>
  );
}

const SWATCH_KEYS: { key: keyof ModeTokens; name: Bi }[] = [
  { key: "bg", name: { ar: "الخلفية", fr: "Fond" } },
  { key: "surface", name: { ar: "البطاقة", fr: "Carte" } },
  { key: "surface2", name: { ar: "بطاقة ثانية", fr: "Carte 2" } },
  { key: "text", name: { ar: "النص", fr: "Texte" } },
  { key: "muted", name: { ar: "نص ثانوي", fr: "Texte discret" } },
  { key: "accent", name: { ar: "اللون المميّز", fr: "Accent" } },
  { key: "success", name: { ar: "نجاح", fr: "Succès" } },
  { key: "danger", name: { ar: "خطأ", fr: "Erreur" } },
  { key: "warning", name: { ar: "تنبيه", fr: "Alerte" } },
  { key: "info", name: { ar: "معلومة", fr: "Info" } },
];

function Swatches({ t, title }: { t: ModeTokens; title: Bi }) {
  return (
    <div className="swatch-set">
      <p className="swatch-title">
        <T {...title} />
      </p>
      <div className="swatches">
        {SWATCH_KEYS.map(({ key, name }) => {
          const v = t[key] as string;
          return (
            <div key={key} className="swatch">
              <span className="swatch-chip" style={{ background: key === "accent" ? `linear-gradient(135deg, ${t.accent}, ${t.accent2})` : v }} />
              <span className="swatch-name">
                <T {...name} />
              </span>
              <span className="swatch-hex">{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Palette({ d }: { d: Direction }) {
  return (
    <section className="block">
      <h3 className="block-title">
        <T ar="الألوان" fr="Couleurs" />
      </h3>
      <div className="palette-modes">
        <Swatches t={d.dark} title={{ ar: "الوضع الداكن (الافتراضي)", fr: "Mode sombre (par défaut)" }} />
        <Swatches t={d.light} title={{ ar: "الوضع الفاتح", fr: "Mode clair" }} />
      </div>

      <div className="card sub-card">
        <p className="swatch-title">
          <T ar="الرتب السبع" fr="Les sept rangs" />
        </p>
        <div className="ranks">
          {RANK_NAMES.map((r, i) => (
            <div key={i} className="rank-item">
              <RankBadge rank={i} />
              <span>
                <T {...r} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card sub-card">
        <p className="swatch-title">
          <T ar="تقييم النقلات" fr="Qualité des coups" />
        </p>
        <div className="moves">
          {MOVE_CLASSES.map((m) => (
            <span key={m.key} className="move-chip">
              <span className="move-glyph" style={{ background: `var(--mv-${m.key})` }}>
                {m.glyph === "book" ? <BookOpen aria-hidden="true" /> : <Ltr>{m.glyph}</Ltr>}
              </span>
              <T {...m.name} />
            </span>
          ))}
        </div>
      </div>

      <div className="card sub-card">
        <p className="swatch-title">
          <T ar="ألوان أقسام المسار" fr="Couleurs des sections" />
        </p>
        <div className="sections">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className="section-pill" style={{ ["--sec" as string]: `var(--sec${n})` }}>
              <T ar={`القسم ${n}`} fr={`Section ${n}`} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Typography({ d }: { d: Direction }) {
  return (
    <section className="block">
      <h3 className="block-title">
        <T ar="الخطوط" fr="Typographie" />
      </h3>
      <div className="card type-card">
        <p className="type-fonts">
          <T {...d.fonts.label} />
        </p>
        <p className="type-h1">
          <T ar="تعلّم الشطرنج خطوة بخطوة" fr="Apprends les échecs, pas à pas" />
        </p>
        <p className="type-h2">
          <T ar="الفصل 4 · الأنماط التكتيكية" fr="Chapitre 4 · Motifs tactiques" />
        </p>
        <p className="type-body">
          <T
            ar="النقلة ♘f3 تطوّر الحصان، وتراقب المربعين e5 وd4، وتُعِدّ للتبييت."
            fr="Le coup ♘f3 développe le cavalier, contrôle les cases e5 et d4 et prépare le roque."
          />
        </p>
        <p className="type-small">
          <T ar="نص ثانوي بحجم 14px للتفاصيل والتواريخ" fr="Texte secondaire en 14 px pour les détails et les dates" />
        </p>
        <p className="type-digits">
          <Ltr>0123456789 · 1. e4 e5 2. ♘f3 ♘c6 3. ♗c4</Ltr>
        </p>
      </div>
    </section>
  );
}

function DirectionView({ d }: { d: Direction }) {
  return (
    <section className={`dir dir-${d.id}`} aria-label={d.name.fr}>
      <div className="dir-inner">
        <header className="dir-head">
          <p className="dir-eyebrow">
            <T ar={`الاتجاه ${d.id === "a" ? "1" : d.id === "b" ? "2" : "3"}`} fr={`Piste ${d.id === "a" ? "1" : d.id === "b" ? "2" : "3"}`} />
          </p>
          <h2 className="dir-name">
            <T {...d.name} />
            <span className="dir-tagline">
              <T {...d.tagline} />
            </span>
          </h2>
          <p className="dir-mood">
            <T {...d.mood} />
          </p>
        </header>

        <div className="mocks">
          <PathScreen />
          <PuzzleScreen />
          <div className="mock-col">
            <StatsCard />
            <BoardThemes d={d} />
          </div>
        </div>

        <div className="details">
          <Palette d={d} />
          <Typography d={d} />
        </div>
      </div>
    </section>
  );
}

function Seg({ name, items }: { name: string; items: { id: string; label: ReactNode; checked?: boolean }[] }) {
  return (
    <div className="seg" role="radiogroup">
      {items.map((it) => (
        <label key={it.id} className="seg-item">
          <input type="radio" name={name} id={it.id} defaultChecked={it.checked} />
          <span>{it.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function DesignDirectionsPage() {
  return (
    <div className="lab">
      <link rel="stylesheet" href={FONTS_URL} precedence="default" />
      <style>{tokenCss()}</style>
      <header className="lab-bar">
        <div className="lab-bar-inner">
          <div className="lab-title">
            <h1>
              <T ar="ديلول · اتجاهات التصميم" fr="Diloul · Pistes de design" />
            </h1>
            <p>
              <T
                ar="اختر اتجاهًا واحدًا، أو اطلب مزيجًا من اتجاهين. كل الشاشات هنا نماذج ثابتة."
                fr="Choisis une piste, ou demande un mélange de deux. Tous les écrans sont des maquettes statiques."
              />
            </p>
          </div>
          <div className="lab-controls">
            <Seg
              name="dir"
              items={DIRECTIONS.map((d, i) => ({
                id: `d-${d.id}`,
                checked: i === 0,
                label: <T {...d.name} />,
              }))}
            />
            <Seg
              name="mode"
              items={[
                { id: "m-dark", checked: true, label: <T ar="داكن" fr="Sombre" /> },
                { id: "m-light", label: <T ar="فاتح" fr="Clair" /> },
              ]}
            />
            <Seg
              name="lang"
              items={[
                { id: "l-ar", checked: true, label: "العربية" },
                { id: "l-fr", label: "Français" },
              ]}
            />
          </div>
        </div>
      </header>

      <main>
        {DIRECTIONS.map((d) => (
          <DirectionView key={d.id} d={d} />
        ))}
      </main>
    </div>
  );
}
