"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { applyBoard, applyTheme } from "@/lib/prefs/prefs";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { localAdapter } from "./local";
import { applyPatch, mergeSnapshots } from "./merge";
import { remoteAdapter } from "./remote";
import { emptySnapshot, hasData, type Patch, type Snapshot, type StorageAdapter } from "./types";

/*
 * One storage API for the whole app (SPEC §13.1). Guests write to IndexedDB, signed-in players
 * to Supabase; components never know which. On sign-in, guest data is merged into the account
 * (higher value wins, nothing deleted), then the browser copy is cleared.
 */

export type StorageState = {
  status: "loading" | "ready";
  mode: "guest" | "user";
  user: { id: string; email?: string } | null;
  data: Snapshot;
  /** Supabase variables are set (sign-in available). */
  authAvailable: boolean;
  /** Last write error, if any (shown as a gentle notice; the in-memory data stays usable). */
  error: string | null;
  update: (patch: Patch) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<StorageState | null>(null);

/** Apply stored display settings (theme/board) to <html> when they come from the account. */
function applySettings(s: Snapshot) {
  const st = s.profile?.settings;
  if (st?.theme) applyTheme(st.theme);
  if (st?.board) applyBoard(st.board);
}

export function StorageProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StorageState["status"]>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<Snapshot>(emptySnapshot);
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<StorageAdapter>(localAdapter);
  const dataRef = useRef<Snapshot>(data);
  const userId = session?.user.id ?? null;

  // Follow the auth session (browser only).
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data: d }) => setSession(d.session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load data for the current identity; migrate guest data into the account on sign-in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      const sb = getSupabase();
      let snapshot: Snapshot;
      try {
        if (userId && sb) {
          const remote = remoteAdapter(sb, userId);
          adapterRef.current = remote;
          snapshot = await remote.load();
          const guest = await localAdapter.load();
          if (hasData(guest)) {
            snapshot = mergeSnapshots(snapshot, guest);
            await remote.writeAll(snapshot);
            await localAdapter.clear();
          }
          applySettings(snapshot);
        } else {
          adapterRef.current = localAdapter;
          snapshot = await localAdapter.load();
        }
        setError(null);
      } catch (e) {
        snapshot = dataRef.current;
        setError(e instanceof Error ? e.message : String(e));
      }
      if (cancelled) return;
      dataRef.current = snapshot;
      setData(snapshot);
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const update = useCallback(async (patch: Patch) => {
    const next = applyPatch(dataRef.current, patch);
    dataRef.current = next;
    setData(next);
    try {
      await adapterRef.current.write(next, patch);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase()?.auth.signOut();
  }, []);

  const value = useMemo<StorageState>(
    () => ({
      status,
      mode: userId ? "user" : "guest",
      user: session ? { id: session.user.id, email: session.user.email } : null,
      data,
      authAvailable: supabaseConfigured,
      error,
      update,
      signOut,
    }),
    [status, userId, session, data, error, update, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStorage(): StorageState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStorage must be used inside <StorageProvider>");
  return v;
}
