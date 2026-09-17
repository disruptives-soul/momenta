import { PurchasedProjectEditorView } from "@/features/purchased-projects/components/purchased-project-editor-view";

type PurchasedProjectEditPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export const metadata = {
  title: "Editar diseno comprado",
  description: "Editor post-compra de textos en Momenta.",
};

export default async function PurchasedProjectEditPage({
  params,
}: PurchasedProjectEditPageProps) {
  const { projectId } = await params;

  return (
    <main className="min-h-screen bg-[#eef2f6]">
      <PurchasedProjectEditorView projectId={projectId} />
    </main>
  );
}
