"use client";

import { useEffect, useRef } from "react";
import type Konva from "konva";
import { Text, Transformer } from "react-konva";
import type { TextElement } from "@/features/rendering/templates/template-types";
import {
  getAlignedTextLeft,
  getScaledFontSize,
  type TemplateScale,
} from "../services/template-layout";

type EditableTextProps = {
  element: TextElement;
  scale: TemplateScale;
  isActive: boolean;
  disabled?: boolean;
  onChange: (elementId: string, patch: Partial<TextElement>) => void;
  onSelect: (elementId: string) => void;
  onStartEditing: (element: TextElement) => void;
};

export function EditableText({
  element,
  scale,
  isActive,
  disabled = false,
  onChange,
  onSelect,
  onStartEditing,
}: EditableTextProps) {
  const textRef = useRef<Konva.Text | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const scaledFontSize = getScaledFontSize(element.fontSize, scale);
  const scaledWidth = element.width * scale.scaleX;
  const x = getAlignedTextLeft(
    element.x * scale.scaleX,
    scaledWidth,
    element.align,
  );
  const y = element.y * scale.scaleY - scaledFontSize * 0.82;
  const lineHeight = element.lineHeight ?? 1.15;

  useEffect(() => {
    if (!isActive || !textRef.current || !transformerRef.current) {
      return;
    }

    transformerRef.current.nodes([textRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isActive, scaledFontSize, scaledWidth, element.text]);

  function getMasterAnchorFromNode(node: Konva.Text) {
    const widthPx = node.width() / scale.scaleX;
    const leftPx = node.x() / scale.scaleX;
    const yPx = (node.y() + scaledFontSize * 0.82) / scale.scaleY;
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

  function commitLayoutFromNode(node: Konva.Text) {
    const anchor = getMasterAnchorFromNode(node);
    const nextWidth = Math.max(80, (node.width() * node.scaleX()) / scale.scaleX);
    const nextFontSize = Math.max(
      element.minFontSize,
      element.fontSize * node.scaleY(),
    );

    node.width(nextWidth * scale.scaleX);
    node.scaleX(1);
    node.scaleY(1);

    onChange(element.id, {
      ...anchor,
      width: nextWidth,
      fontSize: nextFontSize,
      rotation: node.rotation(),
    });
  }

  return (
    <>
      <Text
        align={element.align}
        draggable={!disabled}
        fill={element.fill}
        fontFamily={element.fontFamily}
        fontSize={scaledFontSize}
        fontStyle={(element.fontWeight ?? 500) >= 700 ? "bold" : "normal"}
        height={scaledFontSize * lineHeight * element.maxLines}
        letterSpacing={element.letterSpacing ?? 0}
        lineHeight={lineHeight}
        listening={!disabled}
        onClick={() => !disabled && onSelect(element.id)}
        onDblClick={() => !disabled && onStartEditing(element)}
        onDragEnd={(event) => commitLayoutFromNode(event.target as Konva.Text)}
        onTap={() => !disabled && onSelect(element.id)}
        onTransformEnd={(event) =>
          commitLayoutFromNode(event.target as Konva.Text)
        }
        opacity={element.opacity ?? 1}
        ref={textRef}
        rotation={element.rotation ?? 0}
        text={element.text}
        width={scaledWidth}
        x={x}
        y={y}
      />
      {isActive && !disabled ? (
        <Transformer
          anchorCornerRadius={4}
          anchorFill="#ffffff"
          anchorSize={8}
          anchorStroke="#0f766e"
          borderDash={[6, 4]}
          borderStroke="#0f766e"
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 36 || newBox.height < 18) {
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
          ref={transformerRef}
          rotateEnabled
        />
      ) : null}
    </>
  );
}
