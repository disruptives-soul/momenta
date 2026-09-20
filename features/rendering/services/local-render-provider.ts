import type { RenderInput, RenderOutput, RenderProvider } from "@/services/ports/render-provider";
import type {
  PersonalizationLayoutOverrides,
  PersonalizationValues,
} from "@/features/personalization/types/personalization-draft";
import { spaceBirthdayInvitationTemplate } from "../templates/space-birthday-invitation-template";
import { loadRuntimeInvitationTemplate } from "../templates/load-runtime-template";
import type { InvitationTemplate, TextElement } from "../templates/template-types";
import {
  getArcTextCharacters,
  getResponsiveFontSize,
  getTemplateFieldValue,
  getTextAnchor,
  getTextWeight,
  wrapTemplateText,
} from "../templates/template-text";
import { applyFieldOverride } from "../templates/template-overrides";
import { getTextElementLines } from "@/features/personalization/services/text-scene-safe-area";

type LocalRenderProviderOptions = {
  artworkHref?: string;
  artworkOrigin?: string;
  layout?: PersonalizationLayoutOverrides;
  scene?: TextElement[];
  template?: InvitationTemplate;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toPersonalizationValues(
  variables: Record<string, string>,
): PersonalizationValues {
  return { ...variables };
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

function renderSceneTextElement(element: TextElement) {
  const lineHeight = element.lineHeight ?? 1.15;
  const lines = getTextElementLines(element);
  const textX = getSvgTextX(element);
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : element.fontSize * lineHeight;

      return `<tspan x="${textX}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return [
    `<text x="${textX}" y="${element.y}"`,
    ` fill="${element.fill}"`,
    ` font-family="${escapeXml(element.fontFamily)}"`,
    ` font-size="${element.fontSize}"`,
    ` font-weight="${element.fontWeight ?? 500}"`,
    ` opacity="${element.opacity ?? 1}"`,
    element.letterSpacing ? ` letter-spacing="${element.letterSpacing}"` : "",
    element.rotation
      ? ` transform="rotate(${element.rotation} ${textX} ${element.y})"`
      : "",
    ` text-anchor="${getTextAnchor(element.align)}">`,
    tspans,
    "</text>",
  ].join("");
}

export class LocalRenderProvider implements RenderProvider {
  constructor(private readonly options: LocalRenderProviderOptions = {}) {}

  async render(input: RenderInput): Promise<RenderOutput> {
    const values = toPersonalizationValues(input.variables);
    const template = await loadRuntimeInvitationTemplate(
      this.options.template ?? spaceBirthdayInvitationTemplate,
    );
    const artworkSrc =
      this.options.artworkHref ??
      `${this.options.artworkOrigin ?? ""}${template.artwork.src}`;
    const textLayers = this.options.scene
      ? this.options.scene.map(renderSceneTextElement).join("")
      : Object.entries(template.fields)
      .map(([fieldKey, baseField]) => {
        const field = applyFieldOverride(baseField, this.options.layout?.[fieldKey]);
        const value = getTemplateFieldValue(fieldKey, field, values);
        const fontSize = getResponsiveFontSize(value, field);
        const lineHeight = field.lineHeight ?? 1.15;
        const lines = wrapTemplateText(value, field);
        return (field.copies ?? [{ x: field.x, y: field.y }])
          .map((copy) => {
            if (field.arc) {
              const characters = getArcTextCharacters(
                value,
                copy,
                field.arc,
                fontSize,
                field.letterSpacing,
              )
                .map((arcCharacter) =>
                  [
                    `<text x="${arcCharacter.x}" y="${arcCharacter.y}"`,
                    ` fill="${field.fill}"`,
                    ` dominant-baseline="middle"`,
                    ` font-family="${escapeXml(field.fontFamily)}"`,
                    ` font-size="${fontSize}"`,
                    ` font-weight="${getTextWeight(fieldKey, field)}"`,
                    ` opacity="${field.opacity ?? 1}"`,
                    ` text-anchor="middle"`,
                    ` transform="rotate(${arcCharacter.rotation} ${arcCharacter.x} ${arcCharacter.y})">`,
                    escapeXml(arcCharacter.character),
                    "</text>",
                  ].join(""),
                )
                .join("");

              if (!field.rotation) {
                return characters;
              }

              return [
                `<g transform="rotate(${field.rotation} ${copy.x} ${copy.y})">`,
                characters,
                "</g>",
              ].join("");
            }

            const tspans = lines
              .map((line, index) => {
                const dy = index === 0 ? 0 : fontSize * lineHeight;
                const textX = getSvgTextX({ ...field, x: copy.x });

                return `<tspan x="${textX}" dy="${dy}">${escapeXml(line)}</tspan>`;
              })
              .join("");
            const textX = getSvgTextX({ ...field, x: copy.x });

            return [
              `<text x="${textX}" y="${copy.y}"`,
              ` fill="${field.fill}"`,
              ` font-family="${escapeXml(field.fontFamily)}"`,
              ` font-size="${fontSize}"`,
              ` font-weight="${getTextWeight(fieldKey, field)}"`,
              ` opacity="${field.opacity ?? 1}"`,
              field.letterSpacing ? ` letter-spacing="${field.letterSpacing}"` : "",
              field.rotation
                ? ` transform="rotate(${field.rotation} ${textX} ${copy.y})"`
                : "",
              ` text-anchor="${getTextAnchor(field.align)}">`,
              tspans,
              "</text>",
            ].join("");
          })
          .join("");
      })
      .join("");

    const svg = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${template.widthPx}" height="${template.heightPx}" viewBox="0 0 ${template.widthPx} ${template.heightPx}">`,
      `<image href="${escapeXml(artworkSrc)}" x="0" y="0" width="${template.widthPx}" height="${template.heightPx}" preserveAspectRatio="xMidYMid slice"/>`,
      textLayers,
      "</svg>",
    ].join("");

    return {
      svg,
    };
  }
}
