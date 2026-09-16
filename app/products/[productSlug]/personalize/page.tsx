import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoadingState } from "@/components/ui/status-state";
import { PersonalizationFlow } from "@/features/personalization/components/personalization-flow";
import { getProductBySlug } from "@/features/products/services/product-catalog";

type ProductPersonalizePageProps = {
  params: Promise<{
    productSlug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPersonalizePageProps) {
  const { productSlug } = await params;
  const product = getProductBySlug(productSlug);

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
  const product = getProductBySlug(productSlug);

  if (!product) {
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
        <PersonalizationFlow productSlug={product.slug} />
      </Suspense>
    </main>
  );
}
