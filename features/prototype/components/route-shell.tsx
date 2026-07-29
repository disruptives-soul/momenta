import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/status-state";
import { prototypeSteps, simulatedStates } from "../data/mock-flow-states";

type RouteShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  currentStepId?: string;
  nextHref?: string;
  nextLabel?: string;
};

export function RouteShell({
  eyebrow,
  title,
  description,
  currentStepId,
  nextHref,
  nextLabel = "Continuar",
}: RouteShellProps) {
  return (
    <PageShell eyebrow={eyebrow} title={title} description={description}>
      <div className="grid gap-5">
        {currentStepId ? (
          <ProgressSteps steps={prototypeSteps} currentStepId={currentStepId} />
        ) : null}

        <Card className="grid gap-4">
          <p className="text-sm font-medium text-primary">Contenido en preparación</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Estamos preparando esta sección para que puedas recorrerla pronto.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <LoadingState title="Loading" description={simulatedStates.loading} />
            <EmptyState title="Empty" description={simulatedStates.empty} />
            <ErrorState title="Error" description={simulatedStates.error} />
          </div>
          {nextHref ? (
            <div>
              <Button asChild>
                <Link href={nextHref}>
                  {nextLabel}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </PageShell>
  );
}
