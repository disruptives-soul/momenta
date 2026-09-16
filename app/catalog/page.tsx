import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { CatalogDiscovery } from "@/features/catalog/components/catalog-discovery";
import { activePilotCategory } from "@/features/catalog/data/mock-categories";
import { listPublicCollections } from "@/features/collections/services/list-public-collections";

export const metadata = {
  title: "Catalogo",
  description: "Explora productos imprimibles de Momenta por tipo de pieza.",
};

export default async function CatalogPage() {
  const collections = await listPublicCollections();

  return (
    <PageShell
      actions={
        <Button asChild variant="secondary">
          <Link href={`/categories/${activePilotCategory.slug}`}>
            Ver Cumpleanos infantiles
          </Link>
        </Button>
      }
      description="Explora productos comprables por tipo de pieza. Cada pieza pertenece a una coleccion visual, pero se puede comprar de forma independiente."
      eyebrow="Catalogo"
      title="Productos para imprimir"
    >
      <DiscoveryEvent name="catalog_viewed" />
      <CatalogDiscovery collections={collections} />
    </PageShell>
  );
}
