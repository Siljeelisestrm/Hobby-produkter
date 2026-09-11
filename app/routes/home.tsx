import { useEffect, useState } from "react";
import { ProductDetailsModal } from "~/components/product-details-modal";
import { ProjectCard } from "~/components/project-card";
import {
  deleteProduct,
  fetchProducts,
  setProductFavorite,
  type UpdateProductInput,
  updateProduct,
} from "~/lib/products";
import type { ProjectItem } from "~/types/project";

export default function Home() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isCancelled = false;

    const loadProducts = async () => {
      try {
        const data = await fetchProducts();

        if (!isCancelled) {
          setProjects(data);
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

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, []);

  const sortedProjects = [...projects].sort((a, b) => {
    const yearA = a.madeYear ?? Number.NEGATIVE_INFINITY;
    const yearB = b.madeYear ?? Number.NEGATIVE_INFINITY;

    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });

  const availableYears = Array.from(
    new Set(
      sortedProjects
        .map((project) => project.madeYear)
        .filter((year): year is number => typeof year === "number"),
    ),
  ).sort((a, b) => b - a);
  const filteredProjects =
    selectedYear === "all"
      ? sortedProjects
      : sortedProjects.filter(
          (project) => project.madeYear === Number(selectedYear),
        );
  const hasProjects = filteredProjects.length > 0;
  const hasAnyProjects = projects.length > 0;
  const handleSelectProject = (project: ProjectItem) => {
    setDeleteErrorMessage(null);
    setUpdateErrorMessage(null);
    setSelectedProject(project);
  };

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
          currentProject.id === updatedProduct.id
            ? updatedProduct
            : currentProject,
        ),
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
        currentProjects.filter(
          (currentProject) => currentProject.id !== project.id,
        ),
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
          currentProject.id === updatedProduct.id
            ? updatedProduct
            : currentProject,
        ),
      );
      setSelectedProject(updatedProduct);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setUpdateErrorMessage(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <main className="content" aria-label="Prosjektoversikt">
        <section className="intro">
          <h1>Mine hjemmelagde ting</h1>
          <p>Dette er jo en litt gøyal måte å holde styr på alt.</p>
        </section>

        {isLoading ? (
          <p className="state-message">Laster produkter...</p>
        ) : null}

        {errorMessage ? (
          <p className="state-message error">{errorMessage}</p>
        ) : null}

        {!isLoading && !errorMessage && hasAnyProjects ? (
          <section className="filter-row" aria-label="Filtrering">
            <label className="form-field filter-field">
              År
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                <option value="all">Alle</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </section>
        ) : null}

        {!isLoading && !errorMessage && !hasAnyProjects ? (
          <p className="state-message">
            Ingen produkter enda. Legg inn første produkt i Supabase.
          </p>
        ) : null}

        {!isLoading && !errorMessage && hasAnyProjects && !hasProjects ? (
          <p className="state-message">Ingen produkter for valgt år.</p>
        ) : null}

        {hasProjects ? (
          <section className="project-grid" aria-label="Prosjekter">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={handleSelectProject}
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
          onToggleFavorite={handleToggleFavorite}
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
