import { useState } from "react";
import type { FormEvent } from "react";
import {
  STASH_CATEGORIES,
  STASH_CATEGORY_LABELS,
} from "~/types/stash";
import type { StashCategory, StashItem } from "~/types/stash";

type StashItemFormProps = {
  initialItem?: StashItem;
  isSubmitting: boolean;
  submitError: string | null;
  submitLabel: string;
  onSubmit: (input: {
    category: StashCategory;
    title: string;
    quantity: number;
    widthCm?: number;
    lengthCm?: number;
    priceNok?: number;
    imageFile?: File;
    removeExistingImage: boolean;
  }) => Promise<boolean>;
};

export function StashItemForm({
  initialItem,
  isSubmitting,
  submitError,
  submitLabel,
  onSubmit,
}: StashItemFormProps) {
  const [category, setCategory] = useState<StashCategory>(
    initialItem?.category ?? "garn",
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialItem?.imageUrl ?? null,
  );
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImageFile(file);
    setRemoveExistingImage(false);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(undefined);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const priceRaw = String(formData.get("priceNok") ?? "").trim();

    let quantity = 1;
    let widthCm: number | undefined;
    let lengthCm: number | undefined;

    if (category === "stoff") {
      const widthRaw = String(formData.get("widthCm") ?? "").trim();
      const lengthRaw = String(formData.get("lengthCm") ?? "").trim();

      if (widthRaw) {
        widthCm = Number(widthRaw);
        if (Number.isNaN(widthCm) || widthCm < 0) {
          setFormError("Bredde må være et gyldig tall.");
          return;
        }
      }

      if (lengthRaw) {
        lengthCm = Number(lengthRaw);
        if (Number.isNaN(lengthCm) || lengthCm < 0) {
          setFormError("Lengde må være et gyldig tall.");
          return;
        }
      }
    } else {
      const quantityRaw = String(formData.get("quantity") ?? "").trim();
      quantity = quantityRaw ? Number(quantityRaw) : 1;
      if (Number.isNaN(quantity) || quantity < 0) {
        setFormError("Antall må være et gyldig tall.");
        return;
      }
    }

    let priceNok: number | undefined;
    if (priceRaw) {
      priceNok = Number(priceRaw);
      if (Number.isNaN(priceNok) || priceNok < 0) {
        setFormError("Pris må være et gyldig tall.");
        return;
      }
    }

    const succeeded = await onSubmit({
      category,
      title,
      quantity,
      widthCm,
      lengthCm,
      priceNok,
      imageFile,
      removeExistingImage,
    });

    if (succeeded && !initialItem) {
      form.reset();
      setCategory("garn");
      setImagePreview(null);
      setImageFile(undefined);
      setRemoveExistingImage(false);
    }
  };

  return (
    <form className="product-form stash-item-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="stash-category">Kategori</label>
        <select
          id="stash-category"
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value as StashCategory)}
        >
          {STASH_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {STASH_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="stash-title">Navn (valgfritt)</label>
        <input
          id="stash-title"
          name="title"
          type="text"
          defaultValue={initialItem?.title ?? ""}
          placeholder="F.eks. Rosa merinoull"
        />
      </div>

      {category === "stoff" ? (
        <div className="form-field form-field--dimensions">
          <label htmlFor="stash-width">Mål på stoffet (cm)</label>
          <div className="stash-dimensions-row">
            <input
              id="stash-width"
              name="widthCm"
              type="number"
              min={0}
              step="0.1"
              defaultValue={initialItem?.widthCm ?? ""}
              placeholder="Bredde"
              aria-label="Bredde i cm"
            />
            <span aria-hidden="true">×</span>
            <input
              id="stash-length"
              name="lengthCm"
              type="number"
              min={0}
              step="0.1"
              defaultValue={initialItem?.lengthCm ?? ""}
              placeholder="Lengde"
              aria-label="Lengde i cm"
            />
          </div>
        </div>
      ) : (
        <div className="form-field">
          <label htmlFor="stash-quantity">Antall</label>
          <input
            id="stash-quantity"
            name="quantity"
            type="number"
            min={0}
            step="0.1"
            defaultValue={initialItem?.quantity ?? 1}
            required
          />
        </div>
      )}

      <div className="form-field">
        <label htmlFor="stash-price">Pris i kr (valgfritt)</label>
        <input
          id="stash-price"
          name="priceNok"
          type="number"
          min={0}
          step="0.01"
          defaultValue={initialItem?.priceNok ?? ""}
          placeholder="F.eks. 89"
        />
      </div>

      <div className="form-field">
        <label htmlFor="stash-image">Bilde</label>
        <input
          id="stash-image"
          name="imageFile"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview ? (
          <div className="stash-item-form__preview">
            <img src={imagePreview} alt="Forhåndsvisning" />
            <button
              type="button"
              className="secondary-button"
              onClick={handleRemoveImage}
            >
              Fjern bilde
            </button>
          </div>
        ) : null}
      </div>

      {formError ? <p className="state-message error">{formError}</p> : null}
      {submitError ? <p className="state-message error">{submitError}</p> : null}

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? "Lagrer..." : submitLabel}
      </button>
    </form>
  );
}
