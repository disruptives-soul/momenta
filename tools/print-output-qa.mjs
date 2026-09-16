import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const requireFonts = process.argv.includes("--require-fonts");
const endpoint =
  process.env.MOMENTA_RENDER_ENDPOINT ?? "http://localhost:3000/api/render";

const templates = [
  {
    id: "space-birthday-invitation-v1",
    masterPath:
      "features/rendering/assets/space-birthday/invitation/INVITACION A3.jpg",
    widthMm: 297,
    heightMm: 420,
    designMasterPpi: 300,
    expectedPdfName: "space-birthday-invitation-a3.pdf",
  },
  {
    id: "sunday-in-bloom-stickers-a3-v1",
    masterPath:
      "features/rendering/assets/space-birthday/invitation/STICKERS A3.jpg",
    widthMm: 297,
    heightMm: 420,
    designMasterPpi: 300,
    expectedPdfName: "space-birthday-stickers-a3.pdf",
  },
  {
    id: "sunday-in-bloom-banner-2x1-v1",
    masterPath:
      "features/rendering/assets/space-birthday/invitation/BANNER 2mx1m-150.jpg",
    widthMm: 2000,
    heightMm: 1000,
    designMasterPpi: 150,
    expectedPdfName: "space-birthday-banner-2x1m.pdf",
  },
  {
    id: "sunday-in-bloom-backing-1x1-v1",
    masterPath:
      "features/rendering/assets/space-birthday/invitation/BACKING 1mx1m-150.jpg",
    widthMm: 1000,
    heightMm: 1000,
    designMasterPpi: 150,
    expectedPdfName: "space-birthday-backing-1x1m.pdf",
  },
];

function mmToPt(mm) {
  return (mm / 25.4) * 72;
}

function mmToInches(mm) {
  return mm / 25.4;
}

function roughlyEqual(actual, expected, tolerance = 0.75) {
  return Math.abs(actual - expected) <= tolerance;
}

function readUInt32LE(bytes, offset) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function readUInt16LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function parseStoredZipEntries(bytes) {
  const entries = [];
  let offset = 0;

  while (offset + 30 <= bytes.length) {
    const signature = readUInt32LE(bytes, offset);

    if (signature !== 0x04034b50) {
      break;
    }

    const compressionMethod = readUInt16LE(bytes, offset + 8);
    const compressedSize = readUInt32LE(bytes, offset + 18);
    const fileNameLength = readUInt16LE(bytes, offset + 26);
    const extraLength = readUInt16LE(bytes, offset + 28);
    const fileNameStart = offset + 30;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = new TextDecoder().decode(
      bytes.slice(fileNameStart, fileNameEnd),
    );
    const dataStart = fileNameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (compressionMethod !== 0) {
      throw new Error(`ZIP entry ${fileName} is compressed; QA parser expects stored entries.`);
    }

    entries.push({
      name: fileName,
      bytes: bytes.slice(dataStart, dataEnd),
    });

    offset = dataEnd;
  }

  return entries;
}

