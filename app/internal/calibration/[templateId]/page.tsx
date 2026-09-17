import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import {
  getHeadlessProductByTemplateId,
  isPublicProduct,
} from "@/features/products/services/headless-catalog";
import { getTemplateMasterAssetSrc } from "@/features/rendering/templates/template-assets";
import { getRenderingTemplateAsync } from "@/features/rendering/templates/headless-template-registry";

export const dynamic = "force-dynamic";

type CalibrationPageProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export async function generateMetadata({ params }: CalibrationPageProps) {
  const { templateId } = await params;

  return {
    title: `Calibrar ${templateId}`,
  };
}

export default async function CalibrationPage({ params }: CalibrationPageProps) {
  const { templateId } = await params;
  const [template, product] = await Promise.all([
    getRenderingTemplateAsync(templateId),
    getHeadlessProductByTemplateId(templateId, { includeUnpublished: true }),
  ]);

  if (!template) {
    notFound();
  }

  const fields = Object.entries(template.fields);
  const isCalibrated = fields.length > 0;
  const canOpenPublicProduct = product ? isPublicProduct(product) : false;

  return (
    <main className="min-h-screen bg-[#eef2f6]">
      <Container className="py-10">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone={isCalibrated ? "free" : "premium"}>
              {isCalibrated ? "Calibrado" : "Necesita calibracion"}
            </Badge>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Calibracion de template
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {product?.name ?? templateId} - {template.widthMm} x{" "}
              {template.heightMm} mm - {templateId}
            </p>
          </div>

          {product && canOpenPublicProduct ? (
            <Button asChild variant="secondary">
              <Link href={`/products/${product.slug}`}>Ver producto publico</Link>
            </Button>
          ) : product ? (
            <Badge tone="neutral">Oculto del catalogo publico</Badge>
          ) : null}
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[1.5rem] border border-white/70 bg-surface p-4 shadow-sm">
            <div className="relative mx-auto aspect-[297/420] max-h-[78vh] overflow-hidden rounded-[1rem] bg-muted">
              <Image
                alt={`Master limpio para ${templateId}`}
                className="object-contain"
                fill
                priority
                sizes="(min-width: 1024px) 60vw, 92vw"
                src={getTemplateMasterAssetSrc(template)}
              />
            </div>
          </div>

          <aside className="h-fit rounded-[1.5rem] border border-white/70 bg-surface p-5 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold">Capas</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Esta pantalla valida que Next ya puede leer el producto crudo y
              cargar el master limpio. El siguiente paso es guardar capas desde
              el canvas interno.
            </p>

            <div className="mt-5 grid gap-3">
              {fields.length > 0 ? (
                fields.map(([id, field]) => (
                  <div
                    className="rounded-xl bg-background px-3 py-2 text-sm"
                    key={id}
                  >
                    <p className="font-semibold">{field.label}</p>
                    <p className="text-muted-foreground">
                      x {Math.round(field.x)} - y {Math.round(field.y)} -{" "}
                      {field.fontSize}px
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-background px-3 py-3 text-sm text-muted-foreground">
                  Todavia no hay textos calibrados.
                </div>
              )}
            </div>
          </aside>
        </section>
      </Container>
    </main>
  );
}
