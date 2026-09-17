import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { CatalogDiscovery } from "@/features/catalog/components/catalog-discovery";
import { FeaturedCollectionCarousel } from "@/features/collections/components/featured-collection-carousel";
import { listPublicCollections } from "@/features/collections/services/list-public-collections";

export default async function HomePage() {
  const collections = await listPublicCollections();

  return (
    <main>
      <DiscoveryEvent name="home_viewed" />

      <Container className="pt-8 md:pt-12">
        <FeaturedCollectionCarousel />
      </Container>

      <section className="relative overflow-hidden">
        <div className="absolute right-[18%] top-0 hidden h-24 w-24 rounded-b-[2rem] bg-surface/55 lg:block" />
        <div className="absolute right-[24%] top-28 hidden size-14 rounded-[1rem] bg-primary/14 lg:block" />
        <Container className="py-12 md:py-16">
          <div className="max-w-3xl">
            <Badge tone="neutral" className="rounded-full bg-surface/82">
              Disenos tematicos listos para personalizar
            </Badge>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.98] md:text-7xl">
              {"Disenos para tus "}
              <span className="italic text-primary">eventos</span>
              {", hechos a tu medida"}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              Invitaciones, banners y stickers con una estetica cuidada. Elige una
              pieza, personalizala con tus datos y llevala al carrito en minutos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/catalog">Explorar catalogo</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/products/invitation">Ver invitacion destacada</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Container className="pb-20">
        <Suspense
          fallback={
            <div className="min-h-96 rounded-[1.35rem] bg-white/72 shadow-sm" />
          }
        >
          <CatalogDiscovery collections={collections} />
        </Suspense>
      </Container>
    </main>
  );
}
