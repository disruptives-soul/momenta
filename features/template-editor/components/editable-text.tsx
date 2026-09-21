"use client";

import { useEffect, useRef } from "react";
import type Konva from "konva";
import { Group, Rect, Text, Transformer } from "react-konva";
import type {
  TextElement,
  TextPathGeometry,
} from "@/features/rendering/templates/template-types";
import { layoutPathText } from "@/features/rendering/templates/path-text-layout";
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

const activeGuideStroke = "#0f766e";
const hoverGuideStroke = "#b24c32";
const guideStrokeWidth = 2;

let textMeasurementContext: CanvasRenderingContext2D | null = null;

function getTextMeasurementContext() {
  if (typeof document === "undefined") {
    return null;
  }

  if (!textMeasurementContext) {
    textMeasurementContext = document.createElement("canvas").getContext("2d");
  }

  return textMeasurementContext;
}

function measureTrackedTextWidth(
  value: string,
  fontFamily: string,
  fontWeight: number | undefined,
  fontSize: number,
  letterSpacing: number,
) {
  const context = getTextMeasurementContext();
  const characters = Array.from(value);

  if (!context) {
    return (
      characters.length * fontSize * 0.54 +
      Math.max(0, characters.length - 1) * letterSpacing
    );
  }

  context.font = `${(fontWeight ?? 400) >= 700 ? 700 : 400} ${fontSize}px ${fontFamily}`;

  return (
    context.measureText(value).width +
    Math.max(0, characters.length - 1) * letterSpacing
  );
}

function getFittedPointFontSize(element: TextElement, maxWidth: number) {
  if (
    element.kind === "pathText" ||
    element.sourceTextKind !== "point" ||
    element.maxLines > 1
  ) {
    return element.fontSize;
  }

  const targetWidth = maxWidth * 0.96;
  const measuredWidth = measureTrackedTextWidth(
    element.text,
    element.fontFamily,
    element.fontWeight,
    element.fontSize,
    element.letterSpacing ?? 0,
  );

  if (measuredWidth <= targetWidth) {
    return element.fontSize;
  }

  const minFontSize = Math.max(8, element.minFontSize ?? element.fontSize * 0.45);
  let low = minFontSize;
  let high = element.fontSize;

  for (let index = 0; index < 10; index += 1) {
    const next = (low + high) / 2;
    const ratio = next / element.fontSize;
    const nextWidth = measureTrackedTextWidth(
      element.text,
      element.fontFamily,
      element.fontWeight,
      next,
      (element.letterSpacing ?? 0) * ratio,
    );

    if (nextWidth <= targetWidth) {
      low = next;
    } else {
      high = next;
    }
  }

  return low;
}

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
  const visualBox = getTextVisualBox(element);
  const renderFontSize = getFittedPointFontSize(element, visualBox.width);
  const renderFontScale =
    element.fontSize > 0 ? renderFontSize / element.fontSize : 1;
  const scaledFontSize = getScaledFontSize(renderFontSize, scale);
  const scaledWidth = visualBox.width * scale.scaleX;
  const scaledHeight = visualBox.height * scale.scaleY;
  const scaledLetterSpacing =
    (element.letterSpacing ?? 0) * renderFontScale * scale.scaleX;
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
    const xPx = element.sourceTextKind === "area"
      ? leftPx
      : element.align === "center"
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

  function getScaledPath(path: TextPathGeometry): TextPathGeometry {
    if (path.type === "circle") {
      return {
        ...path,
        radius: path.radius * scale.scaleX,
      };
    }

    return {
      ...path,
      radiusX: path.radiusX * scale.scaleX,
      radiusY: path.radiusY * scale.scaleY,
    };
  }

  if (element.kind === "pathText") {
    const pathBox = getTextVisualBox(element);
    const scaledPathBox = {
      x: pathBox.x * scale.scaleX,
      y: pathBox.y * scale.scaleY,
      width: pathBox.width * scale.scaleX,
      height: pathBox.height * scale.scaleY,
    };
    const glyphs = layoutPathText({
      text: element.text,
      align: element.align,
      centerX: element.x * scale.scaleX,
      centerY: element.y * scale.scaleY,
      path: getScaledPath(element.path),
      fontSize: scaledFontSize,
      letterSpacing: scaledLetterSpacing,
      rotation: element.rotation ?? 0,
    });

    return (
      <>
        {isHoverVisible || isActive || isEditing ? (
          <Rect
            height={scaledPathBox.height}
            listening={false}
            stroke={isHoverVisible ? hoverGuideStroke : activeGuideStroke}
            strokeWidth={guideStrokeWidth}
            width={scaledPathBox.width}
            x={scaledPathBox.x}
            y={scaledPathBox.y}
          />
        ) : null}
        <Group
          dragBoundFunc={(pos) => {
            const box = {
              ...scaledPathBox,
              x: scaledPathBox.x + pos.x,
              y: scaledPathBox.y + pos.y,
            };
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
          }}
          draggable={!disabled}
          listening={!disabled}
          onClick={(event) =>
            !disabled && onSelect(element.id, event.evt.shiftKey)
          }
          onDblClick={() => !disabled && onStartEditing(element)}
          onDragEnd={(event) => {
            const node = event.target;

            onGuidesChange([]);
            onChange(element.id, {
              x: element.x + node.x() / scale.scaleX,
              y: element.y + node.y() / scale.scaleY,
            });
            node.position({ x: 0, y: 0 });
          }}
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
          visible={!isEditing}
        >
          <Rect
            fill="transparent"
            height={scaledPathBox.height}
            width={scaledPathBox.width}
            x={scaledPathBox.x}
            y={scaledPathBox.y}
          />
          {glyphs.map((glyph, index) => (
            <Text
              fill={element.fill}
              fontFamily={element.fontFamily}
              fontSize={scaledFontSize}
              fontStyle={(element.fontWeight ?? 500) >= 700 ? "bold" : "normal"}
              key={`${element.id}-${index}-${glyph.character}`}
              listening={false}
              opacity={element.opacity ?? 1}
              offsetX={scaledFontSize * 0.27}
              offsetY={scaledFontSize * 0.36}
              rotation={glyph.rotation}
              text={glyph.character}
              x={glyph.x}
              y={glyph.y}
            />
          ))}
        </Group>
      </>
    );
  }

  return (
    <>
      {isHoverVisible ? (
        <Rect
          height={scaledHeight}
          listening={false}
          rotation={element.rotation ?? 0}
          stroke={hoverGuideStroke}
          strokeWidth={guideStrokeWidth}
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
          stroke={activeGuideStroke}
          strokeWidth={guideStrokeWidth}
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
        height={
          element.sourceTextKind === "area" || element.source === "illustrator"
            ? scaledHeight
            : undefined
        }
        letterSpacing={scaledLetterSpacing}
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
        wrap={
          element.sourceTextKind === "point" || element.maxLines <= 1
            ? "none"
            : "word"
        }
        x={x}
        y={y}
      />
      {isActive && !disabled && !isEditing ? (
        <Transformer
          anchorCornerRadius={4}
          anchorFill="#ffffff"
          anchorSize={10}
          anchorStroke={activeGuideStroke}
          anchorStrokeWidth={2}
          borderStroke={activeGuideStroke}
          borderStrokeWidth={guideStrokeWidth}
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
