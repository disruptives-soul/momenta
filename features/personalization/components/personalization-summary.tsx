"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/status-state";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { TemplatePreview } from "@/features/rendering/components/template-preview";
import { getRenderingTemplate } from "@/features/rendering/templates/template-registry";
import { loadPersonalizationDraft } from "../services/personalization-draft-storage";
import {
  demoPersonalizationProjectId,
  getDraftTemplateLayout,
  type PersonalizationDraft,
} from "../types/personalization-draft";

type PersonalizationSummaryProps = {
  projectId: string;
};

export function PersonalizationSummary({ projectId }: PersonalizationSummaryProps) {
  const router = useRouter();
  const [draft] = useState<PersonalizationDraft>(loadPersonalizationDraft);
  const isValidProject = projectId === demoPersonalizationProjectId;
  const template = getRenderingTemplate(draft.templateId);

  useEffect(() => {
    trackValidationEvent("review_viewed", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
  }, [draft.collectionSlug, draft.productCode]);

  if (!isValidProject || !template) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href="/collections/space-birthday/personalize">
              Volver al editor
            </Link>
          </Button>
        }
        description="No encontramos una plantilla disponible para revisar."
        title="Plantilla no disponible"
      />
    );
  }

  function requestPreview() {
    trackValidationEvent("preview_requested", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
    router.push(`/projects/${projectId}/preview`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-start">
      <TemplatePreview
        layout={getDraftTemplateLayout(draft, template.id)}
        templateId={template.id}
        values={draft.values}
      />

      <Card className="grid gap-5">
        <div>
          <p className="text-sm font-medium text-primary">Revisión</p>
          <h1 className="mt-2 text-3xl font-semibold">Revisá la plantilla</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Confirmá que los textos se ven bien antes de generar el archivo final.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={requestPreview} type="button">
            Generar vista previa
          </Button>
          <Button asChild variant="secondary">
            <Link href="/collections/space-birthday/personalize">
              Editar textos
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
