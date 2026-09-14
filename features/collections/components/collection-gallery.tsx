import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { spaceBirthdayGalleryItems } from "../data/space-birthday-assets";
import type { PublicCollection } from "../types/public-collection";

type CollectionGalleryProps = {
  collection: PublicCollection;
};

const aspectClass = {
  landscape: "aspect-[2/1]",
  portrait: "aspect-[297/420]",
  square: "aspect-square",
} as const;

export function CollectionGallery({ collection }: CollectionGalleryProps) {
  return (
    <div aria-label={`Piezas de ${collection.name}`} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {spaceBirthdayGalleryItems.map((item) => (
          <figure
            className="overflow-hidden rounded-md border border-border bg-surface shadow-sm"
            key={item.id}
          >
            <div className={cn("relative bg-muted", aspectClass[item.aspect])}>
              <Image
                alt={item.title}
                className="object-cover"
                fill
                sizes="(min-width: 768px) 22vw, 45vw"
                src={item.src}
              />
            </div>
            <figcaption className="grid gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="neutral">{item.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {item.title}
                </span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
