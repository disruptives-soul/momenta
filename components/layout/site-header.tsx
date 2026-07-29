import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./container";

const navigation = [
  { href: "/catalog", label: "Catálogo" },
  { href: "/categories/childrens-birthdays", label: "Cumpleaños" },
  { href: "/collections/space-birthday", label: "Space Birthday" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <Link className="inline-flex items-center gap-2 font-semibold" href="/">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          <span>Momenta</span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden gap-5 md:flex">
          {navigation.map((item) => (
            <Link
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="sm" variant="secondary">
          <Link href="/collections/space-birthday/personalize">Probar</Link>
        </Button>
      </Container>
    </header>
  );
}
