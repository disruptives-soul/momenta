import type { TextElement } from "@/features/rendering/templates/template-types";
import type { InvitationTemplate } from "@/features/rendering/templates/template-types";
import type {
  PurchasedProductSnapshot,
  PurchasedTemplateSnapshot,
} from "@/features/purchased-projects/types/purchased-project";

type SupabaseOrderItemInput = {
  id: string;
  productId: string;
  template: InvitationTemplate;
  productSnapshot?: PurchasedProductSnapshot;
  templateSnapshot?: PurchasedTemplateSnapshot;
  scene: TextElement[];
};

type SupabaseGeneratedFileInput = {
  id: string;
  orderItemId?: string | null;
  kind: "pdf" | "zip";
  storageKey: string;
  contentType: string;
};

type SupabaseOrderInput = {
  id: string;
  status?: string;
  totalCents?: number;
  currency?: string;
  items: SupabaseOrderItemInput[];
  generatedFiles: SupabaseGeneratedFileInput[];
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

function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

function getProductSnapshot(item: SupabaseOrderItemInput) {
  if (item.productSnapshot) {
    return item.productSnapshot;
  }

  return {
    id: item.productId,
    slug: item.template.productCode,
    name: item.template.productCode,
    pieceTypeName: item.template.productCode,
    collectionSlug: item.template.collectionSlug,
    collectionName: item.template.collectionSlug,
    widthMm: item.template.widthMm,
    heightMm: item.template.heightMm,
    outputFormats: ["pdf"],
    visualFormat: item.template.printProfile.label,
  };
}

function getTemplateSnapshot(item: SupabaseOrderItemInput) {
  if (item.templateSnapshot) {
    return item.templateSnapshot;
  }

  return {
    id: item.template.id,
    printProfileId: item.template.printProfile.id,
    widthMm: item.template.widthMm,
    heightMm: item.template.heightMm,
  };
}

async function upsertRows(table: string, rows: unknown[]) {
  if (rows.length === 0) {
    return;
  }

  const config = getSupabaseConfig();

  if (!config) {
    return;
  }

  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(
      `Supabase upsert failed for ${table}: ${response.status} ${await response.text()}`,
    );
  }
}

export async function saveRenderedOrderToSupabase(input: SupabaseOrderInput) {
  if (!isSupabaseConfigured()) {
    return { skipped: true as const };
  }

  await upsertRows("momenta_orders", [
    {
      id: input.id,
      status: input.status ?? "paid_demo",
      total_cents: input.totalCents ?? 0,
      currency: input.currency ?? "ARS",
    },
  ]);

  await upsertRows(
    "momenta_order_items",
    input.items.map((item) => ({
      id: item.id,
      order_id: input.id,
      product_id: item.productId,
      template_id: item.template.id,
      product_snapshot: getProductSnapshot(item),
      template_snapshot: getTemplateSnapshot(item),
      scene: item.scene,
    })),
  );

  await upsertRows(
    "momenta_generated_files",
    input.generatedFiles.map((file) => ({
      id: file.id,
      order_id: input.id,
      order_item_id: file.orderItemId ?? null,
      kind: file.kind,
      storage_provider: "r2",
      storage_key: file.storageKey,
      content_type: file.contentType,
    })),
  );

  return { skipped: false as const };
}
