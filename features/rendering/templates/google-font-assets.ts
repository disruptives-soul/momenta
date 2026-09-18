import googleFontsManifest from "../assets/google-fonts-manifest.json";
import type { TemplateFontAsset } from "./template-types";

type GoogleFontManifest = Record<string, TemplateFontAsset>;

const googleFonts = googleFontsManifest as GoogleFontManifest;

function normalizeFontFamilyName(value: string) {
  return value
    .split(",")[0]
    ?.replaceAll("\"", "")
    .replaceAll("'", "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function getBundledGoogleFontFamily(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = normalizeFontFamilyName(value);

  return (
    Object.keys(googleFonts).find(
      (family) => normalizeFontFamilyName(family) === normalized,
    ) ?? null
  );
}

export function getBundledGoogleFontAsset(value?: string) {
  const family = getBundledGoogleFontFamily(value);

  return family ? googleFonts[family] : undefined;
}

export function getBundledGoogleFontFamilyStack(value?: string) {
  const family = getBundledGoogleFontFamily(value);

  return family ? `${family}, Arial, Helvetica, sans-serif` : undefined;
}

export function getPublicFontAssetUrl(assetPath: string) {
  return assetPath.startsWith("/")
    ? assetPath
    : `/${assetPath.replace(/^fonts\//, "fonts/")}`;
}
