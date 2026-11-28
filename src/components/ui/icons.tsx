import { ArrowLeft, ArrowRight, type LucideProps } from "lucide-react";

/*
 * Direction-aware arrows. "Next" points to where reading goes: right in French, left in Arabic.
 * Always use these for forward/back actions instead of raw arrow icons.
 */
export function NextArrow({ className = "", ...props }: LucideProps) {
  return <ArrowRight aria-hidden="true" className={`rtl:-scale-x-100 ${className}`} {...props} />;
}

export function BackArrow({ className = "", ...props }: LucideProps) {
  return <ArrowLeft aria-hidden="true" className={`rtl:-scale-x-100 ${className}`} {...props} />;
}
