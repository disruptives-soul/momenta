"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Type } from "lucide-react";
import {
  Image as KonvaImage,
  Layer,
  Line,
  Stage,
  Text as KonvaText,
} from "react-konva";
import type {
  InvitationTemplate,
  TextElement,
} from "@/features/rendering/templates/template-types";
import { useTemplateScale } from "../hooks/use-template-scale";
import { getScaledFontSize } from "../services/template-layout";
import { EditableText } from "./editable-text";
import type { CanvasAlignmentGuide } from "../services/canvas-guides";
import {
  getTemplateSafeArea,
  getTextVisualBox,
} from "@/features/personalization/services/text-scene-safe-area";

type PersonalizationCanvasProps = {
  template: InvitationTemplate;
  scene: TextElement[];
  selectedElementId: string | null;
  hoveredElementId?: string | null;
  zoom: number;
  previewMode: boolean;
  onSelectedElementChange: (elementId: string | null) => void;
  onUpdateTextElement: (elementId: string, patch: Partial<TextElement>) => void;
};

function useCanvasImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const nextImage = new window.Image();
    nextImage.decoding = "async";
    nextImage.src = src;
    nextImage.onload = () => setImage(nextImage);

    return () => {
      nextImage.onload = null;
    };
  }, [src]);

  return image;
}

