"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CartSnapshot } from "../services/cart-storage";
import { lastOrderStorageKey } from "./cart-checkout-view";

type LastOrder = {
  id: string;
  items: CartSnapshot[];
  createdAt: string;
};

export function CheckoutSuccessView() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    window.queueMicrotask(() => {
      const current = window.sessionStorage.getItem(lastOrderStorageKey);

      if (!current) {
        return;
      }

      try {
        setOrder(JSON.parse(current) as LastOrder);
      } catch {
        setOrder(null);
      }
    });
  }, []);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Card className="grid gap-5 text-center">
        <CheckCircle2
          aria-hidden="true"
          className="mx-auto size-12 text-primary"
        />
        <p className="text-sm font-medium text-primary">Pedido confirmado</p>
        <h1 className="text-3xl font-semibold md:text-5xl">
          Tus archivos quedaron listos para preparar
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
          En este MVP no se realizo ningun cobro. Guardamos la intencion con los
          productos personalizados para validar el flujo completo.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/catalog">Explorar mas productos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </Card>

      {order ? (
        <Card className="grid gap-3">
          <h2 className="text-xl font-semibold">Resumen del pedido</h2>
          <p className="text-sm text-muted-foreground">ID demo: {order.id}</p>
          <div className="grid gap-2">
            {order.items.map((item) => (
              <div
                className="rounded-xl border border-border bg-muted p-3 text-sm"
                key={item.id}
              >
                <strong>{item.product.name}</strong>
                <p className="text-muted-foreground">
                  {item.product.pieceTypeName} - {item.product.visualFormat}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
