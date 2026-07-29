export type UserPlan = "free" | "premium";

export type User = {
  id: string;
  email: string;
  plan: UserPlan;
  createdAt: Date;
};
