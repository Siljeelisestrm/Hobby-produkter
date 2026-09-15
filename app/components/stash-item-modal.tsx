import { useState } from "react";
import { StashItemForm } from "~/components/stash-item-form";
import { STASH_CATEGORY_LABELS } from "~/types/stash";
import type { StashCategory, StashItem } from "~/types/stash";

type StashItemModalProps = {
  item: StashItem;
  isUpdating: boolean;
  updateErrorMessage: string | null;
  isDeleting: boolean;
  deleteErrorMessage: string | null;
  onUpdate: (input: {
    category: StashCategory;
    title: string;
    quantity: number;
    priceNok?: number;
    imageFile?: File;
    removeExistingImage: boolean;
  }) => Promise<boolean>;
  onDelete: () => Promise<void>;
  onClose: () => void;
};

export function StashItemModal({
  item,
  isUpdating,
  updateErrorMessage,
  isDeleting,
  deleteErrorMessage,
  onUpdate,
  onDelete,
  onClose,
}: StashItemModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel stash-item-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Bibliotekelement"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Lukk"
        >
          <span className="icon-mark icon-mark--close" aria-hidden="true" />
        </button>

        {isEditing ? (
          <StashItemForm
            initialItem={item}
            isSubmitting={isUpdating}
            submitError={updateErrorMessage}
            submitLabel="Lagre endringer"
            onSubmit={async (input) => {
              const succeeded = await onUpdate(input);
              if (succeeded) {
                setIsEditing(false);
              }
              return succeeded;
            }}
          />
        ) : (
          <>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title || STASH_CATEGORY_LABELS[item.category]}
                className="stash-item-modal__image"
              />
            ) : null}
            <div className="modal-details">
              <span className="status-badge">
                {STASH_CATEGORY_LABELS[item.category]}
              </span>
              <h2>{item.title || STASH_CATEGORY_LABELS[item.category]}</h2>
              {item.category === "stoff" && (item.widthCm || item.lengthCm) ? (
                <p>
                  Mål: {item.widthCm ?? "?"} × {item.lengthCm ?? "?"} cm
                </p>
              ) : (
                <p>Antall: {item.quantity}</p>
              )}
              {typeof item.priceNok === "number" ? (
                <p>Pris: {item.priceNok} kr</p>
              ) : null}
            </div>

            {deleteErrorMessage ? (
              <p className="state-message error">{deleteErrorMessage}</p>
            ) : null}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsEditing(true)}
              >
                Rediger
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={isDeleting}
                onClick={() => void onDelete()}
              >
                {isDeleting ? "Sletter..." : "Slett"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
