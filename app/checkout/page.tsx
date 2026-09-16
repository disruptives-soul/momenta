import { Container } from "@/components/layout/container";
import { CartCheckoutView } from "@/features/cart/components/cart-checkout-view";

export const metadata = {
  title: "Checkout",
  description: "Confirmacion de productos personalizados en Momenta.",
};

export default function CheckoutPage() {
  return (
    <main>
      <Container className="py-10 md:py-14">
        <CartCheckoutView />
      </Container>
    </main>
  );
}
