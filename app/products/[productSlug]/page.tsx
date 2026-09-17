import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { EventLink } from "@/features/analytics/components/event-link";
import { ProductOptionCard } from "@/features/products/components/product-option-card";
import { SaveProductButton } from "@/features/products/components/save-product-button";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/features/products/services/product-catalog";
import { getProductPreviewAssetSrc } from "@/features/products/services/product-assets";
import { cn } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{
    productSlug: string;
  }>;
};

const previewAspectClass = {
  landscape: "aspect-[4/3]",
  portrait: "aspect-[4/3]",
  square: "aspect-[4/3]",
} as const;

function getPriceLabel(priceLabel?: string) {
  if (priceLabel) {
    return `Desde ${priceLabel.replace("ARS ", "$")} por unidad`;
  }

  return "Gratis";
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { productSlug } = await params;
  const product = getProductBySlug(productSlug);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params;
  const product = getProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product).slice(0, 3);
  const isPremium = product.access === "premium";

  return (
    <main>
      <DiscoveryEvent
        name={isPremium ? "premium_product_viewed" : "free_product_selected"}
        payload={{ product: product.slug }}
      />

      <Container className="py-10 md:py-14">
        <nav className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Link href="/catalog">Catalogo</Link>
          <ChevronRight aria-hidden="true" className="size-4" />
          <span>{product.pieceTypeName}</span>
        </nav>

        <section className="rounded-[2rem] bg-white/76 p-5 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.95fr] lg:items-center">
            <div
              className={cn(
                "relative overflow-hidden rounded-[1.35rem] bg-muted",
                previewAspectClass[product.prototype.previewAspect],
              )}
            >
              <Image
                alt={product.prototype.previewAlt}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 42vw, 92vw"
                src={getProductPreviewAssetSrc(product)}
              />
              <div className="absolute bottom-[-0.8rem] right-[-0.4rem] rounded-[1rem] bg-white px-5 py-4 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Vista previa
                </p>
                <p className="font-serif text-lg font-semibold">
                  {product.collectionName}
                </p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral" className="rounded-full bg-white">
                  {product.pieceTypeName}
                </Badge>
                <Badge tone="neutral" className="rounded-full bg-white">
                  {product.prototype.visualFormat}
                </Badge>
                <Badge tone="neutral" className="rounded-full bg-white">
                  {isPremium ? "Premium" : "Gratis"}
                </Badge>
              </div>

              <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
                {product.name}
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-5 text-sm font-semibold text-foreground">
                {getPriceLabel(product.priceLabel)}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="rounded-full px-6 shadow-md">
                  <EventLink
                    eventName="personalization_started"
                    eventPayload={{
                      collectionSlug: product.collectionSlug,
                      productCode: product.slug,
                    }}
                    href={`/products/${product.slug}/personalize`}
                  >
                    Personalizar
                  </EventLink>
                </Button>
                <SaveProductButton productSlug={product.slug} />
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 ? (
            <section className="mt-12">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Mas de esta tematica
              </h2>
              <div className="grid gap-5 md:grid-cols-3">
                {relatedProducts.map((relatedProduct) => (
                  <ProductOptionCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </Container>
    </main>
  );
}
