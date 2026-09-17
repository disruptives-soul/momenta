import { NextResponse } from "next/server";
import { listPurchasedProjectsFromSupabase } from "@/infrastructure/supabase/supabase-purchased-project-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listPurchasedProjectsFromSupabase();

    return NextResponse.json({
      ok: true,
      source: "supabase",
      projects,
    });
  } catch (error) {
    console.error("Failed to list Supabase purchased projects.", error);

    return NextResponse.json(
      {
        ok: false,
        source: "supabase",
        projects: [],
      },
      { status: 500 },
    );
  }
}
