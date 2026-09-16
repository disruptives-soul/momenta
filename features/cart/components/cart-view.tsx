"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, ShoppingBag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  cartUpdatedEventName,
  clearCartSnapshots,
  loadCartSnapshots,
  removeCartSnapshot,
  type CartSnapshot,
} from "../services/cart-storage";

function formatPhysicalSize(widthMm: number, heightMm: number) {
  if (widthMm >= 1000 || heightMm >= 1000) {
    return `${widthMm / 1000} x ${heightMm / 1000} m`;
  }

  return `${widthMm} x ${heightMm} mm`;
}

function formatPrice(priceLabel?: string) {
  return priceLabel?.replace("ARS ", "$") ?? "Gratis";
}

export function CartView() {
  const [items, setItems] = useState<CartSnapshot[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    function syncCart() {
      setItems(loadCartSnapshots());
      setIsHydrated(true);
    }

    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener(cartUpdatedEventName, syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(cartUpdatedEventName, syncCart);
    };
  }, []);

  const hasItems = items.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section className="grid gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Carrito</p>
          <h1 className="mt-2 text-4xl font-semibold md:text-5xl">
            Tus productos personalizados
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cada linea representa un Product con su escena de textos congelada
            para renderizar el PDF final.
          </p>
        </div>

        {!isHydrated ? (
          <Card className="grid min-h-80 place-items-center text-center">
            <div className="max-w-md">
              <ShoppingBag
                aria-hidden="true"
                className="mx-auto size-10 text-muted-foreground"
              />
              <h2 className="mt-4 text-2xl font-semibold">
                Cargando carrito
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Estamos preparando el producto personalizado.
              </p>
            </div>
          </Card>
        ) : !hasItems ? (
          <Card className="grid min-h-80 place-items-center text-center">
            <div className="max-w-md">
              <ShoppingBag
                aria-hidden="true"
                className="mx-auto size-10 text-muted-foreground"
              />
              <h2 className="mt-4 text-2xl font-semibold">
                Tu carrito esta vacio
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Personaliza una invitacion, stickers, banner o backing para
                agregarlo al carrito.
              </p>
              <Button asChild className="mt-5 rounded-full">
                <Link href="/catalog">Explorar productos</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <Card
                className="grid gap-4 p-4 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center"
                key={item.id}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                  {item.product.previewSrc ? (
                    <Image
                      alt={item.product.previewAlt ?? item.product.name}
                      className="object-cover"
                      fill
                      sizes="128px"
                      src={item.product.previewSrc}
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="neutral">{item.product.pieceTypeName}</Badge>
                    <Badge tone="neutral">{item.product.collectionName}</Badge>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold">
                    {item.product.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.product.visualFormat ??
                      formatPhysicalSize(item.product.widthMm, item.product.heightMm)}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatPrice(item.product.priceLabel)}
                  </p>
                </div>

                <div className="grid gap-2 sm:justify-items-end">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/products/${item.product.slug}/personalize`}>
                      Editar
                    </Link>
                  </Button>
                  <Button
                    aria-label={`Eliminar ${item.product.name}`}
                    onClick={() => removeCartSnapshot(item.id)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" />
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card className="grid gap-5 lg:sticky lg:top-20">
        <div>
          <h2 className="text-2xl font-semibold">Resumen</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "producto" : "productos"} en el
            carrito
          </p>
        </div>

        <div className="grid gap-3 rounded-xl border border-border bg-muted p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Entrega</span>
            <strong>PDF digital</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Personalizacion</span>
            <strong>Incluida</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Watermark</span>
            <strong>Solo preview</strong>
          </div>
        </div>

        {hasItems ? (
          <Button asChild className="rounded-full">
            <Link href="/checkout">
              <CreditCard aria-hidden="true" />
              Continuar a checkout
            </Link>
          </Button>
        ) : (
          <Button className="rounded-full" disabled type="button">
            <CreditCard aria-hidden="true" />
            Continuar a checkout
          </Button>
        )}
        <Button asChild className="rounded-full" variant="secondary">
          <Link href="/catalog">Seguir comprando</Link>
        </Button>
        {hasItems ? (
          <Button
            className="rounded-full"
            onClick={clearCartSnapshots}
            type="button"
            variant="ghost"
          >
            Vaciar carrito
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
