import { useState } from "react";

import type { Route } from "./+types/add-product";
import { AddProductForm } from "~/components/add-product-form";
import { SiteHeader } from "~/components/site-header";
import { createProduct, type CreateProductInput } from "~/lib/products";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Legg til produkt | Hjemmelagde Ting" },
    {
      name: "description",
      content: "Legg til nytt produkt med bilde og status.",
    },
  ];
}

export default function AddProduct() {
  const [isCreating, setIsCreating] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);

  const handleCreateProduct = async (input: CreateProductInput): Promise<boolean> => {
    setIsCreating(true);
    setCreateErrorMessage(null);
    setCreateSuccessMessage(null);

    try {
      await createProduct(input);
      setCreateSuccessMessage("Produktet ble lagret.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setCreateErrorMessage(message);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="page">
      <SiteHeader />

      <main className="content">
        <section className="intro">
          <h1>Legg til nytt produkt</h1>
          <p>Fyll inn informasjon og last opp bilde direkte fra nettsiden.</p>
        </section>

        <AddProductForm
          isSubmitting={isCreating}
          submitError={createErrorMessage}
          submitSuccess={createSuccessMessage}
          onSubmit={handleCreateProduct}
        />
      </main>
    </div>
  );
}
