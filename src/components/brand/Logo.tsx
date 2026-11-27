import { LogoMark } from "./LogoMark";

/** Mark + wordmark. `name` comes from the translation files ("ديلول" / "Diloul"). */
export function Logo({ name, size = 28, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-heading font-extrabold leading-none" style={{ fontSize: size * 0.68 }}>
        {name}
      </span>
    </span>
  );
}
