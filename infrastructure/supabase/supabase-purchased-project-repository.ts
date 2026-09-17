import {
  addDays,
  DEMO_USER_ID,
  editableWindowDays,
} from "@/features/purchased-projects/services/purchased-project-lifecycle";
import type {
  GeneratedVersion,
  PurchasedProductSnapshot,
  PurchasedProject,
  PurchasedTemplateSnapshot,
} from "@/features/purchased-projects/types/purchased-project";
import type { TextElement } from "@/features/rendering/templates/template-types";

type SupabaseOrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  template_id: string;
  product_snapshot: PurchasedProductSnapshot;
  template_snapshot: PurchasedTemplateSnapshot;
  scene: TextElement[];
  editable_until?: string | null;
  reactivation_count?: number | null;
  created_at: string;
};

type SupabaseGeneratedFileRow = {
  id: string;
  order_id: string;
  order_item_id: string | null;
  kind: "pdf" | "zip";
  storage_key: string;
  content_type: string;
  created_at: string;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

async function selectRows<T>(path: string): Promise<T[]> {
  const config = getSupabaseConfig();

  if (!config) {
    return [];
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Supabase select failed for ${path}: ${response.status} ${await response.text()}`,
    );
  }

  return (await response.json()) as T[];
}

function getGeneratedVersions(
  item: SupabaseOrderItemRow,
  files: SupabaseGeneratedFileRow[],
): GeneratedVersion[] {
  return files
    .filter((file) => file.order_item_id === item.id)
    .map((file) => ({
      id: file.id,
      projectId: item.id,
      createdAt: file.created_at,
      fileName: file.storage_key.split("/").pop(),
      storageKey: file.storage_key,
    }));
}

function toPurchasedProject(
  item: SupabaseOrderItemRow,
  files: SupabaseGeneratedFileRow[],
): PurchasedProject {
  const purchasedAt = item.created_at;

  return {
    id: item.id,
    userId: DEMO_USER_ID,
    orderId: item.order_id,
    productId: item.product_id,
    templateId: item.template_id,
    product: item.product_snapshot,
    template: item.template_snapshot,
    scene: item.scene,
    purchasedAt,
    editableUntil:
      item.editable_until ??
      addDays(new Date(purchasedAt), editableWindowDays).toISOString(),
    reactivationCount: item.reactivation_count ?? 0,
    generatedVersions: getGeneratedVersions(item, files),
  };
}

export async function listPurchasedProjectsFromSupabase() {
  const [items, files] = await Promise.all([
    selectRows<SupabaseOrderItemRow>(
      "momenta_order_items?select=*&order=created_at.desc",
    ),
    selectRows<SupabaseGeneratedFileRow>(
      "momenta_generated_files?select=*&order=created_at.asc",
    ),
  ]);

  return items.map((item) => toPurchasedProject(item, files));
}

export async function getPurchasedProjectFromSupabase(projectId: string) {
  const [items, files] = await Promise.all([
    selectRows<SupabaseOrderItemRow>(
      `momenta_order_items?select=*&id=eq.${encodeURIComponent(projectId)}&limit=1`,
    ),
    selectRows<SupabaseGeneratedFileRow>(
      "momenta_generated_files?select=*&order=created_at.asc",
    ),
  ]);

  const item = items[0];

  return item ? toPurchasedProject(item, files) : null;
}

async function patchPurchasedProjectInSupabase(
  projectId: string,
  patch: Record<string, unknown>,
) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(
    `${config.url}/rest/v1/momenta_order_items?id=eq.${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Supabase update failed for purchased project ${projectId}: ${response.status} ${await response.text()}`,
    );
  }

  return getPurchasedProjectFromSupabase(projectId);
}

export async function updatePurchasedProjectInSupabase(input: {
  projectId: string;
  scene: TextElement[];
  editableUntil?: string;
  reactivationCount?: number;
}) {
  try {
    return await patchPurchasedProjectInSupabase(input.projectId, {
      scene: input.scene,
      editable_until: input.editableUntil,
      reactivation_count: input.reactivationCount,
    });
  } catch (error) {
    if (
      input.editableUntil === undefined &&
      input.reactivationCount === undefined
    ) {
      throw error;
    }

    return patchPurchasedProjectInSupabase(input.projectId, {
      scene: input.scene,
    });
  }
}
