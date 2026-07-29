"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trackValidationEvent } from "@/features/analytics/services/track-validation-event";
import { demoPersonalizationProjectId } from "@/features/personalization/types/personalization-draft";
import { premiumEventPayload } from "../data/mock-premium-offer";

const feedbackOptions = [
  "El diseño",
  "La personalización",
  "El precio",
  "Que combina con la invitación",
  "La facilidad de imprimirlo",
  "Otro",
];

export function MockCheckoutSuccess() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState("");
  const [otherFeedback, setOtherFeedback] = useState("");

  function submitFeedback() {
    if (!selectedFeedback) {
      return;
    }

    trackValidationEvent("premium_feedback_submitted", {
      ...premiumEventPayload,
      feedback: selectedFeedback,
    });
    setSubmitted(true);
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Card className="grid gap-5 text-center">
        <p className="text-sm font-medium text-primary">Intención registrada</p>
        <h1 className="text-3xl font-semibold md:text-5xl">
          Gracias por tu interés
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
          No realizamos ningún cobro. Tu respuesta nos ayuda a conocer el interés
          por el Stickers pack de Space Birthday.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/collections/space-birthday">Volver a Space Birthday</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/projects/${demoPersonalizationProjectId}/preview`}>
              Ver mi invitación
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/catalog">Explorar colecciones</Link>
          </Button>
        </div>
      </Card>

      <Card className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            ¿Qué fue lo principal que te convenció?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            La respuesta es opcional y no incluye información personal.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {feedbackOptions.map((option) => (
            <label
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm"
              key={option}
            >
              <input
                checked={selectedFeedback === option}
                name="premium-feedback"
                onChange={() => {
                  setSelectedFeedback(option);
                  if (option !== "Otro") {
                    setOtherFeedback("");
                  }
                }}
                type="radio"
                value={option}
              />
              {option}
            </label>
          ))}
        </div>
        {selectedFeedback === "Otro" ? (
          <Textarea
            onChange={(event) => setOtherFeedback(event.target.value)}
            placeholder="Contanos brevemente"
            value={otherFeedback}
          />
        ) : null}
        <Button disabled={!selectedFeedback || submitted} onClick={submitFeedback}>
          {submitted ? "Respuesta registrada" : "Enviar respuesta opcional"}
        </Button>
      </Card>
    </div>
  );
}
