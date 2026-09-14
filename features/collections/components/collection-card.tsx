import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EventLink } from "@/features/analytics/components/event-link";
import { spaceBirthdayGalleryItems } from "../data/space-birthday-assets";
import type { PublicCollection } from "../types/public-collection";

type CollectionCardProps = {
  collection: PublicCollection;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  const hasPremium = collection.products.some(
    (product) => product.access === "premium",
  );

  return (
    <EventLink
      className="group block"
      eventName="collection_viewed"
      eventPayload={{ collection: collection.slug }}
      href={`/collections/${collection.slug}`}
    >
      <Card className="grid min-h-full gap-4 transition-colors group-hover:border-primary">
        <div className="grid aspect-[4/3] grid-cols-2 gap-2 overflow-hidden rounded-md border border-border bg-muted p-2">
          {spaceBirthdayGalleryItems.map((item) => (
            <div
              className="relative overflow-hidden rounded-sm bg-surface"
              key={item.id}
            >
              <Image
                alt={item.title}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 12vw, 45vw"
                src={item.src}
              />
            </div>
          ))}
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{collection.categoryName}</Badge>
            <Badge tone="free">Free</Badge>
            {hasPremium ? <Badge tone="premium">Premium</Badge> : null}
          </div>
          <h3 className="mt-4 text-xl font-semibold">{collection.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {collection.description}
          </p>
        </div>
      </Card>
    </EventLink>
  );
}
