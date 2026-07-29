"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { Textarea } from "@/components/ui/textarea";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { spaceInvitationProduct } from "@/features/products/data/mock-products";
import {
  getStepIndex,
  personalizationSteps,
} from "../config/personalization-steps";
import {
  loadPersonalizationDraft,
  savePersonalizationDraft,
} from "../services/personalization-draft-storage";
import { getPersonalizationField } from "../services/personalization-fields";
import {
  demoPersonalizationProjectId,
  type PersonalizationDraft,
  type PersonalizationFieldKey,
} from "../types/personalization-draft";
import {
  validatePersonalizationStep,
  type PersonalizationErrors,
} from "../validators/personalization-validator";
import { CharacterCounter } from "./character-counter";
import { ExitPersonalizationLink } from "./exit-personalization-link";
import { FormNavigation } from "./form-navigation";

export function PersonalizationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<
    Partial<Record<PersonalizationFieldKey, HTMLInputElement | HTMLTextAreaElement | null>>
  >({});
  const [draft, setDraft] = useState<PersonalizationDraft>(loadPersonalizationDraft);
  const [errors, setErrors] = useState<PersonalizationErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<PersonalizationFieldKey, boolean>>
  >({});

  useEffect(() => {
    savePersonalizationDraft(draft);
  }, [draft]);

  useEffect(() => {
    trackValidationEvent("personalization_started", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
  }, [draft.collectionSlug, draft.productCode]);

  useEffect(() => {
    trackValidationEvent("personalization_step_viewed", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
      step: draft.currentStep,
    });
  }, [draft.collectionSlug, draft.currentStep, draft.productCode]);

  const requestedStep = searchParams.get("step");
  const requestedStepExists = personalizationSteps.some(
    (step) => step.id === requestedStep,
  );
  const currentStepId = requestedStepExists ? String(requestedStep) : draft.currentStep;
  const currentStepIndex = getStepIndex(currentStepId);
  const currentStep = personalizationSteps[currentStepIndex];
  const isLastStep = currentStepIndex === personalizationSteps.length - 1;

  const progressSteps = useMemo(
    () =>
      personalizationSteps.map((step) => ({
        id: step.id,
        label: step.title,
      })),
    [],
  );

  function setFieldValue(field: PersonalizationFieldKey, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      values: {
        ...currentDraft.values,
        [field]: value,
      },
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  }

  function focusFirstError(stepErrors: PersonalizationErrors) {
    const firstErrorField = currentStep.fields.find((field) => stepErrors[field]);

    if (firstErrorField) {
      inputRefs.current[firstErrorField]?.focus();
    }
  }

  function submitCurrentStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const stepErrors = validatePersonalizationStep(currentStep, draft.values);

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      focusFirstError(stepErrors);
      trackValidationEvent("personalization_validation_failed", {
        collectionSlug: draft.collectionSlug,
        productCode: draft.productCode,
        step: currentStep.id,
        field: Object.keys(stepErrors)[0],
      });
      return;
    }

    currentStep.fields.forEach((field) => {
      if (draft.values[field].trim()) {
        trackValidationEvent("personalization_field_completed", {
          collectionSlug: draft.collectionSlug,
          productCode: draft.productCode,
          step: currentStep.id,
          field,
        });
      }
    });

    if (isLastStep) {
      const nextDraft = {
        ...draft,
        currentStep: "review",
      };
      savePersonalizationDraft(nextDraft);
      trackValidationEvent("personalization_completed", {
        collectionSlug: draft.collectionSlug,
        productCode: draft.productCode,
      });
      router.push(`/projects/${demoPersonalizationProjectId}/review`);
      return;
    }

    const nextStep = personalizationSteps[currentStepIndex + 1];
    setDraft((currentDraft) => ({
      ...currentDraft,
      currentStep: nextStep.id,
    }));
    setErrors({});
  }

  function goBack() {
    if (currentStepIndex === 0) {
      return;
    }

    const previousStep = personalizationSteps[currentStepIndex - 1];
    trackValidationEvent("personalization_back_clicked", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
      step: currentStep.id,
    });
    setDraft((currentDraft) => ({
      ...currentDraft,
      currentStep: previousStep.id,
    }));
    setErrors({});
  }

  const hasChanges = Object.values(draft.values).some((value) => value.trim());

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            Space Birthday · {spaceInvitationProduct.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">
            Personalización guiada
          </h1>
        </div>
        <ExitPersonalizationLink
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
          hasChanges={hasChanges}
          href="/collections/space-birthday"
        >
          Salir
        </ExitPersonalizationLink>
      </div>

      <ProgressSteps steps={progressSteps} currentStepId={currentStep.id} />

      <Card className="mx-auto grid w-full max-w-2xl gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Paso {currentStepIndex + 1} de {personalizationSteps.length}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{currentStep.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {currentStep.description}
          </p>
        </div>

        <form className="grid gap-5" onSubmit={submitCurrentStep} noValidate>
          {currentStep.fields.map((fieldKey) => {
            const field = getPersonalizationField(fieldKey);
            const error = errors[fieldKey];
            const fieldId = `personalization-${fieldKey}`;
            const errorId = `${fieldId}-error`;
            const value = draft.values[fieldKey];
            const maxLength = field?.rule.maxLength;

            if (!field) {
              return null;
            }

            const sharedProps = {
              "aria-describedby": error ? errorId : undefined,
              "aria-invalid": Boolean(error),
              id: fieldId,
              name: fieldKey,
              onBlur: () =>
                setTouchedFields((currentTouchedFields) => ({
                  ...currentTouchedFields,
                  [fieldKey]: true,
                })),
              required: field.rule.required,
              value,
            };

            return (
              <div className="grid gap-2" key={field.key}>
                <label className="text-sm font-medium" htmlFor={fieldId}>
                  {field.label}
                  {field.rule.required ? (
                    <span className="text-danger"> *</span>
                  ) : null}
                </label>
                {fieldKey === "message" ? (
                  <Textarea
                    {...sharedProps}
                    maxLength={maxLength}
                    onChange={(event) =>
                      setFieldValue(fieldKey, event.target.value)
                    }
                    placeholder={field.rule.placeholder}
                    ref={(node) => {
                      inputRefs.current[fieldKey] = node;
                    }}
                  />
                ) : (
                  <Input
                    {...sharedProps}
                    inputMode={fieldKey === "age" ? "numeric" : undefined}
                    max={field.rule.maxValue}
                    maxLength={maxLength}
                    min={field.rule.minValue}
                    onChange={(event) =>
                      setFieldValue(fieldKey, event.target.value)
                    }
                    placeholder={field.rule.placeholder}
                    ref={(node) => {
                      inputRefs.current[fieldKey] = node;
                    }}
                    type={
                      fieldKey === "age"
                        ? "number"
                        : field.kind === "date" || field.kind === "time"
                          ? field.kind
                          : "text"
                    }
                  />
                )}
                {maxLength ? (
                  <CharacterCounter
                    alwaysShow={fieldKey === "message" || touchedFields[fieldKey]}
                    maxLength={maxLength}
                    value={value}
                  />
                ) : null}
                <FieldError id={errorId}>{error}</FieldError>
              </div>
            );
          })}

          <FormNavigation
            canGoBack={currentStepIndex > 0}
            isLastStep={isLastStep}
            onBack={goBack}
          />
        </form>
      </Card>
    </div>
  );
}
