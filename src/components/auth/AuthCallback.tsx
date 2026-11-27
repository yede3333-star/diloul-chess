"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { Link, useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Landing page of the magic link / Google redirect. The browser client exchanges the `?code=`
 * itself (PKCE; the verifier is in this browser's cookies), then we go to the profile.
 */
export function AuthCallback() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    const params = new URLSearchParams(window.location.search);
    if (!sb || params.get("error") || params.get("error_description")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL says the sign-in failed
      setFailed(true);
      return;
    }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.replace("/profile");
    };
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => session && go());
    sb.auth.getSession().then(({ data }) => data.session && go());
    const timer = window.setTimeout(() => !done && setFailed(true), 12000);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <>
      <Mascot size={80} />
      {failed ? (
        <>
          <p role="alert" className="text-[15px]">
            {t("callbackError")}
          </p>
          <Link href="/login" className="btn btn-primary">
            {t("tryAgain")}
          </Link>
        </>
      ) : (
        <p role="status" className="font-heading text-lg font-bold">
          {t("callbackTitle")}
        </p>
      )}
    </>
  );
}
