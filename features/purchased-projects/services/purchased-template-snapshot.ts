import type {
  PurchasedTemplateSnapshot,
} from "../types/purchased-project";
import type { InvitationTemplate } from "@/features/rendering/templates/template-types";

export function getRuntimeTemplateFromSnapshot(
  snapshot: PurchasedTemplateSnapshot,
): InvitationTemplate | null {
  if (!snapshot.fields || !snapshot.printProfile || !snapshot.textConstraints) {
    return null;
  }

  return snapshot as InvitationTemplate;
}