export function PersonalizationCanvas({
  template,
  scene,
  selectedElementId,
  hoveredElementId = null,
  zoom,
  previewMode,
  onSelectedElementChange,
  onUpdateTextElement,
}: PersonalizationCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scale = useTemplateScale(containerRef, template, zoom);
  const image = useCanvasImage(template.preview.src);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<
    CanvasAlignmentGuide[]
  >([]);
  const [canvasHoveredElementId, setCanvasHoveredElementId] = useState<string | null>(
    null,
  );
  const visibleHoverElementId = hoveredElementId ?? canvasHoveredElementId;
  const activeElement =
    scene.find((element) => element.id === selectedElementId) ?? null;
  const hoveredElement =
    scene.find((element) => element.id === visibleHoverElementId) ?? null;
  const canvasHintElement = hoveredElement ?? null;
  const editingElement =
    scene.find((element) => element.id === editingElementId) ?? null;

  const editingStyle = useMemo(() => {
    if (!editingElement) {
      return null;
    }

    const visualBox = getTextVisualBox(editingElement);
    const fontSize = getScaledFontSize(editingElement.fontSize, scale);
    const left = visualBox.x * scale.scaleX;
    const top = visualBox.y * scale.scaleY;

    return {
      color: editingElement.fill,
      fontSize,
      fontWeight: editingElement.fontWeight ?? 500,
      left,
      lineHeight: editingElement.lineHeight ?? 1.15,
      opacity: editingElement.opacity ?? 1,
      rotation: editingElement.rotation ?? 0,
      textAlign: editingElement.align,
      top,
      width: visualBox.width * scale.scaleX,
    };
  }, [editingElement, scale]);
  const safeArea = useMemo(() => {
    const templateSafeArea = getTemplateSafeArea(template);

    return {
      x: templateSafeArea.x * scale.scaleX,
      y: templateSafeArea.y * scale.scaleY,
      width: templateSafeArea.width * scale.scaleX,
      height: templateSafeArea.height * scale.scaleY,
    };
  }, [scale.scaleX, scale.scaleY, template]);
  const canvasHintStyle = useMemo(() => {
    if (!canvasHintElement) {
      return null;
    }

    const visualBox = getTextVisualBox(canvasHintElement);
    const scaledWidth = visualBox.width * scale.scaleX;
    const left = visualBox.x * scale.scaleX;
    const top = visualBox.y * scale.scaleY - 30;

    return {
      left: Math.max(8, Math.min(scale.width - 128, left + scaledWidth / 2)),
      top: Math.max(8, top),
    };
  }, [canvasHintElement, scale]);
  const watermarkTiles = useMemo(() => {
    const stepX = Math.max(220, scale.width / 2.3);
    const stepY = Math.max(140, scale.height / 4.8);
    const tiles: Array<{ id: string; x: number; y: number }> = [];

    for (let y = -stepY; y < scale.height + stepY; y += stepY) {
      for (let x = -stepX; x < scale.width + stepX; x += stepX) {
        tiles.push({
          id: `${Math.round(x)}-${Math.round(y)}`,
          x,
          y,
        });
      }
    }

    return tiles;
  }, [scale.height, scale.width]);

  function startEditing(element: TextElement) {
    if (previewMode) {
      return;
    }

    onSelectedElementChange(element.id);
    setAlignmentGuides([]);
    setEditingElementId(element.id);
  }

  useEffect(() => {
    if (!editingElement || !textareaRef.current) {
      return;
    }

    const textarea = textareaRef.current;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editingElement?.text, editingElement]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-start justify-center overflow-auto rounded-md bg-[#eef2f1] p-4"
    >
      <div className="relative shrink-0" style={{ width: scale.width }}>
        {!previewMode ? (
          null
        ) : null}
        <div className="overflow-hidden rounded-md border border-border bg-surface shadow-md">
        <Stage height={scale.height} width={scale.width}>
          <Layer name="ArtworkLayer">
            {image ? (
              <KonvaImage
                height={scale.height}
                image={image}
                listening={false}
                width={scale.width}
                x={0}
                y={0}
              />
            ) : null}
          </Layer>
          <Layer name="TextLayer">
            {!previewMode
              ? alignmentGuides.map((guide) => (
                  <Line
                    dash={[8, 6]}
                    key={guide.id}
                    listening={false}
                    opacity={0.8}
                    points={
                      guide.orientation === "vertical"
                        ? [
                            guide.position,
                            guide.start,
                            guide.position,
                            guide.end,
                          ]
                        : [
                            guide.start,
                            guide.position,
                            guide.end,
                            guide.position,
                          ]
                    }
                    stroke="#0f766e"
                    strokeWidth={1.5}
                  />
                ))
              : null}
            {scene.map((element) => (
              <EditableText
                canvasSize={{ width: scale.width, height: scale.height }}
                disabled={previewMode}
                element={element}
                isHovered={element.id === visibleHoverElementId}
                isEditing={element.id === editingElementId}
                isActive={element.id === selectedElementId}
                key={element.id}
                onChange={onUpdateTextElement}
                onGuidesChange={setAlignmentGuides}
                onHoverChange={setCanvasHoveredElementId}
                onSelect={onSelectedElementChange}
                onStartEditing={startEditing}
                safeArea={safeArea}
                scale={scale}
              />
            ))}
          </Layer>
          <Layer listening={false} name="WatermarkLayer">
            {watermarkTiles.map((tile) => (
              <KonvaText
                fill="#111827"
                fontFamily="Arial"
                fontSize={Math.max(18, scale.width / 18)}
                fontStyle="bold"
                key={tile.id}
                listening={false}
                opacity={0.13}
                rotation={-28}
                text="MOMENTA PREVIEW"
                width={Math.max(220, scale.width / 2.5)}
                x={tile.x}
                y={tile.y}
              />
            ))}
          </Layer>
        </Stage>
        </div>

        {!previewMode && canvasHintElement && canvasHintStyle ? (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-lg"
            style={canvasHintStyle}
          >
            Click para editar
          </div>
        ) : null}

        {!previewMode && editingElement && editingStyle ? (
          <textarea
            autoFocus
            className="absolute z-30 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none"
            onBlur={() => setEditingElementId(null)}
            onChange={(event) =>
              onUpdateTextElement(editingElement.id, {
                text: event.target.value,
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setEditingElementId(null);
              }

              if (event.key === "Enter" && editingElement.maxLines === 1) {
                event.preventDefault();
                setEditingElementId(null);
              }
            }}
            ref={textareaRef}
            style={{
              color: editingStyle.color,
              fontFamily: editingElement.fontFamily,
              fontSize: editingStyle.fontSize,
              fontWeight: editingStyle.fontWeight,
              letterSpacing: editingElement.letterSpacing ?? 0,
              left: editingStyle.left,
              lineHeight: editingStyle.lineHeight,
              opacity: editingStyle.opacity,
              textAlign: editingStyle.textAlign,
              top: editingStyle.top,
              transform: editingStyle.rotation
                ? `rotate(${editingStyle.rotation}deg)`
                : undefined,
              transformOrigin: "top left",
              width: editingStyle.width,
            }}
            value={editingElement.text}
          />
        ) : null}
      </div>

      {!previewMode && activeElement ? (
        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/30 bg-white/95 px-2 py-1.5 text-sm shadow-lg">
          <span className="font-medium">{activeElement.label}</span>
          <button
            aria-label="Editar texto"
            className="grid size-8 place-items-center rounded-full hover:bg-muted"
            onClick={() => startEditing(activeElement)}
            type="button"
          >
            <Type className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
