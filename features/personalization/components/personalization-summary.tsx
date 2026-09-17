"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/status-state";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { saveCartSnapshot } from "@/features/cart/services/cart-storage";
import { getProductPreviewAssetSrc } from "@/features/products/services/product-assets";
import { getProductForRenderingTemplate } from "@/features/products/services/product-catalog";
import { TemplatePreview } from "@/features/rendering/components/template-preview";
import { getRenderingTemplate } from "@/features/rendering/templates/template-registry";
import { loadPersonalizationDraft } from "../services/personalization-draft-storage";
import {
  createInitialPersonalizationDraft,
  demoPersonalizationProjectId,
  getDraftTemplateScene,
  type PersonalizationDraft,
} from "../types/personalization-draft";

type PersonalizationSummaryProps = {
  projectId: string;
};

function formatPhysicalSize(widthMm: number, heightMm: number) {
  if (widthMm >= 1000 || heightMm >= 1000) {
    return `${widthMm / 1000} x ${heightMm / 1000} m`;
  }

  return `${widthMm} x ${heightMm} mm`;
}

function createCartSnapshotId(productId: string, templateId: string) {
  return `${productId}:${templateId}:${Date.now()}`;
}

export function PersonalizationSummary({ projectId }: PersonalizationSummaryProps) {
  const [draft, setDraft] = useState<PersonalizationDraft>(
    createInitialPersonalizationDraft,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const isValidProject = projectId === demoPersonalizationProjectId;
  const template = draft.templateSnapshot ?? getRenderingTemplate(draft.templateId);
  const product =
    draft.productSnapshot ??
    (template ? getProductForRenderingTemplate(template) : null);
  const scene = template ? getDraftTemplateScene(draft, template.id) : [];
  const editHref = product
    ? `/products/${product.slug}/personalize`
    : "/products/invitation/personalize";
  const deliveredFormats = product?.outputFormats
    .map((format) => format.toUpperCase())
    .join(" + ");

  useEffect(() => {
    window.queueMicrotask(() => {
      setDraft(loadPersonalizationDraft());
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    trackValidationEvent("review_viewed", {
      collectionSlug: draft.collectionSlug,
      productCode: draft.productCode,
    });
  }, [draft.collectionSlug, draft.productCode, isHydrated]);

  if (!isValidProject || !template || !product) {
    return (
      <ErrorState
        action={
          <Button asChild>
            <Link href={editHref}>Volver al editor</Link>
          </Button>
        }
        description="No encontramos una personalizacion disponible para revisar."
        title="Personalizacion no disponible"
      />
    );
  }

  if (!isHydrated) {
    return (
      <Card className="mx-auto grid max-w-xl gap-3 text-center">
        <p className="text-sm font-medium text-primary">Review</p>
        <h1 className="text-3xl font-semibold">Preparando revision</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Estamos cargando la pieza personalizada antes de confirmar el carrito.
        </p>
      </Card>
    );
  }

  function addToCart() {
    if (!template || !product) {
      return;
    }

    saveCartSnapshot({
      id: createCartSnapshotId(product.id, template.id),
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        pieceTypeName: product.pieceTypeName,
        collectionSlug: product.collectionSlug,
        collectionName: product.collectionName,
        widthMm: product.widthMm,
        heightMm: product.heightMm,
        outputFormats: product.outputFormats,
        priceLabel: product.priceLabel,
        previewAlt: product.prototype.previewAlt,
        previewSrc: getProductPreviewAssetSrc(product),
        visualFormat: product.prototype.visualFormat,
      },
      template: {
        ...template,
        id: template.id,
        printProfileId: template.printProfile.id,
        widthMm: template.widthMm,
        heightMm: template.heightMm,
      },
      scene,
      createdAt: new Date().toISOString(),
    });

    setAddedToCart(true);
    trackValidationEvent("preview_confirmed", {
      collectionSlug: product.collectionSlug,
      productCode: product.slug,
    });
    window.location.assign("/cart");
  }

  const checklist = [
    "Revise que los textos personalizados esten correctos.",
    "Confirme que no queden textos de muestra.",
    "Verifique que el texto no tape informacion importante del arte.",
    "Valide que esta es la pieza que quiere agregar al carrito.",
  ];

  const pdfFeatures = [
    `PDF final sin watermark para ${product.name}.`,
    `Pagina 1 al tamano fisico ${formatPhysicalSize(product.widthMm, product.heightMm)}.`,
    "Pagina 2 A4 con instrucciones MOMENTA.",
    "Artwork base immutable y textos renderizados desde la escena personalizada.",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_0.75fr] lg:items-start">
      <div className="grid gap-4">
        <TemplatePreview
          ariaLabel={`Vista previa de ${product.name} personalizado`}
          scene={scene}
          template={template}
          templateId={template.id}
          values={draft.valuesByTemplate[template.id] ?? draft.values}
        />
        <p className="text-center text-sm text-muted-foreground">
          Vista previa read-only con watermark. El PDF comprado se genera sin
          marca de agua.
        </p>
      </div>

      <Card className="grid gap-5">
        <div>
          <p className="text-sm font-medium text-primary">Review</p>
          <h1 className="mt-2 text-3xl font-semibold">Revisa el producto</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esta pantalla confirma la personalizacion antes de crear la linea de
            carrito.
          </p>
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-muted p-4 text-sm">
          <div>
            <p className="text-muted-foreground">Producto</p>
            <p className="font-semibold">{product.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p className="font-semibold">{product.pieceTypeName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tamano fisico</p>
            <p className="font-semibold">
              {formatPhysicalSize(product.widthMm, product.heightMm)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Formato digital entregado</p>
            <p className="font-semibold">{deliveredFormats}</p>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold">Checklist minimo</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {checklist.map((item) => (
              <li className="flex gap-2" key={item}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Caracteristicas del PDF</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {pdfFeatures.map((item) => (
              <li className="flex gap-2" key={item}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {addedToCart ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
            Producto agregado al carrito con snapshot de producto, template y
            escena personalizada.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild variant="secondary">
            <Link href={editHref}>Seguir editando</Link>
          </Button>
          <Button disabled={addedToCart} onClick={addToCart} type="button">
            <ShoppingCart aria-hidden="true" />
            {addedToCart ? "Agregado" : "Anadir al carrito"}
          </Button>
        </div>

        <Badge tone="neutral">
          Carrito libre por Product: una linea por producto personalizado.
        </Badge>
      </Card>
    </div>
  );
}
