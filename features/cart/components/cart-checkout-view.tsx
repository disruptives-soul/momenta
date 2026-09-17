"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, LockKeyhole } from "lucide-react";
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
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { localPurchasedProjectRepository } from "@/features/purchased-projects/services/local-purchased-project-repository";
import { createPurchasedProjectFromCartSnapshot } from "@/features/purchased-projects/services/purchased-project-lifecycle";

const lastOrderStorageKey = "momenta:last-order";

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

export function CartCheckoutView() {
  const router = useRouter();
  const [items, setItems] = useState<CartSnapshot[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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

  async function confirmOrder() {
    if (items.length === 0) {
      return;
    }

    setIsConfirming(true);

    const now = new Date();
    const projects = items.map((item) =>
      createPurchasedProjectFromCartSnapshot(item, now),
    );

    await Promise.all(
      projects.map(async (project) => {
        await localPurchasedProjectRepository.create(project);
        trackValidationEvent("post_purchase_project_created", {
          productId: project.productId,
          projectId: project.id,
          templateId: project.templateId,
        });
      }),
    );

    const order = {
      id: `demo-${Date.now()}`,
      items,
      projectIds: projects.map((project) => project.id),
      createdAt: new Date().toISOString(),
    };

    window.sessionStorage.setItem(lastOrderStorageKey, JSON.stringify(order));

    window.setTimeout(() => {
      clearCartSnapshots();
      router.push("/checkout/success");
    }, 450);
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
            Confirma el producto y revisa el total. La descarga del ZIP se
            habilita despues de confirmar el pago demo.
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
            Al confirmar se prepara la pantalla de pedido con la descarga de los
            PDFs finales.
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
      </Card>
    </div>
  );
}

export { lastOrderStorageKey };
