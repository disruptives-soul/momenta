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

async function createPdfFromJpg(template, outputPath) {
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

  await writeFile(outputPath, await pdf.save());
}

async function createPdfFromSharpPng(template, outputPath) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([mmToPt(template.widthMm), mmToPt(template.heightMm)]);
  const masterBytes = await readFile(join(process.cwd(), template.masterPath));
  const pngBytes = await sharp(masterBytes).png().toBuffer();
  const png = await pdf.embedPng(pngBytes);

  page.drawImage(png, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });

  await writeFile(outputPath, await pdf.save());
}

const templateId = process.argv[2] ?? "space-birthday-invitation-v1";
const template = templates[templateId];

if (!template) {
  console.error(
    `Unknown template "${templateId}". Options: ${Object.keys(templates).join(", ")}`,
  );
  process.exit(1);
}

const outputDir = join(process.cwd(), "tmp", "color-pipeline", templateId);
await mkdir(outputDir, { recursive: true });

const jpgPdfPath = join(outputDir, "A-original-jpg-embedJpg.pdf");
const sharpPngPdfPath = join(outputDir, "B-sharp-png-embedPng.pdf");

await createPdfFromJpg(template, jpgPdfPath);
await createPdfFromSharpPng(template, sharpPngPdfPath);

console.log("Generated color pipeline fixtures:");
console.log(`A: ${jpgPdfPath}`);
console.log(`B: ${sharpPngPdfPath}`);
