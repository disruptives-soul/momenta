"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { ValidationEventName } from "../services/validation-events";
import {
  trackValidationEvent,
  type ValidationEventPayload,
} from "../services/track-validation-event";

type EventLinkProps = ComponentProps<typeof Link> & {
  eventName: ValidationEventName;
  eventPayload?: ValidationEventPayload;
};

export function EventLink({
  eventName,
  eventPayload,
  onClick,
  ...props
}: EventLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackValidationEvent(eventName, eventPayload);
        onClick?.(event);
      }}
    />
  );
}
