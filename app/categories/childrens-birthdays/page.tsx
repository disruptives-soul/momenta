import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/status-state";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { activePilotCategory } from "@/features/catalog/data/mock-categories";
import { CollectionCard } from "@/features/collections/components/collection-card";
import { listPublicCollections } from "@/features/collections/services/list-public-collections";
import { Breadcrumbs } from "@/features/prototype/components/breadcrumbs";

export const metadata = {
  title: "Cumpleaños infantiles",
  description: "Colecciones imprimibles para cumpleaños infantiles.",
};

export default async function ChildrensBirthdaysCategoryPage() {
  const collections = await listPublicCollections();

  return (
    <PageShell
      actions={
        <Button asChild>
          <Link href="/collections/space-birthday">Ver Space Birthday</Link>
        </Button>
      }
      description={activePilotCategory.description}
      eyebrow="Categoría"
      title={activePilotCategory.name}
    >
      <DiscoveryEvent
        name="category_viewed"
        payload={{ category: activePilotCategory.slug }}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Inicio" },
          { href: "/catalog", label: "Catálogo" },
          {
            href: `/categories/${activePilotCategory.slug}`,
            label: activePilotCategory.name,
          },
        ]}
      />
      {collections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Cuando existan colecciones publicadas para esta categoría, aparecerán acá."
          title="Sin colecciones disponibles"
        />
      )}
    </PageShell>
  );
}
