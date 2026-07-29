import type { PersonalizationStep } from "../config/personalization-steps";
import { getPersonalizationField } from "../services/personalization-fields";
import type {
  PersonalizationFieldKey,
  PersonalizationValues,
} from "../types/personalization-draft";

export type PersonalizationErrors = Partial<
  Record<PersonalizationFieldKey, string>
>;

function isValidDate(value: string) {
  if (!value) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date >= today;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validatePersonalizationField(
  fieldKey: PersonalizationFieldKey,
  value: string,
) {
  const field = getPersonalizationField(fieldKey);
  const trimmedValue = value.trim();

  if (!field) {
    return "Campo no configurado.";
  }

  if (field.rule.required && !trimmedValue) {
    if (fieldKey === "name") return "Ingresa el nombre.";
    if (fieldKey === "age") return "Ingresa la edad.";
    if (fieldKey === "date") return "Selecciona la fecha del evento.";
    if (fieldKey === "time") return "Selecciona la hora del evento.";
    if (fieldKey === "place") return "Ingresa el lugar del evento.";
  }

  if (field.rule.maxLength && trimmedValue.length > field.rule.maxLength) {
    if (fieldKey === "name") {
      return "El nombre puede tener hasta 30 caracteres.";
    }

    if (fieldKey === "place") {
      return "El lugar puede tener hasta 60 caracteres.";
    }

    if (fieldKey === "message") {
      return "El mensaje puede tener hasta 120 caracteres.";
    }
  }

  if (fieldKey === "age" && trimmedValue) {
    const age = Number(trimmedValue);

    if (!Number.isInteger(age) || age < 1 || age > 99) {
      return "La edad debe estar entre 1 y 99.";
    }
  }

  if (fieldKey === "date" && trimmedValue && !isValidDate(trimmedValue)) {
    return "Selecciona la fecha del evento.";
  }

  if (fieldKey === "time" && trimmedValue && !isValidTime(trimmedValue)) {
    return "Selecciona la hora del evento.";
  }

  return "";
}

export function validatePersonalizationStep(
  step: PersonalizationStep,
  values: PersonalizationValues,
) {
  return step.fields.reduce<PersonalizationErrors>((errors, field) => {
    const error = validatePersonalizationField(field, values[field]);

    if (error) {
      errors[field] = error;
    }

    return errors;
  }, {});
}

export function validateAllPersonalizationValues(values: PersonalizationValues) {
  const fields: PersonalizationFieldKey[] = [
    "name",
    "age",
    "date",
    "time",
    "place",
    "message",
  ];

  return fields.reduce<PersonalizationErrors>((errors, field) => {
    const error = validatePersonalizationField(field, values[field]);

    if (error) {
      errors[field] = error;
    }

    return errors;
  }, {});
}
