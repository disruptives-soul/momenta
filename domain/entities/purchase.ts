export type PurchaseStatus = "pending" | "approved" | "rejected" | "refunded";

export type Purchase = {
  id: string;
  userId: string;
  productId: string;
  provider: "mercado-pago";
  providerReference: string;
  status: PurchaseStatus;
  amountCents: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};
