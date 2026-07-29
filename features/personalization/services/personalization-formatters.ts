import type {
  PersonalizationFieldKey,
  PersonalizationValues,
} from "../types/personalization-draft";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDateForDisplay(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return capitalize(`${weekday} ${day} de ${month}`);
}

export function formatTimeForDisplay(value: string) {
  return value ? `${value} h` : "";
}

export function formatAgeForDisplay(value: string) {
  if (!value) {
    return "";
  }

  return value === "1" ? "1 año" : `${value} años`;
}

export function formatPersonalizationValue(
  field: PersonalizationFieldKey,
  values: PersonalizationValues,
) {
  const value = values[field];

  if (field === "date") {
    return formatDateForDisplay(value);
  }

  if (field === "time") {
    return formatTimeForDisplay(value);
  }

  if (field === "age") {
    return formatAgeForDisplay(value);
  }

  return value || "Sin mensaje";
}
