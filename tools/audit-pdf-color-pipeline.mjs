import { readFile } from "node:fs/promises";
import { join } from "node:path";

const filesToAudit = [
  "features/rendering/services/pdf-template-renderer.ts",
];

const forbiddenPatterns = [
  {
    label: "sharp() inside PDF renderer",
    pattern: /\bsharp\s*\(/,
  },
  {
    label: "PNG encoding inside PDF renderer",
    pattern: /\.png\s*\(/,
  },
  {
    label: "JPEG re-encoding inside PDF renderer",
    pattern: /\.jpeg\s*\(/,
  },
  {
    label: "format conversion inside PDF renderer",
    pattern: /\.toFormat\s*\(/,
  },
  {
    label: "PNG embedding inside PDF renderer",
    pattern: /\.embedPng\s*\(/,
  },
];

let failed = false;

for (const file of filesToAudit) {
  const absolutePath = join(process.cwd(), file);
  const content = await readFile(absolutePath, "utf8");

  for (const forbidden of forbiddenPatterns) {
    if (forbidden.pattern.test(content)) {
      console.error(`${forbidden.label} found in ${file}.`);
      failed = true;
    }
  }

  if (!/loadOriginalMasterJpgBytes/.test(content) || !/\.embedJpg\s*\(/.test(content)) {
    console.error(
      `${file} must load original JPG bytes and pass them directly to embedJpg().`,
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  "PDF color pipeline OK: original JPG bytes are embedded directly with embedJpg().",
);
