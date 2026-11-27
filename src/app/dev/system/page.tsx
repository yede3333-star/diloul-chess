import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BookOpen, Check, Dumbbell, Flame, GraduationCap, HandFist, Lock, Puzzle, Share2, Star, Swords, Trophy, X } from "lucide-react";
import { StaticBoard } from "@/components/board/StaticBoard";
import { Logo } from "@/components/brand/Logo";
import { LogoMark } from "@/components/brand/LogoMark";
import { Mascot } from "@/components/brand/Mascot";
import { RankBadge } from "@/components/rank/RankBadge";
import { RANK_KEYS } from "@/config/rank-keys";

/*
 * Internal reference for the chosen design system (tokens.css + primitives.css).
 * Uses only Tailwind utilities mapped to tokens, so it doubles as a check of the mapping.
 * No client JavaScript: it can be exported as a static preview.
 */

export const metadata: Metadata = {
  title: "ديلول · نظام التصميم",
  robots: { index: false, follow: false },
};

/** Verified with chess.js: 1.d4 d5 2.Bf4 (London System). */
const LONDON_FEN = "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2";

const RANK_AR = ["البداية", "مبتدئ", "هاوٍ", "متدرّب", "متمكّن", "خبير", "أستاذ"];

const SWATCHES: { v: string; ar: string }[] = [
  { v: "bg", ar: "الخلفية" },
  { v: "surface", ar: "البطاقة" },
  { v: "surface-2", ar: "بطاقة 2" },
  { v: "border", ar: "الحدود" },
  { v: "fg", ar: "النص" },
  { v: "fg-muted", ar: "نص ثانوي" },
  { v: "accent", ar: "المميّز" },
  { v: "accent-edge", ar: "حافة الزر" },
  { v: "success", ar: "نجاح" },
  { v: "danger", ar: "خطأ" },
  { v: "warning", ar: "تنبيه" },
  { v: "info", ar: "معلومة" },
];

const MOVES = [
  { v: "book", ar: "نظرية", g: <BookOpen className="size-[15px]" strokeWidth={2.4} /> },
  { v: "best", ar: "أفضل نقلة", g: <Star className="size-[15px]" strokeWidth={2.6} /> },
  { v: "good", ar: "جيدة", g: <Check className="size-[15px]" strokeWidth={3} /> },
  { v: "inaccuracy", ar: "عدم دقة", g: "?" },
  { v: "mistake", ar: "خطأ", g: <X className="size-[15px]" strokeWidth={3} /> },
  { v: "blunder", ar: "غلطة فادحة", g: "??" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-fg-muted">{title}</h3>
      {children}
    </section>
  );
}

