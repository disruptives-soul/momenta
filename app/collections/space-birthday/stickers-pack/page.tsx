import { Container } from "@/components/layout/container";
import { PremiumDetail } from "@/features/premium/components/premium-detail";

export const metadata = {
  title: "Stickers pack",
  description: "Detalle del Stickers pack Premium de Space Birthday.",
};

export default function StickersPackPage() {
  return (
    <main>
      <Container className="py-8 md:py-12">
        <PremiumDetail />
      </Container>
    </main>
  );
}
