"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

type SaveProductButtonProps = {
  productSlug: string;
};

const savedProductsStorageKey = "momenta:saved-products";

function loadSavedProducts() {
  const current = window.sessionStorage.getItem(savedProductsStorageKey);

  if (!current) {
    return [];
  }

  try {
    const parsed = JSON.parse(current);

    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function SaveProductButton({ productSlug }: SaveProductButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    window.queueMicrotask(() => {
      setIsSaved(loadSavedProducts().includes(productSlug));
    });
  }, [productSlug]);

  function toggleSaved() {
    const savedProducts = loadSavedProducts();
    const nextSavedProducts = savedProducts.includes(productSlug)
      ? savedProducts.filter((slug) => slug !== productSlug)
      : [...savedProducts, productSlug];

    window.sessionStorage.setItem(
      savedProductsStorageKey,
      JSON.stringify(nextSavedProducts),
    );
    setIsSaved(nextSavedProducts.includes(productSlug));
  }

  return (
    <Button
      aria-pressed={isSaved}
      className="rounded-full bg-white px-6"
      onClick={toggleSaved}
      type="button"
      variant="secondary"
    >
      <Bookmark aria-hidden="true" />
      {isSaved ? "Guardado" : "Guardar"}
    </Button>
  );
}
