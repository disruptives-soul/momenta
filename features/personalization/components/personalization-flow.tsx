"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import {
  getProductBySlug,
  getRenderingTemplateForProduct,
  listProducts,
} from "@/features/products/services/product-catalog";
import { renderingTemplates } from "@/features/rendering/templates/template-registry";
import {
  createDefaultTextElement,
  createTextSceneFromTemplate,
  getTextSceneConstraints,
} from "@/features/rendering/templates/text-scene";
import {
  loadPersonalizationDraft,
  savePersonalizationDraft,
} from "../services/personalization-draft-storage";
import {
  clampTextElementToSafeArea,
  createCenteredTextElementInSafeArea,
} from "../services/text-scene-safe-area";
import {
  createInitialPersonalizationDraft,
  demoPersonalizationProjectId,
  type PersonalizationDraft,
  type PersonalizationTextScenes,
  type PersonalizationValues,
} from "../types/personalization-draft";
import type { TextElement } from "@/features/rendering/templates/template-types";
import type { InvitationTemplate } from "@/features/rendering/templates/template-types";
import type { PrototypeProduct } from "@/features/products/data/mock-products";

const PersonalizationEditor = dynamic(
  () =>
    import("./personalization-editor").then(
      (module) => module.PersonalizationEditor,
    ),
  {
    loading: () => (
      <div className="min-h-[680px] w-full rounded-md border border-border bg-surface shadow-md" />
    ),
    ssr: false,
  },
);

type PersonalizationHistory = {
  past: Array<{
    values: PersonalizationValues;
    valuesByTemplate: PersonalizationDraft["valuesByTemplate"];
    layouts: PersonalizationDraft["layouts"];
    scenes: PersonalizationTextScenes;
  }>;
  future: Array<{
    values: PersonalizationValues;
    valuesByTemplate: PersonalizationDraft["valuesByTemplate"];
    layouts: PersonalizationDraft["layouts"];
    scenes: PersonalizationTextScenes;
  }>;
};

type PersonalizationFlowProps = {
  productSlug?: string;
};

function getTemplateDefaults(templateId: string): PersonalizationValues {
  const template =
    renderingTemplates.find((item) => item.id === templateId) ?? renderingTemplates[0];

  return Object.fromEntries(
    Object.entries(template.fields).map(([key, field]) => [
      key,
      field.defaultValue,
    ]),
  );
}

function scopeDraftToProduct(
  draft: PersonalizationDraft,
  product: PrototypeProduct,
  template: InvitationTemplate,
): PersonalizationDraft {
  const templateValues =
    draft.valuesByTemplate[template.id] ?? getTemplateDefaults(template.id);

  return {
    ...draft,
    collectionSlug: product.collectionSlug as PersonalizationDraft["collectionSlug"],
    productCode: product.slug,
    templateId: template.id,
    values: templateValues,
    valuesByTemplate: {
      ...draft.valuesByTemplate,
      [template.id]: templateValues,
    },
    layouts: {
      ...draft.layouts,
      [template.id]: draft.layouts[template.id] ?? {},
    },
    scenes: {
      ...draft.scenes,
      [template.id]:
        draft.scenes[template.id] ?? createTextSceneFromTemplate(template),
    },
  };
}

