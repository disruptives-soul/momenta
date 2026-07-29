import { cn } from "@/lib/utils";

type CharacterCounterProps = {
  value: string;
  maxLength: number;
  alwaysShow?: boolean;
};

export function CharacterCounter({
  value,
  maxLength,
  alwaysShow = false,
}: CharacterCounterProps) {
  const remaining = maxLength - value.length;
  const shouldShow = alwaysShow || remaining <= 10;

  if (!shouldShow) {
    return null;
  }

  return (
    <p
      className={cn(
        "mt-2 text-right text-xs text-muted-foreground",
        remaining < 0 && "text-danger",
      )}
    >
      {value.length}/{maxLength}
    </p>
  );
}
