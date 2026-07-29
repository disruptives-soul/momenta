import { Container } from "@/components/layout/container";
import { DownloadSimulation } from "@/features/result/components/download-simulation";

type DownloadPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export const metadata = {
  title: "Descarga",
  description: "Descarga de prueba de la Invitación esencial.",
};

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { projectId } = await params;

  return (
    <main>
      <Container className="py-8 md:py-12">
        <DownloadSimulation projectId={projectId} />
      </Container>
    </main>
  );
}
