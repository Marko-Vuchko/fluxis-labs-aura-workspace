import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function CornerBracket({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-4 w-4 border-primary/60",
        className,
      )}
    />
  );
}

export function HudPanel({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "relative overflow-hidden rounded-xl",
        "border border-primary/20 bg-[#070b14]/78 p-4",
        "shadow-[0_0_40px_-24px_rgb(34_211_238_/_0.55)] backdrop-blur-md",
        className,
      )}
    >
      <CornerBracket className="top-2 left-2 border-t border-l" />
      <CornerBracket className="top-2 right-2 border-t border-r" />
      <CornerBracket className="bottom-2 left-2 border-b border-l" />
      <CornerBracket className="right-2 bottom-2 border-r border-b" />
      {children}
    </section>
  );
}
