"use client";

import type { TextElement } from "@/features/rendering/templates/template-types";

export type CartSnapshot = {
  id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    pieceTypeName: string;
    collectionSlug: string;
    collectionName: string;
    widthMm: number;
    heightMm: number;
    outputFormats: string[];
    priceLabel?: string;
    previewSrc?: string;
    previewAlt?: string;
    visualFormat?: string;
  };
  template: {
    id: string;
    printProfileId: string;
    widthMm: number;
    heightMm: number;
  };
  scene: TextElement[];
  createdAt: string;
};

export const cartStorageKey = "momenta:cart";
export const cartUpdatedEventName = "momenta:cart-updated";

function emitCartUpdated() {
  window.dispatchEvent(new Event(cartUpdatedEventName));
}

export function loadCartSnapshots() {
  if (typeof window === "undefined") {
    return [];
  }

  const current = window.sessionStorage.getItem(cartStorageKey);

  if (!current) {
    return [];
  }

  try {
    const parsed = JSON.parse(current);

    return Array.isArray(parsed) ? (parsed as CartSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveCartSnapshot(snapshot: CartSnapshot) {
  const items = loadCartSnapshots();

  window.sessionStorage.setItem(
    cartStorageKey,
    JSON.stringify([...items, snapshot]),
  );
  emitCartUpdated();
}

export function removeCartSnapshot(snapshotId: string) {
  const items = loadCartSnapshots().filter((item) => item.id !== snapshotId);

  window.sessionStorage.setItem(cartStorageKey, JSON.stringify(items));
  emitCartUpdated();
}

export function clearCartSnapshots() {
  window.sessionStorage.removeItem(cartStorageKey);
  emitCartUpdated();
}

export function getCartSnapshotCount() {
  return loadCartSnapshots().length;
}
