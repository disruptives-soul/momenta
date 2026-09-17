"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  downloadCartZip,
  type ZipDownloadState,
} from "../services/cart-download";
import type { CartSnapshot } from "../services/cart-storage";
import { lastOrderStorageKey } from "./cart-checkout-view";

type LastOrder = {
  id: string;
  items: CartSnapshot[];
  projectIds?: string[];
  createdAt: string;
};

type OrderLoadState = "loading" | "ready" | "missing";

export function CheckoutSuccessView() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [orderLoadState, setOrderLoadState] =
    useState<OrderLoadState>("loading");
  const [downloadState, setDownloadState] =
    useState<ZipDownloadState>("idle");
  const autoDownloadAttemptedRef = useRef(false);

  useEffect(() => {
    window.queueMicrotask(() => {
      const current = window.sessionStorage.getItem(lastOrderStorageKey);

      if (!current) {
        setOrderLoadState("missing");
        return;
      }

      try {
        setOrder(JSON.parse(current) as LastOrder);
        setOrderLoadState("ready");
      } catch {
        setOrder(null);
        setOrderLoadState("missing");
      }
    });
  }, []);

  async function downloadOrderZip(items: CartSnapshot[], orderId: string) {
    setDownloadState("downloading");

    try {
      await downloadCartZip(items, orderId);
      setDownloadState("completed");
    } catch {
      setDownloadState("failed");
    }
  }

  useEffect(() => {
    if (!order || autoDownloadAttemptedRef.current) {
      return;
    }

    autoDownloadAttemptedRef.current = true;
    void downloadOrderZip(order.items, order.id);
  }, [order]);

  if (orderLoadState === "loading") {
    return (
      <Card className="mx-auto grid min-h-80 max-w-3xl place-items-center text-center">
        <div>
          <p className="text-sm font-medium text-primary">Pedido</p>
          <h1 className="mt-2 text-3xl font-semibold">Preparando archivos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estamos buscando el pedido confirmado.
          </p>
        </div>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="mx-auto grid max-w-3xl gap-5 text-center">
        <FileQuestion
          aria-hidden="true"
          className="mx-auto size-12 text-muted-foreground"
        />
        <p className="text-sm font-medium text-primary">Pedido no disponible</p>
        <h1 className="text-3xl font-semibold md:text-5xl">
          No encontramos un pedido confirmado
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
          Esta pantalla solo prepara archivos despues de confirmar el checkout.
          Vuelve al carrito o explora el catalogo para crear una nueva compra.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/cart">Volver al carrito</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/catalog">Explorar productos</Link>
          </Button>
        </div>
      </Card>
    );
  }

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
          productos personalizados y preparamos el ZIP con los archivos finales.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            disabled={downloadState === "downloading"}
            onClick={() => downloadOrderZip(order.items, order.id)}
            type="button"
          >
            <Download aria-hidden="true" />
            {downloadState === "downloading"
              ? "Preparando ZIP"
              : "Descargar ZIP"}
          </Button>
          <Button asChild>
            <Link href="/account/designs">Ver mis disenos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/catalog">Explorar mas productos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
        {downloadState === "completed" ? (
          <p className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
            ZIP generado y descargado correctamente.
          </p>
        ) : null}
        {downloadState === "failed" ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            No pudimos generar el ZIP. Intenta descargarlo nuevamente.
          </p>
        ) : null}
      </Card>

      <Card className="grid gap-3">
        <h2 className="text-xl font-semibold">Resumen del pedido</h2>
        <p className="text-sm text-muted-foreground">ID demo: {order.id}</p>
        {order.projectIds?.length ? (
          <p className="text-sm text-muted-foreground">
            Proyectos creados: {order.projectIds.length}
          </p>
        ) : null}
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
    </div>
  );
}
