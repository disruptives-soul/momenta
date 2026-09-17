import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn(
        "rounded-[1.5rem] border border-white/70 bg-surface p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
