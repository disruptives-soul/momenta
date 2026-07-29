import type { PersonalizationFieldKey } from "../types/personalization-draft";

export type PersonalizationStep = {
  id: string;
  title: string;
  description: string;
  fields: PersonalizationFieldKey[];
};

export const personalizationSteps: PersonalizationStep[] = [
  {
    id: "name",
    title: "Nombre",
    description: "Primero, el nombre que aparecerá en la invitación.",
    fields: ["name"],
  },
  {
    id: "age",
    title: "Edad",
    description: "La edad ayuda a personalizar el diseño del cumpleaños.",
    fields: ["age"],
  },
  {
    id: "date-time",
    title: "Fecha y hora",
    description: "Usaremos estos datos solo para mostrar la invitación.",
    fields: ["date", "time"],
  },
  {
    id: "place",
    title: "Lugar",
    description: "Indicá dónde será la celebración.",
    fields: ["place"],
  },
  {
    id: "message",
    title: "Mensaje adicional",
    description: "Podés sumar una frase breve o dejar este paso vacío.",
    fields: ["message"],
  },
];

export function getStepIndex(stepId: string) {
  const index = personalizationSteps.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : 0;
}

export function getStepForField(field: PersonalizationFieldKey) {
  return (
    personalizationSteps.find((step) => step.fields.includes(field)) ??
    personalizationSteps[0]
  );
}
