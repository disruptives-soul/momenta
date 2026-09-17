import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { Template } from "@/domain";
import {
  spaceInvitationProduct,
  spaceStickersPackProduct,
} from "@/features/products/data/mock-products";
import { saveRenderedOrderToSupabase } from "@/infrastructure/supabase/supabase-order-repository";
import { createStorageProvider } from "@/infrastructure/storage/storage-provider-factory";
import { LocalRenderProvider } from "@/features/rendering/services/local-render-provider";
import { renderPersonalizedInvitationPdf } from "@/features/rendering/services/pdf-template-renderer";
import { createZip } from "@/features/rendering/services/zip-writer";
import {
  loadOriginalMasterJpgBytes,
  TemplatePrintProfileError,
} from "@/features/rendering/templates/load-runtime-template";
import { getRenderingTemplate } from "@/features/rendering/templates/template-registry";
import type { InvitationTemplate } from "@/features/rendering/templates/template-types";
import type {
  PersonalizationLayoutOverrides,
  PersonalizationValues,
} from "@/features/personalization/types/personalization-draft";
import type { TextElement } from "@/features/rendering/templates/template-types";

export const runtime = "nodejs";

type RenderRequestBody = {
  templateId?: string;
  format?: RenderFormat;
  data?: Partial<PersonalizationValues>;
  layout?: PersonalizationLayoutOverrides;
  scene?: TextElement[];
  orderId?: string;
  templates?: RenderTemplateRequest[];
};

type RenderTemplateRequest = {
  templateId?: string;
  data?: Partial<PersonalizationValues>;
  layout?: PersonalizationLayoutOverrides;
  scene?: TextElement[];
};

type RenderFormat = "pdf" | "png" | "svg";

function getRenderFormat(request: Request, body: RenderRequestBody): RenderFormat | null {
  const format =
    new URL(request.url).searchParams.get("format") ?? body.format ?? "pdf";

  if (format === "pdf" || format === "png" || format === "svg") {
    return format;
  }

  return null;
}

function getPieceFileSlug(template: InvitationTemplate) {
  if (template.productCode === "essential-invitation") return "invitation";
  if (template.productCode === "stickers-pack") return "stickers";
  if (template.productCode.includes("banner")) return "banner";
  if (template.productCode.includes("backing")) return "backing";

  return template.productCode;
}

function getPrintSizeSlug(template: InvitationTemplate) {
  if (template.printProfile.id.includes("a3")) return "a3";
  if (template.printProfile.id.includes("2x1")) return "2x1m";
  if (template.printProfile.id.includes("1x1")) return "1x1m";

  return template.printProfile.id;
}

function getProductPdfFileName(template: InvitationTemplate) {
  return [
    template.collectionSlug,
    getPieceFileSlug(template),
    getPrintSizeSlug(template),
  ].join("-") + ".pdf";
}

function getFileName(template: InvitationTemplate, format: RenderFormat) {
  if (format === "pdf") {
    return getProductPdfFileName(template);
  }

  return `${template.id}.${format}`;
}

function getProductsZipFileName(templates: InvitationTemplate[]) {
  const collectionSlugs = new Set(
    templates.map((template) => template.collectionSlug),
  );

  if (collectionSlugs.size === 1) {
    return `momenta-${templates[0].collectionSlug}.zip`;
  }

  const shortId = createHash("sha1")
    .update(templates.map((template) => template.id).sort().join("|"))
    .digest("hex")
    .slice(0, 8);

  return `momenta-files-${shortId}.zip`;
}

function sanitizeStorageSegment(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || `order-${Date.now()}`
  );
}

function getGeneratedOrderPrefix(orderId: string) {
  return `generated/orders/${sanitizeStorageSegment(orderId)}`;
}

function createStableId(parts: string[]) {
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
}

async function storeGeneratedObject(input: {
  orderId?: string;
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  if (!input.orderId) {
    return null;
  }

  await createStorageProvider().putObject({
    key: `${getGeneratedOrderPrefix(input.orderId)}/${input.key}`,
    body: input.body,
    contentType: input.contentType,
  });

  return `${getGeneratedOrderPrefix(input.orderId)}/${input.key}`;
}

function getUniqueZipFileName(fileName: string, usedFileNames: Set<string>) {
  if (!usedFileNames.has(fileName)) {
    usedFileNames.add(fileName);
    return fileName;
  }

  const extensionIndex = fileName.lastIndexOf(".");
  const baseName =
    extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : "";
  let copyIndex = 2;
  let nextFileName = `${baseName}-${copyIndex}${extension}`;

  while (usedFileNames.has(nextFileName)) {
    copyIndex += 1;
    nextFileName = `${baseName}-${copyIndex}${extension}`;
  }

  usedFileNames.add(nextFileName);
  return nextFileName;
}

function normalizeData(data: RenderRequestBody["data"]): PersonalizationValues {
  return Object.fromEntries(
    Object.entries(data ?? {}).map(([key, value]) => [
      key,
      typeof value === "string" ? value : "",
    ]),
  );
}

async function loadMasterDataUri(template: InvitationTemplate) {
  const master = await loadOriginalMasterJpgBytes(template);

  return `data:${template.master.contentType};base64,${master.toString("base64")}`;
}

async function svgToPng(svg: string) {
  const { default: sharp } = await import("sharp");

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function renderErrorResponse(error: unknown) {
  if (error instanceof TemplatePrintProfileError) {
    return NextResponse.json(
      {
        error: error.message,
        diagnostics: error.diagnostics,
      },
      { status: 422 },
    );
  }

  console.error("Render failed.", error);

  return NextResponse.json(
    {
      error: "Render failed.",
      detail:
        process.env.NODE_ENV === "production"
          ? undefined
          : error instanceof Error
            ? error.message
            : String(error),
    },
    { status: 500 },
  );
}

function renderFileResponse(
  body: BodyInit,
  template: InvitationTemplate,
  format: RenderFormat,
  contentType: string,
  headers?: HeadersInit,
) {
  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${getFileName(template, format)}"`,
      "Content-Type": contentType,
      ...headers,
    },
  });
}

