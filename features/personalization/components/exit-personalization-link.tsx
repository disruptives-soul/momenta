"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type ExitPersonalizationLinkProps = ComponentProps<typeof Link> & {
  hasChanges: boolean;
};

export function ExitPersonalizationLink({
  hasChanges,
  onClick,
  ...props
}: ExitPersonalizationLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (
          hasChanges &&
          !window.confirm(
            "Si salís ahora, los datos quedan solo en este prototipo local.",
          )
        ) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    />
  );
}
