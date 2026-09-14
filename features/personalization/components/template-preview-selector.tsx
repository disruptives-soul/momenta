"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { spaceBirthdayGalleryItems } from "@/features/collections/data/space-birthday-assets";

type TemplatePreviewSelectorProps = {
  activeTemplateId: string;
  onTemplateChange: (templateId: string) => void;
};

const aspectClass = {
  landscape: "aspect-[2/1]",
  portrait: "aspect-[297/420]",
  square: "aspect-square",
} as const;

export function TemplatePreviewSelector({
  activeTemplateId,
  onTemplateChange,
}: TemplatePreviewSelectorProps) {
  return (
    <section className="grid gap-3 rounded-md border border-border bg-surface p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Vista previa de piezas
          </p>
          <h2 className="text-lg font-semibold">Elegi el diseno antes de editar</h2>
        </div>
        <Badge tone="neutral">{spaceBirthdayGalleryItems.length} assets</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {spaceBirthdayGalleryItems.map((item) => {
          const templateId = "templateId" in item ? item.templateId : null;
          const selected = templateId === activeTemplateId;
          const disabled = !item.editable || !templateId;

          return (
            <button
              className={cn(
                "grid gap-2 rounded-md border bg-background p-2 text-left transition",
                selected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50",
                disabled && "cursor-default opacity-75 hover:border-border",
              )}
              disabled={disabled}
              key={item.id}
              onClick={() => {
                if (templateId) {
                  onTemplateChange(templateId);
                }
              }}
              type="button"
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-md bg-muted",
                  aspectClass[item.aspect],
                )}
              >
                <Image
                  alt={item.title}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1280px) 18vw, (min-width: 640px) 42vw, 90vw"
                  src={item.src}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{item.title}</span>
                <Badge tone={selected ? "free" : "neutral"}>
                  {selected ? "Editando" : item.editable ? "Editable" : "Preview"}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
