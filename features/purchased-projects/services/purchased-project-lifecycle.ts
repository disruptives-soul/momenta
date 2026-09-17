import type { CartSnapshot } from "@/features/cart/services/cart-storage";
import type {
  GeneratedVersion,
  PurchasedProject,
} from "../types/purchased-project";

export const DEMO_USER_ID = "demo-user";
export const editableWindowDays = 10;

function createClientId(prefix: string) {
  if (
    typeof window !== "undefined" &&
    "crypto" in window &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

export function isProjectEditable(project: PurchasedProject, now = new Date()) {
  return now <= new Date(project.editableUntil);
}

export function createPurchasedProjectFromCartSnapshot(
  snapshot: CartSnapshot,
  now = new Date(),
): PurchasedProject {
  const purchasedAt = now.toISOString();

  return {
    id: createClientId("pp"),
    userId: DEMO_USER_ID,
    productId: snapshot.product.id,
    templateId: snapshot.template.id,
    product: snapshot.product,
    template: snapshot.template,
    scene: snapshot.scene,
    purchasedAt,
    editableUntil: addDays(now, editableWindowDays).toISOString(),
    reactivationCount: 0,
    generatedVersions: [],
  };
}

export function reactivatePurchasedProject(
  project: PurchasedProject,
  now = new Date(),
): PurchasedProject {
  return {
    ...project,
    editableUntil: addDays(now, editableWindowDays).toISOString(),
    reactivationCount: project.reactivationCount + 1,
  };
}

export function addGeneratedVersion(
  project: PurchasedProject,
  fileName?: string,
  now = new Date(),
): PurchasedProject {
  const generatedVersion: GeneratedVersion = {
    id: createClientId("gv"),
    projectId: project.id,
    createdAt: now.toISOString(),
    fileName,
  };

  return {
    ...project,
    generatedVersions: [...project.generatedVersions, generatedVersion],
  };
}

export function formatEditableUntil(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
