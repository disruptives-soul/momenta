import { Container } from "@/components/layout/container";
import { PurchasedProjectDetailView } from "@/features/purchased-projects/components/purchased-project-detail-view";

type PurchasedProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export const metadata = {
  title: "Diseno comprado",
  description: "Detalle de diseno comprado en Momenta.",
};

export default async function PurchasedProjectPage({
  params,
}: PurchasedProjectPageProps) {
  const { projectId } = await params;

  return (
    <main>
      <Container className="py-10 md:py-14">
        <PurchasedProjectDetailView projectId={projectId} />
      </Container>
    </main>
  );
}
