import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoApiBase = "https://api.github.com/repos/google/fonts/contents";
const manifestPath = path.join(
  "features",
  "rendering",
  "assets",
  "google-fonts-manifest.json",
);
const renderFontRoot = path.join(
  "features",
  "rendering",
  "assets",
  "fonts",
  "google",
);
const publicFontRoot = path.join("public", "fonts", "google");

function toSlug(family) {
  return family.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toFamilyFilePrefix(family) {
  return family.replace(/[^A-Za-z0-9]/g, "");
}

function usage() {
  console.log(
    [
      "Usage:",
      '  pnpm fonts:cache "Montserrat"',
      '  pnpm fonts:cache "Playfair Display" "Lora"',
      "",
      "Downloads TTF files from the Google Fonts repository, writes them to:",
      "  public/fonts/google/<family>/",
      "  features/rendering/assets/fonts/google/<family>/",
      "",
      "Then updates features/rendering/assets/google-fonts-manifest.json.",
    ].join("\n"),
  );
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "momenta-font-cache",
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "momenta-font-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function getDirectoryEntries(slug) {
  for (const license of ["ofl", "apache", "ufl"]) {
    const entries = await fetchJson(`${repoApiBase}/${license}/${slug}?ref=main`);
    if (Array.isArray(entries)) {
      return { license, entries };
    }
  }

  throw new Error(`Google Fonts family not found: ${slug}`);
}

async function getFontFiles(slug) {
  const directory = await getDirectoryEntries(slug);
  const staticDir = directory.entries.find(
    (entry) => entry.type === "dir" && entry.name === "static",
  );
  const staticEntries = staticDir
    ? await fetchJson(`${repoApiBase}/${directory.license}/${slug}/static?ref=main`)
    : null;
  const entries = Array.isArray(staticEntries)
    ? [...staticEntries, ...directory.entries]
    : directory.entries;

  return entries.filter(
    (entry) =>
      entry.type === "file" &&
      entry.name.toLowerCase().endsWith(".ttf") &&
      entry.download_url,
  );
}

function chooseFontFile(files, family, weight) {
  const prefix = toFamilyFilePrefix(family).toLowerCase();
  const exactSuffix = weight === "bold" ? "-bold.ttf" : "-regular.ttf";
  const exact = files.find((file) => {
    const name = file.name.toLowerCase();
    return name.startsWith(prefix) && name.endsWith(exactSuffix);
  });

  if (exact) {
    return exact;
  }

  const named = files.find((file) => {
    const name = file.name.toLowerCase();
    return (
      name.includes(weight === "bold" ? "bold" : "regular") &&
      !name.includes("italic")
    );
  });

  if (named) {
    return named;
  }

  const variable = files.find((file) => {
    const name = file.name.toLowerCase();
    return name.includes("[") && !name.includes("italic");
  });

  if (variable) {
    return variable;
  }

  return files.find((file) => !file.name.toLowerCase().includes("italic"));
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeFontCopies(slug, fontFile) {
  const bytes = await fetchBuffer(fontFile.download_url);
  const renderDir = path.join(renderFontRoot, slug);
  const publicDir = path.join(publicFontRoot, slug);

  await mkdir(renderDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(renderDir, fontFile.name), bytes);
  await writeFile(path.join(publicDir, fontFile.name), bytes);

  return `fonts/google/${slug}/${fontFile.name}`;
}

async function cacheFamily(family) {
  const slug = toSlug(family);
  const files = await getFontFiles(slug);

  if (files.length === 0) {
    throw new Error(`No TTF files found for ${family}`);
  }

  const regular = chooseFontFile(files, family, "regular");
  const bold = chooseFontFile(files, family, "bold") ?? regular;

  if (!regular) {
    throw new Error(`No usable regular TTF found for ${family}`);
  }

  const regularPath = await writeFontCopies(slug, regular);
  const boldPath =
    bold && bold.download_url !== regular.download_url
      ? await writeFontCopies(slug, bold)
      : regularPath;
  const manifest = await readManifest();

  manifest[family] = {
    regular: regularPath,
    bold: boldPath,
  };

  await writeFile(`${manifestPath}\n`.trim(), `${JSON.stringify(manifest, null, 2)}\n`);

  return { family, regular: regularPath, bold: boldPath };
}

const families = process.argv.slice(2).filter((arg) => arg !== "--");

if (families.length === 0 || families.includes("--help") || families.includes("-h")) {
  usage();
  process.exit(families.length === 0 ? 1 : 0);
}

for (const family of families) {
  const result = await cacheFamily(family);
  console.log(
    `Cached ${result.family}: regular=${result.regular} bold=${result.bold}`,
  );
}
