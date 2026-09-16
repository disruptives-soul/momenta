"use client";

import { useMemo, useState } from "react";
import type { PublicCollection } from "@/features/collections/types/public-collection";
import { ProductOptionCard } from "@/features/products/components/product-option-card";
import {
  pieceTypes,
  type PrototypeProduct,
} from "@/features/products/data/mock-products";
import { cn } from "@/lib/utils";

type CatalogDiscoveryProps = {
  collections: PublicCollection[];
};

const themeFilters = [
  { id: "all", label: "Todas las tematicas" },
  { id: "space-birthday", label: "Space Birthday" },
] as const;

export function CatalogDiscovery({ collections }: CatalogDiscoveryProps) {
  const [activePieceType, setActivePieceType] = useState("all");
  const [activeTheme, setActiveTheme] = useState("all");

  const products = useMemo(
    () =>
      collections.flatMap(
        (collection) => collection.products as PrototypeProduct[],
      ),
    [collections],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesType =
          activePieceType === "all" || product.pieceTypeId === activePieceType;
        const matchesTheme =
          activeTheme === "all" || product.collectionSlug === activeTheme;

        return matchesType && matchesTheme;
      }),
    [activePieceType, activeTheme, products],
  );

  const typeFilters = [
    { id: "all", label: "Todas las piezas" },
    ...pieceTypes.map((pieceType) => ({
      id: pieceType.id,
      label: pieceType.label,
    })),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-[1.35rem] bg-white/72 p-5 shadow-sm lg:sticky lg:top-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Filtros
        </p>

        <div className="mt-5 grid gap-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Tipo de pieza
            </p>
            <div className="grid gap-1">
              {typeFilters.map((filter) => (
                <button
                  className={cn(
                    "rounded-full px-3 py-2 text-left text-sm font-semibold transition",
                    activePieceType === filter.id
                      ? "bg-foreground text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  key={filter.id}
                  onClick={() => setActivePieceType(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Tematica
            </p>
            <div className="grid gap-1">
              {themeFilters.map((filter) => (
                <button
                  className={cn(
                    "rounded-full px-3 py-2 text-left text-sm font-semibold transition",
                    activeTheme === filter.id
                      ? "bg-foreground text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  key={filter.id}
                  onClick={() => setActiveTheme(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold">Todos los disenos</h2>
          <p className="text-sm font-medium text-muted-foreground">
            {filteredProducts.length} piezas
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductOptionCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
