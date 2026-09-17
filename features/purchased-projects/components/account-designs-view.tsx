"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Edit3, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/status-state";
import { TemplatePreview } from "@/features/rendering/components/template-preview";
import {
  DEMO_USER_ID,
  formatEditableUntil,
  isProjectEditable,
} from "../services/purchased-project-lifecycle";
import {
  localPurchasedProjectRepository,
  purchasedProjectsUpdatedEventName,
} from "../services/local-purchased-project-repository";
import { listPurchasedProjectsFromApi } from "../services/purchased-project-api";
import { downloadPurchasedProjectPdf } from "../services/purchased-project-download";
import type { PurchasedProject } from "../types/purchased-project";

type DownloadStatus = "idle" | "downloading" | "failed";

export function AccountDesignsView() {
  const [projects, setProjects] = useState<PurchasedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadStates, setDownloadStates] = useState<
    Record<string, DownloadStatus>
  >({});

  async function syncProjects() {
    try {
      const supabaseProjects = await listPurchasedProjectsFromApi();

      if (supabaseProjects.length > 0) {
        setProjects(supabaseProjects);
        setIsLoading(false);
        return;
      }
    } catch {
      // Keep the MVP usable if Supabase is unavailable.
    }

    setProjects(await localPurchasedProjectRepository.listByUser(DEMO_USER_ID));
    setIsLoading(false);
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      void syncProjects();
    });

    window.addEventListener("storage", syncProjects);
    window.addEventListener(purchasedProjectsUpdatedEventName, syncProjects);

    return () => {
      window.removeEventListener("storage", syncProjects);
      window.removeEventListener(purchasedProjectsUpdatedEventName, syncProjects);
    };
  }, []);

  async function downloadProject(project: PurchasedProject) {
    setDownloadStates((current) => ({
      ...current,
      [project.id]: "downloading",
    }));

    try {
      const updatedProject = await downloadPurchasedProjectPdf(project);
      setProjects((current) =>
        current.map((item) =>
          item.id === updatedProject.id ? updatedProject : item,
        ),
      );
      setDownloadStates((current) => ({
        ...current,
        [project.id]: "idle",
      }));
    } catch {
      setDownloadStates((current) => ({
        ...current,
        [project.id]: "failed",
      }));
    }
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Estamos cargando los productos personalizados comprados."
        title="Cargando mis disenos"
      />
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        action={
          <Button asChild>
            <Link href="/catalog">Explorar productos</Link>
          </Button>
        }
        description="Cuando confirmes un checkout demo, cada producto personalizado aparecera aca con su periodo de edicion."
        title="Todavia no tenes disenos comprados"
      />
    );
  }

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-medium text-primary">Cuenta demo</p>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">
          Mis disenos
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Cada compra crea una copia editable durante 10 dias. El arte base se
          conserva y solo se modifican las capas de texto.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {projects.map((project) => {
          const editable = isProjectEditable(project);
          const downloadState = downloadStates[project.id] ?? "idle";

          return (
            <Card
              className="grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)]"
              key={project.id}
            >
              <TemplatePreview
                compact
                scene={project.scene}
                templateId={project.templateId}
                values={{}}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="neutral">{project.product.pieceTypeName}</Badge>
                  <Badge tone={editable ? "free" : "neutral"}>
                    {editable ? "Editable" : "Bloqueado"}
                  </Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold">
                  {project.product.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {project.product.visualFormat ??
                    `${project.template.widthMm} x ${project.template.heightMm} mm`}
                </p>
                <p className="mt-3 text-sm font-medium">
                  {editable
                    ? `Editable hasta ${formatEditableUntil(project.editableUntil)}`
                    : "Edicion finalizada"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Versiones generadas: {project.generatedVersions.length}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {editable ? (
                    <Button asChild size="sm">
                      <Link href={`/account/designs/${project.id}/edit`}>
                        <Edit3 aria-hidden="true" />
                        Editar diseno
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link href={`/account/designs/${project.id}/reactivate`}>
                        <RefreshCw aria-hidden="true" />
                        Reactivar edicion
                      </Link>
                    </Button>
                  )}
                  <Button
                    disabled={downloadState === "downloading"}
                    onClick={() => downloadProject(project)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Download aria-hidden="true" />
                    {downloadState === "downloading"
                      ? "Preparando"
                      : "Descargar PDF"}
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/account/designs/${project.id}`}>Ver</Link>
                  </Button>
                </div>

                {downloadState === "failed" ? (
                  <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-2 text-sm text-danger">
                    No pudimos generar el PDF. Intenta nuevamente.
                  </p>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
