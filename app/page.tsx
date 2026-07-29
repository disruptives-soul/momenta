import Link from "next/link";
import { ArrowRight, Compass, Gift, Printer } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiscoveryEvent } from "@/features/analytics/components/discovery-event";
import { CategoryCard } from "@/features/catalog/components/category-card";
import { mockCategories } from "@/features/catalog/data/mock-categories";
import { CollectionCard } from "@/features/collections/components/collection-card";
import { spaceBirthdayAssets } from "@/features/collections/data/space-birthday-assets";
import { listPublicCollections } from "@/features/collections/services/list-public-collections";
import { Hero } from "@/features/prototype/components/hero";
import { HowItWorks } from "@/features/prototype/components/how-it-works";
import { PlaceholderArtwork } from "@/features/prototype/components/placeholder-artwork";
import { CTASection } from "@/features/prototype/components/cta-section";

export default async function HomePage() {
  const collections = await listPublicCollections({ limit: 1 });
  const featuredCollection = collections[0];

  return (
    <main>
      <DiscoveryEvent name="home_viewed" />

      <Hero
        actions={
          <>
            <Button asChild>
              <Link href="/catalog">
                Explorar colecciones
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="#como-funciona">Ver cómo funciona</Link>
            </Button>
          </>
        }
        description="Elige una colección, personalízala paso a paso y prepara piezas imprimibles para tu celebración."
        eyebrow="Colecciones imprimibles"
        media={
          <PlaceholderArtwork
            description={spaceBirthdayAssets.cover.description}
            label={spaceBirthdayAssets.cover.label}
            title={spaceBirthdayAssets.cover.title}
            variant="cover"
          />
        }
        title="Colecciones imprimibles listas para personalizar."
      />

      <Container className="grid gap-12 py-12">
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Colección destacada</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Una colección espacial para cumpleaños infantiles.
              </p>
            </div>
            <Link className="text-sm font-medium text-primary" href="/catalog">
              Ver catálogo
            </Link>
          </div>
          {featuredCollection ? (
            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <PlaceholderArtwork
                description={spaceBirthdayAssets.thumbnail.description}
                label={spaceBirthdayAssets.thumbnail.label}
                title={spaceBirthdayAssets.thumbnail.title}
                variant="thumbnail"
              />
              <CollectionCard collection={featuredCollection} />
            </div>
          ) : null}
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">Categorías disponibles</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explora colecciones por tipo de celebración.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {mockCategories.map((category) => (
              <CategoryCard category={category} key={category.id} />
            ))}
          </div>
        </section>

        <section id="como-funciona">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">Cómo funciona</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Un flujo guiado, sin editor libre ni pasos técnicos.
            </p>
          </div>
          <HowItWorks />
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">Free y Premium</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Empieza gratis y suma piezas coordinadas cuando quieras completar la celebración.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="grid gap-4 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3">
                <Compass aria-hidden="true" className="size-5 text-primary" />
                <Badge tone="free">Free</Badge>
              </div>
              <h3 className="text-xl font-semibold">Invitación esencial</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Una invitación vertical personalizada con nombre, edad, fecha,
                hora, lugar y mensaje opcional.
              </p>
            </Card>
            <Card className="grid gap-4 border-accent/40 bg-accent/10">
              <div className="flex items-center gap-3">
                <Gift aria-hidden="true" className="size-5 text-accent" />
                <Badge tone="premium">Premium</Badge>
              </div>
              <h3 className="text-xl font-semibold">Stickers pack</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Página A4 con 12 stickers circulares de 5 cm. Precio: ARS 1.990.
              </p>
            </Card>
          </div>
        </section>

        <CTASection
          action={
            <Button asChild>
              <Link href="/catalog">
                Explorar colecciones
                <Printer aria-hidden="true" />
              </Link>
            </Button>
          }
          description="Empezá por Space Birthday y personalizá tu invitación en pocos pasos."
          title="Listo para elegir una colección"
        />
      </Container>
    </main>
  );
}
