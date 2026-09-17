import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PublicCollection } from "@/features/collections/types/public-collection";
import type { PrototypeProduct } from "../data/mock-products";

type CatalogProductManifest = {
  collection: {
    slug: string;
    name: string;
    description?: string;
  };
  product: {
    slug: string;
    name: string;
    description?: string;
    status?: CatalogStatus;
    pieceType: string;
    price: number;
    visualFormat: string;
    widthMm: number;
    heightMm: number;
    printProfileId: string;
    templateId: string;
    outputFormats?: Array<"png" | "pdf">;
    assets?: PrototypeProduct["assets"];
  };
  printProfile?: {
    id: string;
    label: string;
  };
  templateId?: string;
};

type SupabaseCatalogProductRow = {
  id: string;
  collection_slug: string;
  slug: string;
  name: string;
  piece_type: string;
  price: number;
  visual_format: string;
  width_mm: number;
  height_mm: number;
  print_profile_id: string;
  template_id: string;
  storage_provider: "local" | "local-file" | "r2";
  storage_keys: {
    masterKey: string;
    previewKey: string;
    templateKey: string;
  };
  product_payload?: {
    description?: string;
    status?: CatalogStatus;
  };
  print_profile_payload?: {
    label?: string;
  };
};

type CatalogStatus = "draft" | "needs_calibration" | "ready" | "published";

type HeadlessCatalogOptions = {
  includeUnpublished?: boolean;
};

type SupabaseCatalogCollectionRow = {
  slug: string;
  name: string;
  description?: string | null;
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

async function readSupabaseTable<T>(table: string, select = "*") {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(
    `${config.url}/rest/v1/${table}?select=${encodeURIComponent(select)}`,
    {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
      next: { revalidate: 30 },
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T[];
}

function getPieceTypeName(pieceType: string) {
  const names: Record<string, string> = {
    invitation: "Invitacion",
    stickers: "Stickers",
    banner: "Banner",
    backing: "Backing",
    card: "Tarjeta",
    menu: "Menu",
  };

  return names[pieceType] ?? pieceType;
}

function getPreviewAspect(widthMm: number, heightMm: number) {
  if (Math.abs(widthMm - heightMm) < 1) {
    return "square" as const;
  }

  return widthMm > heightMm ? ("landscape" as const) : ("portrait" as const);
}

function getPriceLabel(price: number) {
  return price > 0 ? `ARS ${price.toFixed(2)}` : undefined;
}

function normalizeStatus(status?: string): CatalogStatus {
  if (
    status === "draft" ||
    status === "needs_calibration" ||
    status === "ready" ||
    status === "published"
  ) {
    return status;
  }

  return "published";
}

export function isPublicProduct(product: PrototypeProduct) {
  return (
    product.catalogStatus === undefined ||
    product.catalogStatus === "ready" ||
    product.catalogStatus === "published"
  );
}

function mapManifestToProduct(manifest: CatalogProductManifest): PrototypeProduct {
  const collectionSlug = manifest.collection.slug;
  const product = manifest.product;
  const templateId = product.templateId ?? manifest.templateId;
  const pieceTypeName = getPieceTypeName(product.pieceType);
  const href = `/products/${product.slug}`;

  return {
    id: `${collectionSlug}:${product.slug}`,
    slug: product.slug,
    collectionId: `col_${collectionSlug}`,
    collectionSlug,
    collectionName: manifest.collection.name,
    collectionPieceId: `piece_${collectionSlug}_${product.slug}`,
    pieceTypeId: product.pieceType,
    pieceTypeName,
    printProfileId: product.printProfileId,
    name: product.name,
    description:
      product.description ??
      `${pieceTypeName} de la coleccion ${manifest.collection.name}.`,
    access: product.price > 0 ? "premium" : "free",
    priceLabel: getPriceLabel(product.price),
    widthMm: product.widthMm,
    heightMm: product.heightMm,
    templateId: templateId ?? `${collectionSlug}-${product.slug}-v1`,
    assets: product.assets,
    variables: [],
    outputFormats: product.outputFormats ?? ["png", "pdf"],
    catalogStatus: normalizeStatus(product.status),
    prototype: {
      behavior: "simulated",
      ctaLabel: "Ver producto",
      href,
      highlights: [
        product.visualFormat,
        "Sincronizado desde WordPress CMS",
        "Preparado para personalizacion",
      ],
      previewAlt: product.name,
      previewAspect: getPreviewAspect(product.widthMm, product.heightMm),
      previewSrc: "",
      visualFormat: product.visualFormat,
    },
  };
}

function mapSupabaseRowToProduct(
  row: SupabaseCatalogProductRow,
  collection?: SupabaseCatalogCollectionRow,
): PrototypeProduct {
  return mapManifestToProduct({
    collection: {
      slug: row.collection_slug,
      name: collection?.name ?? row.collection_slug,
      description: collection?.description ?? undefined,
    },
    product: {
      slug: row.slug,
      name: row.name,
      description: row.product_payload?.description,
      status: row.product_payload?.status,
      pieceType: row.piece_type,
      price: row.price,
      visualFormat: row.visual_format,
      widthMm: row.width_mm,
      heightMm: row.height_mm,
      printProfileId: row.print_profile_id,
      templateId: row.template_id,
      outputFormats: ["png", "pdf"],
      assets: {
        provider: row.storage_provider,
        masterKey: row.storage_keys.masterKey,
        previewKey: row.storage_keys.previewKey,
        templateKey: row.storage_keys.templateKey,
        generatedPrefix: `generated/${row.collection_slug}/${row.slug}`,
      },
    },
    printProfile: {
      id: row.print_profile_id,
      label: row.print_profile_payload?.label ?? row.print_profile_id,
    },
    templateId: row.template_id,
  });
}

async function findProductManifestFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);

      if (entry.isDirectory()) {
        return findProductManifestFiles(path);
      }

      return entry.name === "_product.json" ? [path] : [];
    }),
  );

  return files.flat();
}

