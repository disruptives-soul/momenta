import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { CatalogDiscovery } from "@/features/catalog/components/catalog-discovery";
import { activePilotCategory } from "@/features/catalog/data/mock-categories";
import { listPublicCollections } from "@/features/collections/services/list-public-collections";

export const metadata = {
  title: "Catálogo",
  description: "Explora colecciones imprimibles de Momenta.",
};

export default async function CatalogPage() {
  const collections = await listPublicCollections();

  return (
    <PageShell
      actions={
        <Button asChild variant="secondary">
          <Link href={`/categories/${activePilotCategory.slug}`}>
            Ver Cumpleaños infantiles
          </Link>
        </Button>
      }
      description="Explorá colecciones imprimibles listas para personalizar. En esta etapa usamos datos mock y una colección piloto."
      eyebrow="Catálogo"
      title="Colecciones para imprimir"
    >
      <DiscoveryEvent name="catalog_viewed" />
      <CatalogDiscovery collections={collections} />
    </PageShell>
  );
}
