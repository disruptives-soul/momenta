import { Container } from "@/components/layout/container";
import { CartView } from "@/features/cart/components/cart-view";

export const metadata = {
  title: "Carrito",
  description: "Productos personalizados listos para comprar en Momenta.",
};

export default function CartPage() {
  return (
    <main>
      <Container className="py-10 md:py-14">
        <CartView />
      </Container>
    </main>
  );
}
