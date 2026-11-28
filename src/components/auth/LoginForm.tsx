"use client";

import { Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Google sign-in needs setup in Google Cloud Console first (a deferred computer task), so it is opt-in.
const GOOGLE_ON = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "on";

/** Magic link (with a 6-digit code fallback) and, once configured, Google (SPEC §13). */
export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!supabaseConfigured) {
    return <p className="card p-4 text-[15px]">{t("notConfigured")}</p>;
  }

  const callbackUrl = () => `${window.location.origin}/${locale}/auth/callback`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email)) {
      setError(t("invalidEmail"));
      return;
    }
    setError(null);
    setState("sending");
    const { error: err } = await getSupabase()!.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true } });
    if (err) {
      setError(t("error", { message: err.message }));
      setState("idle");
    } else setState("sent");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("verifying");
    const { error: err } = await getSupabase()!.auth.verifyOtp({ email, token: code, type: "email" });
    if (err) {
      setError(t("error", { message: err.message }));
      setState("sent");
    } else router.replace("/profile");
  }

  return (
    <div className="flex flex-col gap-5">
      {state === "idle" || state === "sending" ? (
        <form onSubmit={sendLink} className="card flex flex-col gap-3 p-4" noValidate>
          <label htmlFor="email" className="text-sm font-semibold">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder={t("emailPlaceholder")}
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
            className="min-h-12 rounded-md border-2 border-border bg-bg px-4 text-base text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:border-accent"
          />
          <button type="submit" className="btn btn-primary btn-lg mt-1" disabled={state === "sending"}>
            <Mail aria-hidden="true" />
            {state === "sending" ? t("sending") : t("sendLink")}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="card flex flex-col gap-3 p-4">
          <p role="status" className="text-[15px]">
            {t("sent", { email })}
          </p>
          <label htmlFor="code" className="text-sm font-semibold">
            {t("codeLabel")}
          </label>
          <input
            id="code"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="min-h-12 rounded-md border-2 border-border bg-bg px-4 text-center text-xl tracking-[0.4em] text-fg tabular focus:outline-none focus-visible:border-accent"
          />
          <button type="submit" className="btn btn-secondary" disabled={code.length !== 6 || state === "verifying"}>
            {state === "verifying" ? t("verifying") : t("verify")}
          </button>
        </form>
      )}

      {error && (
        <p id="login-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {GOOGLE_ON && (
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={() => getSupabase()!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl() } })}
        >
          {t("google")}
        </button>
      )}
    </div>
  );
}
