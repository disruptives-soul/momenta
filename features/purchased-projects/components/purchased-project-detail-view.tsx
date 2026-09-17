"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, Edit3, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/status-state";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { TemplatePreview } from "@/features/rendering/components/template-preview";
import {
  addDays,
  formatEditableUntil,
  isProjectEditable,
  reactivatePurchasedProject,
} from "../services/purchased-project-lifecycle";
import { localPurchasedProjectRepository } from "../services/local-purchased-project-repository";
import {
  getPurchasedProjectFromApi,
  updatePurchasedProjectInApi,
} from "../services/purchased-project-api";
import { downloadPurchasedProjectPdf } from "../services/purchased-project-download";
import type { PurchasedProject } from "../types/purchased-project";

type PurchasedProjectDetailViewProps = {
  projectId: string;
};

export function PurchasedProjectDetailView({
  projectId,
}: PurchasedProjectDetailViewProps) {
  const searchParams = useSearchParams();
  const debugLifecycle = searchParams.get("debugLifecycle") === "1";
  const [project, setProject] = useState<PurchasedProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadState, setDownloadState] = useState<
    "idle" | "downloading" | "failed"
  >("idle");

  useEffect(() => {
    let active = true;

    async function loadProject() {
      let nextProject: PurchasedProject | null = null;

      try {
        nextProject = await getPurchasedProjectFromApi(projectId);
      } catch {
        nextProject = null;
      }

      if (!nextProject) {
        nextProject = await localPurchasedProjectRepository.getById(projectId);
      }

      if (!active) {
        return;
      }

      setProject(nextProject);
      setIsLoading(false);

      if (nextProject && !isProjectEditable(nextProject)) {
        trackValidationEvent("project_locked_viewed", {
          productId: nextProject.productId,
          projectId: nextProject.id,
          templateId: nextProject.templateId,
        });
      }
    }

    void loadProject();

    return () => {
      active = false;
    };
  }, [projectId]);

  async function updateProject(nextProject: PurchasedProject) {
    await localPurchasedProjectRepository.update(nextProject);
    try {
      await updatePurchasedProjectInApi(nextProject);
    } catch {
      // Local fallback keeps the MVP usable without Supabase writes.
    }
    setProject(nextProject);
  }

  async function downloadProject() {
    if (!project) {
      return;
    }

    setDownloadState("downloading");

    try {
      const updatedProject = await downloadPurchasedProjectPdf(project);
      setProject(updatedProject);
      setDownloadState("idle");
    } catch {
      setDownloadState("failed");
    }
  }

  async function reactivateProject() {
    if (!project) {
      return;
    }

    trackValidationEvent("reactivation_cta_clicked", {
      productId: project.productId,
      projectId: project.id,
      templateId: project.templateId,
    });
    const updatedProject = reactivatePurchasedProject(project);
    await updateProject(updatedProject);
    trackValidationEvent("project_reactivated", {
      productId: project.productId,
      projectId: project.id,
      templateId: project.templateId,
    });
  }

  if (isLoading) {
    return <LoadingState title="Cargando diseno" />;
  }

  if (!project) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href="/account/designs">Volver a mis disenos</Link>
          </Button>
        }
        description="No encontramos este proyecto comprado."
        title="Diseno no encontrado"
      />
    );
  }

  const editable = isProjectEditable(project);

  return (
    <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
      <div>
        <TemplatePreview
          ariaLabel={`Vista previa de ${project.product.name}`}
          scene={project.scene}
          templateId={project.templateId}
          values={{}}
        />
      </div>

      <Card className="grid gap-5">
        <div>
          <p className="text-sm font-medium text-primary">Diseno comprado</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {project.product.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {project.product.visualFormat ??
              `${project.template.widthMm} x ${project.template.heightMm} mm`}
          </p>
        </div>

        <div className="rounded-md border border-border bg-muted p-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={editable ? "free" : "neutral"}>
              {editable ? "Editable" : "Bloqueado"}
            </Badge>
            <Badge tone="neutral">
              {project.generatedVersions.length} versiones
            </Badge>
          </div>
          <p className="mt-3 text-sm font-medium">
            {editable
              ? `Editable hasta ${formatEditableUntil(project.editableUntil)}`
              : "Edicion finalizada"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Compra demo: {formatEditableUntil(project.purchasedAt)}
          </p>
        </div>

        <div className="grid gap-3">
          {editable ? (
            <Button asChild>
              <Link href={`/account/designs/${project.id}/edit`}>
                <Edit3 aria-hidden="true" />
                Editar diseno
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/account/designs/${project.id}/reactivate`}>
                <RefreshCw aria-hidden="true" />
                Reactivar edicion
              </Link>
            </Button>
          )}
          <Button
            disabled={downloadState === "downloading"}
            onClick={downloadProject}
            type="button"
            variant="secondary"
          >
            <Download aria-hidden="true" />
            {downloadState === "downloading"
              ? "Preparando PDF"
              : "Descargar PDF"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/account/designs">Volver a mis disenos</Link>
          </Button>
        </div>

        {downloadState === "failed" ? (
          <p className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            No pudimos generar el PDF. Intenta nuevamente.
          </p>
        ) : null}

        {project.generatedVersions.length > 0 ? (
          <div>
            <h2 className="text-sm font-semibold">Versiones generadas</h2>
            <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
              {project.generatedVersions.slice(-5).map((version) => (
                <li key={version.id}>
                  {formatEditableUntil(version.createdAt)}
                  {version.fileName ? ` - ${version.fileName}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {debugLifecycle ? (
          <div className="grid gap-2 rounded-md border border-warning/40 bg-warning/10 p-3">
            <p className="text-sm font-semibold">Debug lifecycle</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  updateProject({
                    ...project,
                    editableUntil: addDays(new Date(), 10).toISOString(),
                  })
                }
                size="sm"
                type="button"
                variant="secondary"
              >
                Force editable
              </Button>
              <Button
                onClick={() =>
                  updateProject({
                    ...project,
                    editableUntil: addDays(new Date(), -1).toISOString(),
                  })
                }
                size="sm"
                type="button"
                variant="secondary"
              >
                Force locked
              </Button>
              <Button
                onClick={reactivateProject}
                size="sm"
                type="button"
                variant="secondary"
              >
                Reactivar
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
