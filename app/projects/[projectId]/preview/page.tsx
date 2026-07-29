import { Container } from "@/components/layout/container";
import { PreviewSimulation } from "@/features/result/components/preview-simulation";

type PreviewPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    simulateError?: string;
  }>;
};

export const metadata = {
  title: "Preview",
  description: "Generación y preview simulado para Etapa 1.",
};

export default async function PreviewPage({
  params,
  searchParams,
}: PreviewPageProps) {
  const { projectId } = await params;
  const { simulateError } = await searchParams;

  return (
    <main>
      <Container className="py-8 md:py-12">
        <PreviewSimulation
          projectId={projectId}
          simulateError={simulateError === "1"}
        />
      </Container>
    </main>
  );
}
