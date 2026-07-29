import { Container } from "@/components/layout/container";
import { PersonalizationSummary } from "@/features/personalization/components/personalization-summary";

type ReviewPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export const metadata = {
  title: "Revisión de datos",
  description: "Revisión de datos de la Invitación esencial.",
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { projectId } = await params;

  return (
    <main>
      <Container className="py-8 md:py-12">
        <PersonalizationSummary projectId={projectId} />
      </Container>
    </main>
  );
}
