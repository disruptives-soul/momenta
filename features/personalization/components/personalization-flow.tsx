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
import type {
  InvitationTemplate,
  TextElement,
} from "@/features/rendering/templates/template-types";
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
  product?: PrototypeProduct;
  productSlug?: string;
  template?: InvitationTemplate;
};

function getTemplateDefaults(template: InvitationTemplate): PersonalizationValues {
  return Object.fromEntries(
    Object.entries(template.fields).map(([key, field]) => [
      key,
      field.defaultValue,
    ]),
  );
}

function getTemplateSignature(template: InvitationTemplate) {
  return JSON.stringify({
    id: template.id,
    widthMm: template.widthMm,
    heightMm: template.heightMm,
    widthPx: template.widthPx,
    heightPx: template.heightPx,
    safeArea: template.safeArea,
    fields: Object.fromEntries(
      Object.entries(template.fields).map(([key, field]) => [
        key,
        {
          defaultValue: field.defaultValue,
          source: field.source,
          sourceTextKind: field.sourceTextKind,
          x: field.x,
          y: field.y,
          width: field.width,
          fontFamily: field.fontFamily,
          pdfFont: field.pdfFont,
          fontAsset: field.fontAsset,
          fontWeight: field.fontWeight,
          fontSize: field.fontSize,
          fill: field.fill,
          opacity: field.opacity,
          align: field.align,
          maxLines: field.maxLines,
          lineHeight: field.lineHeight,
          letterSpacing: field.letterSpacing,
          rotation: field.rotation,
          path: field.path,
          arc: field.arc,
        },
      ]),
    ),
  });
}

function canReuseStoredTemplate(
  draft: PersonalizationDraft,
  template: InvitationTemplate,
) {
  return (
    draft.templateSnapshot?.id === template.id &&
    getTemplateSignature(draft.templateSnapshot) === getTemplateSignature(template)
  );
}

function getScopedTemplateValues(
  draft: PersonalizationDraft,
  template: InvitationTemplate,
  useStoredValues: boolean,
) {
  const defaults = getTemplateDefaults(template);
  const storedValues = useStoredValues
    ? draft.valuesByTemplate[template.id] ?? {}
    : {};

  return Object.fromEntries(
    Object.entries(defaults).map(([key, defaultValue]) => [
      key,
      typeof storedValues[key] === "string" ? storedValues[key] : defaultValue,
    ]),
  );
}

function sceneMatchesTemplate(
  scene: TextElement[],
  template: InvitationTemplate,
) {
  const fieldIds = Object.keys(template.fields);

  if (scene.length !== fieldIds.length) {
    return false;
  }

  const sceneIds = new Set(scene.map((element) => element.id));

  return fieldIds.every((fieldId) => sceneIds.has(fieldId));
}

function mergeTextElementPatch(
  element: TextElement,
  patch: Partial<TextElement>,
): TextElement {
  return {
    ...element,
    ...patch,
  } as TextElement;
}

function getDraftSceneForTemplate(
  draft: PersonalizationDraft,
  template: InvitationTemplate,
  useStoredScene: boolean,
) {
  const existingScene = draft.scenes[template.id];

  if (
    !useStoredScene ||
    !existingScene ||
    !sceneMatchesTemplate(existingScene, template)
  ) {
    return createTextSceneFromTemplate(template);
  }

  return existingScene;
}

function scopeDraftToProduct(
  draft: PersonalizationDraft,
  product: PrototypeProduct,
  template: InvitationTemplate,
): PersonalizationDraft {
  const canReuseDraftTemplate = canReuseStoredTemplate(draft, template);
  const templateValues = getScopedTemplateValues(
    draft,
    template,
    canReuseDraftTemplate,
  );
  const templateScene = getDraftSceneForTemplate(
    draft,
    template,
    canReuseDraftTemplate,
  );

  return {
    ...draft,
    collectionSlug: product.collectionSlug,
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
      [template.id]: templateScene,
    },
    productSnapshot: product,
    templateSnapshot: template,
  };
}

export function PersonalizationFlow({
  product,
  productSlug = "invitation",
  template,
}: PersonalizationFlowProps) {
  const router = useRouter();
  const activeProduct =
    product ??
    getProductBySlug(productSlug) ??
    getProductBySlug("invitation") ??
    listProducts()[0];
  const productTemplate =
    template ?? getRenderingTemplateForProduct(activeProduct) ?? renderingTemplates[0];
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
        element.id === elementId
          ? mergeTextElementPatch(element, patch)
          : element,
      ),
    );
  }

  function updateTextElements(
    patches: Array<{ elementId: string; patch: Partial<TextElement> }>,
  ) {
    const patchesById = new Map(
      patches.map(({ elementId, patch }) => [elementId, patch]),
    );

    setTextScene(
      activeScene.map((element) => {
        const patch = patchesById.get(element.id);

        return patch ? mergeTextElementPatch(element, patch) : element;
      }),
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
        onRedo={redo}
        onSetScene={setTextScene}
        onUndo={undo}
        onUpdateTextElement={updateTextElement}
        onUpdateTextElements={updateTextElements}
        productName={activeProduct.name}
        scene={activeScene}
        template={activeTemplate}
      />
    </div>
  );
}
