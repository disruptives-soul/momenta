export type CreateCheckoutInput = {
  purchaseId: string;
  productId: string;
  amountCents: number;
  currency: string;
  successUrl: string;
  failureUrl: string;
};

export type CheckoutSession = {
  providerReference: string;
  checkoutUrl: string;
};

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
}
