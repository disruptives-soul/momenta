import { NextResponse } from "next/server";
import {
  getPurchasedProjectFromSupabase,
  updatePurchasedProjectInSupabase,
} from "@/infrastructure/supabase/supabase-purchased-project-repository";
import type { TextElement } from "@/features/rendering/templates/template-types";

export const runtime = "nodejs";

type AccountDesignRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, { params }: AccountDesignRouteProps) {
  const { projectId } = await params;

  try {
    const project = await getPurchasedProjectFromSupabase(projectId);

    return NextResponse.json({
      ok: true,
      source: "supabase",
      project,
    });
  } catch (error) {
    console.error("Failed to get Supabase purchased project.", error);

    return NextResponse.json(
      {
        ok: false,
        source: "supabase",
        project: null,
      },
      { status: 500 },
    );
  }
}

type UpdateProjectBody = {
  editableUntil?: string;
  reactivationCount?: number;
  scene?: TextElement[];
};

export async function PATCH(
  request: Request,
  { params }: AccountDesignRouteProps,
) {
  const { projectId } = await params;
  let body: UpdateProjectBody;

  try {
    body = (await request.json()) as UpdateProjectBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.scene)) {
    return NextResponse.json(
      { error: "scene must be an array." },
      { status: 400 },
    );
  }

  try {
    const project = await updatePurchasedProjectInSupabase({
      projectId,
      scene: body.scene,
      editableUntil: body.editableUntil,
      reactivationCount: body.reactivationCount,
    });

    return NextResponse.json({
      ok: true,
      source: "supabase",
      project,
    });
  } catch (error) {
    console.error("Failed to update Supabase purchased project.", error);

    return NextResponse.json(
      {
        ok: false,
        source: "supabase",
        project: null,
      },
      { status: 500 },
    );
  }
}
