/**
 * Error reporting entry point. Sentry is deferred (see SETUP.md, "Sentry"): until it is wired,
 * errors only go to the console. Call this from error boundaries and catch blocks so that turning
 * Sentry on later is a change in this file only.
 *
 * When enabling: install @sentry/nextjs, set NEXT_PUBLIC_SENTRY_DSN in Vercel, and forward here
 * with personal data scrubbed (SPEC §19.5: no e-mail, no usernames).
 */
export function reportError(error: unknown, context?: Record<string, string | number | boolean | undefined>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Placeholder: Sentry.captureException(error, { extra: context }) once enabled.
  }
  console.error("[diloul]", error, context ?? "");
}
