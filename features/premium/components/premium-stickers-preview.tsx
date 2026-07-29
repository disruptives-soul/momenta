import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PremiumStickersPreviewProps = {
  compact?: boolean;
};

const stickerLabels = [
  "Mateo",
  "7",
  "Space",
  "Birthday",
  "Mateo",
  "7",
  "Space",
  "Birthday",
  "Mateo",
  "7",
  "Space",
  "Birthday",
];

export function PremiumStickersPreview({
  compact = false,
}: PremiumStickersPreviewProps) {
  return (
    <figure>
      <div
        aria-label="Vista previa del Stickers pack con 12 stickers circulares"
        className={cn(
          "mx-auto aspect-[210/297] w-full max-w-sm rounded-md border border-border bg-surface p-4 shadow-md",
          compact && "max-w-64 p-3",
        )}
        role="img"
      >
        <div className="flex h-full flex-col rounded-sm border border-dashed border-accent/45 bg-[#fffaf0] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Badge tone="premium">Vista Premium</Badge>
            <span className="text-xs font-medium text-muted-foreground">A4</span>
          </div>
          <div className="grid flex-1 grid-cols-3 content-center gap-3">
            {stickerLabels.map((label, index) => (
              <div
                className="grid aspect-square place-items-center rounded-full border border-primary/35 bg-background text-center shadow-sm"
                key={`${label}-${index}`}
              >
                <span className="px-2 text-xs font-semibold leading-tight text-primary">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            12 stickers · 5 cm
          </p>
        </div>
      </div>
      <figcaption className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
        Lámina A4 con stickers personalizados con nombre y edad.
      </figcaption>
    </figure>
  );
}
