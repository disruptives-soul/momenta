import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import type { Template } from "@/domain";
import {
  spaceInvitationProduct,
  spaceStickersPackProduct,
} from "@/features/products/data/mock-products";
import { LocalRenderProvider } from "@/features/rendering/services/local-render-provider";
import {
  renderPersonalizedInvitationPdf,
  renderPersonalizedTemplatesPdf,
} from "@/features/rendering/services/pdf-template-renderer";
import {
  getMasterAssetPath,
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

function getFileName(template: InvitationTemplate, format: RenderFormat) {
  return `${template.id}.${format}`;
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
  const master = await readFile(getMasterAssetPath(template));

  return `data:${template.master.contentType};base64,${master.toString("base64")}`;
}

async function svgToPng(svg: string) {
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

  throw error;
}

function renderFileResponse(
  body: BodyInit,
  template: InvitationTemplate,
  format: RenderFormat,
  contentType: string,
) {
  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${getFileName(template, format)}"`,
      "Content-Type": contentType,
    },
  });
}

function renderNamedFileResponse(
  body: BodyInit,
  fileName: string,
  contentType: string,
) {
  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": contentType,
    },
  });
}

function bytesToResponseBody(bytes: Uint8Array) {
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return body;
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

    let pdf: Uint8Array;

    try {
      pdf = await renderPersonalizedTemplatesPdf(
        templates.filter((item) => item !== null),
      );
    } catch (error) {
      return renderErrorResponse(error);
    }

    return renderNamedFileResponse(
      bytesToResponseBody(pdf),
      "momenta-space-birthday-templates.pdf",
      "application/pdf",
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

    try {
      pdf = await renderPersonalizedInvitationPdf(
        values,
        renderingTemplate,
        body.layout,
        body.scene,
      );
    } catch (error) {
      return renderErrorResponse(error);
    }

    return renderFileResponse(
      bytesToResponseBody(pdf),
      renderingTemplate,
      format,
      "application/pdf",
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
