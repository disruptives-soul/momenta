"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/status-state";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import {
  createDefaultTextElement,
  getTextSceneConstraints,
} from "@/features/rendering/templates/text-scene";
import { getRenderingTemplate } from "@/features/rendering/templates/template-registry";
import type {
  InvitationTemplate,
  TextElement,
} from "@/features/rendering/templates/template-types";
import {
  clampTextElementToSafeArea,
  createCenteredTextElementInSafeArea,
} from "@/features/personalization/services/text-scene-safe-area";
import {
  isProjectEditable,
  formatEditableUntil,
} from "../services/purchased-project-lifecycle";
import { localPurchasedProjectRepository } from "../services/local-purchased-project-repository";
import type { PurchasedProject } from "../types/purchased-project";

const PersonalizationEditor = dynamic(
  () =>
    import("@/features/personalization/components/personalization-editor").then(
      (module) => module.PersonalizationEditor,
    ),
  {
    loading: () => (
      <div className="min-h-[680px] w-full rounded-md border border-border bg-surface shadow-md" />
    ),
    ssr: false,
  },
);

type PurchasedProjectEditorViewProps = {
  projectId: string;
};

type SceneHistory = {
  past: TextElement[][];
  future: TextElement[][];
};

export function PurchasedProjectEditorView({
  projectId,
}: PurchasedProjectEditorViewProps) {
  const router = useRouter();
  const editSavedTrackedRef = useRef(false);
  const [project, setProject] = useState<PurchasedProject | null>(null);
  const [template, setTemplate] = useState<InvitationTemplate | null>(null);
  const [scene, setScene] = useState<TextElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<SceneHistory>({
    past: [],
    future: [],
  });

  useEffect(() => {
    let active = true;

    void localPurchasedProjectRepository.getById(projectId).then((nextProject) => {
      if (!active) {
        return;
      }

      if (!nextProject) {
        setIsLoading(false);
        return;
      }

      if (!isProjectEditable(nextProject)) {
        trackValidationEvent("project_locked_viewed", {
          productId: nextProject.productId,
          projectId: nextProject.id,
          templateId: nextProject.templateId,
        });
      }

      setProject(nextProject);
      setTemplate(getRenderingTemplate(nextProject.templateId) ?? null);
      setScene(nextProject.scene);
      setIsLoading(false);
      trackValidationEvent("post_purchase_editor_opened", {
        productId: nextProject.productId,
        projectId: nextProject.id,
        templateId: nextProject.templateId,
      });
    });

    return () => {
      active = false;
    };
  }, [projectId]);

  async function saveScene(nextScene: TextElement[]) {
    if (!project || !template || !isProjectEditable(project)) {
      return;
    }

    const clampedScene = nextScene.map((element) =>
      clampTextElementToSafeArea(element, template),
    );
    const updatedProject = {
      ...project,
      scene: clampedScene,
    };

    setProject(updatedProject);
    setScene(clampedScene);
    await localPurchasedProjectRepository.update(updatedProject);

    if (!editSavedTrackedRef.current) {
      editSavedTrackedRef.current = true;
      trackValidationEvent("post_purchase_edit_saved", {
        productId: updatedProject.productId,
        projectId: updatedProject.id,
        templateId: updatedProject.templateId,
      });
    }
  }

  function pushHistory() {
    setHistory((currentHistory) => ({
      past: [...currentHistory.past, scene].slice(-30),
      future: [],
    }));
  }

  function setTextScene(nextScene: TextElement[]) {
    pushHistory();
    void saveScene(nextScene);
  }

  function updateTextElement(elementId: string, patch: Partial<TextElement>) {
    setTextScene(
      scene.map((element) =>
        element.id === elementId ? { ...element, ...patch } : element,
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
      scene.map((element) => {
        const patch = patchesById.get(element.id);

        return patch ? { ...element, ...patch } : element;
      }),
    );
  }

  function addTextElement() {
    if (!template) {
      return;
    }

    setTextScene([
      ...scene,
      createCenteredTextElementInSafeArea(
        createDefaultTextElement(template, scene.length + 1),
        template,
      ),
    ]);
  }

  function undo() {
    const previousScene = history.past.at(-1);

    if (!previousScene) {
      return;
    }

    setHistory((currentHistory) => ({
      past: currentHistory.past.slice(0, -1),
      future: [scene, ...currentHistory.future].slice(0, 30),
    }));
    void saveScene(previousScene);
  }

  function redo() {
    const nextScene = history.future[0];

    if (!nextScene) {
      return;
    }

    setHistory((currentHistory) => ({
      past: [...currentHistory.past, scene].slice(-30),
      future: currentHistory.future.slice(1),
    }));
    void saveScene(nextScene);
  }

  if (isLoading) {
    return (
      <LoadingState
        className="m-8"
        description="Estamos buscando tu copia post-compra."
        title="Cargando editor"
      />
    );
  }

  if (!project || !template) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href="/account/designs">Volver a mis disenos</Link>
          </Button>
        }
        className="m-8"
        description="No encontramos este proyecto comprado o su template asociado."
        title="Diseno no encontrado"
      />
    );
  }

  if (!isProjectEditable(project)) {
    return (
      <ErrorState
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={`/account/designs/${project.id}/reactivate`}>
                Reactivar edicion
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/account/designs/${project.id}`}>Ver diseno</Link>
            </Button>
          </div>
        }
        className="m-8"
        description={`La edicion finalizo el ${formatEditableUntil(project.editableUntil)}. Podes descargar el PDF o reactivar una nueva ventana de 10 dias.`}
        title="Este diseno esta bloqueado"
      />
    );
  }

  return (
    <PersonalizationEditor
      canRedo={history.future.length > 0}
      canUndo={history.past.length > 0}
      constraints={getTextSceneConstraints(template)}
      exitHref={`/account/designs/${project.id}`}
      onAddTextElement={addTextElement}
      onContinue={() => router.push(`/account/designs/${project.id}`)}
      onRedo={redo}
      onSetScene={setTextScene}
      onUndo={undo}
      onUpdateTextElement={updateTextElement}
      onUpdateTextElements={updateTextElements}
      productName={project.product.name}
      scene={scene}
      template={template}
    />
  );
}
