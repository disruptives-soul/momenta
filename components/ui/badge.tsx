import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "free" | "premium" | "neutral";
};

const toneClasses = {
  free: "border-primary/30 bg-primary/10 text-primary",
  premium: "border-accent/30 bg-accent/15 text-accent-foreground",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
