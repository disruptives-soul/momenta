import { Container } from "@/components/layout/container";
import { MockCheckoutSuccess } from "@/features/premium/components/mock-checkout-success";

export const metadata = {
  title: "Interés confirmado",
  description: "Confirmación de intención Premium simulada.",
};

export default function MockCheckoutSuccessPage() {
  return (
    <main>
      <Container className="py-8 md:py-12">
        <MockCheckoutSuccess />
      </Container>
    </main>
  );
}
