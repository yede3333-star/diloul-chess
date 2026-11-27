/**
 * Device display preferences (theme, board), kept in localStorage.
 * Applied to <html> by an inline script before first paint, so there is no flash.
 * These move into the unified settings storage (lib/storage) in step 5.
 */

export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const BOARD_THEMES = ["sand", "wood", "night", "green"] as const;
export type BoardTheme = (typeof BOARD_THEMES)[number];

export const PREF_KEYS = { theme: "diloul:theme", board: "diloul:board" } as const;

/** Runs in <head> before paint. Kept tiny and defensive (storage can throw in private mode). */
export const PREFS_INLINE_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem("${PREF_KEYS.theme}"),b=localStorage.getItem("${PREF_KEYS.board}");if(t==="light")d.dataset.theme="light";if(b&&/^(sand|wood|night|green)$/.test(b))d.dataset.board=b}catch(e){}`;

/** Re-applies stored preferences to <html> (after a client navigation re-renders it). */
export function reapplyStoredPrefs() {
  try {
    const d = document.documentElement;
    const t = localStorage.getItem(PREF_KEYS.theme);
    const b = localStorage.getItem(PREF_KEYS.board);
    if (t === "light") d.dataset.theme = "light";
    else delete d.dataset.theme;
    if (b && (BOARD_THEMES as readonly string[]).includes(b)) d.dataset.board = b;
  } catch {}
}

export function applyTheme(theme: Theme) {
  const d = document.documentElement;
  if (theme === "light") d.dataset.theme = "light";
  else delete d.dataset.theme;
  try {
    localStorage.setItem(PREF_KEYS.theme, theme);
  } catch {}
}

export function applyBoard(board: BoardTheme) {
  document.documentElement.dataset.board = board;
  try {
    localStorage.setItem(PREF_KEYS.board, board);
  } catch {}
}

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function readBoard(): BoardTheme {
  const b = document.documentElement.dataset.board;
  return (BOARD_THEMES as readonly string[]).includes(b ?? "") ? (b as BoardTheme) : "sand";
}
