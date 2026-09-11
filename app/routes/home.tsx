import { useEffect, useState } from "react";
import { SiteHeader } from "~/components/site-header";
import { ProductDetailsModal } from "~/components/product-details-modal";
import { ProjectCard } from "~/components/project-card";
import { deleteProduct, fetchProducts } from "~/lib/products";
import type { ProjectItem } from "~/types/project";

export default function Home() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

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

  const hasProjects = projects.length > 0;
  const handleSelectProject = (project: ProjectItem) => {
    setDeleteErrorMessage(null);
    setSelectedProject(project);
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

  return (
    <div className="page">
      <SiteHeader />

      <main className="content" aria-label="Prosjektoversikt">
        <section className="intro">
          <h1>Mine hjemmelagde ting</h1>
          <p>
            Her kan jeg vise fram ting jeg har laget, og holde styr på om jeg
            beholder dem, vurderer salg eller allerede har solgt dem.
          </p>
        </section>

        {isLoading ? <p className="state-message">Laster produkter...</p> : null}

        {errorMessage ? <p className="state-message error">{errorMessage}</p> : null}

        {!isLoading && !errorMessage && !hasProjects ? (
          <p className="state-message">
            Ingen produkter enda. Legg inn første produkt i Supabase.
          </p>
        ) : null}

        {hasProjects ? (
          <section className="project-grid" aria-label="Prosjekter">
            {projects.map((project) => (
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
          onDelete={handleDeleteProduct}
          onClose={() => {
            setDeleteErrorMessage(null);
            setSelectedProject(null);
          }}
        />
      ) : null}
    </div>
  );
}
