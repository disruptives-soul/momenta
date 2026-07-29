import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlaceholderArtworkProps = {
  label: string;
  title: string;
  description?: string;
  variant?: "cover" | "invitation" | "stickers" | "thumbnail";
  className?: string;
};

export function PlaceholderArtwork({
  label,
  title,
  description,
  variant = "cover",
  className,
}: PlaceholderArtworkProps) {
  const isInvitation = variant === "invitation";
  const isStickers = variant === "stickers";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-surface-strong p-4 shadow-sm",
        isInvitation && "aspect-[5/7]",
        isStickers && "aspect-[1/1.414]",
        variant === "cover" && "aspect-[4/3]",
        variant === "thumbnail" && "aspect-[4/3]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.14),transparent_45%),linear-gradient(45deg,rgba(249,115,22,0.16),transparent_55%)]" />
      <div className="relative flex h-full flex-col justify-between rounded-sm border border-dashed border-primary/35 bg-background/80 p-4">
        <Badge tone="neutral">{label}</Badge>
        {isStickers ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                className="aspect-square rounded-full border border-primary/30 bg-surface"
                key={index}
              />
            ))}
          </div>
        ) : null}
        <div>
          <p className="text-xl font-semibold">{title}</p>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
