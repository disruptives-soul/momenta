"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBag, UserCircle } from "lucide-react";
import {
  cartUpdatedEventName,
  getCartSnapshotCount,
} from "@/features/cart/services/cart-storage";
import { Container } from "./container";

const navigation = [
  { href: "/catalog?type=invitation", label: "Invitaciones" },
  { href: "/catalog?type=banner", label: "Banners" },
  { href: "/catalog?type=stickers", label: "Stickers" },
  { href: "/collections/space-birthday", label: "Temas" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getCartSnapshotCount());
    }

    syncCartCount();
    window.addEventListener("storage", syncCartCount);
    window.addEventListener(cartUpdatedEventName, syncCartCount);

    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener(cartUpdatedEventName, syncCartCount);
    };
  }, []);

  if (
    pathname === "/collections/space-birthday/personalize" ||
    (pathname.startsWith("/products/") && pathname.endsWith("/personalize")) ||
    (pathname.startsWith("/account/designs/") && pathname.endsWith("/edit"))
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/45 bg-surface/82 backdrop-blur-xl">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2.5 font-serif text-lg font-semibold"
          href="/"
        >
          <span className="grid size-8 place-items-center rounded-full bg-foreground text-xs font-semibold text-primary-foreground">
            M
          </span>
          <span>Momenta</span>
        </Link>

        <nav aria-label="Navegacion principal" className="hidden gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            className="hidden h-9 items-center rounded-full bg-surface px-4 text-sm font-semibold shadow-sm transition hover:bg-muted md:inline-flex"
            href="/account/designs"
          >
            Mis disenos
          </Link>
          <Link
            className="inline-flex h-9 items-center gap-2 rounded-full bg-surface px-3 text-sm font-semibold shadow-sm transition hover:bg-muted"
            href="/cart"
          >
            <ShoppingBag aria-hidden="true" className="size-4" />
            Carrito
            <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
              {cartCount}
            </span>
          </Link>
          <Link
            aria-label="Mis disenos"
            className="hidden size-9 place-items-center rounded-full bg-foreground text-primary-foreground shadow-sm lg:grid"
            href="/account/designs"
          >
            <UserCircle aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </Container>
    </header>
  );
}
