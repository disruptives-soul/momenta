import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const templates = {
  "space-birthday-invitation-v1": {
    masterPath:
      "features/rendering/assets/space-birthday/invitation/INVITACION A3.jpg",
    widthMm: 297,
    heightMm: 420,
  },
  "sunday-in-bloom-stickers-a3-v1": {
    masterPath:
      "features/rendering/assets/space-birthday/invitation/STICKERS A3.jpg",
    widthMm: 297,
    heightMm: 420,
  },
  "sunday-in-bloom-banner-2x1-v1": {
    masterPath:
      "features/rendering/assets/space-birthday/invitation/BANNER 2mx1m-150.jpg",
    widthMm: 2000,
    heightMm: 1000,
  },
  "sunday-in-bloom-backing-1x1-v1": {
    masterPath:
      "features/rendering/assets/space-birthday/invitation/BACKING 1mx1m-150.jpg",
    widthMm: 1000,
    heightMm: 1000,
  },
};

function mmToPt(mm) {
  return (mm / 25.4) * 72;
}

async function createOriginalJpgPdf(template, outputPath) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([mmToPt(template.widthMm), mmToPt(template.heightMm)]);
  const masterBytes = await readFile(join(process.cwd(), template.masterPath));
  const jpg = await pdf.embedJpg(masterBytes);

  page.drawImage(jpg, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });

  const pdfBytes = await pdf.save({ useObjectStreams: false });
  await writeFile(outputPath, pdfBytes);

  return Buffer.from(pdfBytes).toString("latin1");
}

function inspectPdfColorSpaces(pdfText) {
  return {
    hasIccBased: /\/ICCBased\b/.test(pdfText),
    hasDeviceRgb: /\/DeviceRGB\b/.test(pdfText),
    hasDeviceCmyk: /\/DeviceCMYK\b/.test(pdfText),
    colorSpaceEntries: Array.from(
      pdfText.matchAll(/\/ColorSpace\s+(\/[A-Za-z0-9]+)/g),
      (match) => match[1],
    ),
  };
}

const templateId = process.argv[2] ?? "space-birthday-invitation-v1";
const template = templates[templateId];

if (!template) {
  console.error(
    `Unknown template "${templateId}". Options: ${Object.keys(templates).join(", ")}`,
  );
  process.exit(1);
}

const masterPath = join(process.cwd(), template.masterPath);
const metadata = await sharp(masterPath).metadata();
const outputDir = join(process.cwd(), "tmp", "color-pipeline", templateId);
await mkdir(outputDir, { recursive: true });

const pdfPath = join(outputDir, "A-original-jpg-embedJpg-inspectable.pdf");
const pdfText = await createOriginalJpgPdf(template, pdfPath);
const pdfColor = inspectPdfColorSpaces(pdfText);

const report = {
  templateId,
  master: {
    path: masterPath,
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    density: metadata.density,
    space: metadata.space,
    channels: metadata.channels,
    hasProfile: metadata.hasProfile,
    iccBytes: metadata.icc?.length ?? 0,
  },
  pdf: {
    path: pdfPath,
    ...pdfColor,
  },
  qaGuidance:
    "Compare master.jpg vs PDF A in a color-managed app such as Acrobat. If PDF A shifts color, investigate ICC handling between Illustrator, JPG, pdf-lib ColorSpace declaration and PDF viewer before adding conversions.",
};

await writeFile(
  join(outputDir, "color-profile-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(JSON.stringify(report, null, 2));
