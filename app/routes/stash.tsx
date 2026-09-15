import { useEffect, useMemo, useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { StashItemCard } from "~/components/stash-item-card";
import { StashItemForm } from "~/components/stash-item-form";
import { StashItemModal } from "~/components/stash-item-modal";
import { useAuth } from "~/context/auth-context";
import {
  createStashItem,
  deleteStashItem,
  fetchStashItems,
  updateStashItem,
} from "~/lib/stash";
import { STASH_CATEGORIES, STASH_CATEGORY_LABELS } from "~/types/stash";
import type { StashCategory, StashItem } from "~/types/stash";

type CategoryFilter = "all" | StashCategory;

export default function Stash() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<StashItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedItem, setSelectedItem] = useState<StashItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(
    null,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const data = await fetchStashItems(user.id);
        if (!isCancelled) {
          setItems(data);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof Error ? error.message : "Ukjent feil.";
          setErrorMessage(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + (item.priceNok ?? 0), 0),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      categoryFilter === "all"
        ? items
        : items.filter((item) => item.category === categoryFilter),
    [items, categoryFilter],
  );

  const handleCreate = async (input: {
    category: StashCategory;
    title: string;
    quantity: number;
    widthCm?: number;
    lengthCm?: number;
    priceNok?: number;
    imageFile?: File;
  }): Promise<boolean> => {
    if (!user) {
      setCreateErrorMessage("Du må være logget inn.");
      return false;
    }

    setIsCreating(true);
    setCreateErrorMessage(null);
    try {
      const created = await createStashItem(user.id, input);
      setItems((current) => [created, ...current]);
      setIsAddModalOpen(false);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setCreateErrorMessage(message);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (input: {
    category: StashCategory;
    title: string;
    quantity: number;
    widthCm?: number;
    lengthCm?: number;
    priceNok?: number;
    imageFile?: File;
    removeExistingImage: boolean;
  }): Promise<boolean> => {
    if (!selectedItem) {
      return false;
    }

    setIsUpdating(true);
    setUpdateErrorMessage(null);
    try {
      const updated = await updateStashItem(selectedItem, {
        category: input.category,
        title: input.title,
        quantity: input.quantity,
        widthCm: input.widthCm,
        lengthCm: input.lengthCm,
        priceNok: input.priceNok,
        imageFile: input.imageFile,
        keepExistingImage: !input.removeExistingImage,
      });
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedItem(updated);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setUpdateErrorMessage(message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedItem) {
      return;
    }

    const userConfirmed = window.confirm(
      `Er du sikker på at du vil slette "${selectedItem.title || STASH_CATEGORY_LABELS[selectedItem.category]}"?`,
    );
    if (!userConfirmed) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await deleteStashItem(selectedItem.id);
      setItems((current) => current.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setDeleteErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <main className="content">
        <p className="state-message">Laster bruker...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="content">
        <section className="intro">
          <h1>Hobbybibliotek</h1>
          <p>Logg inn for å se ditt hobbybibliotek.</p>
        </section>
        <AuthForm />
      </main>
    );
  }

  return (
    <>
      <main className="content" aria-label="Hobbybibliotek">
        <section className="intro">
          <div className="intro-top">
            <h1>Hobbybibliotek</h1>
            <button
              type="button"
              className="icon-button"
              aria-label="Legg til i biblioteket"
              title="Legg til i biblioteket"
              onClick={() => setIsAddModalOpen(true)}
            >
              <span className="icon-mark icon-mark--plus" aria-hidden="true" />
            </button>
          </div>
          <p>
            Oversikt over garn, stoff, perler og annet du har liggende. Total
            verdi: {totalValue} kr.
          </p>
        </section>

        <div className="stash-category-tabs" role="tablist" aria-label="Kategori">
          <button
            type="button"
            role="tab"
            aria-selected={categoryFilter === "all"}
            className={
              categoryFilter === "all"
                ? "stash-category-tabs__button is-active"
                : "stash-category-tabs__button"
            }
            onClick={() => setCategoryFilter("all")}
          >
            Alle
          </button>
          {STASH_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={categoryFilter === category}
              className={
                categoryFilter === category
                  ? "stash-category-tabs__button is-active"
                  : "stash-category-tabs__button"
              }
              onClick={() => setCategoryFilter(category)}
            >
              {STASH_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        {isLoading ? <p className="state-message">Laster biblioteket...</p> : null}
        {errorMessage ? (
          <p className="state-message error">{errorMessage}</p>
        ) : null}

        {!isLoading && !errorMessage && items.length === 0 ? (
          <p className="state-message">
            Ingen ting registrert enda. Trykk + for å legge til.
          </p>
        ) : null}

        {!isLoading && !errorMessage && items.length > 0 && filteredItems.length === 0 ? (
          <p className="state-message">Ingen ting i denne kategorien enda.</p>
        ) : null}

        {filteredItems.length > 0 ? (
          <section className="stash-grid" aria-label="Bibliotek">
            {filteredItems.map((item) => (
              <StashItemCard
                key={item.id}
                item={item}
                onSelect={setSelectedItem}
              />
            ))}
          </section>
        ) : null}
      </main>

      {isAddModalOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="modal-panel add-product-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Legg til i biblioteket"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setIsAddModalOpen(false)}
              aria-label="Lukk"
            >
              <span className="icon-mark icon-mark--close" aria-hidden="true" />
            </button>
            <StashItemForm
              isSubmitting={isCreating}
              submitError={createErrorMessage}
              submitLabel="Legg til"
              onSubmit={handleCreate}
            />
          </div>
        </div>
      ) : null}

      {selectedItem ? (
        <StashItemModal
          item={selectedItem}
          isUpdating={isUpdating}
          updateErrorMessage={updateErrorMessage}
          isDeleting={isDeleting}
          deleteErrorMessage={deleteErrorMessage}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => {
            setUpdateErrorMessage(null);
            setDeleteErrorMessage(null);
            setSelectedItem(null);
          }}
        />
      ) : null}
    </>
  );
}
