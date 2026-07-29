import { Card } from "@/components/ui/card";

const steps = [
  {
    title: "Elige una colección",
    description: "Encuentra un estilo visual listo para tu celebración.",
  },
  {
    title: "Personaliza los datos",
    description: "Completa nombre, edad, fecha, hora y lugar.",
  },
  {
    title: "Descarga e imprime",
    description: "Obtén una pieza lista para revisar, compartir e imprimir.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <Card className="grid gap-3" key={step.title}>
          <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <h3 className="text-lg font-semibold">{step.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {step.description}
          </p>
        </Card>
      ))}
    </div>
  );
}
