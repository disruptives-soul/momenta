"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  clearStoredValidationEvents,
  getStoredValidationEvents,
  type StoredValidationEvent,
  validationEventDispatched,
} from "../services/mock-event-store";

const freeFunnel = [
  "collection_viewed",
  "personalization_started",
  "personalization_completed",
  "preview_viewed",
  "download_clicked",
] as const;

const premiumFunnel = [
  "premium_product_viewed",
  "premium_cta_clicked",
  "mock_checkout_started",
  "purchase_intent_confirmed",
] as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function hasEvent(events: StoredValidationEvent[], name: string) {
  return events.some((event) => event.name === name);
}

function getEventDetails(event: StoredValidationEvent) {
  const price =
    event.payload.price && event.payload.currency
      ? `${event.payload.currency} ${event.payload.price}`
      : undefined;

  return [
    ["Ruta", event.path],
    ["Colección", event.payload.collection ?? event.payload.collectionSlug],
    ["Producto", event.payload.product ?? event.payload.productCode],
    ["Paso", event.payload.step],
    ["Precio", price],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]));
}

export function DebugEventsPanel() {
  const [isEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const params = new URLSearchParams(window.location.search);

    return params.get("debugEvents") === "1";
  });
  const [events, setEvents] = useState<StoredValidationEvent[]>(() =>
    getStoredValidationEvents(),
  );

  useEffect(() => {
    function syncEvents() {
      setEvents(getStoredValidationEvents());
    }

    window.addEventListener(validationEventDispatched, syncEvents);

    return () => {
      window.removeEventListener(validationEventDispatched, syncEvents);
    };
  }, []);

  const latestEvents = useMemo(() => events.slice(-18).reverse(), [events]);

  if (!isEnabled) {
    return null;
  }

  return (
    <aside
      aria-label="Visor de eventos mock"
      className="fixed bottom-4 right-4 z-50 max-h-[72vh] w-[min(28rem,calc(100vw-2rem))] overflow-auto rounded-md border border-border bg-background p-4 shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Eventos mock</p>
          <p className="text-xs text-muted-foreground">
            Visible solo con `?debugEvents=1`
          </p>
        </div>
        <Button
          onClick={() => {
            clearStoredValidationEvents();
            setEvents([]);
          }}
          size="sm"
          type="button"
          variant="secondary"
        >
          Limpiar
        </Button>
      </div>

      <div className="mb-4 grid gap-3 text-xs">
        <div className="rounded-md border border-border bg-muted p-3">
          <p className="font-semibold">Embudo Free</p>
          <ol className="mt-2 grid gap-1">
            {freeFunnel.map((eventName) => (
              <li key={eventName}>
                {hasEvent(events, eventName) ? "done" : "pending"} {eventName}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-md border border-border bg-muted p-3">
          <p className="font-semibold">Embudo Premium</p>
          <ol className="mt-2 grid gap-1">
            {premiumFunnel.map((eventName) => (
              <li key={eventName}>
                {hasEvent(events, eventName) ? "done" : "pending"} {eventName}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ol className="grid gap-2 text-xs">
        {latestEvents.length > 0 ? (
          latestEvents.map((event) => (
            <li
              className="rounded-md border border-border bg-surface p-2"
              key={event.id}
            >
              <div className="flex justify-between gap-3">
                <strong>{event.name}</strong>
                <span className="text-muted-foreground">
                  {formatDateTime(event.occurredAt)}
                </span>
              </div>
              <dl className="mt-2 grid gap-1 text-muted-foreground">
                {getEventDetails(event).map(([label, value]) => (
                  <div className="grid grid-cols-[5rem_1fr] gap-2" key={label}>
                    <dt>{label}</dt>
                    <dd className="font-mono text-[0.68rem]">{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))
        ) : (
          <li className="rounded-md border border-border bg-muted p-3 text-muted-foreground">
            Todavía no hay eventos registrados en esta sesión.
          </li>
        )}
      </ol>
    </aside>
  );
}
