import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { EventLink } from "@/features/analytics/components/event-link";
import { Breadcrumbs } from "@/features/prototype/components/breadcrumbs";
import { mockPremiumOffer, premiumEventPayload } from "../data/mock-premium-offer";
import { PremiumStickersPreview } from "./premium-stickers-preview";

export function PremiumDetail() {
  return (
    <div className="grid gap-10">
      <DiscoveryEvent
        name="premium_product_viewed"
        payload={premiumEventPayload}
      />
      <DiscoveryEvent
        name="premium_details_viewed"
        payload={premiumEventPayload}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Inicio" },
          { href: "/catalog", label: "Catálogo" },
          { href: "/collections/space-birthday", label: "Space Birthday" },
          {
            href: "/collections/space-birthday/stickers-pack",
            label: "Stickers pack",
          },
        ]}
      />

      <section className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div className="grid gap-5">
          <Badge tone="premium">Premium</Badge>
          <div>
            <p className="text-sm font-medium text-primary">
              {mockPremiumOffer.collectionName}
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight md:text-5xl">
              {mockPremiumOffer.productName}
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Una expansión coordinada para completar la celebración con stickers
              personalizados con nombre y edad.
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Precio</p>
            <p className="text-3xl font-semibold">{mockPremiumOffer.priceLabel}</p>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>{mockPremiumOffer.paymentModel}</p>
            <p>{mockPremiumOffer.subscription}</p>
            <p>{mockPremiumOffer.delivery}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <EventLink
                eventName="premium_cta_clicked"
                eventPayload={premiumEventPayload}
                href="/checkout/mock"
              >
                Comprar por {mockPremiumOffer.priceLabel}
                <ArrowRight aria-hidden="true" />
              </EventLink>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/collections/space-birthday">Volver a la colección</Link>
            </Button>
          </div>
        </div>

        <div>
          <DiscoveryEvent
            name="premium_preview_viewed"
            payload={premiumEventPayload}
          />
          <PremiumStickersPreview />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-[1fr_0.85fr]">
        <Card>
          <DiscoveryEvent
            name="premium_benefits_viewed"
            payload={premiumEventPayload}
          />
          <h2 className="text-2xl font-semibold">Qué incluye</h2>
          <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
            {mockPremiumOffer.includes.map((item) => (
              <li className="flex gap-2" key={item}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="grid gap-4 bg-surface-strong">
          <h2 className="text-2xl font-semibold">Free y Premium</h2>
          {mockPremiumOffer.freeComparison.map((item) => (
            <p className="text-sm leading-6 text-muted-foreground" key={item}>
              {item}
            </p>
          ))}
        </Card>
      </section>

    </div>
  );
}
