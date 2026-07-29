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
        description="Elige una colección, personalízala y descarga tu kit imprimible."
        eyebrow="Prototipo de experiencia"
        media={
          <PlaceholderArtwork
            description="Asset provisional hasta recibir la portada final."
            label="Placeholder de portada"
            title="Space Birthday"
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
                La primera colección piloto para validar descubrimiento.
              </p>
            </div>
            <Link className="text-sm font-medium text-primary" href="/catalog">
              Ver catálogo
            </Link>
          </div>
          {featuredCollection ? (
            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <PlaceholderArtwork
                description={featuredCollection.prototype?.visualStyle}
                label="Miniatura provisional"
                title={featuredCollection.name}
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
              Solo Cumpleaños infantiles está activa durante esta etapa.
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
              El prototipo diferencia el acceso gratuito del interés Premium.
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
                Página A4 con 12 stickers circulares de 5 cm. Precio de
                validación: ARS 1.990.
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
          description="Empezá por Space Birthday y recorré la experiencia del prototipo."
          title="Listo para elegir una colección"
        />
      </Container>
    </main>
  );
}
