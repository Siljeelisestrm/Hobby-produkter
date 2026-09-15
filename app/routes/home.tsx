import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AddProductForm } from "~/components/add-product-form";
import { AuthForm } from "~/components/auth-form";
import { DashboardPanel } from "~/components/dashboard-panel";
import { ProductDetailsModal } from "~/components/product-details-modal";
import { ProjectCard } from "~/components/project-card";
import { useAuth } from "~/context/auth-context";
import {
  createProduct,
  deleteProduct,
  fetchUserProducts,
  setProductFavorite,
  setProductShared,
  type CreateProductInput,
  type UpdateProductInput,
  updateProduct,
} from "~/lib/products";
import type { ProjectItem } from "~/types/project";

type ShareFilter = "all" | "shared" | "private";
type HomeView = "products" | "dashboard";

export default function Home() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [homeView, setHomeView] = useState<HomeView>("products");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [shareFilter, setShareFilter] = useState<ShareFilter>("all");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setIsAddModalOpen(params.get("new") === "1");
  }, [location.search]);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    const loadProducts = async () => {
      try {
        const data = await fetchUserProducts(user.id);
        if (!isCancelled) {
          setProjects(data);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : "Ukjent feil.";
          setErrorMessage(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) => {
        const yearA = a.madeYear ?? Number.NEGATIVE_INFINITY;
        const yearB = b.madeYear ?? Number.NEGATIVE_INFINITY;
        if (yearA !== yearB) {
          return yearB - yearA;
        }

        return b.createdAt.localeCompare(a.createdAt);
      }),
    [projects],
  );

  const availableYears = Array.from(
    new Set(
      sortedProjects
        .map((project) => project.madeYear)
        .filter((year): year is number => typeof year === "number"),
    ),
  ).sort((a, b) => b - a);

  const filteredProjects = sortedProjects.filter((project) => {
    const yearPass = selectedYear === "all" || project.madeYear === Number(selectedYear);
    const sharePass =
      shareFilter === "all" ||
      (shareFilter === "shared" ? project.isShared : !project.isShared);

    return yearPass && sharePass;
  });

  const hasProjects = filteredProjects.length > 0;
  const hasAnyProjects = projects.length > 0;

  const closeAddModal = () => {
    const params = new URLSearchParams(location.search);
    params.delete("new");
    const query = params.toString();
    navigate(query ? `/?${query}` : "/", { replace: true });
  };

  const openAddModal = () => {
    const params = new URLSearchParams(location.search);
    params.set("new", "1");
    navigate(`/?${params.toString()}`, { replace: false });
  };

  const handleSelectProject = (project: ProjectItem) => {
    setDeleteErrorMessage(null);
    setUpdateErrorMessage(null);
    setSelectedProject(project);
  };

  const handleCreateProduct = async (input: CreateProductInput): Promise<boolean> => {
    if (!user) {
      setCreateErrorMessage("Du må være logget inn for å lage produkter.");
      return false;
    }

    setIsCreating(true);
    setCreateErrorMessage(null);
    setCreateSuccessMessage(null);

    try {
      const createdProduct = await createProduct(input);
      setProjects((current) => [createdProduct, ...current]);
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

  const handleUpdateProduct = async (
    project: ProjectItem,
    input: UpdateProductInput,
  ): Promise<boolean> => {
    setIsUpdating(true);
    setUpdateErrorMessage(null);

    try {
      const updatedProduct = await updateProduct(project, input);
      setProjects((current) =>
        current.map((item) => (item.id === updatedProduct.id ? updatedProduct : item)),
      );
      setSelectedProject(updatedProduct);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setUpdateErrorMessage(message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async (project: ProjectItem): Promise<void> => {
    const userConfirmed = window.confirm(
      `Er du sikker på at du vil slette "${project.title}"?`,
    );
    if (!userConfirmed) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      await deleteProduct(project);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setSelectedProject(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setDeleteErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFavorite = async (
    project: ProjectItem,
    isFavorite: boolean,
  ): Promise<void> => {
    setIsUpdating(true);
    setUpdateErrorMessage(null);

    try {
      const updatedProduct = await setProductFavorite(project.id, isFavorite);
      setProjects((current) =>
        current.map((item) => (item.id === updatedProduct.id ? updatedProduct : item)),
      );
      setSelectedProject(updatedProduct);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setUpdateErrorMessage(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleShare = async (
    project: ProjectItem,
    isShared: boolean,
  ): Promise<void> => {
    setIsUpdating(true);
    setUpdateErrorMessage(null);

    try {
      const updatedProduct = await setProductShared(project.id, isShared);
      setProjects((current) =>
        current.map((item) => (item.id === updatedProduct.id ? updatedProduct : item)),
      );
      setSelectedProject(updatedProduct);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setUpdateErrorMessage(message);
    } finally {
      setIsUpdating(false);
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
          <h1>Min side</h1>
          <p>Logg inn for å se og administrere dine private produkter.</p>
        </section>
        <AuthForm />
      </main>
    );
  }

  return (
    <>
      <main className="content" aria-label="Min side">
        <section className="intro">
          <div className="intro-top">
            <h1>Min side</h1>
            {homeView === "products" ? (
              <button
                type="button"
                className="icon-button"
                aria-label="Legg til produkt"
                title="Legg til produkt"
                onClick={openAddModal}
              >
                <span className="icon-mark icon-mark--plus" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <p>Hei {profile?.username ?? "der"}!</p>
          <div className="view-toggle" role="tablist" aria-label="Visning">
            <button
              type="button"
              role="tab"
              aria-selected={homeView === "products"}
              className={
                homeView === "products"
                  ? "view-toggle__button is-active"
                  : "view-toggle__button"
              }
              onClick={() => setHomeView("products")}
            >
              Produkter/profil
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={homeView === "dashboard"}
              className={
                homeView === "dashboard"
                  ? "view-toggle__button is-active"
                  : "view-toggle__button"
              }
              onClick={() => setHomeView("dashboard")}
            >
              Dashboard
            </button>
          </div>
        </section>

        {homeView === "dashboard" ? <DashboardPanel ownerId={user.id} /> : null}

        {homeView === "products" ? (
          <>
            {isLoading ? <p className="state-message">Laster produkter...</p> : null}
            {errorMessage ? <p className="state-message error">{errorMessage}</p> : null}

            {!isLoading && !errorMessage && hasAnyProjects ? (
              <section className="filter-row filter-row--double" aria-label="Filtrering">
                <select
                  className="filter-select"
                  aria-label="Filtrer på år"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                >
                  <option value="all">Alle år</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  aria-label="Filtrer på publisering"
                  value={shareFilter}
                  onChange={(event) => setShareFilter(event.target.value as ShareFilter)}
                >
                  <option value="all">Alle</option>
                  <option value="shared">Publisert</option>
                  <option value="private">Ikke publisert</option>
                </select>
              </section>
            ) : null}

            {!isLoading && !errorMessage && !hasAnyProjects ? (
              <p className="state-message">Ingen produkter enda. Trykk + for å legge til.</p>
            ) : null}

            {!isLoading && !errorMessage && hasAnyProjects && !hasProjects ? (
              <p className="state-message">Ingen produkter for valgt filter.</p>
            ) : null}

            {hasProjects ? (
              <section className="project-grid" aria-label="Produkter">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    showLikes
                    showShareState
                    onSelect={handleSelectProject}
                  />
                ))}
              </section>
            ) : null}
          </>
        ) : null}
      </main>

      {isAddModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeAddModal}>
          <div
            className="modal-panel add-product-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Legg til produkt"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeAddModal}
              aria-label="Lukk legg til produkt"
            >
              <span className="icon-mark icon-mark--close" aria-hidden="true" />
            </button>
            <AddProductForm
              isSubmitting={isCreating}
              submitError={createErrorMessage}
              submitSuccess={createSuccessMessage}
              onSubmit={handleCreateProduct}
            />
          </div>
        </div>
      ) : null}

      {selectedProject ? (
        <ProductDetailsModal
          project={selectedProject}
          isDeleting={isDeleting}
          deleteErrorMessage={deleteErrorMessage}
          isUpdating={isUpdating}
          updateErrorMessage={updateErrorMessage}
          showFavoriteToggle
          showShareToggle
          shareLabel="Del med venner"
          onToggleFavorite={handleToggleFavorite}
          onToggleShare={handleToggleShare}
          onUpdate={handleUpdateProduct}
          onDelete={handleDeleteProduct}
          onClose={() => {
            setDeleteErrorMessage(null);
            setUpdateErrorMessage(null);
            setSelectedProject(null);
          }}
        />
      ) : null}
    </>
  );
}
