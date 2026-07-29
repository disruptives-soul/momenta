import { Container } from "@/components/layout/container";
import { MockCheckout } from "@/features/premium/components/mock-checkout";

type MockCheckoutPageProps = {
  searchParams: Promise<{
    simulateError?: string;
  }>;
};

export const metadata = {
  title: "Checkout simulado",
  description: "Checkout simulado para validar intención Premium.",
};

export default async function MockCheckoutPage({
  searchParams,
}: MockCheckoutPageProps) {
  const { simulateError } = await searchParams;

  return (
    <main>
      <Container className="py-8 md:py-12">
        <MockCheckout simulateError={simulateError === "1"} />
      </Container>
    </main>
  );
}
