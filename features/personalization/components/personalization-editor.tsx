"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ChevronRight,
  Copy,
  Minus,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  InvitationTemplate,
  TextElement,
  TextSceneConstraints,
} from "@/features/rendering/templates/template-types";
import { PersonalizationCanvas } from "@/features/template-editor/components/personalization-canvas";

type PersonalizationEditorProps = {
  exitHref: string;
  productName: string;
  template: InvitationTemplate;
  scene: TextElement[];
  constraints: TextSceneConstraints;
  canUndo: boolean;
  canRedo: boolean;
  onUpdateTextElement: (elementId: string, patch: Partial<TextElement>) => void;
  onAddTextElement: () => void;
  onDuplicateTextElement: (elementId: string) => void;
  onDeleteTextElement: (elementId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onContinue: () => void;
};

const zoomLevels = [0.75, 0.9, 1, 1.15, 1.3];
const alignmentActions: Array<{
  align: TextElement["align"];
  icon: typeof AlignLeft;
  label: string;
}> = [
  { align: "left", icon: AlignLeft, label: "Alinear izquierda" },
  { align: "center", icon: AlignCenter, label: "Alinear centro" },
  { align: "right", icon: AlignRight, label: "Alinear derecha" },
];

function isTextEditingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

function getShortText(value: string) {
  return value.length > 42 ? `${value.slice(0, 42).trim()}...` : value;
}

export function PersonalizationEditor({
  exitHref,
  productName,
  template,
  scene,
  constraints,
  canUndo,
  canRedo,
  onUpdateTextElement,
  onAddTextElement,
  onDuplicateTextElement,
  onDeleteTextElement,
  onUndo,
  onRedo,
  onContinue,
}: PersonalizationEditorProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    scene[0]?.id ?? null,
  );
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(2);
  const zoom = zoomLevels[zoomIndex];
  const selectedElement =
    scene.find((element) => element.id === selectedElementId) ?? scene[0] ?? null;
  const activeSelectedElementId = selectedElement?.id ?? null;

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      if (isTextEditingTarget(event.target)) {
        return;
      }

      const isModifierPressed = event.metaKey || event.ctrlKey;

      if (!isModifierPressed) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "z" && event.shiftKey && canRedo) {
        event.preventDefault();
        onRedo();
        return;
      }

      if (key === "z" && !event.shiftKey && canUndo) {
        event.preventDefault();
        onUndo();
        return;
      }

      if (key === "y" && canRedo) {
        event.preventDefault();
        onRedo();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, [canRedo, canUndo, onRedo, onUndo]);

  function updateSelectedElement(patch: Partial<TextElement>) {
    if (!activeSelectedElementId) return;
    onUpdateTextElement(activeSelectedElementId, patch);
  }

  function deleteSelectedElement(elementId: string) {
    const selectedIndex = scene.findIndex((element) => element.id === elementId);
    const nextSelection =
      scene[selectedIndex + 1]?.id ?? scene[selectedIndex - 1]?.id ?? null;

    onDeleteTextElement(elementId);

    if (activeSelectedElementId === elementId) {
      setSelectedElementId(nextSelection);
    }
  }

  return (
    <section className="grid h-screen min-h-[720px] grid-rows-[4.25rem_4.75rem_minmax(0,1fr)_2.5rem] overflow-hidden bg-[#edf1f5]">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-white px-5">
        <div className="flex min-w-0 items-center gap-4">
          <Button asChild aria-label="Volver al producto" size="sm" variant="ghost">
            <Link href={exitHref}>
              <ArrowLeft />
            </Link>
          </Button>
          <div className="h-7 w-px bg-border" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {productName}
            </p>
            <p className="text-xs text-muted-foreground">
              {template.widthMm} x {template.heightMm} mm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <p className="hidden items-center gap-2 text-sm font-medium text-muted-foreground sm:flex">
            <span className="size-2 rounded-full bg-success" />
            Guardado automaticamente
          </p>
          <Button onClick={onContinue} type="button">
            Continuar
            <ChevronRight />
          </Button>
        </div>
      </header>

      <div className="grid border-b border-border bg-white lg:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="hidden border-r border-border px-5 py-3 lg:block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Textos</h2>
              <p className="text-sm text-muted-foreground">
                {scene.length} capas editables
              </p>
            </div>
            <Button onClick={onAddTextElement} type="button">
              <Plus />
              Agregar texto
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
          {selectedElement ? (
            <>
              <div className="hidden min-w-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary md:block">
                Editando: {selectedElement.label}
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <div className="flex items-center rounded-md border border-border bg-background">
                  <Button
                    aria-label="Reducir tamano"
                    onClick={() =>
                      updateSelectedElement({
                        fontSize: Math.max(
                          constraints.minFontSize,
                          selectedElement.fontSize - 8,
                        ),
                      })
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Minus />
                  </Button>
                  <Input
                    aria-label="Tamano de texto en pixeles"
                    className="h-9 w-16 border-0 text-center"
                    max={constraints.maxFontSize}
                    min={constraints.minFontSize}
                    onChange={(event) =>
                      updateSelectedElement({
                        fontSize: Math.min(
                          constraints.maxFontSize,
                          Math.max(
                            constraints.minFontSize,
                            Number(event.target.value) || selectedElement.fontSize,
                          ),
                        ),
                      })
                    }
                    type="number"
                    value={Math.round(selectedElement.fontSize)}
                  />
                  <span className="pr-1 text-xs text-muted-foreground">px</span>
                  <Button
                    aria-label="Aumentar tamano"
                    onClick={() =>
                      updateSelectedElement({
                        fontSize: Math.min(
                          constraints.maxFontSize,
                          selectedElement.fontSize + 8,
                        ),
                      })
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Plus />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  {constraints.allowedColors.map((color) => (
                    <button
                      aria-label={`Color ${color}`}
                      className={cn(
                        "size-8 rounded-full border border-border",
                        selectedElement.fill === color &&
                          "outline outline-2 outline-primary outline-offset-2",
                      )}
                      key={color}
                      onClick={() => updateSelectedElement({ fill: color })}
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>

                <div className="flex rounded-md border border-border bg-background">
                  {alignmentActions.map(({ align, icon: Icon, label }) => (
                    <Button
                      aria-label={label}
                      key={align}
                      onClick={() =>
                        updateSelectedElement({
                          align,
                        })
                      }
                      size="sm"
                      type="button"
                      variant={
                        selectedElement.align === align ? "primary" : "ghost"
                      }
                    >
                      <Icon />
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => onDuplicateTextElement(selectedElement.id)}
                  type="button"
                  variant="secondary"
                >
                  <Copy />
                  Duplicar
                </Button>
                <Button
                  aria-label="Eliminar texto"
                  onClick={() => deleteSelectedElement(selectedElement.id)}
                  type="button"
                  variant="secondary"
                >
                  <Trash2 />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecciona un texto para editarlo.
            </p>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              aria-label="Deshacer"
              disabled={!canUndo}
              onClick={onUndo}
              size="sm"
              type="button"
              variant="secondary"
            >
              Deshacer
            </Button>
            <Button
              aria-label="Rehacer"
              disabled={!canRedo}
              onClick={onRedo}
              size="sm"
              type="button"
              variant="secondary"
            >
              Rehacer
            </Button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r border-border bg-white">
          <div className="grid gap-2 p-4">
            <Button
              className="lg:hidden"
              onClick={onAddTextElement}
              type="button"
            >
              <Plus />
              Agregar texto
            </Button>
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Haz click para ubicar en el canvas
            </p>
            {scene.map((element) => {
              const selected = activeSelectedElementId === element.id;

              return (
                <button
                  className={cn(
                    "group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-transparent p-3 text-left text-sm transition",
                    selected
                      ? "border-primary/40 bg-primary/5"
                      : "hover:bg-muted",
                  )}
                  key={element.id}
                  onBlur={() => setHoveredElementId(null)}
                  onFocus={() => setHoveredElementId(element.id)}
                  onClick={() => setSelectedElementId(element.id)}
                  onMouseEnter={() => setHoveredElementId(element.id)}
                  onMouseLeave={() => setHoveredElementId(null)}
                  title="Click para seleccionar este texto en el canvas"
                  type="button"
                >
                  <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
                    <Type className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {element.label}
                    </span>
                    <span className="block truncate font-semibold">
                      {getShortText(element.text)}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(element.fontSize)}px
                  </span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-primary/20 bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    Ver en canvas
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="relative grid min-h-0">
          <div className="absolute left-1/2 top-5 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-white/95 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm md:flex">
            <span className="size-2 rounded-full bg-success" />
            Diseno protegido
            <span className="h-5 w-px bg-border" />
            Solo podes editar los textos.
          </div>
          <PersonalizationCanvas
            hoveredElementId={hoveredElementId}
            onSelectedElementChange={setSelectedElementId}
            onUpdateTextElement={onUpdateTextElement}
            previewMode={false}
            scene={scene}
            selectedElementId={activeSelectedElementId}
            template={template}
            zoom={zoom}
          />
          <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full border border-border bg-white/95 px-2 py-1 shadow-sm">
            <Button
              aria-label="Alejar"
              disabled={zoomIndex === 0}
              onClick={() => setZoomIndex((current) => Math.max(0, current - 1))}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Minus />
            </Button>
            <span className="min-w-12 text-center text-sm font-semibold">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              aria-label="Acercar"
              disabled={zoomIndex === zoomLevels.length - 1}
              onClick={() =>
                setZoomIndex((current) =>
                  Math.min(zoomLevels.length - 1, current + 1),
                )
              }
              size="sm"
              type="button"
              variant="ghost"
            >
              <Plus />
            </Button>
          </div>
        </main>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-border bg-white px-5 text-xs font-medium text-muted-foreground">
        <span>
          Diseno protegido - {scene.length} capas de texto - Guardado automatico
        </span>
        <span>Margen seguro: {template.safeArea?.insetMm ?? 20} mm</span>
      </footer>
    </section>
  );
}
