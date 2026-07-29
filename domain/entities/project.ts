export type ProjectStatus =
  | "draft"
  | "ready"
  | "rendering"
  | "completed"
  | "failed"
  | "archived";

export type Project = {
  id: string;
  userId: string;
  collectionId: string;
  productId: string;
  status: ProjectStatus;
  variables: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
};
