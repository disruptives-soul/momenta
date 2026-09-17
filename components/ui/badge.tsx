import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "free" | "premium" | "neutral";
};

const toneClasses = {
  free: "border-success/25 bg-success/10 text-success",
  premium: "border-primary/25 bg-primary/10 text-primary",
  neutral: "border-white/70 bg-surface text-muted-foreground",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
