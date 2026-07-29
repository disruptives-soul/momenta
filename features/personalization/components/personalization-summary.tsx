"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/status-state";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { spaceInvitationProduct } from "@/features/products/data/mock-products";
import { getStepForField } from "../config/personalization-steps";
import {
  formatPersonalizationValue,
} from "../services/personalization-formatters";
import {
  loadPersonalizationDraft,
  savePersonalizationDraft,
} from "../services/personalization-draft-storage";
import {
  demoPersonalizationProjectId,
  type PersonalizationDraft,
  type PersonalizationFieldKey,
} from "../types/personalization-draft";
import { validateAllPersonalizationValues } from "../validators/personalization-validator";

const summaryFields: Array<{ key: PersonalizationFieldKey; label: string }> = [
  { key: "name", label: "Nombre" },
  { key: "age", label: "Edad" },
  { key: "date", label: "Fecha" },
  { key: "time", label: "Hora" },
  { key: "place", label: "Lugar" },
  { key: "message", label: "Mensaje" },
];

type PersonalizationSummaryProps = {
  projectId: string;
};

export function PersonalizationSummary({ projectId }: PersonalizationSummaryProps) {
  const router = useRouter();
  const [draft] = useState<PersonalizationDraft>(loadPersonalizationDraft);
  const isValidProject = projectId === demoPersonalizationProjectId;
  const errors = validateAllPersonalizationValues(draft.values);
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    trackValidationEvent("review_viewed", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
  }, [draft.collectionSlug, draft.productCode]);

  if (!isValidProject) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href="/collections/space-birthday/personalize">
              Volver a personalizar
            </Link>
          </Button>
        }
        description="Esta ruta usa un proyecto mock controlado para la Etapa 1."
        title="Proyecto mock inválido"
      />
    );
  }


  function editField(field: PersonalizationFieldKey) {
    const step = getStepForField(field);
    savePersonalizationDraft({
      ...draft,
      currentStep: step.id,
    });
    trackValidationEvent("personalization_edit_requested", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
      field,
      step: step.id,
    });
    router.push(`/collections/space-birthday/personalize?step=${step.id}`);
  }

  function requestPreview() {
    if (hasErrors) {
      router.push("/collections/space-birthday/personalize");
      return;
    }

    trackValidationEvent("preview_requested", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
    router.push(`/projects/${projectId}/preview`);
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-4">
        <p className="text-sm font-medium text-primary">
          Space Birthday · {spaceInvitationProduct.name}
        </p>
        <h1 className="text-3xl font-semibold md:text-5xl">Revisar datos</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Todavía no se generó el diseño. Revisá que la información esté bien
          antes de ir al shell de preview.
        </p>
      </Card>

      {hasErrors ? (
        <ErrorState
          action={
            <Button asChild>
              <Link href="/collections/space-birthday/personalize">
                Completar datos
              </Link>
            </Button>
          }
          description="Hay datos obligatorios incompletos o inválidos."
          title="Faltan datos para revisar"
        />
      ) : (
        <Card>
          <dl className="grid gap-4">
            {summaryFields.map((field) => (
              <div
                className="grid gap-3 rounded-md border border-border bg-muted p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                key={field.key}
              >
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {formatPersonalizationValue(field.key, draft.values)}
                  </dd>
                </div>
                <Button
                  onClick={() => editField(field.key)}
                  type="button"
                  variant="secondary"
                >
                  Editar
                </Button>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="secondary">
          <Link href="/collections/space-birthday/personalize">
            Editar datos
          </Link>
        </Button>
        <Button disabled={hasErrors} onClick={requestPreview} type="button">
          Generar vista previa
        </Button>
      </div>
    </div>
  );
}