export function PersonalizationFlow({ productSlug = "invitation" }: PersonalizationFlowProps) {
  const router = useRouter();
  const activeProduct =
    getProductBySlug(productSlug) ?? getProductBySlug("invitation") ?? listProducts()[0];
  const productTemplate =
    getRenderingTemplateForProduct(activeProduct) ?? renderingTemplates[0];
  const [draft, setDraft] = useState<PersonalizationDraft>(
    () =>
      scopeDraftToProduct(
        createInitialPersonalizationDraft(),
        activeProduct,
        productTemplate,
      ),
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [history, setHistory] = useState<PersonalizationHistory>({
    past: [],
    future: [],
  });
  const activeTemplate = productTemplate;
  const activeScene =
    draft.scenes[activeTemplate.id] ?? createTextSceneFromTemplate(activeTemplate);
  const activeConstraints = getTextSceneConstraints(activeTemplate);

  useEffect(() => {
    let active = true;

    window.queueMicrotask(() => {
      if (!active) {
        return;
      }

      setDraft(
        scopeDraftToProduct(
          loadPersonalizationDraft(),
          activeProduct,
          activeTemplate,
        ),
      );
      setIsHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [activeProduct, activeTemplate]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    savePersonalizationDraft(draft);
  }, [draft, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    trackValidationEvent("personalization_started", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
  }, [draft.collectionSlug, draft.productCode, isHydrated]);

  function pushHistory() {
    setHistory((currentHistory) => ({
      past: [
        ...currentHistory.past,
        {
          values: draft.values,
          valuesByTemplate: draft.valuesByTemplate,
          layouts: draft.layouts,
          scenes: draft.scenes,
        },
      ].slice(-30),
      future: [],
    }));
  }

  function setTextScene(nextScene: TextElement[]) {
    pushHistory();
    setDraft((currentDraft) => ({
      ...currentDraft,
      scenes: {
        ...currentDraft.scenes,
        [currentDraft.templateId]: nextScene.map((element) =>
          clampTextElementToSafeArea(element, activeTemplate),
        ),
      },
    }));
  }

  function updateTextElement(
    elementId: string,
    patch: Partial<TextElement>,
  ) {
    setTextScene(
      activeScene.map((element) =>
        element.id === elementId ? { ...element, ...patch } : element,
      ),
    );
  }

  function addTextElement() {
    setTextScene([
      ...activeScene,
      createCenteredTextElementInSafeArea(
        createDefaultTextElement(activeTemplate, activeScene.length + 1),
        activeTemplate,
      ),
    ]);
  }

  function duplicateTextElement(elementId: string) {
    const element = activeScene.find((item) => item.id === elementId);

    if (!element) {
      return;
    }

    setTextScene([
      ...activeScene,
      {
        ...element,
        id: `${element.id}-copy-${Date.now()}`,
        label: `${element.label} copia`,
        x: element.x + 48,
        y: element.y + 48,
      },
    ]);
  }

  function deleteTextElement(elementId: string) {
    setTextScene(activeScene.filter((element) => element.id !== elementId));
  }

  function undo() {
    const previousSnapshot = history.past.at(-1);

    if (!previousSnapshot) {
      return;
    }

    setHistory((currentHistory) => ({
      past: currentHistory.past.slice(0, -1),
      future: [
        {
          values: draft.values,
          valuesByTemplate: draft.valuesByTemplate,
          layouts: draft.layouts,
          scenes: draft.scenes,
        },
        ...currentHistory.future,
      ].slice(0, 30),
    }));
    setDraft((currentDraft) => ({
      ...currentDraft,
      values: previousSnapshot.values,
      valuesByTemplate: previousSnapshot.valuesByTemplate,
      layouts: previousSnapshot.layouts,
      scenes: previousSnapshot.scenes,
    }));
  }

  function redo() {
    const nextSnapshot = history.future[0];

    if (!nextSnapshot) {
      return;
    }

    setHistory((currentHistory) => ({
      past: [
        ...currentHistory.past,
        {
          values: draft.values,
          valuesByTemplate: draft.valuesByTemplate,
          layouts: draft.layouts,
          scenes: draft.scenes,
        },
      ].slice(-30),
      future: currentHistory.future.slice(1),
    }));
    setDraft((currentDraft) => ({
      ...currentDraft,
      values: nextSnapshot.values,
      valuesByTemplate: nextSnapshot.valuesByTemplate,
      layouts: nextSnapshot.layouts,
      scenes: nextSnapshot.scenes,
    }));
  }

  function continueToReview() {
    trackValidationEvent("personalization_completed", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
    savePersonalizationDraft(draft);
    router.push(`/projects/${demoPersonalizationProjectId}/review`);
  }

  return (
    <div className="min-h-screen">
      <PersonalizationEditor
        key={activeTemplate.id}
        canRedo={history.future.length > 0}
        canUndo={history.past.length > 0}
        constraints={activeConstraints}
        exitHref={`/products/${activeProduct.slug}`}
        onAddTextElement={addTextElement}
        onContinue={continueToReview}
        onDeleteTextElement={deleteTextElement}
        onDuplicateTextElement={duplicateTextElement}
        onRedo={redo}
        onUndo={undo}
        onUpdateTextElement={updateTextElement}
        productName={activeProduct.name}
        scene={activeScene}
        template={activeTemplate}
      />
    </div>
  );
}
