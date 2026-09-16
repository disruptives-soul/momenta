"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Container } from "./container";

const navigation = [
  { href: "/catalog?type=invitation", label: "Invitaciones" },
  { href: "/catalog?type=banner", label: "Flyers" },
  { href: "/catalog?type=stickers", label: "Stickers" },
  { href: "/collections/space-birthday", label: "Temas" },
];

export function SiteHeader() {
  const pathname = usePathname();

  if (
    pathname === "/collections/space-birthday/personalize" ||
    (pathname.startsWith("/products/") && pathname.endsWith("/personalize"))
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-surface/86 backdrop-blur-xl">
      <Container className="flex min-h-14 items-center justify-between gap-4">
        <Link className="inline-flex items-center gap-2 font-semibold" href="/">
          <span className="grid size-7 place-items-center rounded-full bg-foreground text-xs font-semibold text-primary-foreground">
            M
          </span>
          <span>Momenta</span>
        </Link>

        <nav aria-label="Navegacion principal" className="hidden gap-8 md:flex">
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

        <Link
          className="inline-flex h-8 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold shadow-sm"
          href="/projects/demo-space-birthday/review"
        >
          <ShoppingBag aria-hidden="true" className="size-4" />
          Carrito
          <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
            0
          </span>
        </Link>
      </Container>
    </header>
  );
}
