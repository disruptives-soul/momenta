import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EventLink } from "@/features/analytics/components/event-link";
import type { MockCategory } from "../data/mock-categories";

type CategoryCardProps = {
  category: MockCategory;
};

export function CategoryCard({ category }: CategoryCardProps) {
  const isActive = category.status === "active";

  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {category.description}
          </p>
        </div>
        <Badge tone={isActive ? "free" : "neutral"}>
          {isActive ? "Activa" : "Próximamente"}
        </Badge>
      </div>
      {isActive ? (
        <EventLink
          className="text-sm font-medium text-primary"
          eventName="category_viewed"
          eventPayload={{ category: category.slug }}
          href={`/categories/${category.slug}`}
        >
          Ver categoría
        </EventLink>
      ) : (
          <p className="text-sm font-medium text-muted-foreground">
            Próximamente
          </p>
        )}
      </Card>
    );
}
