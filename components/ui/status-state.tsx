import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

type StatusStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: StatusStateProps) {
  return (
    <Card className={cn("grid place-items-center py-10 text-center", className)}>
      <Inbox aria-hidden="true" className="mb-3 size-8 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function LoadingState({ title, description, className }: StatusStateProps) {
  return (
    <Card className={cn("grid place-items-center py-10 text-center", className)}>
      <Loader2 aria-hidden="true" className="mb-3 size-8 animate-spin text-primary" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: StatusStateProps) {
  return (
    <Card className={cn("grid place-items-center py-10 text-center", className)}>
      <AlertTriangle aria-hidden="true" className="mb-3 size-8 text-danger" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
