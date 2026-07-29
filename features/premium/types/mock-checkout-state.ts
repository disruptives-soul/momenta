export type MockCheckoutState =
  | "idle"
  | "reviewing"
  | "confirming"
  | "completed"
  | "cancelled"
  | "failed";
