"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/status-state";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import {
  formatEditableUntil,
  reactivatePurchasedProject,
} from "../services/purchased-project-lifecycle";
import { localPurchasedProjectRepository } from "../services/local-purchased-project-repository";
import type { PurchasedProject } from "../types/purchased-project";

type ReactivateProjectViewProps = {
  projectId: string;
};

export function ReactivateProjectView({ projectId }: ReactivateProjectViewProps) {
  const router = useRouter();
  const [project, setProject] = useState<PurchasedProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let active = true;

    void localPurchasedProjectRepository.getById(projectId).then((nextProject) => {
      if (!active) {
        return;
      }

      setProject(nextProject);
      setIsLoading(false);

      if (nextProject) {
        trackValidationEvent("reactivation_cta_clicked", {
          productId: nextProject.productId,
          projectId: nextProject.id,
          templateId: nextProject.templateId,
        });
      }
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  async function reactivate() {
    if (!project) {
      return;
    }

    setIsConfirming(true);
    const updatedProject = reactivatePurchasedProject(project);

    await localPurchasedProjectRepository.update(updatedProject);
    trackValidationEvent("project_reactivated", {
      productId: updatedProject.productId,
      projectId: updatedProject.id,
      templateId: updatedProject.templateId,
    });
    router.push(`/account/designs/${updatedProject.id}/edit`);
  }

  if (isLoading) {
    return <LoadingState title="Cargando reactivacion" />;
  }

  if (!project) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href="/account/designs">Volver a mis disenos</Link>
          </Button>
        }
        description="No encontramos este proyecto comprado en el piloto local."
        title="Diseno no encontrado"
      />
    );
  }

  return (
    <Card className="mx-auto grid max-w-2xl gap-5 text-center">
      <RefreshCw aria-hidden="true" className="mx-auto size-10 text-primary" />
      <p className="text-sm font-medium text-primary">Reactivacion demo</p>
      <h1 className="text-3xl font-semibold md:text-5xl">
        Reactivar edicion
      </h1>
      <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
        Este piloto no realiza cobros. Al confirmar, {project.product.name}
        quedara editable por 10 dias desde ahora.
      </p>
      <div className="rounded-md border border-border bg-muted p-4 text-sm">
        <p>
          Ventana anterior:{" "}
          <strong>{formatEditableUntil(project.editableUntil)}</strong>
        </p>
        <p className="mt-1 text-muted-foreground">
          Reactivaciones previas: {project.reactivationCount}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button disabled={isConfirming} onClick={reactivate} type="button">
          {isConfirming ? "Reactivando" : "Confirmar reactivacion"}
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/account/designs/${project.id}`}>Cancelar</Link>
        </Button>
      </div>
    </Card>
  );
}
