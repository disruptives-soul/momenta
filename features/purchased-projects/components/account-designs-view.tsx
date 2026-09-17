"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Edit3, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/status-state";
import { TemplatePreview } from "@/features/rendering/components/template-preview";
import {
  DEMO_USER_ID,
  formatEditableUntil,
  isProjectEditable,
} from "../services/purchased-project-lifecycle";
import {
  localPurchasedProjectRepository,
  purchasedProjectsUpdatedEventName,
} from "../services/local-purchased-project-repository";
import { listPurchasedProjectsFromApi } from "../services/purchased-project-api";
import { downloadPurchasedProjectPdf } from "../services/purchased-project-download";
import { getRuntimeTemplateFromSnapshot } from "../services/purchased-template-snapshot";
import type { PurchasedProject } from "../types/purchased-project";

type DownloadStatus = "idle" | "downloading" | "failed";
type ProjectFilter = "all" | "purchased" | "editable";

export function AccountDesignsView() {
  const [projects, setProjects] = useState<PurchasedProject[]>([]);
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [downloadStates, setDownloadStates] = useState<
    Record<string, DownloadStatus>
  >({});

  async function syncProjects() {
    try {
      const supabaseProjects = await listPurchasedProjectsFromApi();

      if (supabaseProjects.length > 0) {
        setProjects(supabaseProjects);
        setIsLoading(false);
        return;
      }
    } catch {
      // Keep the MVP usable if Supabase is unavailable.
    }

    setProjects(await localPurchasedProjectRepository.listByUser(DEMO_USER_ID));
    setIsLoading(false);
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      void syncProjects();
    });

    window.addEventListener("storage", syncProjects);
    window.addEventListener(purchasedProjectsUpdatedEventName, syncProjects);

    return () => {
      window.removeEventListener("storage", syncProjects);
      window.removeEventListener(purchasedProjectsUpdatedEventName, syncProjects);
    };
  }, []);

  async function downloadProject(project: PurchasedProject) {
    setDownloadStates((current) => ({
      ...current,
      [project.id]: "downloading",
    }));

    try {
      const updatedProject = await downloadPurchasedProjectPdf(project);
      setProjects((current) =>
        current.map((item) =>
          item.id === updatedProject.id ? updatedProject : item,
        ),
      );
      setDownloadStates((current) => ({
        ...current,
        [project.id]: "idle",
      }));
    } catch {
      setDownloadStates((current) => ({
        ...current,
        [project.id]: "failed",
      }));
    }
  }

  const editableCount = projects.filter((project) => isProjectEditable(project)).length;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesFilter =
          activeFilter === "all" ||
          activeFilter === "purchased" ||
          (activeFilter === "editable" && isProjectEditable(project));
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          [
            project.product.name,
            project.product.pieceTypeName,
            project.product.collectionName,
            project.product.visualFormat,
          ]
            .filter((value): value is string => Boolean(value))
            .some((value) =>
              value.toLowerCase().includes(normalizedSearchQuery),
            );

        return matchesFilter && matchesSearch;
      }),
    [activeFilter, normalizedSearchQuery, projects],
  );

  async function downloadVisibleProjects() {
    for (const project of visibleProjects) {
      await downloadProject(project);
    }
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Estamos cargando los productos personalizados comprados."
        title="Cargando mis disenos"
      />
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        action={
          <Button asChild>
            <Link href="/catalog">Explorar productos</Link>
          </Button>
        }
        description="Cuando confirmes un checkout demo, cada producto personalizado aparecera aca con su periodo de edicion."
        title="Todavia no tenes disenos comprados"
      />
    );
  }

  return (
    <section className="grid gap-9">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
            Atelier personal - tus disenos son tuyos para siempre
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.98] md:text-6xl">
          Mis disenos
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Tus proyectos y archivos generados permanecen disponibles para
            descargar. Podes reactivar la ventana de edicion cuando desees hacer
            nuevos cambios.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex h-10 items-center rounded-full bg-surface px-4 text-sm font-semibold text-muted-foreground shadow-sm">
            <span className="mr-2 size-2 rounded-full bg-primary" />
            {editableCount} con edicion activa
          </span>
          <Button
            disabled={visibleProjects.length === 0}
            onClick={downloadVisibleProjects}
            type="button"
            variant="secondary"
          >
            <Download aria-hidden="true" />
            Descargar archivos
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex flex-wrap gap-2 rounded-full bg-surface/72 p-1.5 shadow-sm">
          <button
            className={
              activeFilter === "all"
                ? "rounded-full bg-surface px-4 py-2 text-sm font-semibold shadow-sm"
                : "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground"
            }
            onClick={() => setActiveFilter("all")}
            type="button"
          >
            Todos <span className="text-muted-foreground">{projects.length}</span>
          </button>
          <button
            className={
              activeFilter === "purchased"
                ? "rounded-full bg-surface px-4 py-2 text-sm font-semibold shadow-sm"
                : "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground"
            }
            onClick={() => setActiveFilter("purchased")}
            type="button"
          >
            Comprados {projects.length}
          </button>
          <button
            className={
              activeFilter === "editable"
                ? "rounded-full bg-surface px-4 py-2 text-sm font-semibold shadow-sm"
                : "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground"
            }
            onClick={() => setActiveFilter("editable")}
            type="button"
          >
            Edicion activa {editableCount}
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex h-11 min-w-[16rem] items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm text-muted-foreground shadow-sm">
            <Search aria-hidden="true" className="size-4" />
            <input
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar en mis disenos..."
              value={searchQuery}
            />
          </label>
          <span className="inline-flex h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold text-muted-foreground shadow-sm">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Mas recientes
          </span>
        </div>
      </div>

      <div>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-2xl font-semibold">Continuar editando</h2>
          <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-primary">
            Edicion activa
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.map((project) => {
          const editable = isProjectEditable(project);
          const downloadState = downloadStates[project.id] ?? "idle";
          const runtimeTemplate = getRuntimeTemplateFromSnapshot(project.template);

          return (
            <Card
              className="group overflow-hidden p-3 transition hover:-translate-y-0.5 hover:shadow-md"
              key={project.id}
            >
              <div className="relative overflow-hidden rounded-[1.15rem] bg-muted">
                <TemplatePreview
                  scene={project.scene}
                  template={runtimeTemplate ?? undefined}
                  templateId={project.templateId}
                  values={{}}
                />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <Badge tone={editable ? "premium" : "neutral"}>
                    {editable ? "Edicion activa" : "Edicion finalizada"}
                  </Badge>
                  <Badge tone="neutral">Comprado</Badge>
                </div>
              </div>

              <div className="px-1 pb-1 pt-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  {editable
                    ? `Edicion disponible hasta ${formatEditableUntil(project.editableUntil)}`
                    : "Tu diseno sigue disponible para descargar"}
                </p>
                <h2 className="mt-1 truncate font-serif text-2xl font-semibold">
                  {project.product.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {project.product.visualFormat ??
                    `${project.template.widthMm} x ${project.template.heightMm} mm`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Versiones generadas: {project.generatedVersions.length}
                </p>

                <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                  {editable ? (
                    <Button asChild size="sm">
                      <Link href={`/account/designs/${project.id}/edit`}>
                        <Edit3 aria-hidden="true" />
                        Continuar editando
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link href={`/account/designs/${project.id}/reactivate`}>
                        <RefreshCw aria-hidden="true" />
                        Reactivar edicion
                      </Link>
                    </Button>
                  )}
                  <Button
                    disabled={downloadState === "downloading"}
                    onClick={() => downloadProject(project)}
                    aria-label={`Descargar PDF de ${project.product.name}`}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Download aria-hidden="true" />
                  </Button>
                </div>

                {downloadState === "failed" ? (
                  <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 p-2 text-sm text-danger">
                    No pudimos generar el PDF. Intenta nuevamente.
                  </p>
                ) : null}
              </div>
            </Card>
          );
        })}
        </div>
      </div>
    </section>
  );
}
