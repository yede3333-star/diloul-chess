import type { Metadata } from "next";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { LONDON_START } from "./script";

export const metadata: Metadata = {
  title: "Lesson mockup",
  robots: { index: false, follow: false },
};

/** Lesson screen mockup (before checkpoint 1.2): a short real London lesson in the player. */
export default function LessonMockupPage() {
  return <LessonPlayer script={LONDON_START} exitHref="/learn/openings" />;
}
