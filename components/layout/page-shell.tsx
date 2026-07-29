import type { ReactNode } from "react";
import { Container } from "./container";
import { cn } from "@/lib/utils";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  actions,
  className,
}: PageShellProps) {
  return (
    <main className={cn("py-8 md:py-12", className)}>
      <Container>
        <div className="mb-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            {eyebrow ? (
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children}
      </Container>
    </main>
  );
}
