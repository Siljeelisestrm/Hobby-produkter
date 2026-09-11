import { useState } from "react";
import type { FormEvent } from "react";

import type { CreateProductInput } from "~/lib/products";
import type { ProjectStatus } from "~/types/project";

type AddProductFormProps = {
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onSubmit: (input: CreateProductInput) => Promise<boolean>;
};

const defaultStatus: ProjectStatus = "beholdt";

export function AddProductForm({
  isSubmitting,
  submitError,
  submitSuccess,
  onSubmit,
}: AddProductFormProps) {
  const [status, setStatus] = useState<ProjectStatus>(defaultStatus);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const details = String(formData.get("details") ?? "").trim();
    const selectedStatus = String(formData.get("status") ?? defaultStatus);
    const soldPriceRaw = String(formData.get("soldPriceNok") ?? "").trim();
    const imageFileValue = formData.get("imageFile");

    if (
      selectedStatus !== "beholdt" &&
      selectedStatus !== "vurderes-solgt" &&
      selectedStatus !== "solgt"
    ) {
      setFormError("Ugyldig status valgt.");
      return;
    }

    let soldPriceNok: number | undefined;
    if (selectedStatus === "solgt") {
      if (!soldPriceRaw) {
        setFormError("Legg inn salgspris når status er Solgt.");
        return;
      }

      const parsedPrice = Number(soldPriceRaw);
      if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
        setFormError("Salgspris må være et heltall på 0 eller mer.");
        return;
      }

      soldPriceNok = parsedPrice;
    }

    const imageFile = imageFileValue instanceof File && imageFileValue.size > 0
      ? imageFileValue
      : undefined;

    const wasSaved = await onSubmit({
      title,
      description,
      details: details || undefined,
      status: selectedStatus,
      soldPriceNok,
      imageFile,
    });

    if (wasSaved) {
      form.reset();
      setStatus(defaultStatus);
      setFormError(null);
    }
  };

  return (
    <section className="product-form-section" aria-label="Legg til produkt">
      <h2>Legg til nytt produkt</h2>
      <form className="product-form" onSubmit={handleSubmit}>
        <label className="form-field">
          Tittel
          <input name="title" type="text" required disabled={isSubmitting} />
        </label>

        <label className="form-field">
          Kort beskrivelse
          <textarea
            name="description"
            rows={3}
            required
            disabled={isSubmitting}
          />
        </label>

        <label className="form-field">
          Ekstra detaljer
          <textarea name="details" rows={4} disabled={isSubmitting} />
        </label>

        <label className="form-field">
          Status
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectStatus)}
            disabled={isSubmitting}
          >
            <option value="beholdt">Beholdt</option>
            <option value="vurderes-solgt">Vurderes solgt</option>
            <option value="solgt">Solgt</option>
          </select>
        </label>

        {status === "solgt" ? (
          <label className="form-field">
            Salgspris (NOK)
            <input
              name="soldPriceNok"
              type="number"
              min={0}
              step={1}
              required
              disabled={isSubmitting}
            />
          </label>
        ) : null}

        <label className="form-field">
          Bilde
          <input
            name="imageFile"
            type="file"
            accept="image/*"
            disabled={isSubmitting}
          />
        </label>

        {formError ? <p className="state-message error">{formError}</p> : null}
        {submitError ? <p className="state-message error">{submitError}</p> : null}
        {submitSuccess ? <p className="state-message success">{submitSuccess}</p> : null}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Lagrer..." : "Lagre produkt"}
        </button>
      </form>
    </section>
  );
}
