import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EventLink } from "@/features/analytics/components/event-link";
import { PlaceholderArtwork } from "@/features/prototype/components/placeholder-artwork";
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
        <PlaceholderArtwork
          label="Miniatura provisional"
          title={collection.name}
          variant="thumbnail"
        />
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
