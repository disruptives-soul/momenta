"use client";

import { useEffect, useRef } from "react";
import type Konva from "konva";
import { Rect, Text, Transformer } from "react-konva";
import type { TextElement } from "@/features/rendering/templates/template-types";
import { getScaledFontSize, type TemplateScale } from "../services/template-layout";
import {
  getSmartCanvasGuides,
  type CanvasAlignmentGuide,
} from "../services/canvas-guides";
import {
  getRotatedBox,
  getSafeAreaShift,
  getTextVisualBox,
  type TemplateSafeArea,
} from "@/features/personalization/services/text-scene-safe-area";

type NormalizedTextLayout = Pick<
  TextElement,
  "x" | "y" | "width" | "fontSize" | "rotation"
>;

type CanvasSize = {
  width: number;
  height: number;
};

type GuideBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type EditableTextProps = {
  element: TextElement;
  scale: TemplateScale;
  safeArea: TemplateSafeArea;
  canvasSize: CanvasSize;
  guideBoxes: GuideBox[];
  isActive: boolean;
  isEditing: boolean;
  isHovered: boolean;
  disabled?: boolean;
  onChange: (elementId: string, patch: Partial<TextElement>) => void;
  onGuidesChange: (guides: CanvasAlignmentGuide[]) => void;
  onHoverChange: (elementId: string | null) => void;
  onSelect: (elementId: string, additive?: boolean) => void;
  onStartEditing: (element: TextElement) => void;
};

