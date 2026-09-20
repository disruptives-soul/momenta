"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PersonalizationLayoutOverrides,
  PersonalizationValues,
} from "@/features/personalization/types/personalization-draft";
import { getTextElementLines } from "@/features/personalization/services/text-scene-safe-area";
import { cn } from "@/lib/utils";
import type { InvitationTemplate, TextElement } from "../templates/template-types";
import { layoutPathText } from "../templates/path-text-layout";
import {
  getTemplateMasterAssetSrc,
  getTemplatePreviewAssetSrc,
} from "../templates/template-assets";
import { getPublicFontAssetUrl } from "../templates/google-font-assets";
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

type PreviewFontAsset = {
  family: string;
  source: string;
  weight: string;
};

function getPrimaryFontFamily(fontFamily: string) {
  return (
    fontFamily
      .split(",")[0]
      ?.replaceAll("\"", "")
      .replaceAll("'", "")
      .trim() || fontFamily
  );
}

function getPreviewFontAssets(scene?: TextElement[]) {
  const assets = new Map<string, PreviewFontAsset>();

  scene?.forEach((element) => {
    if (!element.fontAsset) {
      return;
    }

    const family = getPrimaryFontFamily(element.fontFamily);
    const regular = element.fontAsset.regular;
    const bold = element.fontAsset.bold;

    assets.set(`${family}:400:${regular}`, {
      family,
      source: getPublicFontAssetUrl(regular),
      weight: "400",
    });

    if (bold) {
      assets.set(`${family}:700:${bold}`, {
        family,
        source: getPublicFontAssetUrl(bold),
        weight: "700",
      });
    }
  });

  return Array.from(assets.values());
}

function hasLoadedFontFace(asset: PreviewFontAsset) {
  return Array.from(document.fonts).some(
    (font) =>
      font.family.replaceAll("\"", "") === asset.family &&
      font.weight === asset.weight &&
      font.status === "loaded",
  );
}

function usePreviewFonts(scene?: TextElement[]) {
  const [, setLoadVersion] = useState(0);
  const fontAssets = useMemo(() => getPreviewFontAssets(scene), [scene]);
  const fontSignature = useMemo(
    () =>
      fontAssets
        .map((asset) => `${asset.family}:${asset.weight}:${asset.source}`)
        .join("|"),
    [fontAssets],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("FontFace" in window)) {
      return;
    }

    let isDisposed = false;

    async function loadFonts() {
      await Promise.all(
        fontAssets.map(async (asset) => {
          if (hasLoadedFontFace(asset)) {
            return;
          }

          const fontFace = new FontFace(
            asset.family,
            `url("${asset.source}")`,
            {
              style: "normal",
              weight: asset.weight,
            },
          );

          const loadedFace = await fontFace.load();
          document.fonts.add(loadedFace);
        }),
      );
      await document.fonts.ready;

      if (!isDisposed) {
        setLoadVersion((current) => current + 1);
      }
    }

    void loadFonts().catch((error) => {
      console.warn("Momenta preview font load failed; using fallback font.", error);
    });

    return () => {
      isDisposed = true;
    };
  }, [fontAssets, fontSignature]);
}

function getSvgTextX(
  source: Pick<TextElement, "align" | "sourceTextKind" | "width" | "x">,
) {
  if (source.sourceTextKind !== "area") {
    return source.x;
  }

  if (source.align === "right") {
    return source.x + source.width;
  }

  if (source.align === "center") {
    return source.x + source.width / 2;
  }

  return source.x;
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

  usePreviewFonts(scene);

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
              if (element.kind === "pathText") {
                const glyphs = layoutPathText({
                  text: element.text,
                  align: element.align,
                  centerX: element.x,
                  centerY: element.y,
                  path: element.path,
                  fontSize: element.fontSize,
                  letterSpacing: element.letterSpacing ?? 0,
                  rotation: element.rotation ?? 0,
                });

                return (
                  <g key={element.id}>
                    {glyphs.map((glyph, index) => (
                      <text
                        dominantBaseline="middle"
                        fill={element.fill}
                        fontFamily={element.fontFamily}
                        fontSize={element.fontSize}
                        fontWeight={element.fontWeight ?? 500}
                        key={`${element.id}-${index}-${glyph.character}`}
                        opacity={element.opacity ?? 1}
                        textAnchor="middle"
                        transform={`rotate(${glyph.rotation} ${glyph.x} ${glyph.y})`}
                        x={glyph.x}
                        y={glyph.y}
                      >
                        {glyph.character}
                      </text>
                    ))}
                  </g>
                );
              }

              const lineHeight = element.lineHeight ?? 1.15;
              const lines = getTextElementLines(element);
              const textX = getSvgTextX(element);

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
                      ? `rotate(${element.rotation} ${textX} ${element.y})`
                      : undefined
                  }
                  x={textX}
                  y={element.y}
                >
                  {lines.map((line, index) => (
                    <tspan
                      dy={index === 0 ? 0 : element.fontSize * lineHeight}
                      key={`${element.id}-${line}-${index}`}
                      x={textX}
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
                (() => {
                  const textX = getSvgTextX({ ...field, x: copy.x });

                  return (
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
                          ? `rotate(${field.rotation} ${textX} ${copy.y})`
                          : undefined
                      }
                      x={textX}
                      y={copy.y}
                    >
                      {lines.map((line, index) => (
                        <tspan
                          dy={index === 0 ? 0 : fontSize * lineHeight}
                          key={`${fieldKey}-${line}-${index}`}
                          x={textX}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  );
                })()
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
