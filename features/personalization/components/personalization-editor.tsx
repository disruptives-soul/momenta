"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Copy,
  Eye,
  Layers,
  Minus,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Ruler,
  Trash2,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  onReorderTextElement: (elementId: string, direction: -1 | 1) => void;
  onUndo: () => void;
  onRedo: () => void;
  onContinue: () => void;
};

const zoomLevels = [0.75, 0.9, 1, 1.15, 1.3];
type EditorPanel = "edit" | "text" | "layers" | "guides";

const printQaLockedControlTitle =
  "Bloqueado temporalmente hasta cerrar QA de Print Output";

function getNextColor(colors: string[], currentColor: string) {
  const currentIndex = colors.indexOf(currentColor);

  if (currentIndex < 0) {
    return colors[0] ?? currentColor;
  }

  return colors[(currentIndex + 1) % colors.length] ?? currentColor;
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
  onReorderTextElement,
  onUndo,
  onRedo,
  onContinue,
}: PersonalizationEditorProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    scene[0]?.id ?? null,
  );
  const [activePanel, setActivePanel] = useState<EditorPanel>("edit");
  const [zoomIndex, setZoomIndex] = useState(2);
  const [previewMode, setPreviewMode] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>(
    {},
  );
  const zoom = zoomLevels[zoomIndex];
  const selectedElement =
    scene.find((element) => element.id === selectedElementId) ?? null;
  const selectedIndex = selectedElement
    ? scene.findIndex((element) => element.id === selectedElement.id)
    : -1;

  useEffect(() => {
    if (!selectedElementId) return;
    inputRefs.current[selectedElementId]?.focus();
  }, [selectedElementId]);

  function updateSelectedElement(patch: Partial<TextElement>) {
    if (!selectedElementId) return;
    onUpdateTextElement(selectedElementId, patch);
  }

  function deleteSelectedElement() {
    if (!selectedElementId) return;
    const nextSelection =
      scene[selectedIndex + 1]?.id ?? scene[selectedIndex - 1]?.id ?? null;

    onDeleteTextElement(selectedElementId);
    setSelectedElementId(nextSelection);
  }

  function getRailButtonClass(panel: EditorPanel) {
    return cn(
      "flex h-14 flex-1 flex-col items-center justify-center gap-1 border-r border-border text-xs font-medium lg:w-full lg:border-b lg:border-r-0",
      activePanel === panel
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );
  }

  return (
    <section className="h-screen min-h-[720px] overflow-hidden bg-[#eef2f6]">
      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-white px-5">
        <div className="flex min-w-0 items-center gap-5">
          <Button asChild size="sm" type="button" variant="ghost">
            <Link href={exitHref}>
              <X />
              Guardar y salir
            </Link>
          </Button>
          <div className="h-7 w-px bg-border" />
          <p className="max-w-[28rem] truncate text-sm font-medium">
            {productName}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-success" />
            Guardado
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            aria-label="Deshacer"
            disabled={!canUndo}
            onClick={onUndo}
            size="sm"
            title="Deshacer"
            type="button"
            variant="secondary"
          >
            <Undo2 />
          </Button>
          <Button
            aria-label="Rehacer"
            disabled={!canRedo}
            onClick={onRedo}
            size="sm"
            title="Rehacer"
            type="button"
            variant="secondary"
          >
            <Redo2 />
          </Button>
          <Button
            onClick={() => setPreviewMode((current) => !current)}
            size="sm"
            type="button"
            variant={previewMode ? "primary" : "secondary"}
          >
            <Eye />
            Preview
          </Button>
          <Button onClick={onContinue} size="sm" type="button">
            Continuar
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid h-[calc(100%-4rem)] min-h-0 gap-4 p-5 lg:grid-cols-[5.5rem_23rem_minmax(0,1fr)]">
        <aside className="flex overflow-hidden rounded-2xl border border-border bg-white shadow-md lg:block">
          <button
            className={getRailButtonClass("edit")}
            onClick={() => {
              setActivePanel("edit");
            }}
            type="button"
          >
            <Pencil className="size-5" />
            Editar
          </button>
          <button
            className={getRailButtonClass("text")}
            onClick={() => {
              setActivePanel("text");
            }}
            type="button"
          >
            <Type className="size-5" />
            Texto
          </button>
          <button
            className={getRailButtonClass("layers")}
            onClick={() => {
              setActivePanel("layers");
            }}
            type="button"
          >
            <Layers className="size-5" />
            Capas
          </button>
          <button
            className={cn(getRailButtonClass("guides"), "lg:border-b-0")}
            onClick={() => {
              setActivePanel("guides");
            }}
            type="button"
          >
            <Ruler className="size-5" />
            Guias
          </button>
        </aside>

        <aside className="min-h-0 overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {activePanel === "layers"
                  ? "Capas"
                  : activePanel === "guides"
                    ? "Guias"
                    : activePanel === "text"
                      ? "Texto"
                      : "Editar"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activePanel === "layers"
                  ? "Orden de textos"
                  : activePanel === "guides"
                    ? "Alineacion visual"
                    : "Escena textual"}
              </p>
            </div>
            {selectedElement ? (
              <Badge tone="free">Seleccionado</Badge>
            ) : null}
          </div>

          {activePanel === "layers" ? (
            <div className="grid gap-2.5">
              {scene.map((element, index) => {
                const selected = selectedElementId === element.id;

                return (
                  <div
                    className={cn(
                      "grid gap-2 rounded-md border border-border bg-surface p-3 text-sm",
                      selected && "border-primary bg-primary/5 text-primary",
                    )}
                    key={element.id}
                  >
                    <button
                      className="flex items-center justify-between gap-3 text-left"
                      onClick={() => setSelectedElementId(element.id)}
                      type="button"
                    >
                      <span className="grid gap-1">
                        <span className="font-medium">{element.label}</span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {element.text}
                        </span>
                      </span>
                      <Type className="size-4 shrink-0" />
                    </button>
                    <div className="flex gap-1">
                      <Button
                        aria-label="Subir capa"
                        disabled={index === scene.length - 1}
                        onClick={() => onReorderTextElement(element.id, 1)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        aria-label="Bajar capa"
                        disabled={index === 0}
                        onClick={() => onReorderTextElement(element.id, -1)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        aria-label="Duplicar texto"
                        onClick={() => onDuplicateTextElement(element.id)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <Copy />
                      </Button>
                      <Button
                        aria-label="Eliminar texto"
                        onClick={() => {
                          onDeleteTextElement(element.id);
                          if (selectedElementId === element.id) {
                            setSelectedElementId(scene[index - 1]?.id ?? null);
                          }
                        }}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activePanel === "guides" ? (
            <div className="grid gap-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-surface p-3 text-sm font-medium">
                <span>Mostrar guias centrales</span>
                <input
                  checked={showGuides}
                  className="size-4 accent-primary"
                  onChange={(event) => setShowGuides(event.target.checked)}
                  type="checkbox"
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-2.5">
              <Button onClick={onAddTextElement} type="button" variant="secondary">
                <Plus />
                Agregar texto
              </Button>
              {scene.map((element) => {
                const selected = selectedElementId === element.id;

                return (
                  <div
                    className={cn(
                      "grid gap-2 rounded-md border border-border p-2.5",
                      selected && "border-primary bg-primary/5",
                    )}
                    key={element.id}
                  >
                    <label className="text-sm font-medium" htmlFor={element.id}>
                      {element.label}
                    </label>
                    {element.maxLines > 1 ? (
                      <Textarea
                        id={element.id}
                        onChange={(event) =>
                          onUpdateTextElement(element.id, {
                            text: event.target.value,
                          })
                        }
                        onFocus={() => setSelectedElementId(element.id)}
                        ref={(node) => {
                          inputRefs.current[element.id] = node;
                        }}
                        value={element.text}
                      />
                    ) : (
                      <Input
                        id={element.id}
                        onChange={(event) =>
                          onUpdateTextElement(element.id, {
                            text: event.target.value,
                          })
                        }
                        onFocus={() => setSelectedElementId(element.id)}
                        ref={(node) => {
                          inputRefs.current[element.id] = node;
                        }}
                        value={element.text}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-1 py-1">
            <div className="flex items-center gap-2">
              <Button
                aria-label="Alejar"
                disabled={zoomIndex === 0}
                onClick={() => setZoomIndex((current) => Math.max(0, current - 1))}
                size="sm"
                title="Alejar"
                type="button"
                variant="secondary"
              >
                <Minus />
              </Button>
              <span className="min-w-12 text-center text-sm font-medium">
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
                title="Acercar"
                type="button"
                variant="secondary"
              >
                <Plus />
              </Button>
            </div>
            {selectedElement ? (
              <div className="flex max-w-full flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 shadow-sm">
                <Button
                  onClick={() => {
                    setActivePanel("edit");
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Type />
                  Editar texto
                </Button>
                <span className="h-6 w-px bg-border" />
                <select
                  className="h-9 max-w-40 rounded-md border border-border bg-background px-2 text-sm font-medium"
                  disabled
                  onChange={(event) => {
                    const option = constraints.allowedFonts.find(
                      (item) => item.value === event.target.value,
                    );

                    updateSelectedElement({
                      fontFamily: event.target.value,
                      pdfFont: option?.pdfFont,
                      fontAsset: option?.fontAsset,
                    });
                  }}
                  title={printQaLockedControlTitle}
                  value={selectedElement.fontFamily}
                >
                  {constraints.allowedFonts.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
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
                    aria-label="Tamano de fuente"
                    className="h-9 w-16 text-center"
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
                <button
                  aria-label="Cambiar color"
                  className="size-8 rounded-full border border-border"
                  onClick={() =>
                    updateSelectedElement({
                      fill: getNextColor(
                        constraints.allowedColors,
                        selectedElement.fill,
                      ),
                    })
                  }
                  style={{ backgroundColor: selectedElement.fill }}
                  type="button"
                />
                <Button
                  aria-label="Negrita"
                  disabled
                  onClick={() =>
                    updateSelectedElement({
                      fontWeight:
                        (selectedElement.fontWeight ?? 500) >= 700 ? 500 : 700,
                    })
                  }
                  size="sm"
                  title={printQaLockedControlTitle}
                  type="button"
                  variant={
                    (selectedElement.fontWeight ?? 500) >= 700
                      ? "primary"
                      : "secondary"
                  }
                >
                  B
                </Button>
                <span className="rounded-full bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
                  Tipografia congelada
                </span>
                <Button
                  aria-label="Duplicar texto"
                  onClick={() => onDuplicateTextElement(selectedElement.id)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Copy />
                </Button>
                <Button
                  aria-label="Eliminar texto"
                  onClick={deleteSelectedElement}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Trash2 />
                </Button>
              </div>
            ) : null}
          </div>

          <div className="grid min-h-0">
            <PersonalizationCanvas
              onSelectedElementChange={setSelectedElementId}
              onUpdateTextElement={onUpdateTextElement}
              previewMode={previewMode}
              scene={scene}
              selectedElementId={selectedElementId}
              showGuides={showGuides}
              template={template}
              zoom={zoom}
            />
          </div>
        </div>

        <aside className="hidden">
          {selectedElement ? (
            <div className="grid gap-4">
              <div className="rounded-md border border-border bg-muted/50 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Objeto</span>
                  <Badge tone="neutral">{selectedElement.id}</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    aria-label="Duplicar texto"
                    onClick={() => onDuplicateTextElement(selectedElement.id)}
                    size="sm"
                    title="Duplicar"
                    type="button"
                    variant="secondary"
                  >
                    <Copy />
                  </Button>
                  <Button
                    aria-label="Eliminar texto"
                    onClick={deleteSelectedElement}
                    size="sm"
                    title="Eliminar"
                    type="button"
                    variant="secondary"
                  >
                    <Trash2 />
                  </Button>
                  <Button
                    aria-label="Rotar izquierda"
                    onClick={() =>
                      updateSelectedElement({
                        rotation: (selectedElement.rotation ?? 0) - 45,
                      })
                    }
                    size="sm"
                    title="Rotar izquierda"
                    type="button"
                    variant="secondary"
                  >
                    <RotateCcw />
                  </Button>
                  <Button
                    aria-label="Rotar derecha"
                    onClick={() =>
                      updateSelectedElement({
                        rotation: (selectedElement.rotation ?? 0) + 45,
                      })
                    }
                    size="sm"
                    title="Rotar derecha"
                    type="button"
                    variant="secondary"
                  >
                    <RotateCw />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <span className="text-sm font-semibold">Tipografia</span>
                <select
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
                  onChange={(event) => {
                    const option = constraints.allowedFonts.find(
                      (item) => item.value === event.target.value,
                    );

                    updateSelectedElement({
                      fontFamily: event.target.value,
                      pdfFont: option?.pdfFont,
                      fontAsset: option?.fontAsset,
                    });
                  }}
                  value={selectedElement.fontFamily}
                >
                  {constraints.allowedFonts.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
                  onChange={(event) =>
                    updateSelectedElement({
                      fontWeight: Number(event.target.value),
                    })
                  }
                  value={selectedElement.fontWeight ?? 500}
                >
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={700}>Bold</option>
                  <option value={800}>Extra Bold</option>
                </select>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <span className="text-sm font-semibold">Transformar</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    X
                    <Input
                      onChange={(event) =>
                        updateSelectedElement({
                          x: Number(event.target.value) || 0,
                        })
                      }
                      type="number"
                      value={Math.round(selectedElement.x)}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Y
                    <Input
                      onChange={(event) =>
                        updateSelectedElement({
                          y: Number(event.target.value) || 0,
                        })
                      }
                      type="number"
                      value={Math.round(selectedElement.y)}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Tamano
                    <Input
                      max={constraints.maxFontSize}
                      min={Math.max(
                        constraints.minFontSize,
                        selectedElement.minFontSize,
                      )}
                      onChange={(event) =>
                        updateSelectedElement({
                          fontSize: Math.min(
                            constraints.maxFontSize,
                            Math.max(
                              constraints.minFontSize,
                              Number(event.target.value) ||
                                selectedElement.minFontSize,
                            ),
                          ),
                        })
                      }
                      type="number"
                      value={Math.round(selectedElement.fontSize)}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Ancho
                    <Input
                      min={80}
                      onChange={(event) =>
                        updateSelectedElement({
                          width: Math.max(80, Number(event.target.value) || 80),
                        })
                      }
                      type="number"
                      value={Math.round(selectedElement.width)}
                    />
                  </label>
                </div>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Rotacion
                  <Input
                    onChange={(event) =>
                      updateSelectedElement({
                        rotation: Number(event.target.value) || 0,
                      })
                    }
                    type="number"
                    value={Math.round(selectedElement.rotation ?? 0)}
                  />
                </label>
              </div>

              <div className="grid gap-3 rounded-md border border-border p-3">
                <span className="text-sm font-semibold">Espaciado</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Tracking
                    <Input
                      min={0}
                      onChange={(event) =>
                        updateSelectedElement({
                          letterSpacing: Math.max(
                            0,
                            Number(event.target.value) || 0,
                          ),
                        })
                      }
                      type="number"
                      value={Math.round(selectedElement.letterSpacing ?? 0)}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    Interlineado
                    <Input
                      max={3}
                      min={0.8}
                      onChange={(event) =>
                        updateSelectedElement({
                          lineHeight: Math.max(
                            0.8,
                            Number(event.target.value) || 1,
                          ),
                        })
                      }
                      step={0.05}
                      type="number"
                      value={selectedElement.lineHeight ?? 1.15}
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-xs text-muted-foreground">
                  Opacidad {Math.round((selectedElement.opacity ?? 1) * 100)}%
                  <input
                    className="accent-primary"
                    max={100}
                    min={10}
                    onChange={(event) =>
                      updateSelectedElement({
                        opacity: Math.min(
                          1,
                          Math.max(0.1, Number(event.target.value) / 100),
                        ),
                      })
                    }
                    type="range"
                    value={Math.round((selectedElement.opacity ?? 1) * 100)}
                  />
                </label>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <span className="text-sm font-semibold">Alineacion</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["left", AlignLeft],
                    ["center", AlignCenter],
                    ["right", AlignRight],
                  ].map(([align, Icon]) => (
                    <Button
                      aria-label={`Alinear ${align}`}
                      key={align as string}
                      onClick={() =>
                        updateSelectedElement({
                          align: align as "left" | "center" | "right",
                        })
                      }
                      size="sm"
                      type="button"
                      variant={
                        selectedElement.align === align ? "primary" : "secondary"
                      }
                    >
                      <Icon />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <span className="text-sm font-semibold">Color</span>
                <div className="flex flex-wrap gap-2">
                  {constraints.allowedColors.map((color) => (
                    <button
                      aria-label={`Color ${color}`}
                      className={cn(
                        "size-8 rounded-md border border-border",
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
                <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-2">
                  <span
                    className="size-5 rounded-sm border border-border"
                    style={{ backgroundColor: selectedElement.fill }}
                  />
                  <input
                    aria-label="Color personalizado"
                    className="h-7 w-full bg-transparent text-sm outline-none"
                    onChange={(event) =>
                      updateSelectedElement({ fill: event.target.value })
                    }
                    type="text"
                    value={selectedElement.fill}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Selecciona o agrega un texto para editar la escena.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
