import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

type HeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  media?: ReactNode;
  className?: string;
};

export function Hero({
  eyebrow,
  title,
  description,
  actions,
  media,
  className,
}: HeroProps) {
  return (
    <section className={cn("border-b border-border", className)}>
      <Container className="grid min-h-[calc(100svh-4rem)] content-center gap-9 py-10 md:grid-cols-[1fr_0.82fr] md:py-12">
        <div className="flex flex-col justify-center gap-6">
          {eyebrow ? (
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {media ? <div className="grid content-center">{media}</div> : null}
      </Container>
    </section>
  );
}
