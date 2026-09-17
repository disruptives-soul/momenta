"use client";

import type {
  PurchasedProject,
  PurchasedProjectRepository,
} from "../types/purchased-project";

const purchasedProjectsStorageKey = "momenta:purchased-projects:v1";
export const purchasedProjectsUpdatedEventName =
  "momenta:purchased-projects-updated";

function emitPurchasedProjectsUpdated() {
  window.dispatchEvent(new Event(purchasedProjectsUpdatedEventName));
}

function readProjects() {
  if (typeof window === "undefined") {
    return [];
  }

  const current = window.localStorage.getItem(purchasedProjectsStorageKey);

  if (!current) {
    return [];
  }

  try {
    const parsed = JSON.parse(current);

    return Array.isArray(parsed) ? (parsed as PurchasedProject[]) : [];
  } catch {
    return [];
  }
}

function writeProjects(projects: PurchasedProject[]) {
  window.localStorage.setItem(
    purchasedProjectsStorageKey,
    JSON.stringify(projects),
  );
  emitPurchasedProjectsUpdated();
}

export class LocalPurchasedProjectRepository
  implements PurchasedProjectRepository
{
  async listByUser(userId: string) {
    return readProjects()
      .filter((project) => project.userId === userId)
      .sort(
        (first, second) =>
          new Date(second.purchasedAt).getTime() -
          new Date(first.purchasedAt).getTime(),
      );
  }

  async getById(id: string) {
    return readProjects().find((project) => project.id === id) ?? null;
  }

  async create(project: PurchasedProject) {
    writeProjects([...readProjects(), project]);
  }

  async update(project: PurchasedProject) {
    const projects = readProjects();
    const nextProjects = projects.some((item) => item.id === project.id)
      ? projects.map((item) => (item.id === project.id ? project : item))
      : [...projects, project];

    writeProjects(nextProjects);
  }
}

export const localPurchasedProjectRepository =
  new LocalPurchasedProjectRepository();
