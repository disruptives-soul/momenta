import type { PublicCollection } from "../types/public-collection";
import { PlaceholderArtwork } from "@/features/prototype/components/placeholder-artwork";
import { spaceBirthdayAssets } from "../data/space-birthday-assets";

type CollectionGalleryProps = {
  collection: PublicCollection;
};

export function CollectionGallery({ collection }: CollectionGalleryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_0.7fr]">
      <PlaceholderArtwork
        description={spaceBirthdayAssets.cover.description}
        label={spaceBirthdayAssets.cover.label}
        title={collection.name}
        variant="cover"
      />
      <div className="grid gap-4">
        <PlaceholderArtwork
          description={spaceBirthdayAssets.invitationPreview.description}
          label={spaceBirthdayAssets.invitationPreview.label}
          title={spaceBirthdayAssets.invitationPreview.title}
          variant="invitation"
        />
        <PlaceholderArtwork
          description={spaceBirthdayAssets.stickersPreview.description}
          label={spaceBirthdayAssets.stickersPreview.label}
          title={spaceBirthdayAssets.stickersPreview.title}
          variant="stickers"
        />
      </div>
    </div>
  );
}
