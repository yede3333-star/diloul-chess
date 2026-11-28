"use client";

import { useSyncExternalStore } from "react";
import { isSoundOn, setSoundOn, subscribeSound } from "./sounds";

/** The device's sound setting (kept in localStorage). On during prerendering. */
export function useSoundOn(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribeSound, isSoundOn, () => true);
  return [on, setSoundOn];
}
