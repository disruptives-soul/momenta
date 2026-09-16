"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Download, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/status-state";
import {
  clearCartSnapshots,
  loadCartSnapshots,
  type CartSnapshot,
} from "../services/cart-storage";

const lastOrderStorageKey = "momenta:last-order";

type ZipDownloadState = "idle" | "downloading" | "completed" | "failed";

function getProductPrice(product: CartSnapshot["product"]) {
  if (!product.priceLabel) {
    return 0;
  }

  const normalized = product.priceLabel.replace(/[^\d.,]/g, "").replace(",", ".");
  const price = Number(normalized);

  return Number.isFinite(price) ? price : 0;
}

function formatMoney(value: number) {
  if (value <= 0) {
    return "Gratis";
  }

  return `$${value.toFixed(2)}`;
}

function getDownloadFileName(response: Response) {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(?<fileName>[^"]+)"/);

  return match?.groups?.fileName ?? "momenta-files.zip";
}

function downloadBlob(blob: Blob, fileName: string) {
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 30_000);
}

export function CartCheckoutView() {
  const router = useRouter();
  const [items, setItems] = useState<CartSnapshot[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [zipDownloadState, setZipDownloadState] =
    useState<ZipDownloadState>("idle");

  useEffect(() => {
    window.queueMicrotask(() => {
      setItems(loadCartSnapshots());
      setIsHydrated(true);
    });
  }, []);

  const subtotal = items.reduce(
    (total, item) => total + getProductPrice(item.product),
    0,
  );

  function confirmOrder() {
    if (items.length === 0) {
      return;
    }

    setIsConfirming(true);

    const order = {
      id: `demo-${Date.now()}`,
      items,
      createdAt: new Date().toISOString(),
    };

    window.sessionStorage.setItem(lastOrderStorageKey, JSON.stringify(order));

    window.setTimeout(() => {
      clearCartSnapshots();
      router.push("/checkout/success");
    }, 450);
  }

  async function downloadZip() {
    if (items.length === 0) {
      return;
    }

    setZipDownloadState("downloading");

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "pdf",
          templates: items.map((item) => ({
            templateId: item.template.id,
            data: {},
            scene: item.scene,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("ZIP render failed.");
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("Empty ZIP.");
      }

      downloadBlob(blob, getDownloadFileName(response));
      setZipDownloadState("completed");
    } catch {
      setZipDownloadState("failed");
    }
  }

  if (!isHydrated) {
    return (
      <Card className="mx-auto grid min-h-80 max-w-3xl place-items-center text-center">
        <div>
          <p className="text-sm font-medium text-primary">Checkout</p>
          <h1 className="mt-2 text-3xl font-semibold">Preparando pago</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estamos cargando el producto personalizado.
          </p>
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <ErrorState
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/cart">Volver al carrito</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/catalog">Explorar productos</Link>
            </Button>
          </div>
        }
        description="Todavia no hay productos personalizados para confirmar."
        title="Carrito vacio"
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <section className="grid gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Checkout de pago</p>
          <h1 className="mt-2 text-4xl font-semibold md:text-5xl">
            Pagar producto personalizado
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Confirma el producto, revisa el total y descarga el ZIP con los PDFs
            finales. En este MVP el pago es simulado y no se realiza ningun
            cobro real.
          </p>
        </div>

        <Card className="grid gap-4">
          <h2 className="text-2xl font-semibold">Productos</h2>
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                className="grid gap-2 rounded-xl border border-border bg-muted p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={item.id}
              >
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="neutral">{item.product.pieceTypeName}</Badge>
                    <Badge tone="neutral">{item.product.collectionName}</Badge>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.product.visualFormat}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatMoney(getProductPrice(item.product))}
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/products/${item.product.slug}/personalize`}>
                    Editar
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="grid gap-4">
          <div className="flex items-center gap-3">
            <CreditCard aria-hidden="true" className="size-5 text-primary" />
            <div>
              <h2 className="text-2xl font-semibold">Metodo de pago</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Simulado para validar checkout. No se transmite informacion real.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Nombre en tarjeta
              <Input readOnly value="Cliente MOMENTA" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Tarjeta
              <Input readOnly value="4242 4242 4242 4242" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Vencimiento
              <Input readOnly value="12/30" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              CVC
              <Input readOnly value="123" />
            </label>
          </div>
        </Card>
      </section>

      <Card className="grid gap-5 lg:sticky lg:top-20">
        <div>
          <h2 className="text-2xl font-semibold">Resumen de pago</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El ZIP se descarga desde este checkout e incluye un PDF por producto
            personalizado.
          </p>
        </div>

        <ul className="grid gap-3 text-sm text-muted-foreground">
          {[
            "PDF final por Product.",
            "Instrucciones A4 incluidas por archivo.",
            "Artwork immutable con textos renderizados.",
            "Sin pago real en este MVP.",
          ].map((item) => (
            <li className="flex gap-2" key={item}>
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-border bg-muted p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cantidad</span>
            <strong>{items.length}</strong>
          </div>
          <div className="mt-3 flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <div className="flex justify-between gap-4 text-base">
              <span className="font-semibold">Total</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
          </div>
        </div>

        <Button
          className="rounded-full"
          disabled={zipDownloadState === "downloading"}
          onClick={downloadZip}
          type="button"
        >
          <Download aria-hidden="true" />
          {zipDownloadState === "downloading"
            ? "Preparando ZIP"
            : "Descargar ZIP"}
        </Button>
        <Button
          className="rounded-full"
          disabled={isConfirming}
          onClick={confirmOrder}
          type="button"
          variant="secondary"
        >
          <LockKeyhole aria-hidden="true" />
          {isConfirming ? "Confirmando pago" : "Confirmar pago demo"}
        </Button>
        <Button asChild className="rounded-full" variant="secondary">
          <Link href="/cart">Volver al carrito</Link>
        </Button>
        {zipDownloadState === "completed" ? (
          <p className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
            ZIP generado y descargado correctamente.
          </p>
        ) : null}
        {zipDownloadState === "failed" ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            No pudimos generar el ZIP. Revisa las piezas o intenta nuevamente.
          </p>
        ) : null}
      </Card>
    </div>
  );
}

export { lastOrderStorageKey };
