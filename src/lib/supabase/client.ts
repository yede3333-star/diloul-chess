"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Browser-only Supabase client. Sign-in, the magic-link code exchange and token refresh all
 * happen in the browser, so pages stay static. Data is protected by RLS in the database.
 * The publishable (anon) key is public by design; the service-role key never reaches the app.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until the Supabase variables are set in Vercel: the site then runs in guest mode only. */
export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured || typeof window === "undefined") return null;
  client ??= createBrowserClient(url!, key!);
  return client;
}
