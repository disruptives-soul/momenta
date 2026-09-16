import { Container } from "@/components/layout/container";
import { CheckoutSuccessView } from "@/features/cart/components/checkout-success-view";

export const metadata = {
  title: "Pedido confirmado",
  description: "Pedido demo confirmado en Momenta.",
};

export default function CheckoutSuccessPage() {
  return (
    <main>
      <Container className="py-10 md:py-14">
        <CheckoutSuccessView />
      </Container>
    </main>
  );
}
