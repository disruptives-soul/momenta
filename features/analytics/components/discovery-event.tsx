"use client";

import { useEffect } from "react";
import type { ValidationEventName } from "../services/validation-events";
import {
  trackValidationEvent,
  type ValidationEventPayload,
} from "../services/track-validation-event";

type DiscoveryEventProps = {
  name: ValidationEventName;
  payload?: ValidationEventPayload;
};

export function DiscoveryEvent({ name, payload }: DiscoveryEventProps) {
  useEffect(() => {
    trackValidationEvent(name, payload);
  }, [name, payload]);

  return null;
}