async function listFontFiles(directory) {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFontFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && /\.(ttf|otf|woff|woff2)$/i.test(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

async function auditFonts() {
  const fontFiles = await listFontFiles(
    join(process.cwd(), "features", "rendering", "assets"),
  );

  if (fontFiles.length === 0) {
    const message =
      "BLOCKED fonts: no real .ttf/.otf/.woff/.woff2 assets found under features/rendering/assets.";

    if (requireFonts) {
      throw new Error(message);
    }

    console.warn(message);
    return false;
  }

  console.log(`Fonts OK: ${fontFiles.length} font asset(s) found.`);
  return true;
}

async function auditPrintProfiles() {
  for (const template of templates) {
    const metadata = await sharp(join(process.cwd(), template.masterPath)).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const effectivePpiX = width / mmToInches(template.widthMm);
    const effectivePpiY = height / mmToInches(template.heightMm);
    const effectivePpi = Math.min(effectivePpiX, effectivePpiY);

    if (effectivePpi + 1 < template.designMasterPpi) {
      throw new Error(
        `${template.id} effective PPI ${effectivePpi.toFixed(1)} is below ${template.designMasterPpi}.`,
      );
    }

    console.log(
      `PPI OK: ${template.id} ${width}x${height}px -> ${effectivePpi.toFixed(1)} effective PPI.`,
    );
  }
}

async function auditColorPipelineSource() {
  const source = await readFile(
    join(process.cwd(), "features/rendering/services/pdf-template-renderer.ts"),
    "utf8",
  );

  const forbiddenPatterns = [
    ["sharp() inside PDF renderer", /\bsharp\s*\(/],
    ["PNG encoding inside PDF renderer", /\.png\s*\(/],
    ["JPEG re-encoding inside PDF renderer", /\.jpeg\s*\(/],
    ["format conversion inside PDF renderer", /\.toFormat\s*\(/],
    ["PNG embedding inside PDF renderer", /\.embedPng\s*\(/],
  ];

  for (const [label, pattern] of forbiddenPatterns) {
    if (pattern.test(source)) {
      throw new Error(`${label} found.`);
    }
  }

  if (!/loadOriginalMasterJpgBytes/.test(source) || !/\.embedJpg\s*\(/.test(source)) {
    throw new Error("PDF renderer must embed original JPG bytes with embedJpg().");
  }

  console.log("Color pipeline source OK: PDF embeds original JPG bytes directly.");
}

async function requestZip() {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      format: "pdf",
      templates: templates.map((template) => ({
        templateId: template.id,
        data: {},
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Render endpoint failed: ${response.status} ${await response.text()}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const disposition = response.headers.get("content-disposition") ?? "";

  if (!contentType.includes("application/zip")) {
    throw new Error(`Expected application/zip; received ${contentType}.`);
  }

  if (!/filename="momenta-space-birthday\.zip"/.test(disposition)) {
    throw new Error(`Unexpected ZIP filename header: ${disposition}.`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function requestDuplicateProductZip() {
  const duplicateTemplate = templates[0];
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      format: "pdf",
      templates: [
        { templateId: duplicateTemplate.id, data: {} },
        { templateId: duplicateTemplate.id, data: {} },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Duplicate render endpoint failed: ${response.status} ${await response.text()}`,
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function auditZipAndPdfs(zipBytes) {
  const entries = parseStoredZipEntries(zipBytes);
  const entryNames = entries.map((entry) => entry.name);
  const uniqueEntryNames = new Set(entryNames);
  const expectedNames = templates.map((template) => template.expectedPdfName);

  if (entryNames.length !== uniqueEntryNames.size) {
    throw new Error(`ZIP contains duplicate filenames: ${entryNames.join(", ")}.`);
  }

  for (const expectedName of expectedNames) {
    if (!uniqueEntryNames.has(expectedName)) {
      throw new Error(`ZIP is missing ${expectedName}. Found: ${entryNames.join(", ")}.`);
    }
  }

  console.log(`ZIP OK: ${entries.length} unique PDF file(s): ${entryNames.join(", ")}.`);

  for (const template of templates) {
    const entry = entries.find((item) => item.name === template.expectedPdfName);

    if (!entry) {
      throw new Error(`Missing PDF ${template.expectedPdfName}.`);
    }

    const pdf = await PDFDocument.load(entry.bytes);
    const pages = pdf.getPages();

    if (pages.length < 2) {
      throw new Error(`${entry.name} must include design page + A4 instruction page.`);
    }

    const firstPage = pages[0];
    const expectedWidthPt = mmToPt(template.widthMm);
    const expectedHeightPt = mmToPt(template.heightMm);

    if (
      !roughlyEqual(firstPage.getWidth(), expectedWidthPt) ||
      !roughlyEqual(firstPage.getHeight(), expectedHeightPt)
    ) {
      throw new Error(
        `${entry.name} page 1 size ${firstPage.getWidth().toFixed(2)}x${firstPage
          .getHeight()
          .toFixed(2)}pt does not match ${template.widthMm}x${template.heightMm}mm.`,
      );
    }

    console.log(
      `PDF OK: ${entry.name} page 1 ${template.widthMm}x${template.heightMm}mm, page 2 instructions present.`,
    );
  }
}

async function auditDuplicateZipNaming(zipBytes) {
  const entries = parseStoredZipEntries(zipBytes);
  const entryNames = entries.map((entry) => entry.name);

  if (
    !entryNames.includes("space-birthday-invitation-a3.pdf") ||
    !entryNames.includes("space-birthday-invitation-a3-2.pdf")
  ) {
    throw new Error(
      `Duplicate product ZIP naming failed. Found: ${entryNames.join(", ")}.`,
    );
  }

  console.log(
    `ZIP duplicate naming OK: ${entryNames.join(", ")}.`,
  );
}

console.log("Starting Momenta Print Output QA...");
const fontsReady = await auditFonts();
await auditPrintProfiles();
await auditColorPipelineSource();
const zipBytes = await requestZip();
await auditZipAndPdfs(zipBytes);
const duplicateZipBytes = await requestDuplicateProductZip();
await auditDuplicateZipNaming(duplicateZipBytes);

if (!fontsReady) {
  console.warn(
    "Print Output QA completed with a production blocker: real fonts are still missing.",
  );
} else {
  console.log("Print Output QA completed.");
}
