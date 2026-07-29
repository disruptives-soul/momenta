"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/status-state";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { mockPremiumOffer, premiumEventPayload } from "../data/mock-premium-offer";
import type { MockCheckoutState } from "../types/mock-checkout-state";
import { PremiumStickersPreview } from "./premium-stickers-preview";

type MockCheckoutProps = {
  simulateError?: boolean;
};

export function MockCheckout({ simulateError = false }: MockCheckoutProps) {
  const router = useRouter();
  const [state, setState] = useState<MockCheckoutState>("reviewing");

  useEffect(() => {
    trackValidationEvent("mock_checkout_started", premiumEventPayload);
    trackValidationEvent("mock_checkout_viewed", premiumEventPayload);
  }, []);

  function cancelCheckout() {
    setState("cancelled");
    trackValidationEvent("mock_checkout_cancelled", premiumEventPayload);
    router.push("/collections/space-birthday/stickers-pack");
  }

  function confirmIntent() {
    setState("confirming");

    window.setTimeout(() => {
      if (simulateError) {
        setState("failed");
        return;
      }

      setState("completed");
      trackValidationEvent("purchase_intent_confirmed", premiumEventPayload);
      trackValidationEvent("mock_checkout_completed", premiumEventPayload);
      router.push("/checkout/mock/success");
    }, 500);
  }

  if (state === "failed") {
    return (
      <ErrorState
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => setState("reviewing")} type="button">
              Intentar nuevamente
            </Button>
            <Button asChild variant="secondary">
              <Link href="/collections/space-birthday/stickers-pack">
                Volver al detalle
              </Link>
            </Button>
          </div>
        }
        description="No pudimos registrar la intención. El contexto del producto se conserva."
        title="No pudimos registrar tu respuesta"
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.7fr_1fr] lg:items-start">
      <PremiumStickersPreview compact />

      <Card className="grid gap-6">
        <div>
          <Badge tone="premium">Checkout simulado</Badge>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
            Confirmar interés
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Este paso mide intención de compra. No solicitamos datos financieros.
          </p>
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-muted p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Producto</span>
            <strong>{mockPremiumOffer.productName}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Colección</span>
            <strong>{mockPremiumOffer.collectionName}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Precio</span>
            <strong>{mockPremiumOffer.priceLabel}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Modelo</span>
            <strong>{mockPremiumOffer.paymentModel}</strong>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Resumen</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {mockPremiumOffer.includes.slice(0, 5).map((item) => (
              <li className="flex gap-2" key={item}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-live="polite"
          className="rounded-md border border-primary/25 bg-primary/10 p-4 text-sm leading-6"
        >
          No se realizará ningún cobro y no se abrirá Mercado Pago. Esta acción
          solo confirma que comprarías el Stickers pack por {mockPremiumOffer.priceLabel}.
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Button
            disabled={state === "confirming"}
            onClick={confirmIntent}
            type="button"
          >
            {state === "confirming"
              ? "Registrando intención"
              : `Sí, compraría este pack por ${mockPremiumOffer.priceLabel}`}
          </Button>
          <Button onClick={cancelCheckout} type="button" variant="secondary">
            <ArrowLeft aria-hidden="true" />
            Volver
          </Button>
        </div>
      </Card>
    </div>
  );
}
