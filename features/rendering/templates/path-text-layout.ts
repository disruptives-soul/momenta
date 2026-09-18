import type { TextPathGeometry } from "./template-types";

export type PathTextGlyphMetric = {
  character: string;
  width: number;
};

export type PathTextGlyphLayout = {
  character: string;
  x: number;
  y: number;
  rotation: number;
};

export type PathTextLayoutInput = {
  text: string;
  centerX: number;
  centerY: number;
  path: TextPathGeometry;
  fontSize: number;
  letterSpacing?: number;
  rotation?: number;
  glyphMetrics?: PathTextGlyphMetric[];
};

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getFallbackGlyphWidth(character: string, fontSize: number) {
  return character.trim() ? fontSize * 0.54 : fontSize * 0.32;
}

function getPathRadii(path: TextPathGeometry) {
  if (path.type === "circle") {
    return {
      radiusX: path.radius,
      radiusY: path.radius,
    };
  }

  return {
    radiusX: path.radiusX,
    radiusY: path.radiusY,
  };
}

function getPathRadiusForArcLength(path: TextPathGeometry) {
  if (path.type === "circle") {
    return Math.max(path.radius, 1);
  }

  return Math.max((path.radiusX + path.radiusY) / 2, 1);
}

export function layoutPathText(input: PathTextLayoutInput) {
  const characters = Array.from(input.text);
  const letterSpacing = input.letterSpacing ?? 0;
  const pathRadius = getPathRadiusForArcLength(input.path);
  const { radiusX, radiusY } = getPathRadii(input.path);
  const startAngle = input.path.startAngle;
  const endAngle = input.path.endAngle;
  const span = endAngle - startAngle;
  const direction = span >= 0 ? 1 : -1;
  const glyphWidths = characters.map(
    (character, index) =>
      input.glyphMetrics?.[index]?.width ??
      getFallbackGlyphWidth(character, input.fontSize),
  );
  const textWidth =
    glyphWidths.reduce((total, width) => total + width, 0) +
    letterSpacing * Math.max(characters.length - 1, 0);
  const textAngle = (textWidth / pathRadius) * (180 / Math.PI);
  let cursorAngle = (startAngle + endAngle) / 2 - (direction * textAngle) / 2;
  const elementRotation = input.rotation ?? 0;

  return characters.map((character, index): PathTextGlyphLayout => {
    const halfCharacterAngle =
      (glyphWidths[index] / 2 / pathRadius) * (180 / Math.PI);
    const letterSpacingAngle = (letterSpacing / pathRadius) * (180 / Math.PI);
    const angle = cursorAngle + direction * halfCharacterAngle;
    const rotatedAngle = angle + elementRotation;
    const radians = degreesToRadians(rotatedAngle);
    const x = input.centerX + radiusX * Math.cos(radians);
    const y = input.centerY + radiusY * Math.sin(radians);

    cursorAngle += direction * (halfCharacterAngle * 2 + letterSpacingAngle);

    return {
      character,
      x,
      y,
      rotation:
        direction >= 0
          ? rotatedAngle + 90
          : rotatedAngle - 90,
    };
  });
}
