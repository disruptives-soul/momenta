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
  demoPersonalizationProjectId,
  type PersonalizationDraft,
} from "@/features/personalization/types/personalization-draft";
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
  const [draft] = useState<PersonalizationDraft>(loadPersonalizationDraft);
  const [downloadState, setDownloadState] =
    useState<PrototypeDownloadState>("available");
  const isValidProject = isValidPrototypeProject(projectId);
  const isComplete = hasCompletePrototypeDraft(draft);

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
        description="Esta pantalla usa un proyecto mock controlado para la Etapa 1."
        title="Proyecto mock inválido"
      />
    );
  }

  if (!isComplete) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href="/collections/space-birthday/personalize">
              Completar personalización
            </Link>
          </Button>
        }
        description="No inventamos valores silenciosamente. Primero completá la invitación."
        title="Faltan datos para la descarga simulada"
      />
    );
  }

  function simulateDownload() {
    setDownloadState("downloading");
    trackValidationEvent("download_clicked", resultEventPayload);

    window.setTimeout(() => {
      setDownloadState("completed");
      trackValidationEvent("download_simulated", resultEventPayload);
    }, 650);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-start">
      <PrototypeInvitationPreview compact values={draft.values} />

      <div className="grid gap-5">
        <Card className="grid gap-5">
          <div>
            <Badge tone="free">Free</Badge>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
              Tu invitación está lista
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              En la versión final podrás descargarla en PNG y PDF, lista para
              compartir o imprimir. En esta etapa la descarga es una simulación.
            </p>
          </div>

          <div className="grid gap-3 rounded-md border border-border bg-muted p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Colección</p>
              <p className="font-semibold">Space Birthday</p>
            </div>
            <div>
              <p className="text-muted-foreground">Producto</p>
              <p className="font-semibold">Invitación esencial</p>
            </div>
            <div>
              <p className="text-muted-foreground">Formatos futuros</p>
              <p className="font-semibold">PNG y PDF</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              disabled={downloadState === "downloading"}
              onClick={simulateDownload}
              type="button"
            >
              <Download aria-hidden="true" />
              {downloadState === "downloading"
                ? "Simulando descarga"
                : "Descargar invitación"}
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/projects/${demoPersonalizationProjectId}/preview`}>
                Volver a ver el diseño
              </Link>
            </Button>
          </div>

          {downloadState === "completed" ? (
            <p className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
              Descarga simulada completada: momenta-space-birthday-demo.pdf
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
