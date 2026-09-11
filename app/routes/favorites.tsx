import { useEffect, useMemo, useState } from "react";
import { AuthForm } from "~/components/auth-form";
import { ProductDetailsModal } from "~/components/product-details-modal";
import { ProjectCard } from "~/components/project-card";
import { useAuth } from "~/context/auth-context";
import {
  deleteProduct,
  fetchUserProducts,
  setProductFavorite,
  setProductShared,
  type UpdateProductInput,
  updateProduct,
} from "~/lib/products";
import type { ProjectItem } from "~/types/project";

export default function Favorites() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);

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

  const favoriteProjects = useMemo(
    () => projects.filter((project) => project.isFavorite),
    [projects],
  );
  const sortedFavoriteProjects = [...favoriteProjects].sort((a, b) => {
    const yearA = a.madeYear ?? Number.NEGATIVE_INFINITY;
    const yearB = b.madeYear ?? Number.NEGATIVE_INFINITY;

    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
  const availableYears = Array.from(
    new Set(
      sortedFavoriteProjects
        .map((project) => project.madeYear)
        .filter((year): year is number => typeof year === "number"),
    ),
  ).sort((a, b) => b - a);

  const filteredFavoriteProjects =
    selectedYear === "all"
      ? sortedFavoriteProjects
      : sortedFavoriteProjects.filter(
          (project) => project.madeYear === Number(selectedYear),
        );
  const hasFavoriteProjects = filteredFavoriteProjects.length > 0;
  const hasAnyFavorites = favoriteProjects.length > 0;

  const handleUpdateProduct = async (
    project: ProjectItem,
    input: UpdateProductInput,
  ): Promise<boolean> => {
    setIsUpdating(true);
    setUpdateErrorMessage(null);

    try {
      const updatedProduct = await updateProduct(project, input);
      setProjects((currentProjects) =>
        currentProjects.map((currentProject) =>
          currentProject.id === updatedProduct.id ? updatedProduct : currentProject
        )
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
      setProjects((currentProjects) =>
        currentProjects.filter((currentProject) => currentProject.id !== project.id)
      );
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
      setProjects((currentProjects) =>
        currentProjects.map((currentProject) =>
          currentProject.id === updatedProduct.id ? updatedProduct : currentProject
        )
      );
      setSelectedProject(updatedProduct.isFavorite ? updatedProduct : null);
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
      setProjects((currentProjects) =>
        currentProjects.map((currentProject) =>
          currentProject.id === updatedProduct.id ? updatedProduct : currentProject
        )
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
          <h1>Favoritter</h1>
          <p>Logg inn for å se favoritter.</p>
        </section>
        <AuthForm />
      </main>
    );
  }

  return (
    <>
      <main className="content" aria-label="Favoritter">
        <section className="intro">
          <h1>Favoritter</h1>
          <p>Dine favorittmarkerte produkter.</p>
        </section>

        {isLoading ? <p className="state-message">Laster produkter...</p> : null}
        {errorMessage ? <p className="state-message error">{errorMessage}</p> : null}

        {!isLoading && !errorMessage && hasAnyFavorites ? (
          <section className="filter-row" aria-label="Filtrering">
            <select
              className="filter-select"
              aria-label="Filtrer favoritter på år"
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
          </section>
        ) : null}

        {!isLoading && !errorMessage && !hasAnyFavorites ? (
          <p className="state-message">Ingen favoritter enda.</p>
        ) : null}

        {!isLoading && !errorMessage && hasAnyFavorites && !hasFavoriteProjects ? (
          <p className="state-message">Ingen favoritter for valgt år.</p>
        ) : null}

        {hasFavoriteProjects ? (
          <section className="project-grid" aria-label="Favorittprodukter">
            {filteredFavoriteProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showLikes
                showShareState
                onSelect={setSelectedProject}
              />
            ))}
          </section>
        ) : null}
      </main>

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
