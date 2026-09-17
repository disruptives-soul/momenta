"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  spaceBackingProduct,
  spaceInvitationProduct,
  spaceStickersPackProduct,
} from "@/features/products/data/mock-products";
import { getProductPreviewAssetSrc } from "@/features/products/services/product-assets";
import { cn } from "@/lib/utils";

const slides = [
  {
    id: "bosque",
    eyebrow: "Coleccion destacada",
    title: "Bosque,",
    accent: "celebraciones",
    suffix: "con calma",
    description:
      "Piezas coordinadas en verdes suaves, papel natural y detalles botanicos para personalizar sin ruido.",
    ctaLabel: "Ver coleccion",
    href: "/collections/space-birthday",
    imageAlt: spaceInvitationProduct.prototype.previewAlt,
    imageSrc: getProductPreviewAssetSrc(spaceInvitationProduct),
  },
  {
    id: "coordinados",
    eyebrow: "Piezas coordinadas",
    title: "Un mismo",
    accent: "universo visual",
    suffix: "en cada detalle",
    description:
      "Invitaciones, stickers y piezas de apoyo mantienen la misma estetica para armar una celebracion completa.",
    ctaLabel: "Ver productos",
    href: "/catalog?theme=space-birthday",
    imageAlt: spaceStickersPackProduct.prototype.previewAlt,
    imageSrc: getProductPreviewAssetSrc(spaceStickersPackProduct),
  },
  {
    id: "gran-formato",
    eyebrow: "Gran formato",
    title: "Ambientacion",
    accent: "lista para imprimir",
    suffix: "sin perder estilo",
    description:
      "Banners y backings se preparan con la resolucion correcta para que el universo visual llegue tambien al espacio fisico.",
    ctaLabel: "Ver backing",
    href: "/products/backing",
    imageAlt: spaceBackingProduct.prototype.previewAlt,
    imageSrc: getProductPreviewAssetSrc(spaceBackingProduct),
  },
] as const;

export function FeaturedCollectionCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  function goToSlide(nextIndex: number) {
    setActiveIndex((nextIndex + slides.length) % slides.length);
  }

  return (
    <section
      aria-label="Colecciones destacadas"
      className="relative overflow-visible rounded-[2rem] border border-white/70 bg-surface shadow-sm"
    >
      <div className="grid min-h-[18rem] overflow-hidden rounded-[2rem] md:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-center p-8 md:p-12">
          <Badge tone="neutral" className="w-fit bg-background">
            {activeSlide.eyebrow}
          </Badge>
          <h1 className="mt-5 max-w-lg text-4xl font-semibold leading-[0.98] md:text-6xl">
            {activeSlide.title}{" "}
            <span className="italic text-primary">{activeSlide.accent}</span>{" "}
            {activeSlide.suffix}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            {activeSlide.description}
          </p>
          <Button asChild className="mt-6 w-fit" variant="secondary">
            <Link href={activeSlide.href}>
              {activeSlide.ctaLabel}
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="relative min-h-[18rem] overflow-hidden bg-muted">
          <Image
            alt={activeSlide.imageAlt}
            className="object-cover transition duration-500"
            fill
            priority
            sizes="(min-width: 1024px) 36rem, 100vw"
            src={activeSlide.imageSrc}
          />
        </div>
      </div>

      <button
        aria-label="Coleccion anterior"
        className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/95 text-foreground shadow-md transition hover:-translate-x-0.5 md:grid"
        onClick={() => goToSlide(activeIndex - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>
      <button
        aria-label="Coleccion siguiente"
        className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/95 text-foreground shadow-md transition hover:translate-x-0.5 md:grid"
        onClick={() => goToSlide(activeIndex + 1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-surface/95 px-3 py-2 shadow-sm">
        {slides.map((slide, index) => (
          <button
            aria-label={`Ver slide ${index + 1}: ${slide.eyebrow}`}
            className={cn(
              "h-2 rounded-full transition-all",
              activeIndex === index
                ? "w-8 bg-primary"
                : "w-2 bg-muted-foreground/35 hover:bg-muted-foreground/60",
            )}
            key={slide.id}
            onClick={() => goToSlide(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
