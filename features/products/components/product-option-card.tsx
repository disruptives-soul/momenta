import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { EventLink } from "@/features/analytics/components/event-link";
import { cn } from "@/lib/utils";
import type { PrototypeProduct } from "../data/mock-products";
import { getProductPreviewAssetSrc } from "../services/product-assets";

type ProductOptionCardProps = {
  product: PrototypeProduct;
};

const previewAspectClass = {
  landscape: "aspect-[4/3]",
  portrait: "aspect-[4/5]",
  square: "aspect-[4/5]",
} as const;

function getPriceLabel(product: PrototypeProduct) {
  if (product.priceLabel) {
    return `Desde ${product.priceLabel.replace("ARS ", "$")}`;
  }

  return "Gratis";
}

export function ProductOptionCard({ product }: ProductOptionCardProps) {
  const eventName =
    product.access === "premium" ? "premium_product_viewed" : "free_product_selected";

  return (
    <article className="group overflow-hidden rounded-[1.45rem] border border-white/70 bg-surface p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <EventLink
        className={cn(
          "relative block overflow-hidden rounded-[1.1rem] bg-muted",
          previewAspectClass[product.prototype.previewAspect],
        )}
        eventName={eventName}
        eventPayload={{ product: product.slug }}
        href={product.prototype.href}
      >
        <Image
          alt={product.prototype.previewAlt}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          fill
          sizes="(min-width: 1280px) 18vw, (min-width: 768px) 28vw, 88vw"
          src={getProductPreviewAssetSrc(product)}
        />
        <div className="absolute left-3 top-3 rounded-full bg-surface/88 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
          {product.pieceTypeName}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-surface/88 px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
          {product.collectionName.replace(" Birthday", "")}
        </div>
      </EventLink>

      <div className="grid gap-3 px-1.5 pb-1.5 pt-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-lg font-semibold leading-tight">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{getPriceLabel(product)}</p>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <EventLink
            className="inline-flex h-9 items-center justify-center rounded-full bg-surface-strong px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
            eventName={eventName}
            eventPayload={{ product: product.slug }}
            href={product.prototype.href}
          >
            Ver detalle
          </EventLink>
          <EventLink
            aria-label={`Personalizar ${product.name}`}
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            eventName={eventName}
            eventPayload={{ product: product.slug }}
            href={`${product.prototype.href}/personalize`}
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </EventLink>
        </div>
      </div>
    </article>
  );
}
