import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Product } from "@/domain";

type ProductSummaryCardProps = {
  product: Product & {
    priceLabel?: string;
    prototype?: {
      ctaLabel: string;
      href: string;
      highlights: string[];
      visualFormat: string;
    };
  };
};

export function ProductSummaryCard({ product }: ProductSummaryCardProps) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {product.description}
          </p>
        </div>
        <Badge tone={product.access}>
          {product.access === "free" ? "Free" : "Premium"}
        </Badge>
      </div>
      {product.priceLabel ? (
        <p className="mt-4 text-xl font-semibold">{product.priceLabel}</p>
      ) : null}
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Medida</dt>
          <dd className="font-medium">
            {product.widthMm} x {product.heightMm} mm
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Formatos</dt>
          <dd className="font-medium">{product.outputFormats.join(", ")}</dd>
        </div>
      </dl>
      {product.prototype?.highlights.length ? (
        <ul className="mt-5 grid gap-2 text-sm text-muted-foreground">
          {product.prototype.highlights.map((highlight) => (
            <li key={highlight}>• {highlight}</li>
          ))}
        </ul>
      ) : null}
      <Button asChild className="mt-5 w-full">
        <Link href={product.prototype?.href ?? "#"}>
          {product.prototype?.ctaLabel ?? "Ver producto"}
        </Link>
      </Button>
    </Card>
  );
}
