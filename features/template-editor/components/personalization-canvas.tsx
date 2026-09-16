"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Type } from "lucide-react";
import {
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text as KonvaText,
} from "react-konva";
import type {
  InvitationTemplate,
  TextElement,
} from "@/features/rendering/templates/template-types";
import { useTemplateScale } from "../hooks/use-template-scale";
import {
  getAlignedTextLeft,
  getScaledFontSize,
} from "../services/template-layout";
import { EditableText } from "./editable-text";

type PersonalizationCanvasProps = {
  template: InvitationTemplate;
  scene: TextElement[];
  selectedElementId: string | null;
  zoom: number;
  previewMode: boolean;
  showGuides: boolean;
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
  zoom,
  previewMode,
  showGuides,
  onSelectedElementChange,
  onUpdateTextElement,
}: PersonalizationCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scale = useTemplateScale(containerRef, template, zoom);
  const image = useCanvasImage(template.preview.src);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const activeElement =
    scene.find((element) => element.id === selectedElementId) ?? null;
  const editingElement =
    scene.find((element) => element.id === editingElementId) ?? null;

  const editingStyle = useMemo(() => {
    if (!editingElement) {
      return null;
    }

    const scaledWidth = editingElement.width * scale.scaleX;
    const fontSize = getScaledFontSize(editingElement.fontSize, scale);
    const left = getAlignedTextLeft(
      editingElement.x * scale.scaleX,
      scaledWidth,
      editingElement.align,
    );
    const top = editingElement.y * scale.scaleY - fontSize * 0.95;

    return {
      fontSize,
      left: left + scale.offsetX,
      minHeight: Math.max(fontSize * (editingElement.maxLines > 1 ? 2.6 : 1.6), 36),
      textAlign: editingElement.align,
      top,
      width: scaledWidth,
    };
  }, [editingElement, scale]);
  const safeArea = {
    x: scale.width * 0.06,
    y: scale.height * 0.04,
    width: scale.width * 0.88,
    height: scale.height * 0.92,
  };
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
    setEditingElementId(element.id);
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-start justify-center overflow-auto rounded-md bg-[#eef2f1] p-4"
    >
      <div className="relative shrink-0" style={{ width: scale.width }}>
        {!previewMode ? (
          <>
            <div
              className="pointer-events-none absolute z-10 rounded border border-dashed border-primary/70"
              style={safeArea}
            />
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground"
              style={{
                left: safeArea.x + safeArea.width / 2,
                top: Math.max(6, safeArea.y - 13),
              }}
            >
              Area segura
            </div>
            <div className="pointer-events-none absolute -left-14 top-0 h-full w-10">
              <span className="absolute left-1/2 top-0 h-full w-px bg-foreground/50" />
              <span className="absolute left-1/2 top-0 h-2 w-3 -translate-x-1/2 border-t border-foreground/50" />
              <span className="absolute bottom-0 left-1/2 h-2 w-3 -translate-x-1/2 border-b border-foreground/50" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-[#eef2f1] px-1 text-xs font-semibold text-foreground">
                {template.heightMm} mm
              </span>
            </div>
            <div className="pointer-events-none absolute -bottom-10 left-0 h-8 w-full">
              <span className="absolute left-0 top-1/2 h-px w-full bg-foreground/50" />
              <span className="absolute left-0 top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/50" />
              <span className="absolute right-0 top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/50" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-[#eef2f1] px-2 text-xs font-semibold text-foreground">
                {template.widthMm} mm
              </span>
            </div>
          </>
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
            {!previewMode ? (
              <Rect
                dash={[12, 9]}
                height={safeArea.height}
                listening={false}
                opacity={0.5}
                stroke="#0f766e"
                strokeWidth={1}
                width={safeArea.width}
                x={safeArea.x}
                y={safeArea.y}
              />
            ) : null}
            {showGuides ? (
              <>
                <Line
                  listening={false}
                  points={[scale.width / 2, 0, scale.width / 2, scale.height]}
                  stroke="#0f766e"
                  strokeWidth={1}
                  dash={[8, 8]}
                  opacity={0.55}
                />
                <Line
                  listening={false}
                  points={[0, scale.height / 2, scale.width, scale.height / 2]}
                  stroke="#0f766e"
                  strokeWidth={1}
                  dash={[8, 8]}
                  opacity={0.55}
                />
              </>
            ) : null}
            {scene.map((element) => (
              <EditableText
                disabled={previewMode}
                element={element}
                isActive={element.id === selectedElementId}
                key={element.id}
                onChange={onUpdateTextElement}
                onSelect={onSelectedElementChange}
                onStartEditing={startEditing}
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
      </div>

      {!previewMode && editingElement && editingStyle ? (
        <textarea
          autoFocus
          className="absolute z-10 resize-none rounded-md border border-primary bg-white/95 px-2 py-1 text-foreground shadow-lg outline-none"
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
          style={{
            fontFamily: editingElement.fontFamily,
            fontSize: editingStyle.fontSize,
            left: editingStyle.left,
            minHeight: editingStyle.minHeight,
            textAlign: editingStyle.textAlign,
            top: editingStyle.top,
            width: editingStyle.width,
          }}
          value={editingElement.text}
        />
      ) : null}

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
