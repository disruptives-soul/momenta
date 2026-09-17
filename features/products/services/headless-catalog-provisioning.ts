import type { PublicCollection } from "@/features/collections/types/public-collection";
import { getRenderingTemplateForProduct } from "./product-catalog";

export type ProvisionableObject = {
  key: string;
  contentType: "application/json";
  body: Uint8Array;
};

const encoder = new TextEncoder();

function jsonObject(key: string, value: unknown): ProvisionableObject {
  return {
    key,
    contentType: "application/json",
    body: encoder.encode(JSON.stringify(value, null, 2)),
  };
}

export function getCollectionPrefix(collectionSlug: string) {
  return `collections/${collectionSlug}`;
}

export function getHeadlessCatalogObjects(
  collections: PublicCollection[],
): ProvisionableObject[] {
  return collections.flatMap((collection) => {
    const collectionPrefix = getCollectionPrefix(collection.slug);
    const collectionManifest = {
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      categorySlug: collection.categorySlug,
      categoryName: collection.categoryName,
      status: collection.status,
      tags: collection.tags,
      products: collection.products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        collectionSlug: product.collectionSlug,
        pieceTypeId: product.pieceTypeId,
        pieceTypeName: product.pieceTypeName,
        printProfileId: product.printProfileId,
        widthMm: product.widthMm,
        heightMm: product.heightMm,
        templateId: product.templateId,
        assets: product.assets,
      })),
    };
    const productObjects = collection.products.flatMap((product) => {
      if (!product.assets) {
        return [];
      }

      const productPrefix = product.assets.templateKey.replace(
        /\/template\.json$/,
        "",
      );
      const renderingTemplate = getRenderingTemplateForProduct(product);
      const productManifest = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        access: product.access,
        collectionId: product.collectionId,
        collectionSlug: product.collectionSlug,
        collectionName: product.collectionName,
        pieceTypeId: product.pieceTypeId,
        pieceTypeName: product.pieceTypeName,
        printProfileId: product.printProfileId,
        widthMm: product.widthMm,
        heightMm: product.heightMm,
        outputFormats: product.outputFormats,
        assets: product.assets,
        assetStatus: {
          master: "awaiting_upload",
          preview: "awaiting_generation_or_upload",
          fonts: "awaiting_real_fonts",
        },
      };
      const requiredAssets = {
        productId: product.id,
        productSlug: product.slug,
        collectionSlug: product.collectionSlug,
        required: [
          {
            kind: "master",
            key: product.assets.masterKey,
            contentType: "image/jpeg",
          },
          {
            kind: "preview",
            key: product.assets.previewKey,
            contentType: "image/webp",
          },
          {
            kind: "template",
            key: product.assets.templateKey,
            contentType: "application/json",
          },
        ],
      };

      return [
        jsonObject(`${productPrefix}/_product.json`, productManifest),
        jsonObject(`${productPrefix}/_assets-required.json`, requiredAssets),
        jsonObject(
          product.assets.templateKey,
          renderingTemplate ?? {
            status: "template_pending",
            productId: product.id,
            productSlug: product.slug,
            printProfileId: product.printProfileId,
          },
        ),
      ];
    });

    return [
      jsonObject(`${collectionPrefix}/_collection.json`, collectionManifest),
      ...productObjects,
    ];
  });
}
