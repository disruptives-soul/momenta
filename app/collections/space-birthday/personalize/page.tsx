import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { LoadingState } from "@/components/ui/status-state";
import { PersonalizationFlow } from "@/features/personalization/components/personalization-flow";

export const metadata = {
  title: "Personalizar invitación",
  description: "Shell del formulario de personalización de Etapa 1.",
};

export default function PersonalizePage() {
  return (
    <main>
      <Container className="py-8 md:py-12">
        <Suspense
          fallback={
            <LoadingState
              description="Preparando el formulario guiado."
              title="Cargando personalización"
            />
          }
        >
          <PersonalizationFlow />
        </Suspense>
      </Container>
    </main>
  );
}
