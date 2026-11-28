"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useStorage } from "@/lib/storage/StorageProvider";

/** First visit (no onboarding yet, guest or account) → the onboarding screen (SPEC §5.4). */
export function OnboardingGate() {
  const { status, data } = useStorage();
  const router = useRouter();
  useEffect(() => {
    if (status === "ready" && !data.profile?.onboardedAt) router.replace("/onboarding");
  }, [status, data.profile?.onboardedAt, router]);
  return null;
}
