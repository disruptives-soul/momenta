import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoadingState } from "@/components/ui/status-state";
import { PersonalizationFlow } from "@/features/personalization/components/personalization-flow";
import { getCatalogProductBySlug } from "@/features/products/services/server-product-catalog";
import { getRenderingTemplateAsync } from "@/features/rendering/templates/headless-template-registry";

type ProductPersonalizePageProps = {
  params: Promise<{
    productSlug: string;
  }>;
};

export const revalidate = 0;

export async function generateMetadata({ params }: ProductPersonalizePageProps) {
  const { productSlug } = await params;
  const product = await getCatalogProductBySlug(productSlug);

  if (!product) {
    return {
      title: "Personalizar producto",
    };
  }

  return {
    title: `Personalizar ${product.name}`,
    description: "Editor visual para personalizar textos imprimibles.",
  };
}

export default async function ProductPersonalizePage({
  params,
}: ProductPersonalizePageProps) {
  const { productSlug } = await params;
  const product = await getCatalogProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  const template = await getRenderingTemplateAsync(product.templateId);

  if (!template) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#eef2f6]">
      <Suspense
        fallback={
          <LoadingState
            description="Preparando el editor."
            title="Cargando personalizacion"
          />
        }
      >
        <PersonalizationFlow
          product={product}
          productSlug={product.slug}
          template={template}
        />
      </Suspense>
    </main>
  );
}
