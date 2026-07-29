import type { ValidationEventName } from "./validation-events";
import { storeValidationEvent } from "./mock-event-store";

export type ValidationEventPayload = {
  category?: string;
  collection?: string;
  projectId?: string;
  collectionSlug?: string;
  currency?: string;
  price?: number | string;
  product?: string;
  productCode?: string;
  step?: string;
  field?: string;
  feedback?: string;
};

export function trackValidationEvent(
  name: ValidationEventName,
  payload: ValidationEventPayload = {},
) {
  const event = storeValidationEvent(name, payload);
  console.info("[Momenta prototype event]", event ?? { name, payload });
}
