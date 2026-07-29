import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProgressStep = {
  id: string;
  label: string;
};

type ProgressStepsProps = {
  steps: ProgressStep[];
  currentStepId: string;
};

export function ProgressSteps({ steps, currentStepId }: ProgressStepsProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Progreso">
      {steps.map((step, index) => {
        const isComplete = currentIndex > index;
        const isCurrent = step.id === currentStepId;

        return (
          <li
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm",
              isCurrent && "border-primary bg-primary/10 text-primary",
              isComplete && "border-success/30 bg-success/10 text-success",
              !isCurrent &&
                !isComplete &&
                "border-border bg-surface text-muted-foreground",
            )}
            key={step.id}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                isCurrent && "border-primary",
                isComplete && "border-success bg-success text-white",
              )}
            >
              {isComplete ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
            </span>
            <span className="truncate">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
