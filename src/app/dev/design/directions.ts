/**
 * The three design directions shown on /dev/design.
 * This page is internal and temporary: once Yede picks a direction, the chosen tokens
 * move into src/styles/tokens.css and this file is removed or frozen.
 */

export type Bi = { ar: string; fr: string };

export type ModeTokens = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  onAccent: string;
  accentSoft: string;
  /** accent used as text or icon color on surfaces (AA on light backgrounds) */
  accentText: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  navBg: string;
  sections: [string, string, string, string];
};

export type BoardTheme = { name: Bi; light: string; dark: string; last: string };

export type Direction = {
  id: "a" | "b" | "c";
  name: Bi;
  tagline: Bi;
  mood: Bi;
  fonts: { arHeading: string; arBody: string; frHeading: string; frBody: string; label: Bi };
  radiusCard: string;
  dark: ModeTokens;
  light: ModeTokens;
  boards: [BoardTheme, BoardTheme];
  ranks: [string, string, string, string, string, string, string];
  moves: { book: string; best: string; good: string; inaccuracy: string; mistake: string; blunder: string };
};

export const DIRECTIONS: Direction[] = [
  {
    id: "a",
    name: { ar: "جمر", fr: "Braise" },
    tagline: { ar: "داكن دافئ", fr: "Sombre et chaleureux" },
    mood: {
      ar: "خلفية زرقاء رمادية هادئة، وبطاقات ناعمة، ولون برتقالي دافئ يدلّ على الفعل الرئيسي فقط. يناسب الجلسات الليلية الطويلة.",
      fr: "Un fond bleu-gris apaisé, des cartes douces et un orange chaud réservé à l’action principale. Idéal pour les longues séances du soir.",
    },
    fonts: {
      arHeading: "'Tajawal'",
      arBody: "'Tajawal'",
      frHeading: "'Manrope'",
      frBody: "'Manrope'",
      label: { ar: "Tajawal للعربية · Manrope للفرنسية", fr: "Tajawal (arabe) · Manrope (français)" },
    },
    radiusCard: "22px",
    dark: {
      bg: "#15171f",
      surface: "#1e212b",
      surface2: "#282c38",
      border: "#343949",
      text: "#ece9e4",
      muted: "#a5a4ae",
      accent: "#ff9a52",
      accent2: "#f2703a",
      onAccent: "#241307",
      accentSoft: "rgba(255, 154, 82, 0.14)",
      accentText: "#ff9a52",
      success: "#5cc785",
      danger: "#f06a6a",
      warning: "#f2c14e",
      info: "#6ea8fe",
      navBg: "rgba(36, 39, 50, 0.92)",
      sections: ["#f08c4a", "#3db5a2", "#8f7cf0", "#e56b8c"],
    },
    light: {
      bg: "#f5f2ee",
      surface: "#fffcf8",
      surface2: "#efeae3",
      border: "#e0d9cf",
      text: "#25222b",
      muted: "#67636d",
      accent: "#f58a3f",
      accent2: "#e5622b",
      onAccent: "#241307",
      accentSoft: "rgba(229, 98, 43, 0.10)",
      accentText: "#b14d17",
      success: "#1a7a43",
      danger: "#c73a3a",
      warning: "#945e00",
      info: "#2f6fd6",
      navBg: "rgba(255, 252, 248, 0.94)",
      sections: ["#e0742e", "#21917f", "#6e5ad6", "#c94b6d"],
    },
    boards: [
      { name: { ar: "خشبي كلاسيكي", fr: "Bois classique" }, light: "#ecd8b8", dark: "#b58863", last: "rgba(214, 205, 92, 0.55)" },
      { name: { ar: "أردواز", fr: "Ardoise" }, light: "#dde2e8", dark: "#7f8ea5", last: "rgba(255, 170, 90, 0.5)" },
    ],
    ranks: ["#4a8fe0", "#4db36b", "#38b6d4", "#9a72e2", "#f08a3c", "#e0524f", "#e3b341"],
    moves: { book: "#d59a5c", best: "#3fb071", good: "#86bf5a", inaccuracy: "#f0c240", mistake: "#f08a3c", blunder: "#e5484d" },
  },
  {
    id: "b",
    name: { ar: "ميدان", fr: "Terrain" },
    tagline: { ar: "كلاسيكي أخضر", fr: "Classique vert" },
    mood: {
      ar: "فحمي مائل للخضرة، وأزرار بارزة كأزرار الألعاب، ورقعة خضراء هادئة. إحساس النادي والمباراة.",
      fr: "Un anthracite légèrement vert, des boutons en relief comme dans un jeu et un échiquier vert apaisé. L’ambiance du club.",
    },
    fonts: {
      arHeading: "'IBM Plex Sans Arabic'",
      arBody: "'IBM Plex Sans Arabic'",
      frHeading: "'IBM Plex Sans'",
      frBody: "'IBM Plex Sans'",
      label: { ar: "IBM Plex Sans Arabic · IBM Plex Sans", fr: "IBM Plex Sans Arabic · IBM Plex Sans" },
    },
    radiusCard: "16px",
    dark: {
      bg: "#171a19",
      surface: "#212523",
      surface2: "#2b302d",
      border: "#3a403c",
      text: "#e7ece8",
      muted: "#a0a9a3",
      accent: "#82c150",
      accent2: "#5f9a34",
      onAccent: "#0f1f07",
      accentSoft: "rgba(130, 193, 80, 0.14)",
      accentText: "#82c150",
      success: "#82c150",
      danger: "#ef6b5e",
      warning: "#f0c24b",
      info: "#64a8e8",
      navBg: "rgba(33, 37, 35, 0.94)",
      sections: ["#82c150", "#4f9bd9", "#e5a93b", "#e06f5b"],
    },
    light: {
      bg: "#eef1ec",
      surface: "#fbfcf8",
      surface2: "#e4e9e1",
      border: "#d3dbcf",
      text: "#1e2420",
      muted: "#5c665f",
      accent: "#6aab38",
      accent2: "#5a9a2c",
      onAccent: "#0f1f07",
      accentSoft: "rgba(106, 171, 56, 0.14)",
      accentText: "#3f7a1c",
      success: "#2f7d1f",
      danger: "#c0392b",
      warning: "#9a6500",
      info: "#2468b3",
      navBg: "rgba(251, 252, 248, 0.95)",
      sections: ["#5b9a2c", "#2f7fc0", "#c98a17", "#c4533f"],
    },
    boards: [
      { name: { ar: "أخضر هادئ", fr: "Vert doux" }, light: "#e8ecd2", dark: "#7b9a5c", last: "rgba(245, 222, 90, 0.55)" },
      { name: { ar: "خشبي", fr: "Bois" }, light: "#f0d9b5", dark: "#b58863", last: "rgba(155, 199, 0, 0.42)" },
    ],
    ranks: ["#3f86d8", "#5aae3c", "#2fb0c9", "#8f64d6", "#ec8430", "#d94a3f", "#d9a62b"],
    moves: { book: "#c99256", best: "#5aae3c", good: "#8cc063", inaccuracy: "#eec13f", mistake: "#ec8430", blunder: "#e0453a" },
  },
  {
    id: "c",
    name: { ar: "ليل الصحراء", fr: "Nuit du désert" },
    tagline: { ar: "اقتراحي: نيلي ورملي", fr: "Ma proposition : indigo et sable" },
    mood: {
      ar: "نيلي عميق كليل الصحراء، ولون رملي ذهبي للأفعال، ولمسة فيروزية للمعلومات. هوية خاصة بديلول لا تشبه غيره.",
      fr: "Un indigo profond comme la nuit saharienne, un or sable pour les actions et une touche turquoise. Une identité propre à Diloul.",
    },
    fonts: {
      arHeading: "'Noto Kufi Arabic'",
      arBody: "'Noto Sans Arabic'",
      frHeading: "'Noto Sans'",
      frBody: "'Noto Sans'",
      label: { ar: "Noto Kufi Arabic للعناوين · Noto Sans Arabic للنص · Noto Sans للفرنسية", fr: "Noto Kufi Arabic (titres) · Noto Sans Arabic · Noto Sans" },
    },
    radiusCard: "24px",
    dark: {
      bg: "#11152a",
      surface: "#1a1f37",
      surface2: "#242a45",
      border: "#323a5a",
      text: "#eee7da",
      muted: "#aaa6b8",
      accent: "#e9b864",
      accent2: "#d4913f",
      onAccent: "#21160a",
      accentSoft: "rgba(233, 184, 100, 0.13)",
      accentText: "#e9b864",
      success: "#4fc9a4",
      danger: "#ef7468",
      warning: "#f0c45c",
      info: "#45bdb4",
      navBg: "rgba(29, 34, 60, 0.92)",
      sections: ["#e2a84e", "#3fb8af", "#d9735e", "#918ce9"],
    },
    light: {
      bg: "#eef0f6",
      surface: "#fafbfe",
      surface2: "#e3e6f0",
      border: "#d3d8e6",
      text: "#1b1f33",
      muted: "#5d6279",
      accent: "#e3a548",
      accent2: "#c8832e",
      onAccent: "#21160a",
      accentSoft: "rgba(200, 131, 46, 0.12)",
      accentText: "#94601c",
      success: "#16805f",
      danger: "#c0443a",
      warning: "#946200",
      info: "#127a73",
      navBg: "rgba(250, 251, 254, 0.94)",
      sections: ["#c8832e", "#1f8f87", "#c25640", "#6762cf"],
    },
    boards: [
      { name: { ar: "رمال", fr: "Sable" }, light: "#ecdfc6", dark: "#c19a6b", last: "rgba(233, 184, 100, 0.55)" },
      { name: { ar: "ليلي", fr: "Nuit" }, light: "#cdd2e3", dark: "#5f6b96", last: "rgba(69, 189, 180, 0.5)" },
    ],
    ranks: ["#5b8def", "#46b27a", "#3cb7c4", "#9b7be6", "#e98f45", "#e0605a", "#e2b04f"],
    moves: { book: "#d1a26a", best: "#3fbf8f", good: "#8cc46a", inaccuracy: "#f0c45c", mistake: "#ec8c45", blunder: "#e5524c" },
  },
];

