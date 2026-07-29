"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/status-state";
import { CollectionCard } from "@/features/collections/components/collection-card";
import type { PublicCollection } from "@/features/collections/types/public-collection";
import { SearchField } from "./search-field";

type CatalogDiscoveryProps = {
  collections: PublicCollection[];
};

export function CatalogDiscovery({ collections }: CatalogDiscoveryProps) {
  const [query, setQuery] = useState("");

  const filteredCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return collections;
    }

    return collections.filter((collection) =>
      [collection.name, collection.categoryName, collection.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [collections, query]);

  return (
    <div className="grid gap-5">
      <SearchField
        label="Buscar colección"
        onChange={setQuery}
        placeholder="Buscar por colección o categoría"
        value={query}
      />
      {filteredCollections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Probá con Space Birthday o revisá la categoría Cumpleaños infantiles."
          title="No encontramos colecciones"
        />
      )}
    </div>
  );
}
