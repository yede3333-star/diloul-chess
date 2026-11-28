import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Bottom feedback bar (SPEC §4.4): green "well done" or red "try again".
 * Icons carry the meaning too, so it works in colorblind mode.
 * Announced to screen readers through role="status".
 */
export function FeedbackBanner({
  kind,
  title,
  message,
  children,
  className = "",
}: {
  kind: "success" | "error";
  title: string;
  message?: ReactNode;
  /** Action buttons. */
  children?: ReactNode;
  className?: string;
}) {
  const ok = kind === "success";
  return (
    <div
      role="status"
      className={`feedback-banner flex flex-col gap-3 border-t-[3px] px-4 pt-3.5 pb-[max(16px,env(safe-area-inset-bottom))] ${
        ok ? "border-success bg-success-soft" : "border-danger bg-danger-soft"
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-full text-on-semantic ${ok ? "bg-success" : "bg-danger"}`}>
          {ok ? <Check className="size-6" strokeWidth={3} aria-hidden="true" /> : <X className="size-6" strokeWidth={3} aria-hidden="true" />}
        </span>
        <div className="flex min-w-0 flex-col">
          <p className={`font-heading text-xl font-extrabold leading-tight ${ok ? "text-success" : "text-danger"}`}>{title}</p>
          {message && <p className="text-[15px] text-fg">{message}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2 pb-1 [&>*]:flex-1">{children}</div>}
    </div>
  );
}
