"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  ChevronDown,
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
import {
  clampTextElementToSafeArea,
  getSafeAreaShift,
  getTemplateSafeArea,
  getTextVisualBox,
  type TemplateSafeArea,
} from "../services/text-scene-safe-area";

type PersonalizationEditorProps = {
  exitHref: string;
  productName: string;
  template: InvitationTemplate;
  scene: TextElement[];
  constraints: TextSceneConstraints;
  canUndo: boolean;
  canRedo: boolean;
  onUpdateTextElement: (elementId: string, patch: Partial<TextElement>) => void;
  onUpdateTextElements: (
    patches: Array<{ elementId: string; patch: Partial<TextElement> }>,
  ) => void;
  onSetScene: (scene: TextElement[]) => void;
  onAddTextElement: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onContinue: () => void;
};

const zoomLevels = [0.5, 0.75, 0.9, 1, 1.3, 1.6, 2];
const textAlignmentActions: Array<{
  align: TextElement["align"];
  icon: typeof AlignLeft;
  label: string;
}> = [
  { align: "left", icon: AlignLeft, label: "Texto izquierda" },
  { align: "center", icon: AlignCenter, label: "Texto centro" },
  { align: "right", icon: AlignRight, label: "Texto derecha" },
];
const positionAlignmentActions: Array<{
  direction: "left" | "center" | "right" | "top" | "middle" | "bottom";
  label: string;
}> = [
  { direction: "left", label: "Izq" },
  { direction: "center", label: "Centro" },
  { direction: "right", label: "Der" },
  { direction: "top", label: "Arriba" },
  { direction: "middle", label: "Medio" },
  { direction: "bottom", label: "Abajo" },
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

function getTemplatePpi(template: InvitationTemplate) {
  return (
    template.masterPpi ??
    template.printProfile.designMasterPpi ??
    template.printProfile.targetPpi ??
    300
  );
}

function fontPxToPt(value: number, template: InvitationTemplate) {
  return (value / getTemplatePpi(template)) * 72;
}

function fontPtToPx(value: number, template: InvitationTemplate) {
  return (value / 72) * getTemplatePpi(template);
}

function getUnionBox(boxes: TemplateSafeArea[]) {
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFontLabel(fontFamily: string) {
  return (
    fontFamily
      .split(",")[0]
      ?.replaceAll("\"", "")
      .replaceAll("'", "")
      .trim() || fontFamily
  );
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
  onUpdateTextElements,
  onSetScene,
  onAddTextElement,
  onUndo,
  onRedo,
  onContinue,
}: PersonalizationEditorProps) {
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(
    scene[0] ? [scene[0].id] : [],
  );
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(3);
  const [clipboardElements, setClipboardElements] = useState<TextElement[]>([]);
  const [isPositionPanelOpen, setIsPositionPanelOpen] = useState(false);
  const zoom = zoomLevels[zoomIndex];
  const selectedElements = scene.filter((element) =>
    selectedElementIds.includes(element.id),
  );
  const selectedElement =
    scene.find((element) => element.id === selectedElementIds.at(-1)) ??
    selectedElements[0] ??
    null;
  const activeSelectedElementIds = selectedElements.map((element) => element.id);
  const selectedFontSizePt = selectedElement
    ? Math.round(fontPxToPt(selectedElement.fontSize, template))
    : 0;
  const minFontSizePt = Math.max(
    1,
    Math.round(fontPxToPt(constraints.minFontSize, template)),
  );
  const maxFontSizePt = Math.round(
    fontPxToPt(constraints.maxFontSize, template),
  );
  const editorFonts = selectedElement &&
    !constraints.allowedFonts.some(
      (font) => font.value === selectedElement.fontFamily,
    )
    ? [
        {
          label: getFontLabel(selectedElement.fontFamily),
          value: selectedElement.fontFamily,
          pdfFont: selectedElement.pdfFont ?? "helvetica",
          fontAsset: selectedElement.fontAsset,
        },
        ...constraints.allowedFonts,
      ]
    : constraints.allowedFonts;
  const selectedFontValue = selectedElement?.fontFamily ?? "";

  function updateSelectedElements(patch: Partial<TextElement>) {
    if (activeSelectedElementIds.length === 0) return;
    onUpdateTextElements(
      activeSelectedElementIds.map((elementId) => ({
        elementId,
        patch,
      })),
    );
  }

  function updateSelectedFont(fontFamily: string) {
    const font = editorFonts.find((item) => item.value === fontFamily);

    if (!font) {
      return;
    }

    updateSelectedElements({
      fontFamily: font.value,
      pdfFont: font.pdfFont,
      fontAsset: font.fontAsset,
    });
  }

  function updateSelectedFontSizePt(nextFontSizePt: number) {
    updateSelectedElements({
      fontSize: fontPtToPx(
        clampNumber(nextFontSizePt, minFontSizePt, maxFontSizePt),
        template,
      ),
    });
  }

  function toggleSelectedBold() {
    updateSelectedElements({
      fontWeight: (selectedElement?.fontWeight ?? 400) >= 700 ? 400 : 700,
    });
  }

  function deleteSelectedElements() {
    if (activeSelectedElementIds.length === 0) {
      return;
    }

    const firstSelectedIndex = scene.findIndex((element) =>
      activeSelectedElementIds.includes(element.id),
    );
    const nextScene = scene.filter(
      (element) => !activeSelectedElementIds.includes(element.id),
    );
    const nextSelection =
      nextScene[firstSelectedIndex]?.id ?? nextScene[firstSelectedIndex - 1]?.id;

    onSetScene(nextScene);
    setSelectedElementIds(nextSelection ? [nextSelection] : []);
  }

  function getOffsetCopies(elements: TextElement[]) {
    const nextElements = elements.map((element, index) => ({
      ...element,
      id: `${element.id}-copy-${Date.now()}-${index}`,
      label: element.label.endsWith("copia")
        ? element.label
        : `${element.label} copia`,
      x: element.x + 48,
      y: element.y + 48,
    }));
    const safeArea = getTemplateSafeArea(template);
    const groupBox = getUnionBox(nextElements.map(getTextVisualBox));
    const shift = getSafeAreaShift(groupBox, safeArea);

    return nextElements.map((element) =>
      clampTextElementToSafeArea(
        {
          ...element,
          x: element.x + shift.dx,
          y: element.y + shift.dy,
        },
        template,
      ),
    );
  }

  function copySelectedElements() {
    setClipboardElements(selectedElements.map((element) => ({ ...element })));
  }

  function pasteElements() {
    if (clipboardElements.length === 0) {
      return;
    }

    const copies = getOffsetCopies(clipboardElements);

    onSetScene([...scene, ...copies]);
    setSelectedElementIds(copies.map((element) => element.id));
  }

  function duplicateSelectedElements() {
    if (selectedElements.length === 0) {
      return;
    }

    const copies = getOffsetCopies(selectedElements);

    onSetScene([...scene, ...copies]);
    setSelectedElementIds(copies.map((element) => element.id));
  }

  function alignSelectedElements(
    direction: "left" | "center" | "right" | "top" | "middle" | "bottom",
  ) {
    if (selectedElements.length === 0) {
      return;
    }

    const safeArea = getTemplateSafeArea(template);
    const groupBox = getUnionBox(selectedElements.map(getTextVisualBox));
    let dx = 0;
    let dy = 0;

    if (direction === "left") dx = safeArea.x - groupBox.x;
    if (direction === "center") {
      dx =
        safeArea.x + safeArea.width / 2 - (groupBox.x + groupBox.width / 2);
    }
    if (direction === "right") {
      dx = safeArea.x + safeArea.width - (groupBox.x + groupBox.width);
    }
    if (direction === "top") dy = safeArea.y - groupBox.y;
    if (direction === "middle") {
      dy =
        safeArea.y + safeArea.height / 2 - (groupBox.y + groupBox.height / 2);
    }
    if (direction === "bottom") {
      dy = safeArea.y + safeArea.height - (groupBox.y + groupBox.height);
    }

    onUpdateTextElements(
      selectedElements.map((element) => ({
        elementId: element.id,
        patch: {
          x: element.x + dx,
          y: element.y + dy,
        },
      })),
    );
  }

  function toggleLayerSelection(elementId: string, additive: boolean) {
    if (!additive) {
      setSelectedElementIds([elementId]);
      return;
    }

    setSelectedElementIds((currentIds) =>
      currentIds.includes(elementId)
        ? currentIds.filter((id) => id !== elementId)
        : [...currentIds, elementId],
    );
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      setSelectedElementIds((currentIds) =>
        currentIds.filter((id) => scene.some((element) => element.id === id)),
      );
      setEditingElementId((currentId) =>
        currentId && scene.some((element) => element.id === currentId)
          ? currentId
          : null,
      );
    });
  }, [scene]);

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      if (isTextEditingTarget(event.target)) {
        return;
      }

      const isModifierPressed = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedElementIds.length > 0
      ) {
        event.preventDefault();
        deleteSelectedElements();
        return;
      }

      if (!isModifierPressed) {
        return;
      }

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
        return;
      }

      if (key === "c" && selectedElements.length > 0) {
        event.preventDefault();
        copySelectedElements();
        return;
      }

      if (key === "v" && clipboardElements.length > 0) {
        event.preventDefault();
        pasteElements();
        return;
      }

      if (key === "d" && selectedElements.length > 0) {
        event.preventDefault();
        duplicateSelectedElements();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  });

  return (
    <section className="grid h-screen min-h-[720px] grid-rows-[4.25rem_auto_minmax(0,1fr)_2.5rem] overflow-hidden bg-[#edf1f5]">
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

      <div className="grid min-h-[4.75rem] border-b border-border bg-white lg:grid-cols-[24rem_minmax(0,1fr)]">
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

        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 px-4 py-3">
          {selectedElement ? (
            <>
              <div className="hidden shrink-0 whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary md:block">
                {selectedElements.length > 1
                  ? `${selectedElements.length} textos`
                  : `Editando: ${selectedElement.label}`}
              </div>
              <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1 rounded-xl border border-border bg-surface px-2 py-1 shadow-[0_12px_28px_rgb(37_31_26_/_0.08)]">
                <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold">
                  <select
                    aria-label="Tipografia"
                    className="h-full max-w-40 bg-transparent font-semibold outline-none"
                    onChange={(event) => updateSelectedFont(event.target.value)}
                    value={selectedFontValue}
                  >
                    {editorFonts.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </label>

                <div className="flex h-9 items-center rounded-md border border-border bg-background">
                  <button
                    aria-label="Reducir tamano"
                    className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={() => updateSelectedFontSizePt(selectedFontSizePt - 1)}
                    type="button"
                  >
                    <Minus className="size-4" />
                  </button>
                  <Input
                    aria-label="Tamano de texto en puntos"
                    className="h-9 w-16 border-0 text-center"
                    inputMode="numeric"
                    onChange={(event) => {
                      const nextValue = Number(
                        event.target.value.replace(/[^\d]/g, ""),
                      );

                      if (Number.isFinite(nextValue) && nextValue > 0) {
                        updateSelectedFontSizePt(nextValue);
                      }
                    }}
                    type="text"
                    value={selectedFontSizePt}
                  />
                  <span className="pr-1 text-xs text-muted-foreground">pt</span>
                  <button
                    aria-label="Aumentar tamano"
                    className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={() => updateSelectedFontSizePt(selectedFontSizePt + 1)}
                    type="button"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                <button
                  aria-label="Negrita"
                  className={cn(
                    "grid size-9 place-items-center rounded-md text-foreground transition hover:bg-muted",
                    (selectedElement.fontWeight ?? 400) >= 700 &&
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                  onClick={toggleSelectedBold}
                  type="button"
                >
                  <Bold className="size-4" />
                </button>

                <div className="mx-1 h-6 w-px bg-border" />

                <div className="flex h-9 items-center gap-1 rounded-md px-1">
                  {constraints.allowedColors.map((color) => (
                    <button
                      aria-label={`Color ${color}`}
                      className={cn(
                        "size-8 rounded-full border border-border",
                        selectedElement.fill === color &&
                          "outline outline-2 outline-primary outline-offset-2",
                      )}
                      key={color}
                      onClick={() => updateSelectedElements({ fill: color })}
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>

                <div className="mx-1 h-6 w-px bg-border" />

                <div className="flex h-9 rounded-md border border-border bg-background">
                  {textAlignmentActions.map(({ align, icon: Icon, label }) => (
                    <button
                      aria-label={label}
                      className={cn(
                        "grid size-9 place-items-center text-muted-foreground transition first:rounded-l-md last:rounded-r-md hover:bg-muted hover:text-foreground",
                        selectedElement.align === align &&
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                      key={align}
                      onClick={() => updateSelectedElements({ align })}
                      type="button"
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <button
                    className={cn(
                      "h-9 rounded-md px-3 text-sm font-semibold text-foreground transition hover:bg-muted",
                      isPositionPanelOpen && "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    onClick={() => setIsPositionPanelOpen((current) => !current)}
                    type="button"
                  >
                    Posicion
                  </button>

                  {isPositionPanelOpen ? (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[22rem] rounded-md border border-border bg-surface p-3 shadow-[0_18px_40px_rgb(37_31_26_/_0.14)]">
                      <p className="mb-3 text-sm font-semibold text-foreground">
                        Alinear a pagina
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {positionAlignmentActions.map(({ direction, label }) => (
                          <button
                            aria-label={`Alinear ${label}`}
                            className="flex h-10 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                            key={direction}
                            onClick={() => {
                              alignSelectedElements(direction);
                              setIsPositionPanelOpen(false);
                            }}
                            type="button"
                          >
                            <span className="grid size-5 place-items-center text-primary">
                              {direction === "top" || direction === "bottom" ? (
                                <span className="h-4 w-4 border-b-2 border-t-2 border-current" />
                              ) : direction === "middle" ? (
                                <span className="h-4 w-4 border-y-2 border-current" />
                              ) : direction === "left" || direction === "right" ? (
                                <span className="h-4 w-4 border-l-2 border-r-2 border-current" />
                              ) : (
                                <span className="h-4 w-4 border-x-2 border-current" />
                              )}
                            </span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mx-1 h-6 w-px bg-border" />

                <button
                  aria-label="Duplicar"
                  className="grid size-9 place-items-center rounded-md text-foreground transition hover:bg-muted"
                  onClick={duplicateSelectedElements}
                  type="button"
                >
                  <Copy className="size-4" />
                </button>
                <button
                  aria-label="Eliminar texto"
                  className="grid size-9 place-items-center rounded-md text-foreground transition hover:bg-muted"
                  onClick={deleteSelectedElements}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>

              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecciona un texto para editarlo.
            </p>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2">
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
              const selected = selectedElementIds.includes(element.id);

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
                  onClick={(event) =>
                    toggleLayerSelection(element.id, event.shiftKey)
                  }
                  onDoubleClick={() => {
                    setSelectedElementIds([element.id]);
                    setEditingElementId(element.id);
                  }}
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
                    {Math.round(fontPxToPt(element.fontSize, template))}pt
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
          <PersonalizationCanvas
            editingElementId={editingElementId}
            hoveredElementId={hoveredElementId}
            onEditingElementIdChange={setEditingElementId}
            onSelectedElementIdsChange={setSelectedElementIds}
            onUpdateTextElement={onUpdateTextElement}
            onUpdateTextElements={onUpdateTextElements}
            previewMode={false}
            scene={scene}
            selectedElementIds={activeSelectedElementIds}
            template={template}
            zoom={zoom}
          />
          <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full border border-border bg-white/95 px-2 py-1 shadow-sm">
            <Button
              aria-label="Ajustar al viewport"
              onClick={() => setZoomIndex(3)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Fit
            </Button>
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
