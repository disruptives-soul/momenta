"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  getPrototypeProjectErrors,
  hasCompletePrototypeDraft,
  isValidPrototypeProject,
  resultEventPayload,
} from "../services/prototype-result";
import type { PrototypeGenerationState } from "../types/prototype-result-state";
import { PrototypeInvitationPreview } from "./prototype-invitation-preview";

const generationMessages = [
  "Estamos preparando tu invitación",
  "Aplicando los datos de tu celebración",
  "Tu vista previa está lista",
];

type PreviewSimulationProps = {
  projectId: string;
  simulateError?: boolean;
};

export function PreviewSimulation({
  projectId,
  simulateError = false,
}: PreviewSimulationProps) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [draft] = useState<PersonalizationDraft>(loadPersonalizationDraft);
  const [state, setState] = useState<PrototypeGenerationState>("generating");
  const [messageIndex, setMessageIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const isValidProject = isValidPrototypeProject(projectId);
  const isComplete = hasCompletePrototypeDraft(draft);
  const errors = getPrototypeProjectErrors(draft);

  useEffect(() => {
    if (!isValidProject || !isComplete) {
      return;
    }

    trackValidationEvent("preview_generation_started", resultEventPayload);

    const timers = [
      window.setTimeout(() => setMessageIndex(1), 550),
      window.setTimeout(() => setMessageIndex(2), 1050),
      window.setTimeout(() => {
        if (simulateError && attempt === 0) {
          setState("failed");
          trackValidationEvent("preview_generation_failed", resultEventPayload);
          return;
        }

        setState("ready");
        trackValidationEvent("preview_generation_completed", resultEventPayload);
        trackValidationEvent("preview_viewed", resultEventPayload);
      }, 1450),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [attempt, isComplete, isValidProject, simulateError]);

  useEffect(() => {
    if (state === "ready") {
      previewRef.current?.focus();
    }
  }, [state]);

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
        description={`Faltan datos o hay valores inválidos: ${Object.keys(errors).join(", ")}.`}
        title="Falta completar la personalización"
      />
    );
  }

  if (state === "failed") {
    return (
      <ErrorState
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                setState("generating");
                setMessageIndex(0);
                setAttempt((value) => value + 1);
              }}
              type="button"
            >
              Intentar nuevamente
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/projects/${projectId}/review`}>Volver a revisión</Link>
            </Button>
          </div>
        }
        description="Tus datos siguen guardados. Puedes intentarlo nuevamente o revisarlos."
        title="No pudimos preparar la vista previa"
      />
    );
  }

  if (state === "generating") {
    return (
      <Card className="mx-auto grid max-w-2xl gap-6 text-center" aria-live="polite">
        <div>
          <p className="text-sm font-medium text-primary">Generación simulada</p>
          <h1 className="mt-3 text-3xl font-semibold">
            {generationMessages[messageIndex]}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esto es una simulación breve del prototipo. No se genera ningún
            archivo real.
          </p>
        </div>
        <div aria-label="Progreso de generación" className="grid gap-2">
          {generationMessages.map((message, index) => (
            <div
              className="flex items-center gap-3 rounded-md border border-border bg-muted p-3 text-left text-sm"
              key={message}
            >
              <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <span
                className={
                  index <= messageIndex ? "font-medium" : "text-muted-foreground"
                }
              >
                {message}
              </span>
            </div>
          ))}
        </div>
        <Button disabled type="button">
          Preparando preview
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-start">
      <div ref={previewRef} tabIndex={-1}>
        <PrototypeInvitationPreview values={draft.values} />
      </div>
      <Card className="grid gap-5">
        <div>
          <p className="text-sm font-medium text-primary">
            Tu vista previa está lista
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Revisá el diseño</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Revisa que todos los datos estén correctos antes de continuar.
          </p>
        </div>
        <div className="grid gap-3">
          <Button
            onClick={() => {
              trackValidationEvent("preview_confirmed", resultEventPayload);
              router.push(`/projects/${demoPersonalizationProjectId}/download`);
            }}
            type="button"
          >
            Confirmar diseño
          </Button>
          <Button
            asChild
            onClick={() =>
              trackValidationEvent("preview_edit_requested", resultEventPayload)
            }
            variant="secondary"
          >
            <Link href="/collections/space-birthday/personalize">Editar datos</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/projects/${projectId}/review`}>Volver a revisión</Link>
          </Button>
          <Button
            onClick={() => {
              setState("generating");
              setMessageIndex(0);
              setAttempt((value) => value + 1);
            }}
            type="button"
            variant="ghost"
          >
            Regenerar vista previa
          </Button>
        </div>
      </Card>
    </div>
  );
}
