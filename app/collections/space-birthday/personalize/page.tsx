import { Suspense } from "react";
import { LoadingState } from "@/components/ui/status-state";
import { PersonalizationFlow } from "@/features/personalization/components/personalization-flow";

export const metadata = {
  title: "Personalizar invitacion",
  description: "Editor visual para personalizar textos imprimibles.",
};

export default function PersonalizePage() {
  return (
    <main className="min-h-screen bg-[#eef2f6]">
      <Suspense
        fallback={
          <LoadingState
            description="Preparando el editor."
            title="Cargando personalizacion"
          />
        }
      >
        <PersonalizationFlow />
      </Suspense>
    </main>
  );
}
