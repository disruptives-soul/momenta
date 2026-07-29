import { Badge } from "@/components/ui/badge";
import {
  formatPersonalizationValue,
} from "@/features/personalization/services/personalization-formatters";
import type { PersonalizationValues } from "@/features/personalization/types/personalization-draft";
import { cn } from "@/lib/utils";

type PrototypeInvitationPreviewProps = {
  values: PersonalizationValues;
  compact?: boolean;
};

function getNameSize(name: string) {
  if (name.length > 24) {
    return "text-3xl";
  }

  if (name.length > 16) {
    return "text-4xl";
  }

  return "text-5xl";
}

export function PrototypeInvitationPreview({
  values,
  compact = false,
}: PrototypeInvitationPreviewProps) {
  const displayMessage = values.message.trim() || "¡Te esperamos!";
  const hasLongText =
    values.name.length > 24 || values.place.length > 48 || displayMessage.length > 92;

  return (
    <figure>
      <div
        aria-label="Preview prototipo de la Invitación esencial personalizada"
        className={cn(
          "relative mx-auto aspect-[5/7] w-full max-w-sm overflow-hidden rounded-md border border-border bg-[#fbfaf7] p-5 shadow-md",
          compact && "max-w-64 p-4",
        )}
        role="img"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,118,110,0.16),transparent_22%),radial-gradient(circle_at_82%_16%,rgba(249,115,22,0.18),transparent_20%),linear-gradient(180deg,#fffaf0,#eef7f5)]" />
        <div className="absolute left-5 top-5 size-10 rounded-full border border-primary/30 bg-surface" />
        <div className="absolute right-7 top-10 size-6 rounded-full bg-accent/30" />
        <div className="absolute bottom-10 left-8 size-8 rounded-full border border-accent/40" />
        <div className="relative flex h-full flex-col justify-between rounded-sm border border-dashed border-primary/30 bg-background/78 p-5 text-center">
          <div>
            <Badge tone="neutral">Prototype preview renderer</Badge>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.14em] text-primary">
              Space Birthday
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Cumpleaños de</p>
            <p className={cn("mt-2 font-semibold leading-none", getNameSize(values.name))}>
              {values.name}
            </p>
            <p className="mt-3 text-3xl font-semibold text-primary">
              {formatPersonalizationValue("age", values)}
            </p>
          </div>

          <div className="grid gap-2 text-sm leading-6">
            <p>{formatPersonalizationValue("date", values)}</p>
            <p>{formatPersonalizationValue("time", values)}</p>
            <p className="font-medium">{values.place}</p>
            <p className="mx-auto line-clamp-3 max-w-[18rem] text-muted-foreground">
              {displayMessage}
            </p>
          </div>
        </div>
      </div>
      {hasLongText ? (
        <figcaption className="mx-auto mt-3 max-w-sm text-sm text-warning">
          Algunos textos están cerca del límite visual del prototipo.
        </figcaption>
      ) : null}
    </figure>
  );
}
