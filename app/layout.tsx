import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { DebugEventsPanel } from "@/features/analytics/components/debug-events-panel";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Momenta",
    template: "%s | Momenta",
  },
  description:
    "Printable design collections that can be personalized and downloaded.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        {children}
        <DebugEventsPanel />
      </body>
    </html>
  );
}
