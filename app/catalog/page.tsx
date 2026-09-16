import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { CatalogDiscovery } from "@/features/catalog/components/catalog-discovery";
import { listPublicCollections } from "@/features/collections/services/list-public-collections";

export const metadata = {
  title: "Catalogo",
  description: "Explora productos imprimibles de Momenta por tipo de pieza.",
};

export default async function CatalogPage() {
  const collections = await listPublicCollections();

  return (
    <main>
      <DiscoveryEvent name="catalog_viewed" />
      <Container className="py-14 md:py-16">
        <div className="mb-10 max-w-3xl">
          <Badge tone="neutral" className="rounded-full bg-white/72">
            Catalogo
          </Badge>
          <h1 className="mt-5 text-5xl font-semibold leading-[0.98] md:text-7xl">
            Disenos para personalizar por pieza
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Cada producto abre su propio proceso de personalizacion. La coleccion
            funciona como tematica visual para combinar piezas relacionadas.
          </p>
        </div>
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
