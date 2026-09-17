"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text as KonvaText,
} from "react-konva";
import type Konva from "konva";
import type {
  InvitationTemplate,
  TextElement,
} from "@/features/rendering/templates/template-types";
import { getTemplatePreviewAssetSrc } from "@/features/rendering/templates/template-assets";
import { useTemplateScale } from "../hooks/use-template-scale";
import { getScaledFontSize } from "../services/template-layout";
import { EditableText } from "./editable-text";
import type { CanvasAlignmentGuide } from "../services/canvas-guides";
import {
  getTemplateSafeArea,
  getSafeAreaShift,
  getTextRotatedBoundingBox,
  getTextVisualBox,
  type TemplateSafeArea,
} from "@/features/personalization/services/text-scene-safe-area";

type PersonalizationCanvasProps = {
  template: InvitationTemplate;
  scene: TextElement[];
  selectedElementIds: string[];
  hoveredElementId?: string | null;
  zoom: number;
  previewMode: boolean;
  onSelectedElementIdsChange: (elementIds: string[]) => void;
  onUpdateTextElement: (elementId: string, patch: Partial<TextElement>) => void;
  onUpdateTextElements: (
    patches: Array<{ elementId: string; patch: Partial<TextElement> }>,
  ) => void;
};

type SelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
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
  selectedElementIds,
  hoveredElementId = null,
  zoom,
  previewMode,
  onSelectedElementIdsChange,
  onUpdateTextElement,
  onUpdateTextElements,
}: PersonalizationCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const scale = useTemplateScale(containerRef, template, zoom);
  const image = useCanvasImage(getTemplatePreviewAssetSrc(template));
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<
    CanvasAlignmentGuide[]
  >([]);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const [canvasHoveredElementId, setCanvasHoveredElementId] = useState<string | null>(
    null,
  );
  const visibleHoverElementId = hoveredElementId ?? canvasHoveredElementId;
  const hoveredElement =
    scene.find((element) => element.id === visibleHoverElementId) ?? null;
  const canvasHintElement = hoveredElement ?? null;
  const editingElement =
    scene.find((element) => element.id === editingElementId) ?? null;
  const masterSafeArea = useMemo(() => getTemplateSafeArea(template), [template]);

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
    return {
      x: masterSafeArea.x * scale.scaleX,
      y: masterSafeArea.y * scale.scaleY,
      width: masterSafeArea.width * scale.scaleX,
      height: masterSafeArea.height * scale.scaleY,
    };
  }, [masterSafeArea, scale.scaleX, scale.scaleY]);
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

    onSelectedElementIdsChange([element.id]);
    setAlignmentGuides([]);
    setEditingElementId(element.id);
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

  function clampGroupDelta(deltaX: number, deltaY: number, elementIds: string[]) {
    const boxes = scene
      .filter((element) => elementIds.includes(element.id))
      .map(getTextRotatedBoundingBox);

    if (boxes.length === 0) {
      return { dx: deltaX, dy: deltaY };
    }

    const groupBox = getUnionBox(boxes);
    const shiftedBox = {
      ...groupBox,
      x: groupBox.x + deltaX,
      y: groupBox.y + deltaY,
    };
    const shift = getSafeAreaShift(shiftedBox, masterSafeArea);

    return {
      dx: deltaX + shift.dx,
      dy: deltaY + shift.dy,
    };
  }

  function handleTextSelect(elementId: string, additive = false) {
    if (!additive) {
      onSelectedElementIdsChange([elementId]);
      return;
    }

    onSelectedElementIdsChange(
      selectedElementIds.includes(elementId)
        ? selectedElementIds.filter((id) => id !== elementId)
        : [...selectedElementIds, elementId],
    );
  }

  function handleTextChange(
    elementId: string,
    patch: Partial<TextElement>,
  ) {
    const element = scene.find((item) => item.id === elementId);

    if (!element) {
      return;
    }

    const patchX = patch.x;
    const patchY = patch.y;
    const isGroupMove =
      selectedElementIds.length > 1 &&
      selectedElementIds.includes(elementId) &&
      typeof patchX === "number" &&
      typeof patchY === "number" &&
      patch.width === element.width &&
      patch.fontSize === element.fontSize;

    if (!isGroupMove) {
      onUpdateTextElement(elementId, patch);
      return;
    }

    const clampedDelta = clampGroupDelta(
      patchX - element.x,
      patchY - element.y,
      selectedElementIds,
    );

    onUpdateTextElements(
      scene
        .filter((item) => selectedElementIds.includes(item.id))
        .map((item) => ({
          elementId: item.id,
          patch: {
            x: item.x + clampedDelta.dx,
            y: item.y + clampedDelta.dy,
          },
        })),
    );
  }

  function getStagePointerPosition() {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();

    if (!pointer) {
      return null;
    }

    return pointer;
  }

  function handleStageMouseDown(event: Konva.KonvaEventObject<MouseEvent>) {
    if (previewMode || event.target !== event.target.getStage()) {
      return;
    }

    const pointer = getStagePointerPosition();

    if (!pointer) {
      return;
    }

    selectionStartRef.current = pointer;
    setSelectionRect({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
  }

  function handleStageMouseMove() {
    const start = selectionStartRef.current;
    const pointer = getStagePointerPosition();

    if (!start || !pointer) {
      return;
    }

    setSelectionRect({
      x: Math.min(start.x, pointer.x),
      y: Math.min(start.y, pointer.y),
      width: Math.abs(pointer.x - start.x),
      height: Math.abs(pointer.y - start.y),
    });
  }

  function intersectsBox(first: SelectionRect, second: SelectionRect) {
    return (
      first.x <= second.x + second.width &&
      first.x + first.width >= second.x &&
      first.y <= second.y + second.height &&
      first.y + first.height >= second.y
    );
  }

  function handleStageMouseUp() {
    const rect = selectionRect;

    if (!rect) {
      return;
    }

    selectionStartRef.current = null;
    setSelectionRect(null);

    if (rect.width < 4 && rect.height < 4) {
      onSelectedElementIdsChange([]);
      return;
    }

    onSelectedElementIdsChange(
      scene
        .filter((element) => {
          const visualBox = getTextVisualBox(element);

          return intersectsBox(rect, {
            x: visualBox.x * scale.scaleX,
            y: visualBox.y * scale.scaleY,
            width: visualBox.width * scale.scaleX,
            height: visualBox.height * scale.scaleY,
          });
        })
        .map((element) => element.id),
    );
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
        <div className="overflow-hidden rounded-md border border-border bg-surface shadow-md">
        <Stage
          height={scale.height}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          ref={stageRef}
          width={scale.width}
        >
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
                guideBoxes={scene
                  .filter(
                    (item) =>
                      item.id !== element.id &&
                      !selectedElementIds.includes(item.id),
                  )
                  .map((item) => {
                    const box = getTextVisualBox(item);

                    return {
                      x: box.x * scale.scaleX,
                      y: box.y * scale.scaleY,
                      width: box.width * scale.scaleX,
                      height: box.height * scale.scaleY,
                    };
                  })}
                isHovered={element.id === visibleHoverElementId}
                isEditing={element.id === editingElementId}
                isActive={selectedElementIds.includes(element.id)}
                key={element.id}
                onChange={handleTextChange}
                onGuidesChange={setAlignmentGuides}
                onHoverChange={setCanvasHoveredElementId}
                onSelect={handleTextSelect}
                onStartEditing={startEditing}
                safeArea={safeArea}
                scale={scale}
              />
            ))}
            {selectionRect ? (
              <Rect
                dash={[6, 4]}
                fill="#0f766e"
                height={selectionRect.height}
                listening={false}
                opacity={0.12}
                stroke="#0f766e"
                strokeWidth={1.5}
                width={selectionRect.width}
                x={selectionRect.x}
                y={selectionRect.y}
              />
            ) : null}
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
            Doble click para editar
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

    </div>
  );
}
