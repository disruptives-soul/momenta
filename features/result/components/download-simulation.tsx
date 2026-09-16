"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/status-state";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { loadPersonalizationDraft } from "@/features/personalization/services/personalization-draft-storage";
import {
  createInitialPersonalizationDraft,
  demoPersonalizationProjectId,
  getDraftTemplateLayout,
  getDraftTemplateScene,
  type PersonalizationDraft,
} from "@/features/personalization/types/personalization-draft";
import {
  getRenderingTemplate,
  renderingTemplates,
} from "@/features/rendering/templates/template-registry";
import { createTextSceneFromTemplate } from "@/features/rendering/templates/text-scene";
import {
  hasCompletePrototypeDraft,
  isValidPrototypeProject,
  resultEventPayload,
} from "../services/prototype-result";
import type { PrototypeDownloadState } from "../types/prototype-result-state";
import { PrototypeInvitationPreview } from "./prototype-invitation-preview";

type DownloadSimulationProps = {
  projectId: string;
};

export function DownloadSimulation({ projectId }: DownloadSimulationProps) {
  const [draft, setDraft] = useState<PersonalizationDraft>(
    createInitialPersonalizationDraft,
  );
  const [downloadState, setDownloadState] =
    useState<PrototypeDownloadState>("available");
  const isValidProject = isValidPrototypeProject(projectId);
  const isComplete = hasCompletePrototypeDraft(draft);
  const template = getRenderingTemplate(draft.templateId);
  const activeLayout = template ? getDraftTemplateLayout(draft, template.id) : {};
  const activeScene = template ? getDraftTemplateScene(draft, template.id) : [];
  const downloadableTemplates = [...renderingTemplates].sort((left, right) => {
    if (left.id === draft.templateId) return -1;
    if (right.id === draft.templateId) return 1;
    return 0;
  });

  useEffect(() => {
    window.queueMicrotask(() => {
      setDraft(loadPersonalizationDraft());
    });
  }, []);

  useEffect(() => {
    if (isValidProject && isComplete) {
      trackValidationEvent("download_page_viewed", resultEventPayload);
      trackValidationEvent("premium_upsell_viewed", resultEventPayload);
    }
  }, [isComplete, isValidProject]);

  if (!isValidProject) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href="/collections/space-birthday">Volver a Space Birthday</Link>
          </Button>
        }
        description="No encontramos una invitación disponible para descargar."
        title="Invitación no disponible"
      />
    );
  }

  if (!isComplete || !template) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href="/collections/space-birthday/personalize">
              Volver al editor
            </Link>
          </Button>
        }
        description="No inventamos valores silenciosamente. Primero completá la invitación."
        title="Falta elegir una plantilla"
      />
    );
  }

  const activeTemplate = template;

  async function renderAndDownload() {
    setDownloadState("downloading");
    trackValidationEvent("download_clicked", resultEventPayload);

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "pdf",
          templates: downloadableTemplates.map((item) => ({
            templateId: item.id,
            data: draft.valuesByTemplate[item.id] ?? draft.values,
            layout: getDraftTemplateLayout(draft, item.id),
            scene: draft.scenes[item.id] ?? createTextSceneFromTemplate(item),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Render failed.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "momenta-space-birthday-templates.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadState("completed");
      trackValidationEvent("download_simulated", resultEventPayload);
    } catch {
      setDownloadState("failed");
      trackValidationEvent("download_failed", resultEventPayload);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-start">
      <PrototypeInvitationPreview
        compact
        layout={activeLayout}
        scene={activeScene}
        templateId={activeTemplate.id}
        values={draft.values}
      />

      <div className="grid gap-5">
        <Card className="grid gap-5">
          <div>
            <Badge tone="free">Free</Badge>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
              Tus plantillas estan listas
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Esta descarga genera un PDF multipagina con todas las plantillas
              personalizadas.
            </p>
          </div>

          <div className="grid gap-3 rounded-md border border-border bg-muted p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Colección</p>
              <p className="font-semibold">Space Birthday</p>
            </div>
            <div>
              <p className="text-muted-foreground">Producto</p>
              <p className="font-semibold">
                {downloadableTemplates.length} plantillas personalizadas
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Formatos</p>
              <p className="font-semibold">PDF real</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              disabled={downloadState === "downloading"}
              onClick={renderAndDownload}
              type="button"
            >
              <Download aria-hidden="true" />
              {downloadState === "downloading"
                ? "Renderizando plantillas"
                : "Descargar plantillas"}
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/projects/${demoPersonalizationProjectId}/preview`}>
                Volver a ver el diseño
              </Link>
            </Button>
          </div>

          {downloadState === "completed" ? (
            <p className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
              Descarga generada: momenta-space-birthday-templates.pdf
            </p>
          ) : null}

          {downloadState === "failed" ? (
            <p className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              No pudimos generar las plantillas. Revisa los datos o intenta
              nuevamente.
            </p>
          ) : null}
        </Card>

        <Card className="grid gap-4 border-accent/40 bg-accent/10">
          <div className="flex items-center gap-3">
            <Gift aria-hidden="true" className="size-5 text-accent" />
            <Badge tone="premium">Premium</Badge>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">
              Completa tu celebración con el Stickers pack
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Página A4 con 12 stickers circulares de 5 cm, coordinados con
              Space Birthday.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link
              href="/collections/space-birthday/stickers-pack"
              onClick={() =>
                trackValidationEvent("premium_upsell_clicked", resultEventPayload)
              }
            >
              Ver Stickers pack
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
