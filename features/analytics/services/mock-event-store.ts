import type {
  ValidationEventName,
} from "./validation-events";
import type { ValidationEventPayload } from "./track-validation-event";

export type StoredValidationEvent = {
  id: string;
  name: ValidationEventName;
  occurredAt: string;
  path: string;
  payload: ValidationEventPayload;
};

const storageKey = "momenta:stage1:validation-events";
const maxStoredEvents = 120;
export const validationEventDispatched = "momenta:validation-event-dispatched";

function readStoredEvents() {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.sessionStorage.getItem(storageKey);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as StoredValidationEvent[];
  } catch {
    return [];
  }
}

export function getStoredValidationEvents() {
  return readStoredEvents();
}

export function clearStoredValidationEvents() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(storageKey);
  window.dispatchEvent(new CustomEvent(validationEventDispatched));
}

export function storeValidationEvent(
  name: ValidationEventName,
  payload: ValidationEventPayload,
) {
  if (typeof window === "undefined") {
    return null;
  }

  const event: StoredValidationEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    occurredAt: new Date().toISOString(),
    path: window.location.pathname,
    payload,
  };
  const events = [...readStoredEvents(), event].slice(-maxStoredEvents);

  window.sessionStorage.setItem(storageKey, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent(validationEventDispatched, { detail: event }));

  return event;
}
