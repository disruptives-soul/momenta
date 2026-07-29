import { Button } from "@/components/ui/button";

type FormNavigationProps = {
  canGoBack: boolean;
  isLastStep: boolean;
  onBack: () => void;
};

export function FormNavigation({
  canGoBack,
  isLastStep,
  onBack,
}: FormNavigationProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
      <Button
        disabled={!canGoBack}
        onClick={onBack}
        type="button"
        variant="secondary"
      >
        Volver
      </Button>
      <Button type="submit">
        {isLastStep ? "Revisar datos" : "Continuar"}
      </Button>
    </div>
  );
}
