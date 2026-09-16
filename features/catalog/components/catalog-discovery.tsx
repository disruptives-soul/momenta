"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/status-state";
import type { PublicCollection } from "@/features/collections/types/public-collection";
import { ProductOptionCard } from "@/features/products/components/product-option-card";
import {
  pieceTypes,
  type PrototypeProduct,
} from "@/features/products/data/mock-products";
import { SearchField } from "./search-field";

type CatalogDiscoveryProps = {
  collections: PublicCollection[];
};

export function CatalogDiscovery({ collections }: CatalogDiscoveryProps) {
  const [query, setQuery] = useState("");
  const [activePieceType, setActivePieceType] = useState("all");

  const products = useMemo(
    () =>
      collections.flatMap(
        (collection) => collection.products as PrototypeProduct[],
      ),
    [collections],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesType =
        activePieceType === "all" || product.pieceTypeId === activePieceType;
      const matchesQuery =
        !normalizedQuery ||
        [
          product.name,
          product.description,
          product.collectionName,
          product.pieceTypeName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [activePieceType, products, query]);

  const groupedProducts = useMemo(
    () =>
      pieceTypes
        .map((pieceType) => ({
          ...pieceType,
          products: filteredProducts.filter(
            (product) => product.pieceTypeId === pieceType.id,
          ),
        }))
        .filter((group) => group.products.length > 0),
    [filteredProducts],
  );

  return (
    <div className="grid gap-5">
      <SearchField
        label="Buscar producto"
        onChange={setQuery}
        placeholder="Buscar por pieza, coleccion o formato"
        value={query}
      />

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
          data-active={activePieceType === "all"}
          onClick={() => setActivePieceType("all")}
          type="button"
        >
          Todas las piezas
        </button>
        {pieceTypes.map((pieceType) => (
          <button
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            data-active={activePieceType === pieceType.id}
            key={pieceType.id}
            onClick={() => setActivePieceType(pieceType.id)}
            type="button"
          >
            {pieceType.pluralLabel}
          </button>
        ))}
      </div>

      {groupedProducts.length > 0 ? (
        <div className="grid gap-8">
          {groupedProducts.map((group) => (
            <section className="grid gap-4" key={group.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{group.pluralLabel}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Productos comprables por pieza, con la coleccion como sistema
                    visual.
                  </p>
                </div>
                <Badge tone="neutral">{group.products.length} disponibles</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {group.products.map((product) => (
                  <ProductOptionCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          description="Proba con Invitacion, Stickers, Backing o Space Birthday."
          title="No encontramos productos"
        />
      )}
    </div>
  );
}
