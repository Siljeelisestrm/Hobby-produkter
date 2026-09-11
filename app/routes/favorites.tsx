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

export default function Favorites() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);

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
          const message = error instanceof Error ? error.message : "Ukjent feil.";
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

  const favoriteProjects = projects.filter((project) => project.isFavorite);
  const hasFavoriteProjects = favoriteProjects.length > 0;

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

  return (
    <>
      <main className="content" aria-label="Favoritter">
        <section className="intro">
          <h1>Favoritter</h1>
          <p>Produkter du har markert som favoritt.</p>
        </section>

        {isLoading ? <p className="state-message">Laster produkter...</p> : null}

        {errorMessage ? <p className="state-message error">{errorMessage}</p> : null}

        {!isLoading && !errorMessage && !hasFavoriteProjects ? (
          <p className="state-message">Ingen favoritter enda.</p>
        ) : null}

        {hasFavoriteProjects ? (
          <section className="project-grid" aria-label="Favorittprodukter">
            {favoriteProjects.map((project) => (
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
