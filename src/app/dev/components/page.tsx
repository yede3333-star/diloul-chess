import { redirect } from "next/navigation";

// The components page lives under the locale so it can be tested in Arabic and French.
export default function DevComponentsRedirect() {
  redirect("/ar/dev/components");
}
