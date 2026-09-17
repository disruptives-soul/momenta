import type { TemplateSafeArea } from "@/features/personalization/services/text-scene-safe-area";

export type CanvasAlignmentGuide = {
  id: string;
  orientation: "horizontal" | "vertical";
  position: number;
  start: number;
  end: number;
};

type GuideBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CanvasSize = {
  width: number;
  height: number;
};

type GuideMatch = {
  distance: number;
  guide: CanvasAlignmentGuide;
  shift: number;
};

const guideSnapThreshold = 7;

function getBestGuideMatch(matches: GuideMatch[]) {
  return matches.sort((first, second) => first.distance - second.distance)[0];
}

export function getSmartCanvasGuides(
  box: GuideBox,
  canvasSize: CanvasSize,
  safeArea: TemplateSafeArea,
  otherBoxes: GuideBox[] = [],
) {
  const verticalTargets = [
    {
      id: "canvas-center-x",
      position: canvasSize.width / 2,
      start: 0,
      end: canvasSize.height,
    },
    {
      id: "safe-center-x",
      position: safeArea.x + safeArea.width / 2,
      start: safeArea.y,
      end: safeArea.y + safeArea.height,
    },
    {
      id: "safe-left",
      position: safeArea.x,
      start: safeArea.y,
      end: safeArea.y + safeArea.height,
    },
    {
      id: "safe-right",
      position: safeArea.x + safeArea.width,
      start: safeArea.y,
      end: safeArea.y + safeArea.height,
    },
    ...otherBoxes.flatMap((otherBox, index) => [
      {
        id: `text-${index}-left`,
        position: otherBox.x,
        start: otherBox.y,
        end: otherBox.y + otherBox.height,
      },
      {
        id: `text-${index}-center-x`,
        position: otherBox.x + otherBox.width / 2,
        start: otherBox.y,
        end: otherBox.y + otherBox.height,
      },
      {
        id: `text-${index}-right`,
        position: otherBox.x + otherBox.width,
        start: otherBox.y,
        end: otherBox.y + otherBox.height,
      },
    ]),
  ];
  const horizontalTargets = [
    {
      id: "canvas-center-y",
      position: canvasSize.height / 2,
      start: 0,
      end: canvasSize.width,
    },
    {
      id: "safe-center-y",
      position: safeArea.y + safeArea.height / 2,
      start: safeArea.x,
      end: safeArea.x + safeArea.width,
    },
    {
      id: "safe-top",
      position: safeArea.y,
      start: safeArea.x,
      end: safeArea.x + safeArea.width,
    },
    {
      id: "safe-bottom",
      position: safeArea.y + safeArea.height,
      start: safeArea.x,
      end: safeArea.x + safeArea.width,
    },
    ...otherBoxes.flatMap((otherBox, index) => [
      {
        id: `text-${index}-top`,
        position: otherBox.y,
        start: otherBox.x,
        end: otherBox.x + otherBox.width,
      },
      {
        id: `text-${index}-middle-y`,
        position: otherBox.y + otherBox.height / 2,
        start: otherBox.x,
        end: otherBox.x + otherBox.width,
      },
      {
        id: `text-${index}-bottom`,
        position: otherBox.y + otherBox.height,
        start: otherBox.x,
        end: otherBox.x + otherBox.width,
      },
    ]),
  ];
  const verticalAnchors = [
    { id: "left", position: box.x },
    { id: "center", position: box.x + box.width / 2 },
    { id: "right", position: box.x + box.width },
  ];
  const horizontalAnchors = [
    { id: "top", position: box.y },
    { id: "middle", position: box.y + box.height / 2 },
    { id: "bottom", position: box.y + box.height },
  ];
  const verticalMatches = verticalTargets.flatMap((target) =>
    verticalAnchors
      .map((anchor) => ({
        distance: Math.abs(target.position - anchor.position),
        guide: {
          id: `${target.id}-${anchor.id}`,
          orientation: "vertical" as const,
          position: target.position,
          start: target.start,
          end: target.end,
        },
        shift: target.position - anchor.position,
      }))
      .filter((match) => match.distance <= guideSnapThreshold),
  );
  const horizontalMatches = horizontalTargets.flatMap((target) =>
    horizontalAnchors
      .map((anchor) => ({
        distance: Math.abs(target.position - anchor.position),
        guide: {
          id: `${target.id}-${anchor.id}`,
          orientation: "horizontal" as const,
          position: target.position,
          start: target.start,
          end: target.end,
        },
        shift: target.position - anchor.position,
      }))
      .filter((match) => match.distance <= guideSnapThreshold),
  );
  const verticalMatch = getBestGuideMatch(verticalMatches);
  const horizontalMatch = getBestGuideMatch(horizontalMatches);

  return {
    dx: verticalMatch?.shift ?? 0,
    dy: horizontalMatch?.shift ?? 0,
    guides: [
      ...(verticalMatch ? [verticalMatch.guide] : []),
      ...(horizontalMatch ? [horizontalMatch.guide] : []),
    ],
  };
}
