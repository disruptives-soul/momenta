"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Layers,
  Minus,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Ruler,
  SlidersHorizontal,
  Trash2,
  Type,
  Undo2,
  UploadCloud,
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
  templates: readonly InvitationTemplate[];
  template: InvitationTemplate;
  scene: TextElement[];
  constraints: TextSceneConstraints;
  canUndo: boolean;
  canRedo: boolean;
  onTemplateChange: (templateId: string) => void;
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
const editorSteps = [
  { id: "design", label: "Diseno", icon: FileText },
  { id: "options", label: "Opciones", icon: SlidersHorizontal },
  { id: "review", label: "Revisar", icon: Eye },
] as const;
type EditorPanel = "edit" | "text" | "layers" | "guides";
type EditorStep = (typeof editorSteps)[number]["id"];

type ProductOptions = {
  format: "impreso" | "digital";
  size: "a3" | "a4" | "stickers";
  paper: "mate" | "premium";
  corners: "square" | "rounded";
  print: "standard" | "hd";
  envelopes: "white" | "none";
  attribution: "remove" | "add";
  quantity: number;
};

const defaultProductOptions: ProductOptions = {
  format: "impreso",
  size: "a3",
  paper: "mate",
  corners: "square",
  print: "standard",
  envelopes: "white",
  attribution: "remove",
  quantity: 1,
};

function getTemplateLabel(templateId: string) {
  if (templateId.includes("banner")) return "Banner 2 x 1 m";
  if (templateId.includes("backing")) return "Backing 1 x 1 m";
  if (templateId.includes("stickers")) return "Stickers A3";
  return "Invitacion A3";
}

function getNextColor(colors: string[], currentColor: string) {
  const currentIndex = colors.indexOf(currentColor);

  if (currentIndex < 0) {
    return colors[0] ?? currentColor;
  }

  return colors[(currentIndex + 1) % colors.length] ?? currentColor;
}

function getFormatLabel(value: ProductOptions["format"]) {
  return value === "impreso" ? "Invitation impreso" : "Archivo digital";
}

function getSizeLabel(value: ProductOptions["size"]) {
  if (value === "a4") return "A4 : 21 x 29.7 cm";
  if (value === "stickers") return "Stickers A3";
  return "A3 : 29.7 x 42 cm";
}

function getPaperLabel(value: ProductOptions["paper"]) {
  return value === "premium" ? "Premium texturado" : "Mate Signatura";
}

function getCornersLabel(value: ProductOptions["corners"]) {
  return value === "rounded" ? "Redondeada" : "Cuadrada";
}

function getPrintLabel(value: ProductOptions["print"]) {
  return value === "hd" ? "HD" : "Estandar";
}

