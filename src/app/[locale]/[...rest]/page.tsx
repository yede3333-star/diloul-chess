import { notFound } from "next/navigation";

// Any unknown path under /ar or /fr shows the localized not-found page.
export default function CatchAll() {
  notFound();
}
