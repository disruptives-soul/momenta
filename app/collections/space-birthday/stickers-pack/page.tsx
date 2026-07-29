import { Container } from "@/components/layout/container";
import { PremiumDetail } from "@/features/premium/components/premium-detail";

export const metadata = {
  title: "Stickers pack",
  description: "Detalle del producto Premium simulado.",
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
