import type {
  PersonalizationLayoutOverrides,
  PersonalizationValues,
} from "@/features/personalization/types/personalization-draft";
import { TemplatePreview } from "@/features/rendering/components/template-preview";
import type { TextElement } from "@/features/rendering/templates/template-types";

type PrototypeInvitationPreviewProps = {
  values: PersonalizationValues;
  layout?: PersonalizationLayoutOverrides;
  scene?: TextElement[];
  templateId?: string;
  compact?: boolean;
};

export function PrototypeInvitationPreview({
  values,
  layout,
  scene,
  templateId,
  compact = false,
}: PrototypeInvitationPreviewProps) {
  return (
    <TemplatePreview
      compact={compact}
      layout={layout}
      scene={scene}
      templateId={templateId}
      values={values}
    />
  );
}
