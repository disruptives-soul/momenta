import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type CTASectionProps = {
  title: string;
  description: string;
  action: ReactNode;
};

export function CTASection({ title, description, action }: CTASectionProps) {
  return (
    <Card className="grid gap-5 bg-surface-strong md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div>{action}</div>
    </Card>
  );
}
