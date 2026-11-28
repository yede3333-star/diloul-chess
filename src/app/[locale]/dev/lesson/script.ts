import { Chess, type Square } from "chess.js";
import type { LessonScript, LessonStep } from "@/components/lesson/types";
import type { Bi } from "@/lib/openings/types";

/**
 * Mockup lesson (checkpoint 1.2 design): "London · the start".
 * Every position is built with chess.js from real moves, so an illegal move breaks the build.
 */
function after(sans: string[]): { fen: string; lastMove?: [Square, Square] } {
  const game = new Chess();
  let last: [Square, Square] | undefined;
  for (const san of sans) {
    const m = game.move(san);
    last = [m.from, m.to];
  }
  return { fen: game.fen(), lastMove: last };
}

// A complete London setup reached in a real game: d4, Bf4, e3, Nf3, c3, Bd3, Nbd2, castled.
const SETUP = ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "Be7", "Bd3", "O-O", "O-O", "c5", "c3", "Nc6", "Nbd2", "b6"];
const LINE = ["d4", "d5", "Bf4", "Nc6", "e3", "Nf6", "Nf3", "Bg4", "c3", "e6"];

const setup = after(SETUP);

const moveStep = (i: number, prompt: Bi, hint: Bi): LessonStep => ({
  kind: "move",
  ...after(LINE.slice(0, i)),
  expect: [LINE[i]],
  reply: LINE[i + 1],
  prompt,
  hint,
});

export const LONDON_START: LessonScript = {
  id: "london-start-1",
  title: { ar: "نظام لندن · البداية", fr: "Système de Londres · Les débuts" },
  orientation: "white",
  startFen: new Chess().fen(),
  steps: [
    {
      kind: "slide",
      ...setup,
      lastMove: undefined,
      title: { ar: "فكرة لندن", fr: "L’idée du Londres" },
      text: {
        ar: "تبني الشكل نفسه تقريبًا في كل مباراة: بيادق d4 وe3 وc3، والفيل في f4.",
        fr: "Tu construis presque la même position à chaque partie : pions d4, e3 et c3, et le fou en f4.",
      },
      shapes: [
        { from: "d4", tone: "best" },
        { from: "e3", tone: "best" },
        { from: "c3", tone: "best" },
        { from: "f4", tone: "best" },
      ],
    },
    {
      kind: "slide",
      ...setup,
      lastMove: undefined,
      title: { ar: "الخطة", fr: "Le plan" },
      text: {
        ar: "بعد التطوير: الحصان يقفز إلى e5، والفيل يصوّب على h7.",
        fr: "Après le développement : le cavalier saute en e5 et le fou vise h7.",
      },
      shapes: [
        { from: "f3", to: "e5", tone: "best" },
        { from: "d3", to: "h7", tone: "hint" },
      ],
    },
    {
      kind: "slide",
      ...after(["d4", "d5", "e3"]),
      lastMove: undefined,
      title: { ar: "انتبه!", fr: "Attention !" },
      text: {
        ar: "أشهر خطأ: e3 قبل Bf4. هكذا يُحبس فيلك خلف بيادقك.",
        fr: "L’erreur classique : e3 avant Bf4. Ton fou reste enfermé derrière tes pions.",
      },
      shapes: [
        { from: "c1", tone: "danger" },
        { from: "e3", tone: "danger" },
      ],
    },
    moveStep(
      0,
      {
        ar: "نبدأ: ادفع بيدق الوزير خطوتين إلى d4.",
        fr: "On commence : avance le pion de la dame de deux cases, en d4.",
      },
      {
        ar: "البيدق المطلوب هو الذي أمام الوزير مباشرة.",
        fr: "C’est le pion juste devant la dame.",
      },
    ),
    moveStep(
      2,
      {
        ar: "الأسود ردّ بـ d5. الآن أهم نقلة في لندن: أخرج الفيل إلى f4.",
        fr: "Les Noirs jouent d5. Voici le coup clé du Londres : sors le fou en f4.",
      },
      {
        ar: "الفيل المقصود هو فيل c1. أوصله إلى f4.",
        fr: "C’est le fou de c1 : amène-le en f4.",
      },
    ),
    moveStep(
      4,
      {
        ar: "الآن e3: تحمي d4 مرة ثانية، وتفتح الطريق لفيلك الآخر.",
        fr: "Maintenant e3 : tu protèges d4 une deuxième fois et tu libères ton autre fou.",
      },
      {
        ar: "ادفع بيدق e خطوة واحدة فقط.",
        fr: "Avance le pion e d’une seule case.",
      },
    ),
    moveStep(
      6,
      {
        ar: "أخرج حصانك إلى f3: يحمي d4 ويستعد للقفز إلى e5.",
        fr: "Sors ton cavalier en f3 : il protège d4 et prépare le saut en e5.",
      },
      { ar: "الحصان المقصود هو حصان g1.", fr: "C’est le cavalier de g1." },
    ),
    moveStep(
      8,
      {
        ar: "فيل الأسود يضايق حصانك. العب c3 ليصبح مركزك ثابتًا.",
        fr: "Le fou noir gêne ton cavalier. Joue c3 pour rendre ton centre solide.",
      },
      { ar: "ادفع بيدق c خطوة واحدة.", fr: "Avance le pion c d’une case." },
    ),
    {
      kind: "info",
      ...after(LINE),
      text: {
        ar: "لاحظ: فيل الأسود ترك c8، فبيدق b7 بلا حماية. لاحقًا يهاجمه وزيرك من b3.",
        fr: "Remarque : le fou noir a quitté c8, donc le pion b7 n’est plus protégé. Plus tard, ta dame l’attaquera depuis b3.",
      },
      shapes: [
        { from: "d1", to: "b3", tone: "hint" },
        { from: "b7", tone: "danger" },
      ],
    },
  ],
};