export const RANK_NAMES: Bi[] = [
  { ar: "البداية", fr: "Débutant" },
  { ar: "مبتدئ", fr: "Novice" },
  { ar: "هاوٍ", fr: "Amateur" },
  { ar: "متدرّب", fr: "Apprenti" },
  { ar: "متمكّن", fr: "Confirmé" },
  { ar: "خبير", fr: "Expert" },
  { ar: "أستاذ", fr: "Maître" },
];

export const MOVE_CLASSES: { key: keyof Direction["moves"]; name: Bi; glyph: string }[] = [
  { key: "book", name: { ar: "نظرية", fr: "Théorique" }, glyph: "book" },
  { key: "best", name: { ar: "أفضل نقلة", fr: "Meilleur coup" }, glyph: "★" },
  { key: "good", name: { ar: "جيدة", fr: "Bon coup" }, glyph: "✓" },
  { key: "inaccuracy", name: { ar: "عدم دقة", fr: "Imprécision" }, glyph: "?" },
  { key: "mistake", name: { ar: "خطأ", fr: "Erreur" }, glyph: "✕" },
  { key: "blunder", name: { ar: "غلطة فادحة", fr: "Gaffe" }, glyph: "??" },
];

/** Verified with chess.js: 1.d4 d5 2.Bf4 (London System). */
export const LONDON_FEN = "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2";

/** Verified with chess.js: White to move, Re8# is the only mate. Shown after the solution. */
export const PUZZLE_SOLVED_FEN = "4R1k1/5ppp/8/8/8/8/1qr2PPP/6K1 b - - 1 1";