export function PersonalizationEditor({
  templates,
  template,
  scene,
  constraints,
  canUndo,
  canRedo,
  onTemplateChange,
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
  const [activeStep, setActiveStep] = useState<EditorStep>("design");
  const [activePanel, setActivePanel] = useState<EditorPanel>("edit");
  const [productOptions, setProductOptions] = useState<ProductOptions>(
    defaultProductOptions,
  );
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
  const sampleTextElements = scene
    .filter((element) =>
      /lorem|save the date|sarah|michael|anniversary|welcome/i.test(element.text),
    )
    .slice(0, 4);
  const estimatedTotal = productOptions.quantity * 2490;

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

  function updateProductOption<Key extends keyof ProductOptions>(
    key: Key,
    value: ProductOptions[Key],
  ) {
    setProductOptions((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function continueFromStep() {
    if (activeStep === "design") {
      setActiveStep("options");
      return;
    }

    if (activeStep === "options") {
      setActiveStep("review");
      return;
    }

    onContinue();
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
            <Link href="/collections/space-birthday">
              <X />
              Guardar y salir
            </Link>
          </Button>
          <div className="h-7 w-px bg-border" />
          <p className="max-w-[28rem] truncate text-sm font-medium">
            {getTemplateLabel(template.id)}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-success" />
            Guardado
          </div>
        </div>

        <div className="hidden items-center rounded-md border border-border bg-background p-1 md:flex">
          {editorSteps.map(({ id, label, icon: Icon }) => (
            <button
              className={cn(
                "flex h-9 items-center gap-2 rounded px-3 text-sm font-medium",
                activeStep === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              key={label}
              onClick={() => setActiveStep(id)}
              type="button"
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
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
          <Button onClick={continueFromStep} size="sm" type="button">
            {activeStep === "review" ? "Finalizar" : "Continuar"}
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid h-[calc(100%-4rem)] min-h-0 gap-4 p-5 lg:grid-cols-[5.5rem_23rem_minmax(0,1fr)]">
        <aside className="flex overflow-hidden rounded-2xl border border-border bg-white shadow-md lg:block">
          <button
            className={getRailButtonClass("edit")}
            onClick={() => {
              setActiveStep("design");
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
              setActiveStep("design");
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
              setActiveStep("design");
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
              setActiveStep("design");
              setActivePanel("guides");
            }}
            type="button"
          >
            <Ruler className="size-5" />
            Guias
          </button>
          <button
            className="flex h-14 flex-1 flex-col items-center justify-center gap-1 border-r border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground lg:w-full lg:border-b lg:border-r-0"
            type="button"
          >
            <UploadCloud className="size-5" />
            Archivos
          </button>
          <button
            className="flex h-14 flex-1 flex-col items-center justify-center gap-1 border-r border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground lg:w-full lg:border-b lg:border-r-0"
            type="button"
          >
            <FileText className="size-5" />
            Plantillas
          </button>
        </aside>

        <aside className="min-h-0 overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {activeStep === "options"
                  ? "Opciones"
                  : activeStep === "review"
                    ? "Revisar"
                    : activePanel === "layers"
                      ? "Capas"
                      : activePanel === "guides"
                        ? "Guias"
                        : activePanel === "text"
                          ? "Texto"
                          : "Editar"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeStep === "options"
                  ? "Producto final"
                  : activeStep === "review"
                    ? "Confirmar antes de generar"
                    : activePanel === "layers"
                      ? "Orden de textos"
                      : activePanel === "guides"
                        ? "Alineacion visual"
                        : "Escena textual"}
              </p>
            </div>
            {activeStep === "design" && selectedElement ? (
              <Badge tone="free">Seleccionado</Badge>
            ) : null}
          </div>

          {activeStep === "options" ? (
            <div className="grid gap-4">
              <div className="rounded-md border border-primary/25 bg-primary/10 p-3">
                <p className="text-sm font-semibold text-primary">
                  Producto trending
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Estas opciones preparan el set completo para imprimir o entregar
                  digitalmente.
                </p>
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-semibold">Elige tu formato</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["impreso", "Invitation impreso"],
                    ["digital", "Archivo digital"],
                  ].map(([value, label]) => (
                    <button
                      aria-pressed={productOptions.format === value}
                      className={cn(
                        "flex min-h-12 items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium",
                        productOptions.format === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface hover:bg-muted",
                      )}
                      key={value}
                      onClick={() =>
                        updateProductOption(
                          "format",
                          value as ProductOptions["format"],
                        )
                      }
                      type="button"
                    >
                      {label}
                      {productOptions.format === value ? (
                        <Check className="size-4" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Tamano</p>
                  <button
                    className="text-xs font-medium text-primary hover:underline"
                    type="button"
                  >
                    Tabla de tamanos
                  </button>
                </div>
                <div className="grid gap-2">
                  {[
                    ["a3", "A3 : 29.7 x 42 cm", "Set completo"],
                    ["a4", "A4 : 21 x 29.7 cm", "- ARS 700"],
                    ["stickers", "Stickers A3", "+ ARS 1.990"],
                  ].map(([value, label, price]) => (
                    <button
                      aria-pressed={productOptions.size === value}
                      className={cn(
                        "flex min-h-12 items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                        productOptions.size === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface hover:bg-muted",
                      )}
                      key={value}
                      onClick={() =>
                        updateProductOption("size", value as ProductOptions["size"])
                      }
                      type="button"
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <p className="text-sm font-semibold">Forma de esquina</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["square", "Cuadrada", "0"],
                    ["rounded", "Redondeada", "+ ARS 250"],
                  ].map(([value, label, price]) => (
                    <button
                      aria-pressed={productOptions.corners === value}
                      className={cn(
                        "grid min-h-20 gap-2 rounded-md border p-2 text-left text-sm",
                        productOptions.corners === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface hover:bg-muted",
                      )}
                      key={value}
                      onClick={() =>
                        updateProductOption(
                          "corners",
                          value as ProductOptions["corners"],
                        )
                      }
                      type="button"
                    >
                      <span
                        className={cn(
                          "h-8 w-10 border border-border bg-white",
                          value === "rounded" && "rounded-xl",
                        )}
                      />
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Tipo de papel</p>
                  <button
                    className="text-xs font-medium text-primary hover:underline"
                    type="button"
                  >
                    Comparacion
                  </button>
                </div>
                <div className="grid gap-2">
                  {[
                    ["mate", "Mate Signatura", "Incluido", "bg-[#f5f1e8]"],
                    ["premium", "Premium texturado", "+ ARS 550", "bg-[#e6e0d3]"],
                  ].map(([value, label, price, swatchClass]) => (
                    <button
                      aria-pressed={productOptions.paper === value}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-md border p-2 text-left text-sm",
                        productOptions.paper === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface hover:bg-muted",
                      )}
                      key={value}
                      onClick={() =>
                        updateProductOption(
                          "paper",
                          value as ProductOptions["paper"],
                        )
                      }
                      type="button"
                    >
                      <span
                        className={cn(
                          "size-9 shrink-0 rounded border border-border",
                          swatchClass,
                        )}
                      />
                      <span className="grid flex-1">
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">{price}</span>
                      </span>
                      {productOptions.paper === value ? (
                        <Check className="size-4" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <p className="text-sm font-semibold">Proceso de impresion</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["standard", "Estandar", "Incluido"],
                    ["hd", "HD", "+ ARS 450"],
                  ].map(([value, label, price]) => (
                    <button
                      aria-pressed={productOptions.print === value}
                      className={cn(
                        "rounded-md border p-3 text-left text-sm",
                        productOptions.print === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface hover:bg-muted",
                      )}
                      key={value}
                      onClick={() =>
                        updateProductOption(
                          "print",
                          value as ProductOptions["print"],
                        )
                      }
                      type="button"
                    >
                      <span className="block font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <p className="text-sm font-semibold">Sobres</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["white", "Blanco"],
                    ["none", "Ninguno"],
                  ].map(([value, label]) => (
                    <button
                      aria-pressed={productOptions.envelopes === value}
                      className={cn(
                        "rounded-md border p-3 text-sm",
                        productOptions.envelopes === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface hover:bg-muted",
                      )}
                      key={value}
                      onClick={() =>
                        updateProductOption(
                          "envelopes",
                          value as ProductOptions["envelopes"],
                        )
                      }
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 rounded-md border border-border p-3">
                <p className="text-sm font-semibold">Atribucion</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["remove", "Quitar logotipo"],
                    ["add", "Anadir logotipo"],
                  ].map(([value, label]) => (
                    <button
                      aria-pressed={productOptions.attribution === value}
                      className={cn(
                        "rounded-md border p-3 text-sm",
                        productOptions.attribution === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface hover:bg-muted",
                      )}
                      key={value}
                      onClick={() =>
                        updateProductOption(
                          "attribution",
                          value as ProductOptions["attribution"],
                        )
                      }
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 z-10 -mx-5 -mb-5 grid gap-3 border-t border-border bg-white p-5 shadow-[0_-10px_24px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <label
                    className="text-sm font-semibold"
                    htmlFor="product-quantity"
                  >
                    Cantidad
                  </label>
                  <Input
                    className="h-10 w-24 text-center"
                    id="product-quantity"
                    min={1}
                    onChange={(event) =>
                      updateProductOption(
                        "quantity",
                        Math.max(1, Number(event.target.value) || 1),
                      )
                    }
                    type="number"
                    value={productOptions.quantity}
                  />
                </div>
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Precio estimado
                    </p>
                    <p className="text-2xl font-semibold">
                      ARS {productOptions.quantity * 2490}
                    </p>
                  </div>
                  <Button
                    className="w-full justify-center"
                    onClick={() => setActiveStep("review")}
                    type="button"
                  >
                    Continuar a revisar
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>
          ) : activeStep === "review" ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  Aseguremonos de que este perfecto
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Revisa tu diseno antes de continuar.
                </p>
              </div>

              <div className="grid gap-3 rounded-md border border-border p-4 text-sm">
                <div className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                    <Check className="size-4" />
                  </span>
                  <div>
                    <h4 className="font-semibold">Cosas a revisar</h4>
                    <ul className="mt-2 grid gap-2 text-muted-foreground">
                      <li>Revisa nombres, fechas, hora y lugar.</li>
                      <li>Verifica que los textos sean claramente visibles.</li>
                      <li>Confirma que no queden textos de muestra.</li>
                      <li>Revisa todas las piezas del set antes de descargar.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {sampleTextElements.length > 0 ? (
                <div className="grid gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
                  <div className="flex gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-warning/20 text-warning">
                      <FileText className="size-4" />
                    </span>
                    <div>
                      <h4 className="font-semibold">Contenido de muestra</h4>
                      <p className="mt-1 text-muted-foreground">
                        Estos textos parecen placeholders. Puedes volver a Diseno
                        para editarlos antes de continuar.
                      </p>
                      <div className="mt-3 grid gap-2">
                        {sampleTextElements.map((element) => (
                          <button
                            className="rounded-md border border-border bg-surface p-2 text-left text-xs hover:bg-muted"
                            key={element.id}
                            onClick={() => {
                              setActiveStep("design");
                              setActivePanel("edit");
                              setSelectedElementId(element.id);
                            }}
                            type="button"
                          >
                            <span className="font-semibold">{element.label}: </span>
                            <span className="text-muted-foreground">
                              {element.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 rounded-md border border-border p-4 text-sm">
                <div className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <SlidersHorizontal className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">Tus opciones seleccionadas</h4>
                    <ul className="mt-3 grid gap-2 text-muted-foreground">
                      <li>Formato: {getFormatLabel(productOptions.format)}</li>
                      <li>Tamano: {getSizeLabel(productOptions.size)}</li>
                      <li>
                        Forma de esquina: {getCornersLabel(productOptions.corners)}
                      </li>
                      <li>Tipo de papel: {getPaperLabel(productOptions.paper)}</li>
                      <li>
                        Proceso de impresion: {getPrintLabel(productOptions.print)}
                      </li>
                      <li>
                        Sobres:{" "}
                        {productOptions.envelopes === "white" ? "Blanco" : "Ninguno"}
                      </li>
                      <li>
                        Atribucion:{" "}
                        {productOptions.attribution === "remove"
                          ? "Quitar logotipo"
                          : "Anadir logotipo"}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-md border border-border p-4 text-sm">
                <h4 className="font-semibold">Resumen del set</h4>
                <div className="grid gap-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Pieza actual</span>
                    <span className="font-medium">{getTemplateLabel(template.id)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Textos editables</span>
                    <span className="font-medium">{scene.length}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Cantidad</span>
                    <span className="font-medium">{productOptions.quantity}</span>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 -mx-5 -mb-5 grid gap-3 border-t border-border bg-white p-5 shadow-[0_-10px_24px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <strong>Subtotal</strong>
                  <div className="text-right">
                    <p className="text-xl font-semibold">ARS {estimatedTotal}</p>
                    <p className="text-xs text-muted-foreground">
                      ARS 2490 por set
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setActiveStep("options")}
                    type="button"
                    variant="secondary"
                  >
                    Opciones
                  </Button>
                  <Button onClick={onContinue} type="button">
                    Confirmar
                    <ChevronRight />
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setActiveStep("design");
                    setActivePanel("edit");
                  }}
                  type="button"
                  variant="ghost"
                >
                  Volver a diseno
                </Button>
              </div>
            </div>
          ) : activePanel === "layers" ? (
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
            {activeStep === "design" && selectedElement ? (
              <div className="flex max-w-full flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 shadow-sm">
                <Button
                  onClick={() => {
                    setActiveStep("design");
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
                  onClick={() =>
                    updateSelectedElement({
                      fontWeight:
                        (selectedElement.fontWeight ?? 500) >= 700 ? 500 : 700,
                    })
                  }
                  size="sm"
                  type="button"
                  variant={
                    (selectedElement.fontWeight ?? 500) >= 700
                      ? "primary"
                      : "secondary"
                  }
                >
                  B
                </Button>
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

          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_7.5rem] gap-4">
            <PersonalizationCanvas
              onCycleElementColor={(elementId) => {
                const element = scene.find((item) => item.id === elementId);

                if (!element) {
                  return;
                }

                onUpdateTextElement(elementId, {
                  fill: getNextColor(constraints.allowedColors, element.fill),
                });
              }}
              onSelectedElementChange={setSelectedElementId}
              onUpdateTextElement={onUpdateTextElement}
              previewMode={previewMode || activeStep !== "design"}
              scene={scene}
              selectedElementId={selectedElementId}
              showGuides={showGuides}
              template={template}
              zoom={zoom}
            />
            <aside className="hidden min-h-0 overflow-y-auto rounded-md border border-border bg-background p-2 xl:block">
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Piezas
              </p>
              <div className="grid gap-2">
                {templates.map((item) => (
                  <button
                    className={cn(
                      "grid gap-1 rounded-md border p-1.5 text-center text-xs font-medium",
                      item.id === template.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-foreground hover:bg-muted",
                    )}
                    key={item.id}
                    onClick={() => onTemplateChange(item.id)}
                    type="button"
                  >
                    <span className="overflow-hidden rounded border border-border bg-muted">
                      <Image
                        alt={getTemplateLabel(item.id)}
                        className="aspect-[3/4] h-auto w-full object-cover"
                        height={item.heightPx ?? 2480}
                        src={item.preview.src}
                        width={item.widthPx ?? item.preview.widthPx}
                      />
                    </span>
                    <span>{getTemplateLabel(item.id)}</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>

        <aside className="hidden">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Propiedades
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {selectedElement ? selectedElement.label : "Sin seleccion"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedElement ? "Texto recto" : "Selecciona un texto"}
              </p>
            </div>
            <SlidersHorizontal className="mt-1 size-5 text-muted-foreground" />
          </div>

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
