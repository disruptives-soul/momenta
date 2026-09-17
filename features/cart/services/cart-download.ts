"use client";

import type { CartSnapshot } from "./cart-storage";

export type ZipDownloadState = "idle" | "downloading" | "completed" | "failed";

function getDownloadFileName(response: Response) {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(?<fileName>[^"]+)"/);

  return match?.groups?.fileName ?? "momenta-files.zip";
}

function downloadBlob(blob: Blob, fileName: string) {
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 30_000);
}

export async function downloadCartZip(items: CartSnapshot[]) {
  if (items.length === 0) {
    throw new Error("Cannot download an empty cart.");
  }

  const response = await fetch("/api/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: "pdf",
      templates: items.map((item) => ({
        templateId: item.template.id,
        data: {},
        scene: item.scene,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error("ZIP render failed.");
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("Empty ZIP.");
  }

  downloadBlob(blob, getDownloadFileName(response));
}
