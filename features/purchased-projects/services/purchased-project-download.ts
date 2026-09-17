"use client";

import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { addGeneratedVersion } from "./purchased-project-lifecycle";
import { localPurchasedProjectRepository } from "./local-purchased-project-repository";
import type { PurchasedProject } from "../types/purchased-project";

function getDownloadFileName(response: Response, fallback: string) {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(?<fileName>[^"]+)"/);

  return match?.groups?.fileName ?? fallback;
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

export async function downloadPurchasedProjectPdf(project: PurchasedProject) {
  const response = await fetch("/api/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cartItemId: project.id,
      format: "pdf",
      orderId: project.orderId ?? project.id,
      productSnapshot: project.product,
      templateId: project.templateId,
      templateSnapshot: project.template,
      data: {},
      scene: project.scene,
    }),
  });

  if (!response.ok) {
    throw new Error("Purchased project render failed.");
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("Empty PDF.");
  }

  const fileName = getDownloadFileName(
    response,
    `${project.product.collectionSlug}-${project.product.slug}.pdf`,
  );

  downloadBlob(blob, fileName);

  const updatedProject = addGeneratedVersion(project, fileName);
  await localPurchasedProjectRepository.update(updatedProject);
  trackValidationEvent("post_purchase_pdf_downloaded", {
    productId: project.productId,
    projectId: project.id,
    templateId: project.templateId,
  });

  return updatedProject;
}
