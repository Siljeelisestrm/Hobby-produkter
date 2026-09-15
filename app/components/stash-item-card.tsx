import { STASH_CATEGORY_LABELS } from "~/types/stash";
import type { StashItem } from "~/types/stash";

type StashItemCardProps = {
  item: StashItem;
  onSelect: (item: StashItem) => void;
};

export function StashItemCard({ item, onSelect }: StashItemCardProps) {
  return (
    <button
      type="button"
      className="stash-item-card"
      onClick={() => onSelect(item)}
    >
      <div className="stash-item-card__image-wrapper">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title || STASH_CATEGORY_LABELS[item.category]}
            className="stash-item-card__image"
          />
        ) : (
          <div className="stash-item-card__placeholder" aria-hidden="true">
            🧶
          </div>
        )}
        <span className="status-badge stash-item-card__badge">
          {STASH_CATEGORY_LABELS[item.category]}
        </span>
      </div>
      <div className="stash-item-card__content">
        <p className="stash-item-card__title">
          {item.title || STASH_CATEGORY_LABELS[item.category]}
        </p>
        <p className="stash-item-card__meta">
          {item.category === "stoff" && (item.widthCm || item.lengthCm)
            ? `${item.widthCm ?? "?"} × ${item.lengthCm ?? "?"} cm`
            : `Antall: ${item.quantity}`}
          {typeof item.priceNok === "number" ? ` · ${item.priceNok} kr` : ""}
        </p>
      </div>
    </button>
  );
}
