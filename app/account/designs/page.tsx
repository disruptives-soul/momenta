import { Container } from "@/components/layout/container";
import { AccountDesignsView } from "@/features/purchased-projects/components/account-designs-view";

export const metadata = {
  title: "Mis disenos",
  description: "Disenos comprados y editables en Momenta.",
};

export default function AccountDesignsPage() {
  return (
    <main>
      <Container className="py-10 md:py-14">
        <AccountDesignsView />
      </Container>
    </main>
  );
}
