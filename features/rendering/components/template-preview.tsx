"use client";

import type {
  PersonalizationLayoutOverrides,
  PersonalizationValues,
} from "@/features/personalization/types/personalization-draft";
import { cn } from "@/lib/utils";
import type { InvitationTemplate, TextElement } from "../templates/template-types";
import {
  getTemplateMasterAssetSrc,
  getTemplatePreviewAssetSrc,
} from "../templates/template-assets";
import { getRenderingTemplate } from "../templates/template-registry";
import {
  getArcTextCharacters,
  getResponsiveFontSize,
  getTemplateFieldValue,
  getTextAnchor,
  getTextWeight,
  wrapTemplateText,
} from "../templates/template-text";
import { applyFieldOverride } from "../templates/template-overrides";

type TemplatePreviewProps = {
  values: PersonalizationValues;
  ariaLabel?: string;
  layout?: PersonalizationLayoutOverrides;
  scene?: TextElement[];
  template?: InvitationTemplate;
  templateId?: string;
  compact?: boolean;
};

function wrapSceneText(element: TextElement) {
  const maxCharactersPerLine = Math.max(
    8,
    Math.floor(element.width / (element.fontSize * 0.54)),
  );
  const lines: string[] = [];

  for (const paragraph of element.text.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let currentLine = "";

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (!currentLine || nextLine.length <= maxCharactersPerLine) {
        currentLine = nextLine;
        continue;
      }

      lines.push(currentLine);
      currentLine = word;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [element.text.trim()];
}

export function TemplatePreview({
  values,
  ariaLabel,
  layout,
  scene,
  template: explicitTemplate,
  templateId = "space-birthday-invitation-v1",
  compact = false,
}: TemplatePreviewProps) {
  const template =
    explicitTemplate ??
    getRenderingTemplate(templateId) ??
    getRenderingTemplate("space-birthday-invitation-v1");

  if (!template) {
    return null;
  }

  const widthPx = template.widthPx ?? 1748;
  const heightPx = template.heightPx ?? 2480;
  const backgroundSrc = scene
    ? getTemplateMasterAssetSrc(template)
    : getTemplatePreviewAssetSrc(template);
  const watermarkPatternId = `momenta-watermark-${template.id.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const hasLongText = scene
    ? scene.some((element) => element.text.length > 92)
    : Object.values(values).some((value) => value.length > 92);

  return (
    <figure>
      <svg
        aria-label={ariaLabel ?? "Vista previa personalizada"}
        className={cn(
          "mx-auto block h-auto w-full max-w-sm overflow-hidden rounded-md border border-border bg-surface shadow-md",
          compact && "max-w-64",
        )}
        role="img"
        viewBox={`0 0 ${widthPx} ${heightPx}`}
      >
        <image
          height={heightPx}
          href={backgroundSrc}
          preserveAspectRatio="xMidYMid slice"
          width={widthPx}
          x="0"
          y="0"
        />
        <defs>
          <pattern
            height={Math.max(260, heightPx / 7)}
            id={watermarkPatternId}
            patternUnits="userSpaceOnUse"
            width={Math.max(520, widthPx / 3)}
          >
            <text
              fill="#111827"
              fontFamily="Arial, sans-serif"
              fontSize={Math.max(46, widthPx / 28)}
              fontWeight="700"
              opacity="0.12"
              textAnchor="middle"
              transform={`rotate(-32 ${Math.max(260, widthPx / 6)} ${Math.max(130, heightPx / 14)})`}
              x={Math.max(260, widthPx / 6)}
              y={Math.max(130, heightPx / 14)}
            >
              MOMENTA PREVIEW
            </text>
          </pattern>
        </defs>
        {scene
          ? scene.map((element) => {
              const lineHeight = element.lineHeight ?? 1.15;
              const lines = wrapSceneText(element);

              return (
                <text
                  fill={element.fill}
                  fontFamily={element.fontFamily}
                  fontSize={element.fontSize}
                  fontWeight={element.fontWeight ?? 500}
                  key={element.id}
                  letterSpacing={element.letterSpacing}
                  opacity={element.opacity ?? 1}
                  textAnchor={getTextAnchor(element.align)}
                  transform={
                    element.rotation
                      ? `rotate(${element.rotation} ${element.x} ${element.y})`
                      : undefined
                  }
                  x={element.x}
                  y={element.y}
                >
                  {lines.map((line, index) => (
                    <tspan
                      dy={index === 0 ? 0 : element.fontSize * lineHeight}
                      key={`${element.id}-${line}-${index}`}
                      x={element.x}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })
          : null}
        {!scene ? Object.entries(template.fields).map(([fieldKey, baseField]) => {
          const field = applyFieldOverride(baseField, layout?.[fieldKey]);
          const value = getTemplateFieldValue(fieldKey, field, values);
          const fontSize = getResponsiveFontSize(value, field);
          const lines = wrapTemplateText(value, field);
          const lineHeight = field.lineHeight ?? 1.15;

          return (
            (field.copies ?? [{ x: field.x, y: field.y }]).map((copy, copyIndex) => (
              field.arc ? (
                <g
                  key={`${fieldKey}-${copyIndex}`}
                  transform={
                    field.rotation
                      ? `rotate(${field.rotation} ${copy.x} ${copy.y})`
                      : undefined
                  }
                >
                  {getArcTextCharacters(
                    value,
                    copy,
                    field.arc,
                    fontSize,
                    field.letterSpacing,
                  ).map((arcCharacter, characterIndex) => (
                    <text
                      dominantBaseline="middle"
                      fill={field.fill}
                      fontFamily={field.fontFamily}
                      fontSize={fontSize}
                      fontWeight={getTextWeight(fieldKey, field)}
                      key={`${fieldKey}-${copyIndex}-${characterIndex}`}
                      opacity={field.opacity ?? 1}
                      textAnchor="middle"
                      transform={`rotate(${arcCharacter.rotation} ${arcCharacter.x} ${arcCharacter.y})`}
                      x={arcCharacter.x}
                      y={arcCharacter.y}
                    >
                      {arcCharacter.character}
                    </text>
                  ))}
                </g>
              ) : (
                <text
                  fill={field.fill}
                  fontFamily={field.fontFamily}
                  fontSize={fontSize}
                  fontWeight={getTextWeight(fieldKey, field)}
                  key={`${fieldKey}-${copyIndex}`}
                  letterSpacing={field.letterSpacing}
                  opacity={field.opacity ?? 1}
                  textAnchor={getTextAnchor(field.align)}
                  transform={
                    field.rotation
                      ? `rotate(${field.rotation} ${copy.x} ${copy.y})`
                      : undefined
                  }
                  x={copy.x}
                  y={copy.y}
                >
                  {lines.map((line, index) => (
                    <tspan
                      dy={index === 0 ? 0 : fontSize * lineHeight}
                      key={`${fieldKey}-${line}-${index}`}
                      x={copy.x}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              )
            ))
          );
        }) : null}
        <rect
          fill={`url(#${watermarkPatternId})`}
          height={heightPx}
          pointerEvents="none"
          width={widthPx}
          x="0"
          y="0"
        />
      </svg>
      {hasLongText ? (
        <figcaption className="mx-auto mt-3 max-w-sm text-sm text-warning">
          Algunos textos estan cerca del limite visual de la pieza.
        </figcaption>
      ) : null}
    </figure>
  );
}
