"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
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
  createInitialPersonalizationDraft,
  demoPersonalizationProjectId,
  type PersonalizationDraft,
  type PersonalizationTextScenes,
  type PersonalizationValues,
} from "../types/personalization-draft";
import type { TextElement } from "@/features/rendering/templates/template-types";

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

export function PersonalizationFlow() {
  const router = useRouter();
  const [draft, setDraft] = useState<PersonalizationDraft>(
    createInitialPersonalizationDraft,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [history, setHistory] = useState<PersonalizationHistory>({
    past: [],
    future: [],
  });
  const activeTemplate =
    renderingTemplates.find((template) => template.id === draft.templateId) ??
    renderingTemplates[0];
  const activeScene =
    draft.scenes[activeTemplate.id] ?? createTextSceneFromTemplate(activeTemplate);
  const activeConstraints = getTextSceneConstraints(activeTemplate);

  useEffect(() => {
    let active = true;

    window.queueMicrotask(() => {
      if (!active) {
        return;
      }

      setDraft(loadPersonalizationDraft());
      setIsHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

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

  function selectTemplate(templateId: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      templateId,
      values:
        currentDraft.valuesByTemplate[templateId] ??
        getTemplateDefaults(templateId),
      valuesByTemplate: {
        ...currentDraft.valuesByTemplate,
        [templateId]:
          currentDraft.valuesByTemplate[templateId] ??
          getTemplateDefaults(templateId),
      },
      layouts: {
        ...currentDraft.layouts,
        [templateId]: currentDraft.layouts[templateId] ?? {},
      },
      scenes: {
        ...currentDraft.scenes,
        [templateId]:
          currentDraft.scenes[templateId] ??
          createTextSceneFromTemplate(
            renderingTemplates.find((item) => item.id === templateId) ??
              renderingTemplates[0],
          ),
      },
    }));
  }

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
        [currentDraft.templateId]: nextScene,
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
      createDefaultTextElement(activeTemplate, activeScene.length + 1),
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

  function reorderTextElement(elementId: string, direction: -1 | 1) {
    const index = activeScene.findIndex((element) => element.id === elementId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= activeScene.length) {
      return;
    }

    const nextScene = [...activeScene];
    const [element] = nextScene.splice(index, 1);
    nextScene.splice(nextIndex, 0, element);
    setTextScene(nextScene);
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

  function requestPreview() {
    trackValidationEvent("personalization_completed", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
    trackValidationEvent("preview_requested", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
    router.push(`/projects/${demoPersonalizationProjectId}/preview`);
  }

  return (
    <div className="min-h-screen">
      <PersonalizationEditor
        key={activeTemplate.id}
        canRedo={history.future.length > 0}
        canUndo={history.past.length > 0}
        constraints={activeConstraints}
        onAddTextElement={addTextElement}
        onContinue={requestPreview}
        onDeleteTextElement={deleteTextElement}
        onDuplicateTextElement={duplicateTextElement}
        onRedo={redo}
        onReorderTextElement={reorderTextElement}
        onTemplateChange={selectTemplate}
        onUndo={undo}
        onUpdateTextElement={updateTextElement}
        scene={activeScene}
        template={activeTemplate}
        templates={renderingTemplates}
      />
    </div>
  );
}
