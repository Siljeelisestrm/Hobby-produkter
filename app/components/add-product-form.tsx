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
  const maxAllowedYear = new Date().getFullYear() + 1;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const details = String(formData.get("details") ?? "").trim();
    const madeYearRaw = String(formData.get("madeYear") ?? "").trim();
    const selectedStatus = String(formData.get("status") ?? defaultStatus);
    const soldPriceRaw = String(formData.get("soldPriceNok") ?? "").trim();
    const imageFileValues = formData.getAll("imageFiles");

    if (
      selectedStatus !== "beholdt" &&
      selectedStatus !== "vurderes-solgt" &&
      selectedStatus !== "solgt" &&
      selectedStatus !== "gave"
    ) {
      setFormError("Ugyldig status valgt.");
      return;
    }

    let soldPriceNok: number | undefined;
    let madeYear: number | undefined;
    if (madeYearRaw) {
      const parsedYear = Number(madeYearRaw);
      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 1900 ||
        parsedYear > maxAllowedYear
      ) {
        setFormError(`Årstall må være et heltall mellom 1900 og ${maxAllowedYear}.`);
        return;
      }

      madeYear = parsedYear;
    }

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

    const imageFiles = imageFileValues.filter(
      (value): value is File => value instanceof File && value.size > 0,
    );
    if (imageFiles.length === 0) {
      setFormError("Du må legge til minst ett bilde.");
      return;
    }

    const wasSaved = await onSubmit({
      title,
      description,
      details: details || undefined,
      madeYear,
      status: selectedStatus,
      soldPriceNok,
      imageFiles,
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
          Kort beskrivelse (valgfritt)
          <textarea
            name="description"
            rows={2}
            disabled={isSubmitting}
          />
        </label>

        <label className="form-field">
          Ekstra detaljer
          <textarea name="details" rows={2} disabled={isSubmitting} />
        </label>

        <label className="form-field">
          År laget (valgfritt)
          <input
            name="madeYear"
            type="number"
            min={1900}
            max={maxAllowedYear}
            step={1}
            disabled={isSubmitting}
          />
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
            <option value="gave">Gave</option>
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
          Bilder
          <input
            name="imageFiles"
            type="file"
            accept="image/*"
            multiple
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
