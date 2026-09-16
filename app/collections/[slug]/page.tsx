import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { EventLink } from "@/features/analytics/components/event-link";
import { CollectionGallery } from "@/features/collections/components/collection-gallery";
import { getCollectionBySlug } from "@/features/collections/services/get-collection-by-slug";
import { ProductOptionCard } from "@/features/products/components/product-option-card";
import type { PrototypeProduct } from "@/features/products/data/mock-products";
import { Breadcrumbs } from "@/features/prototype/components/breadcrumbs";
import { CTASection } from "@/features/prototype/components/cta-section";

type CollectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: "Coleccion no encontrada",
    };
  }

  return {
    title: collection.name,
    description: collection.description,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const products = collection.products as PrototypeProduct[];

  return (
    <main>
      <DiscoveryEvent
        name="collection_viewed"
        payload={{ collection: collection.slug }}
      />

      <section className="border-b border-border">
        <Container className="py-8 md:py-12">
          <Breadcrumbs
            items={[
              { href: "/", label: "Inicio" },
              { href: "/catalog", label: "Catalogo" },
              {
                href: `/categories/${collection.categorySlug}`,
                label: collection.categoryName,
              },
              {
                href: `/collections/${collection.slug}`,
                label: collection.name,
              },
            ]}
          />
          <div className="grid gap-8 md:grid-cols-[1fr_0.9fr] md:items-center">
            <div>
              <Badge tone="neutral">{collection.categoryName}</Badge>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
                {collection.name}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                {collection.prototype?.heroCopy ?? collection.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <EventLink
                    eventName="free_product_selected"
                    eventPayload={{ product: "invitation" }}
                    href="/products/invitation"
                  >
                    Ver invitacion
                    <ArrowRight aria-hidden="true" />
                  </EventLink>
                </Button>
                <Button asChild variant="secondary">
                  <EventLink
                    eventName="premium_product_viewed"
                    eventPayload={{ product: "stickers-pack" }}
                    href="/products/stickers-pack"
                  >
                    Ver Stickers pack
                  </EventLink>
                </Button>
              </div>
            </div>
            <CollectionGallery collection={collection} />
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-10">
        <section className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold">Que podes personalizar</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              El diseno ya esta definido. El usuario solo completa los datos del
              evento para mantener la experiencia simple.
            </p>
          </div>
          <Card>
            <ul className="grid gap-3 text-sm md:grid-cols-2">
              {collection.prototype?.customizableFields.map((field) => (
                <li
                  className="rounded-md border border-border bg-muted px-3 py-2"
                  key={field}
                >
                  {field}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">Piezas de la familia</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cada pieza se puede comprar de forma independiente. La coleccion
              funciona como sistema visual para combinar invitacion, stickers,
              banner y backing.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductOptionCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <CTASection
          action={
            <Button asChild>
              <EventLink
                eventName="free_product_selected"
                eventPayload={{ product: "invitation" }}
                href="/products/invitation"
              >
                Ver producto
              </EventLink>
            </Button>
          }
          description="Completa los datos de la celebracion y revisa la vista previa antes de continuar."
          title="Empeza con la Invitacion A3"
        />
      </Container>
    </main>
  );
}
