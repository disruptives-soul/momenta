"use client";

import { useEffect, useState, type RefObject } from "react";
import type { InvitationTemplate } from "@/features/rendering/templates/template-types";
import {
  getVisibleTemplateSize,
  type TemplateScale,
} from "../services/template-layout";

export function useTemplateScale(
  containerRef: RefObject<HTMLElement | null>,
  template: InvitationTemplate,
  zoom = 1,
) {
  const [scale, setScale] = useState<TemplateScale>(() =>
    getVisibleTemplateSize(template, template.preview.widthPx, zoom),
  );

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateScale = () => {
      setScale(
        getVisibleTemplateSize(
          template,
          element.clientWidth,
          zoom,
          element.clientHeight,
        ),
      );
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);

    return () => observer.disconnect();
  }, [containerRef, template, zoom]);

  return scale;
}
