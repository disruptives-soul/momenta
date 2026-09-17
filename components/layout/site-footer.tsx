"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./container";

export function SiteFooter() {
  const pathname = usePathname();

  if (
    pathname === "/collections/space-birthday/personalize" ||
    (pathname.startsWith("/products/") && pathname.endsWith("/personalize"))
  ) {
    return null;
  }

  return (
    <footer className="border-t border-border/45 bg-surface/70">
      <Container className="flex min-h-20 flex-wrap items-center justify-between gap-5 py-5 text-sm text-muted-foreground">
        <Link
          className="inline-flex items-center gap-2 font-serif font-semibold text-foreground"
          href="/"
        >
          <span className="grid size-7 place-items-center rounded-full bg-foreground text-xs font-sans text-primary-foreground">
            M
          </span>
          Momenta
        </Link>
        <nav className="flex flex-wrap gap-7">
          <Link href="/catalog?type=invitation">Invitaciones</Link>
          <Link href="/catalog?type=banner">Banners</Link>
          <Link href="/catalog?type=stickers">Stickers</Link>
          <Link href="/cart">Carrito</Link>
        </nav>
        <p>&copy; 2026 Momenta - Disenos para imprimir</p>
      </Container>
    </footer>
  );
}
