import type {
  InvitationTemplate,
  TextElement,
} from "@/features/rendering/templates/template-types";

export type TemplateSafeArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualBox = TemplateSafeArea & {
  rotation?: number;
};

const minimumInteractionWidth = 24;
const approximateCharacterWidthFactor = 0.54;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getAlignedTextLeft(element: TextElement) {
  if (element.kind === "pathText") {
    return getTextVisualBox(element).x;
  }

  if (element.sourceTextKind === "area") {
    return element.x;
  }

  const width = getTextElementBoxWidth(element);

  if (element.align === "right") {
    return element.x - width;
  }

  if (element.align === "center") {
    return element.x - width / 2;
  }

  return element.x;
}

function getApproximateTextLineWidth(value: string, element: TextElement) {
  const characters = Array.from(value);
  const letterSpacing = element.letterSpacing ?? 0;

  if (characters.length === 0) {
    return minimumInteractionWidth;
  }

  return (
    characters.length * element.fontSize * approximateCharacterWidthFactor +
    Math.max(0, characters.length - 1) * letterSpacing
  );
}

export function getTextElementLines(element: TextElement) {
  if (element.kind === "pathText") {
    return [element.text];
  }

  if (element.sourceTextKind === "point" || element.maxLines <= 1) {
    return [element.text.replace(/\r?\n/g, " ")];
  }

  const maxLines = Math.max(1, element.maxLines);
  const paragraphs = element.text.split(/\r?\n/);
  const lines: string[] = [];
  const maxWidth = Math.max(minimumInteractionWidth, element.width);

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) {
      break;
    }

    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let currentLine = "";

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (
        !currentLine ||
        getApproximateTextLineWidth(nextLine, element) <= maxWidth
      ) {
        currentLine = nextLine;
        continue;
      }

      lines.push(currentLine);
      if (lines.length >= maxLines) {
        return lines;
      }
      currentLine = word;
    }

    if (currentLine || words.length > 0) {
      lines.push(currentLine);
      if (lines.length >= maxLines) {
        return lines;
      }
    }
  }

  return lines.length > 0 ? lines : [""];
}

export function getTextElementBoxWidth(element: TextElement) {
  if (element.kind === "pathText") {
    return getTextVisualBox(element).width;
  }

  return Math.max(minimumInteractionWidth, element.width);
}

export function getTextElementBoxHeight(element: TextElement) {
  if (element.kind === "pathText") {
    return getTextVisualBox(element).height;
  }

  const lineHeight = element.lineHeight ?? 1.15;

  if (
    element.source === "illustrator" &&
    typeof element.height === "number" &&
    Number.isFinite(element.height) &&
    element.height > 0
  ) {
    return element.height;
  }

  if (
    element.sourceTextKind === "area" &&
    typeof element.height === "number" &&
    Number.isFinite(element.height) &&
    element.height > 0
  ) {
    return Math.max(element.fontSize * lineHeight, element.height);
  }

  const lines = getTextElementLines(element);

  return Math.max(element.fontSize * lineHeight, lines.length * element.fontSize * lineHeight);
}

export function getTextVisualBox(element: TextElement): TemplateSafeArea {
  if (element.kind === "pathText") {
    const padding = element.fontSize;

    if (element.path.type === "circle") {
      const size = element.path.radius * 2 + padding * 2;

      return {
        x: element.x - size / 2,
        y: element.y - size / 2,
        width: size,
        height: size,
      };
    }

    return {
      x: element.x - element.path.radiusX - padding,
      y: element.y - element.path.radiusY - padding,
      width: element.path.radiusX * 2 + padding * 2,
      height: element.path.radiusY * 2 + padding * 2,
    };
  }

  const height = getTextElementBoxHeight(element);

  return {
    x: getAlignedTextLeft(element),
    y: element.y - element.fontSize * 0.82,
    width: getTextElementBoxWidth(element),
    height,
  };
}

export function getRotatedBox(box: VisualBox): TemplateSafeArea {
  const rotation = box.rotation ?? 0;

  if (!rotation) {
    return box;
  }

  const radians = degreesToRadians(rotation);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ].map((corner) => {
    const dx = corner.x - box.x;
    const dy = corner.y - box.y;

    return {
      x: box.x + dx * cos - dy * sin,
      y: box.y + dx * sin + dy * cos,
    };
  });

  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getTextRotatedBoundingBox(element: TextElement): TemplateSafeArea {
  return getRotatedBox({
    ...getTextVisualBox(element),
    rotation: element.rotation ?? 0,
  });
}

export function getSafeAreaShift(box: TemplateSafeArea, safeArea: TemplateSafeArea) {
  let dx = 0;
  let dy = 0;

  if (box.x < safeArea.x) {
    dx = safeArea.x - box.x;
  } else if (box.x + box.width > safeArea.x + safeArea.width) {
    dx = safeArea.x + safeArea.width - (box.x + box.width);
  }

  if (box.y < safeArea.y) {
    dy = safeArea.y - box.y;
  } else if (box.y + box.height > safeArea.y + safeArea.height) {
    dy = safeArea.y + safeArea.height - (box.y + box.height);
  }

  return { dx, dy };
}

export function getTemplateSafeArea(template: InvitationTemplate): TemplateSafeArea {
  const widthPx = template.widthPx ?? 1748;
  const heightPx = template.heightPx ?? 2480;
  const insetMm = template.safeArea?.insetMm ?? 20;
  const insetX = (widthPx / template.widthMm) * insetMm;
  const insetY = (heightPx / template.heightMm) * insetMm;

  return {
    x: insetX,
    y: insetY,
    width: Math.max(0, widthPx - insetX * 2),
    height: Math.max(0, heightPx - insetY * 2),
  };
}

export function clampTextElementToSafeArea(
  element: TextElement,
  template: InvitationTemplate,
): TextElement {
  const safeArea = getTemplateSafeArea(template);
  let nextElement = {
    ...element,
    width: Math.min(Math.max(1, element.width), Math.max(1, safeArea.width)),
  };
  let box = getTextRotatedBoundingBox(nextElement);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (box.width <= safeArea.width && box.height <= safeArea.height) {
      break;
    }

    const scaleFactor = Math.min(
      safeArea.width / Math.max(box.width, 1),
      safeArea.height / Math.max(box.height, 1),
      1,
    );
    const currentFontSize = nextElement.fontSize;
    const nextFontSize = Math.max(1, Math.floor(currentFontSize * scaleFactor));

    nextElement = {
      ...nextElement,
      fontSize: nextFontSize,
      width: Math.min(
        Math.max(1, nextElement.width * scaleFactor),
        Math.max(1, safeArea.width),
      ),
    };
    box = getTextRotatedBoundingBox(nextElement);

    if (nextFontSize === currentFontSize && scaleFactor >= 1) {
      break;
    }
  }

  const { dx, dy } = getSafeAreaShift(box, safeArea);

  if (
    !dx &&
    !dy &&
    nextElement.width === element.width &&
    nextElement.fontSize === element.fontSize
  ) {
    return element;
  }

  return {
    ...nextElement,
    x: nextElement.x + dx,
    y: nextElement.y + dy,
  };
}

export function createCenteredTextElementInSafeArea(
  element: TextElement,
  template: InvitationTemplate,
): TextElement {
  const safeArea = getTemplateSafeArea(template);

  return clampTextElementToSafeArea(
    {
      ...element,
      x: safeArea.x + safeArea.width / 2,
      y: safeArea.y + safeArea.height / 2,
      width: Math.min(element.width, safeArea.width * 0.72),
    },
    template,
  );
}