async function listProductsFromLocalStorage() {
  const root = join(process.cwd(), "tmp", "storage", "collections");
  const files = await findProductManifestFiles(root);
  const manifests = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(file, "utf8");
      return JSON.parse(raw) as CatalogProductManifest;
    }),
  );

  return manifests.map(mapManifestToProduct);
}

async function listProductsFromSupabase() {
  const [productRows, collectionRows] = await Promise.all([
    readSupabaseTable<SupabaseCatalogProductRow>("momenta_catalog_products"),
    readSupabaseTable<SupabaseCatalogCollectionRow>("momenta_catalog_collections"),
  ]);

  if (!productRows) {
    return null;
  }

  const collectionsBySlug = new Map(
    (collectionRows ?? []).map((collection) => [collection.slug, collection]),
  );

  return productRows.map((row) =>
    mapSupabaseRowToProduct(row, collectionsBySlug.get(row.collection_slug)),
  );
}

function dedupeProducts(products: PrototypeProduct[]) {
  return Array.from(
    new Map(products.map((product) => [product.slug, product])).values(),
  );
}

export async function listHeadlessProducts(options: HeadlessCatalogOptions = {}) {
  const supabaseProducts = await listProductsFromSupabase();
  const filterProducts = (products: PrototypeProduct[]) =>
    options.includeUnpublished ? products : products.filter(isPublicProduct);

  if (supabaseProducts?.length) {
    return filterProducts(dedupeProducts(supabaseProducts));
  }

  return filterProducts(dedupeProducts(await listProductsFromLocalStorage()));
}

export async function getHeadlessProductBySlug(
  slug: string,
  options: HeadlessCatalogOptions = {},
) {
  const products = await listHeadlessProducts(options);

  return products.find((product) => product.slug === slug) ?? null;
}

export async function getHeadlessProductByTemplateId(
  templateId: string,
  options: HeadlessCatalogOptions = {},
) {
  const products = await listHeadlessProducts(options);

  return products.find((product) => product.templateId === templateId) ?? null;
}

export async function listHeadlessCollections(
  options: HeadlessCatalogOptions = {},
): Promise<PublicCollection[]> {
  const products = await listHeadlessProducts(options);
  const productsByCollection = new Map<string, PrototypeProduct[]>();

  products.forEach((product) => {
    const current = productsByCollection.get(product.collectionSlug) ?? [];
    current.push(product);
    productsByCollection.set(product.collectionSlug, current);
  });

  return Array.from(productsByCollection.entries()).map(([slug, items]) => {
    const first = items[0];

    return {
      id: `col_${slug}`,
      slug,
      name: first.collectionName,
      description: `${first.collectionName} sincronizada desde WordPress.`,
      categorySlug: "headless",
      categoryName: "Headless CMS",
      status: "published",
      tags: [],
      pieces: items.map((product) => ({
        id: product.collectionPieceId,
        collectionId: product.collectionId,
        pieceTypeId: product.pieceTypeId,
        productId: product.id,
        templateId: product.templateId,
        printProfileId: product.printProfileId,
        status: "published",
      })),
      products: items,
    };
  });
}