function Panel({ theme, title }: { theme: "dark" | "light"; title: string }) {
  return (
    <div className={`theme-${theme} min-w-0 rounded-card border border-border bg-bg p-4 text-fg sm:p-6`}>
      <div className="flex flex-col gap-8">
        <h2 className="text-xl font-extrabold">{title}</h2>

        <Section title="الألوان">
          <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6">
            {SWATCHES.map((s) => (
              <div key={s.v} className="flex min-w-0 flex-col gap-1">
                <span className="h-10 rounded-sm border border-border" style={{ background: `var(--${s.v})` }} />
                <span className="text-xs font-semibold leading-tight">{s.ar}</span>
                <span className="ltr truncate font-mono text-[10px] text-fg-muted">--{s.v}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="الأزرار (البارزة تنخفض عند الضغط)">
          <div className="flex flex-wrap items-center gap-3 pb-1">
            <span className="btn btn-primary btn-lg">ابدأ الدرس</span>
            <span className="btn btn-primary">التالي</span>
            <span className="btn btn-secondary">
              <Share2 aria-hidden="true" />
              مشاركة
            </span>
            <span className="btn btn-ghost">إظهار الحل</span>
            <span className="btn btn-secondary btn-sm">−</span>
          </div>
        </Section>

        <Section title="المسار">
          <div className="card flex flex-col gap-6 p-4">
            <div className="section-card flex items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-accent-text">نظام لندن · بالأبيض</p>
                <p className="font-heading text-lg font-extrabold">هاوٍ · القسم 1</p>
                <p className="text-[15px] font-medium">تعلّم أهم 50 موقفًا</p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-text">
                <BookOpen className="size-[22px]" aria-hidden="true" />
              </span>
            </div>
            <div className="grid grid-cols-3 justify-items-center gap-x-2 gap-y-12 pt-8">
              <div className="flex flex-col items-center gap-3">
                <span className="path-node" data-state="done">
                  <Check aria-hidden="true" />
                </span>
                <span className="text-xs text-fg-muted">مكتملة</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="path-node" data-state="current">
                  <span className="path-bubble">ابدأ</span>
                  <BookOpen aria-hidden="true" />
                </span>
                <span className="text-xs text-fg-muted">الحالية</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="path-node" data-state="locked">
                  <Lock aria-hidden="true" />
                </span>
                <span className="text-xs text-fg-muted">مقفلة</span>
              </div>
              {[
                { I: Dumbbell, ar: "تمرين", s: "--section-2" },
                { I: HandFist, ar: "مواجهة", s: "--section-3" },
                { I: Trophy, ar: "اختبار", s: "--section-4" },
              ].map(({ I, ar, s }) => (
                <div key={ar} className="flex flex-col items-center gap-3">
                  <span className="path-node" data-state="open" style={{ ["--node" as string]: `var(${s})` }}>
                    <I aria-hidden="true" />
                  </span>
                  <span className="text-xs text-fg-muted">{ar}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Mascot size={52} />
              <p className="relative rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[15px] leading-relaxed">
                نُخرج الفيل إلى <span className="san">♗f4</span> قبل <span className="san">e3</span>، حتى لا يُحبس خلف بيادقه.
              </p>
            </div>
          </div>
        </Section>

        <Section title="ألوان الأقسام">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span key={n} className="rounded-full py-1.5 text-center text-sm font-bold text-on-section" style={{ background: `var(--section-${n})` }}>
                القسم {n}
              </span>
            ))}
          </div>
        </Section>

        <Section title="الرتب السبع">
          <div className="grid grid-cols-7 gap-1">
            {RANK_KEYS.map((r, i) => (
              <div key={r} className="flex flex-col items-center gap-1 text-center text-xs font-semibold">
                <RankBadge rank={r} size={38} />
                {RANK_AR[i]}
              </div>
            ))}
          </div>
        </Section>

        <Section title="تقييم النقلات">
          <div className="flex flex-wrap gap-2">
            {MOVES.map((m) => (
              <span key={m.v} className="inline-flex items-center gap-2 rounded-full bg-surface-2 py-1 ps-1 pe-3 text-sm font-semibold">
                <span className="ltr grid h-[26px] min-w-[26px] place-items-center rounded-full px-1 text-[13px] font-extrabold text-on-move" style={{ background: `var(--move-${m.v})` }}>
                  {m.g}
                </span>
                {m.ar}
              </span>
            ))}
          </div>
        </Section>

        <Section title="شرائط التغذية الراجعة">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 rounded-md border-t-[3px] border-success bg-success-soft px-3.5 py-3">
              <span className="grid size-9 place-items-center rounded-full bg-success text-on-semantic">
                <Check className="size-5" strokeWidth={3} aria-hidden="true" />
              </span>
              <p className="font-heading text-lg font-extrabold text-success">أحسنت!</p>
            </div>
            <div className="flex items-center gap-3 rounded-md border-t-[3px] border-danger bg-danger-soft px-3.5 py-3">
              <span className="grid size-9 place-items-center rounded-full bg-danger text-on-semantic">
                <X className="size-5" strokeWidth={3} aria-hidden="true" />
              </span>
              <p className="font-heading text-lg font-extrabold text-danger">حاول مرة أخرى</p>
            </div>
          </div>
        </Section>

        <Section title="الرقعة: رمال (افتراضي) · خشبي كلاسيكي">
          <div className="grid grid-cols-2 gap-3">
            {(["sand", "wood"] as const).map((b) => (
              <div key={b} data-board={b} className="overflow-hidden rounded-board">
                <StaticBoard fen={LONDON_FEN} lastMove={["c1", "f4"]} label="1.d4 d5 2.Bf4" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="الشريط السفلي العائم">
          <nav className="flex gap-1 rounded-[22px] border border-border bg-nav p-1.5 shadow-float">
            {[
              { I: GraduationCap, ar: "تعلّم", on: true },
              { I: Swords, ar: "مبارياتي" },
              { I: Puzzle, ar: "ألغاز" },
            ].map(({ I, ar, on }) => (
              <span
                key={ar}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-[16px] py-1.5 text-xs font-semibold ${on ? "bg-accent-soft text-accent-text" : "text-fg-muted"}`}
              >
                <I className="size-[22px]" aria-hidden="true" />
                {ar}
              </span>
            ))}
          </nav>
        </Section>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-8 px-[max(16px,env(safe-area-inset-left))] py-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Logo name="ديلول" size={40} />
          <span className="chip">
            <Flame className="size-4 text-accent-text" aria-hidden="true" />
            <span className="tabular">12</span>
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-accent-text">المرحلة 0 · الخطوة 2</p>
          <h1 className="text-2xl font-extrabold sm:text-3xl">نظام التصميم: ليل الصحراء</h1>
          <p className="max-w-[62ch] text-fg-muted">
            ألوان «ليل الصحراء» وخطوطه، مع الأزرار والعُقد البارزة من «ميدان». الرقعة الافتراضية «رمال»، و«خشبي كلاسيكي» خيار ثانٍ.
          </p>
        </div>
      </header>

      <section className="card grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-5">
          <LogoMark size={88} title="ديلول" />
          <LogoMark size={48} />
          <LogoMark size={24} />
          <Mascot size={72} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-heading text-3xl font-extrabold">تعلّم الشطرنج خطوة بخطوة</p>
          <p className="text-lg">النص الأساسي بخط Noto Sans Arabic بحجم 16px، مريح للقراءة الطويلة.</p>
          <p lang="fr" dir="ltr" className="text-lg">
            <span className="font-heading font-bold">Apprends les échecs, pas à pas.</span> Le français utilise Noto Sans.
          </p>
          <p className="ltr text-start text-lg font-semibold tabular">0123456789 · 1. d4 d5 2. ♗f4</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel theme="dark" title="الوضع الداكن (الافتراضي)" />
        <Panel theme="light" title="الوضع الفاتح" />
      </div>
    </main>
  );
}
