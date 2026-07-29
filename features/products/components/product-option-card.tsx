import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EventLink } from "@/features/analytics/components/event-link";
import { PlaceholderArtwork } from "@/features/prototype/components/placeholder-artwork";
import type { PrototypeProduct } from "../data/mock-products";

type ProductOptionCardProps = {
  product: PrototypeProduct;
};

export function ProductOptionCard({ product }: ProductOptionCardProps) {
  const isPremium = product.access === "premium";

  return (
    <Card
      className={
        isPremium
          ? "grid gap-5 border-accent/40 bg-accent/10"
          : "grid gap-5 border-primary/30 bg-primary/5"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone={isPremium ? "premium" : "free"}>
            {isPremium ? "Premium" : "Free"}
          </Badge>
          <h3 className="mt-3 text-2xl font-semibold">{product.name}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {product.description}
          </p>
        </div>
        {product.priceLabel ? (
          <p className="rounded-md bg-surface px-3 py-2 text-lg font-semibold shadow-sm">
            {product.priceLabel}
          </p>
        ) : null}
      </div>

      <PlaceholderArtwork
        label={isPremium ? "Vista Premium" : "Vista Free"}
        title={product.name}
        variant={isPremium ? "stickers" : "invitation"}
      />

      <div>
        <p className="text-sm font-medium">Incluye</p>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
          {product.prototype.highlights.map((highlight) => (
            <li key={highlight}>• {highlight}</li>
          ))}
        </ul>
      </div>

      <Button asChild variant={isPremium ? "secondary" : "primary"}>
        <EventLink
          eventName={isPremium ? "premium_product_viewed" : "free_product_selected"}
          eventPayload={{ product: product.slug }}
          href={product.prototype.href}
        >
          {product.prototype.ctaLabel}
        </EventLink>
      </Button>
    </Card>
  );
}
