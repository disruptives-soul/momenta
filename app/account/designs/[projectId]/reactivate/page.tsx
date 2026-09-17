import { Container } from "@/components/layout/container";
import { ReactivateProjectView } from "@/features/purchased-projects/components/reactivate-project-view";

type ReactivateProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export const metadata = {
  title: "Reactivar edicion",
  description: "Reactivacion demo de diseno comprado en Momenta.",
};

export default async function ReactivateProjectPage({
  params,
}: ReactivateProjectPageProps) {
  const { projectId } = await params;

  return (
    <main>
      <Container className="py-10 md:py-14">
        <ReactivateProjectView projectId={projectId} />
      </Container>
    </main>
  );
}
