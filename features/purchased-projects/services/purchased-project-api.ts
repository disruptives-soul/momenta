"use client";

import type { PurchasedProject } from "../types/purchased-project";

type AccountDesignsResponse = {
  ok: boolean;
  projects: PurchasedProject[];
};

type AccountDesignResponse = {
  ok: boolean;
  project: PurchasedProject | null;
};

export async function listPurchasedProjectsFromApi() {
  const response = await fetch("/api/account/designs", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Purchased projects request failed.");
  }

  const payload = (await response.json()) as AccountDesignsResponse;

  return payload.projects;
}

export async function getPurchasedProjectFromApi(projectId: string) {
  const response = await fetch(`/api/account/designs/${projectId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Purchased project request failed.");
  }

  const payload = (await response.json()) as AccountDesignResponse;

  return payload.project;
}

export async function updatePurchasedProjectInApi(project: PurchasedProject) {
  const response = await fetch(`/api/account/designs/${project.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      editableUntil: project.editableUntil,
      reactivationCount: project.reactivationCount,
      scene: project.scene,
    }),
  });

  if (!response.ok) {
    throw new Error("Purchased project update failed.");
  }

  const payload = (await response.json()) as AccountDesignResponse;

  return payload.project;
}