export function EditableText({
  element,
  scale,
  canvasSize,
  guideBoxes,
  isActive,
  isEditing,
  isHovered,
  disabled = false,
  onChange,
  onGuidesChange,
  onHoverChange,
  onSelect,
  onStartEditing,
  safeArea,
}: EditableTextProps) {
  const textRef = useRef<Konva.Text | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const pendingLayoutRef = useRef<NormalizedTextLayout | null>(null);
  const scaledFontSize = getScaledFontSize(element.fontSize, scale);
  const visualBox = getTextVisualBox(element);
  const scaledWidth = visualBox.width * scale.scaleX;
  const scaledHeight = visualBox.height * scale.scaleY;
  const x = visualBox.x * scale.scaleX;
  const y = visualBox.y * scale.scaleY;
  const lineHeight = element.lineHeight ?? 1.15;
  const isHoverVisible = isHovered && !isActive && !disabled && !isEditing;

  useEffect(() => {
    if (!isActive || !textRef.current || !transformerRef.current) {
      return;
    }

    transformerRef.current.nodes([textRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isActive, scaledFontSize, scaledWidth, element.text, isEditing]);

  function getDragBoundPosition(pos: { x: number; y: number }) {
    const box = getRotatedBox({
      x: pos.x,
      y: pos.y,
      width: scaledWidth,
      height: scaledHeight,
      rotation: element.rotation ?? 0,
    });
    const smartGuides = getSmartCanvasGuides(
      box,
      canvasSize,
      safeArea,
      guideBoxes,
    );
    const snappedBox = {
      ...box,
      x: box.x + smartGuides.dx,
      y: box.y + smartGuides.dy,
    };
    const shift = getSafeAreaShift(snappedBox, safeArea);

    onGuidesChange(smartGuides.guides);

    return {
      x: pos.x + smartGuides.dx + shift.dx,
      y: pos.y + smartGuides.dy + shift.dy,
    };
  }

  function getMasterAnchorFromNode(
    node: Konva.Text,
    nextWidth: number,
    nextFontSize: number,
  ) {
    const widthPx = nextWidth;
    const leftPx = node.x() / scale.scaleX;
    const nextScaledFontSize = getScaledFontSize(nextFontSize, scale);
    const yPx = (node.y() + nextScaledFontSize * 0.82) / scale.scaleY;
    const xPx =
      element.align === "center"
        ? leftPx + widthPx / 2
        : element.align === "right"
          ? leftPx + widthPx
          : leftPx;

    return {
      x: xPx,
      y: yPx,
    };
  }

  function isWidthOnlyResize(anchor: string | null | undefined) {
    return anchor === "middle-left" || anchor === "middle-right";
  }

  function getNormalizedLayoutFromNode(node: Konva.Text) {
    const activeAnchor = transformerRef.current?.getActiveAnchor();
    const widthScale = Math.max(Math.abs(node.scaleX()), 0.01);
    const heightScale = Math.max(Math.abs(node.scaleY()), 0.01);
    const widthOnlyResize = isWidthOnlyResize(activeAnchor);
    const fontScale = widthOnlyResize ? 1 : Math.max(widthScale, heightScale);
    const nextWidthScale = widthOnlyResize ? widthScale : fontScale;
    const nextWidth = Math.max(
      24,
      (node.width() * nextWidthScale) / scale.scaleX,
    );
    const nextFontSize = Math.max(
      element.minFontSize,
      element.fontSize * fontScale,
    );
    const anchor = getMasterAnchorFromNode(node, nextWidth, nextFontSize);

    return {
      ...anchor,
      width: nextWidth,
      fontSize: nextFontSize,
      rotation: element.rotation ?? 0,
    };
  }

  function normalizeNodeTransform(
    node: Konva.Text,
    layout: NormalizedTextLayout,
  ) {
    node.width(layout.width * scale.scaleX);
    node.fontSize(getScaledFontSize(layout.fontSize, scale));
    node.scaleX(1);
    node.scaleY(1);
    transformerRef.current?.forceUpdate();
  }

  function normalizeTransformFromNode(node: Konva.Text) {
    const layout = getNormalizedLayoutFromNode(node);
    const nextVisualBox = getTextVisualBox({
      ...element,
      width: layout.width,
      fontSize: layout.fontSize,
    });
    const nextBox = getRotatedBox({
      x: node.x(),
      y: node.y(),
      width: layout.width * scale.scaleX,
      height: nextVisualBox.height * scale.scaleY,
      rotation: element.rotation ?? 0,
    });

    pendingLayoutRef.current = layout;
    normalizeNodeTransform(node, layout);
    onGuidesChange(
      getSmartCanvasGuides(nextBox, canvasSize, safeArea, guideBoxes).guides,
    );

    return layout;
  }

  function commitLayoutFromNode(node: Konva.Text) {
    const layout =
      pendingLayoutRef.current ?? getNormalizedLayoutFromNode(node);

    pendingLayoutRef.current = null;
    normalizeNodeTransform(node, layout);
    onGuidesChange([]);
    onChange(element.id, layout);
  }

  function setPointerCursor(node: Konva.Node, cursor: string) {
    const container = node.getStage()?.container();

    if (container) {
      container.style.cursor = cursor;
    }
  }

  return (
    <>
      {isHoverVisible ? (
        <Rect
          dash={[7, 5]}
          height={scaledHeight}
          listening={false}
          rotation={element.rotation ?? 0}
          stroke="#ec4899"
          strokeWidth={1.5}
          width={scaledWidth}
          x={x}
          y={y}
        />
      ) : null}
      {isEditing ? (
        <Rect
          height={scaledHeight}
          listening={false}
          rotation={element.rotation ?? 0}
          stroke="#0f766e"
          strokeWidth={2}
          width={scaledWidth}
          x={x}
          y={y}
        />
      ) : null}
      <Text
        align={element.align}
        dragBoundFunc={getDragBoundPosition}
        draggable={!disabled}
        fill={element.fill}
        fontFamily={element.fontFamily}
        fontSize={scaledFontSize}
        fontStyle={(element.fontWeight ?? 500) >= 700 ? "bold" : "normal"}
        letterSpacing={element.letterSpacing ?? 0}
        lineHeight={lineHeight}
        listening={!disabled}
        onClick={(event) => !disabled && onSelect(element.id, event.evt.shiftKey)}
        onDblClick={() => !disabled && onStartEditing(element)}
        onDragEnd={(event) => commitLayoutFromNode(event.target as Konva.Text)}
        onMouseEnter={(event) => {
          if (disabled) return;
          setPointerCursor(event.target, "move");
          onHoverChange(element.id);
        }}
        onMouseLeave={(event) => {
          if (disabled) return;
          setPointerCursor(event.target, "default");
          onHoverChange(null);
        }}
        onTap={() => !disabled && onSelect(element.id)}
        onTransform={(event) =>
          normalizeTransformFromNode(event.target as Konva.Text)
        }
        onTransformEnd={(event) =>
          commitLayoutFromNode(event.target as Konva.Text)
        }
        opacity={element.opacity ?? 1}
        ref={textRef}
        rotation={element.rotation ?? 0}
        text={element.text}
        visible={!isEditing}
        width={scaledWidth}
        wrap="word"
        x={x}
        y={y}
      />
      {isActive && !disabled && !isEditing ? (
        <Transformer
          anchorCornerRadius={4}
          anchorFill="#ffffff"
          anchorSize={8}
          anchorStroke="#0f766e"
          borderDash={[6, 4]}
          borderStroke="#0f766e"
          boundBoxFunc={(oldBox, newBox) => {
            const minimumFontSize = getScaledFontSize(element.minFontSize, scale);
            const minimumWidth = Math.max(48, minimumFontSize * 1.6);

            if (
              newBox.width < minimumWidth ||
              newBox.height < minimumFontSize
            ) {
              return oldBox;
            }

            if (
              newBox.x < safeArea.x ||
              newBox.y < safeArea.y ||
              newBox.x + newBox.width > safeArea.x + safeArea.width ||
              newBox.y + newBox.height > safeArea.y + safeArea.height
            ) {
              return oldBox;
            }

            return newBox;
          }}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
          ]}
          flipEnabled={false}
          keepRatio={false}
          ref={transformerRef}
          rotateEnabled={false}
        />
      ) : null}
    </>
  );
}