function renderNamedFileResponse(
  body: BodyInit,
  fileName: string,
  contentType: string,
  headers?: HeadersInit,
) {
  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": contentType,
      ...headers,
    },
  });
}

function bytesToResponseBody(bytes: Uint8Array) {
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return body;
}

async function saveRenderedOrderMetadata(input: {
  orderId?: string;
  items: Array<{
    itemId: string;
    productId: string;
    template: InvitationTemplate;
    scene: TextElement[];
  }>;
  generatedFiles: Array<{
    id: string;
    orderItemId?: string | null;
    kind: "pdf" | "zip";
    storageKey: string;
    contentType: string;
  }>;
}) {
  if (!input.orderId) {
    return null;
  }

  try {
    return await saveRenderedOrderToSupabase({
      id: sanitizeStorageSegment(input.orderId),
      items: input.items.map((item) => ({
        id: item.itemId,
        productId: item.productId,
        template: item.template,
        scene: item.scene,
      })),
      generatedFiles: input.generatedFiles,
    });
  } catch (error) {
    console.error("Supabase order metadata save failed.", error);

    return null;
  }
}

export async function POST(request: Request) {
  let body: RenderRequestBody;

  try {
    body = (await request.json()) as RenderRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const format = getRenderFormat(request, body);

  if (!format) {
    return NextResponse.json(
      { error: "Unsupported format. Use pdf, png or svg." },
      { status: 400 },
    );
  }

  if (body.templates?.length) {
    if (format !== "pdf") {
      return NextResponse.json(
        { error: "Batch render only supports pdf." },
        { status: 400 },
      );
    }

    const templates = body.templates.map((item) => {
      if (!item.templateId) {
        return null;
      }

      const template = getRenderingTemplate(item.templateId);

      if (!template) {
        return null;
      }

      return {
        values: normalizeData(item.data),
        template,
        layout: item.layout,
        scene: item.scene,
      };
    });

    if (templates.some((item) => item === null)) {
      return NextResponse.json(
        { error: "Every batch template needs a valid templateId." },
        { status: 400 },
      );
    }

    const validTemplates = templates.filter((item) => item !== null);

    let zip: Uint8Array;
    let zipStorageKey: string | null = null;
    let pdfStorageKeys: string[] = [];
    const orderItemMetadata: Array<{
      itemId: string;
      productId: string;
      template: InvitationTemplate;
      scene: TextElement[];
    }> = [];
    const generatedFilesMetadata: Array<{
      id: string;
      orderItemId?: string | null;
      kind: "pdf" | "zip";
      storageKey: string;
      contentType: string;
    }> = [];
    let supabaseSaved = false;
    let zipFileName = "";

    try {
      const usedFileNames = new Set<string>();
      const pdfFiles = await Promise.all(
        validTemplates.map(async (item, index) => {
          const fileName = getUniqueZipFileName(
            getProductPdfFileName(item.template),
            usedFileNames,
          );
          const orderItemId = body.orderId
            ? `item_${createStableId([
                sanitizeStorageSegment(body.orderId),
                item.template.id,
                String(index),
              ])}`
            : null;
          const productId = `${item.template.collectionSlug}:${item.template.productCode}`;

          if (orderItemId) {
            orderItemMetadata.push({
              itemId: orderItemId,
              productId,
              template: item.template,
              scene: item.scene ?? [],
            });
          }

          return {
            name: fileName,
            orderItemId,
            bytes: await renderPersonalizedInvitationPdf(
              item.values,
              item.template,
              item.layout,
              item.scene,
            ),
          };
        }),
      );

      if (body.orderId) {
        const orderId = body.orderId;

        pdfStorageKeys = (
          await Promise.all(
            pdfFiles.map(async (file) => {
              const storageKey = await storeGeneratedObject({
                orderId,
                key: `pdfs/${file.name}`,
                body: file.bytes,
                contentType: "application/pdf",
              });

              if (storageKey) {
                generatedFilesMetadata.push({
                  id: `file_${createStableId([
                    sanitizeStorageSegment(orderId),
                    storageKey,
                  ])}`,
                  orderItemId: file.orderItemId,
                  kind: "pdf",
                  storageKey,
                  contentType: "application/pdf",
                });
              }

              return storageKey;
            }),
          )
        ).filter((key) => key !== null);
      }

      zip = createZip(pdfFiles);
      zipFileName = getProductsZipFileName(
        validTemplates.map((item) => item.template),
      );
      zipStorageKey = await storeGeneratedObject({
        orderId: body.orderId,
        key: zipFileName,
        body: zip,
        contentType: "application/zip",
      });
      if (zipStorageKey && body.orderId) {
        generatedFilesMetadata.push({
          id: `file_${createStableId([
            sanitizeStorageSegment(body.orderId),
            zipStorageKey,
          ])}`,
          orderItemId: null,
          kind: "zip",
          storageKey: zipStorageKey,
          contentType: "application/zip",
        });
      }
      const metadataResult = await saveRenderedOrderMetadata({
        orderId: body.orderId,
        items: orderItemMetadata,
        generatedFiles: generatedFilesMetadata,
      });
      supabaseSaved = metadataResult?.skipped === false;
    } catch (error) {
      return renderErrorResponse(error);
    }

    return renderNamedFileResponse(
      bytesToResponseBody(zip),
      zipFileName,
      "application/zip",
      {
        ...(zipStorageKey
          ? { "X-Momenta-Generated-Zip-Key": zipStorageKey }
          : {}),
        ...(pdfStorageKeys.length
          ? { "X-Momenta-Generated-Pdf-Keys": pdfStorageKeys.join(",") }
          : {}),
        ...(supabaseSaved ? { "X-Momenta-Supabase-Saved": "true" } : {}),
      },
    );
  }

  if (!body.templateId) {
    return NextResponse.json(
      { error: "templateId is required." },
      { status: 400 },
    );
  }

  const renderingTemplate = getRenderingTemplate(body.templateId);

  if (!renderingTemplate) {
    return NextResponse.json(
      { error: "Unknown templateId." },
      { status: 404 },
    );
  }

  const values = normalizeData(body.data);

  if (format === "pdf") {
    let pdf: Uint8Array;
    let storageKey: string | null = null;
    let supabaseSaved = false;

    try {
      pdf = await renderPersonalizedInvitationPdf(
        values,
        renderingTemplate,
        body.layout,
        body.scene,
      );
      storageKey = await storeGeneratedObject({
        orderId: body.orderId,
        key: getProductPdfFileName(renderingTemplate),
        body: pdf,
        contentType: "application/pdf",
      });
      if (storageKey && body.orderId) {
        const orderItemId = `item_${createStableId([
          sanitizeStorageSegment(body.orderId),
          renderingTemplate.id,
          "0",
        ])}`;
        const result = await saveRenderedOrderMetadata({
          orderId: body.orderId,
          items: [
            {
              itemId: orderItemId,
              productId: `${renderingTemplate.collectionSlug}:${renderingTemplate.productCode}`,
              template: renderingTemplate,
              scene: body.scene ?? [],
            },
          ],
          generatedFiles: [
            {
              id: `file_${createStableId([
                sanitizeStorageSegment(body.orderId),
                storageKey,
              ])}`,
              orderItemId,
              kind: "pdf",
              storageKey,
              contentType: "application/pdf",
            },
          ],
        });

        supabaseSaved = result?.skipped === false;
      }
    } catch (error) {
      return renderErrorResponse(error);
    }

    return renderFileResponse(
      bytesToResponseBody(pdf),
      renderingTemplate,
      format,
      "application/pdf",
      {
        ...(storageKey ? { "X-Momenta-Generated-Key": storageKey } : {}),
        ...(supabaseSaved ? { "X-Momenta-Supabase-Saved": "true" } : {}),
      },
    );
  }

  const artworkHref = await loadMasterDataUri(renderingTemplate);
  const renderer = new LocalRenderProvider({
    artworkHref,
    layout: body.layout,
    scene: body.scene,
    template: renderingTemplate,
  });
  const product =
    renderingTemplate.productCode === "stickers-pack"
      ? spaceStickersPackProduct
      : spaceInvitationProduct;
  const template: Template = {
    id: renderingTemplate.id,
    productId: product.id,
    assetId: `asset_${renderingTemplate.id}`,
    version: 1,
    variables: product.variables,
  };
  const output = await renderer.render({
    product,
    template,
    variables: values,
  });

  if (format === "svg") {
    return renderFileResponse(
      output.svg,
      renderingTemplate,
      format,
      "image/svg+xml; charset=utf-8",
    );
  }

  const png = await svgToPng(output.svg);

  return renderFileResponse(png, renderingTemplate, format, "image/png");
}
