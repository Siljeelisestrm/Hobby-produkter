import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthForm } from "~/components/auth-form";
import { ProductDetailsModal } from "~/components/product-details-modal";
import { ProjectCard } from "~/components/project-card";
import { useAuth } from "~/context/auth-context";
import { fetchSharedProducts, toggleProductLike } from "~/lib/products";
import type { ProjectItem } from "~/types/project";
import { PiUsersThree } from "react-icons/pi";

export default function Explore() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(
    null,
  );

  const loadSharedProducts = async (): Promise<ProjectItem[]> => {
    setIsLoading(true);
    try {
      const data = await fetchSharedProducts(user?.id);
      setProjects(data);
      setErrorMessage(null);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setErrorMessage(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSharedProducts();
  }, [user?.id]);

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

  const handleToggleLike = async (
    project: ProjectItem,
    shouldLike: boolean,
  ): Promise<void> => {
    if (!user) {
      setUpdateErrorMessage("Logg inn for å like produkter.");
      return;
    }

    setIsUpdating(true);
    setUpdateErrorMessage(null);
    try {
      await toggleProductLike(project.id, user.id, shouldLike);
      const latestProducts = await loadSharedProducts();
      setSelectedProject((current) => {
        if (!current || current.id !== project.id) {
          return current;
        }

        const latest = latestProducts.find((item) => item.id === project.id);
        return latest ?? current;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukjent feil.";
      setUpdateErrorMessage(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <main className="content content--feed" aria-label="Utforsk">
        <section className="intro">
          <div className="intro-top">
            <h1>Utforsk</h1>
            <Link
              to="/brukere"
              className="icon-button"
              aria-label="Se alle brukere"
              title="Se alle brukere"
            >
              <span aria-hidden="true">
                <PiUsersThree />
              </span>
            </Link>
          </div>
        </section>

        {!isAuthLoading && !user ? (
          <p className="state-message">Logg inn for å kunne like produkter.</p>
        ) : null}

        {isLoading ? (
          <p className="state-message">Laster delte produkter...</p>
        ) : null}
        {errorMessage ? (
          <p className="state-message error">{errorMessage}</p>
        ) : null}

        {!isLoading && !errorMessage && filteredProjects.length === 0 ? (
          <p className="state-message">Ingen delte produkter for valgt år.</p>
        ) : null}

        {filteredProjects.length > 0 ? (
          <section className="project-grid" aria-label="Delte produkter">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showOwner
                showLikes
                showLikeButton
                isLikeUpdating={isUpdating}
                onToggleLike={handleToggleLike}
                showStatus={false}
                ownerProfileHref={
                  project.ownerUsername
                    ? `/profil/${encodeURIComponent(project.ownerUsername)}`
                    : undefined
                }
                onSelect={setSelectedProject}
              />
            ))}
          </section>
        ) : null}

        {!user ? <AuthForm /> : null}
      </main>

      {selectedProject ? (
        <ProductDetailsModal
          project={selectedProject}
          isDeleting={false}
          deleteErrorMessage={null}
          isUpdating={isUpdating}
          updateErrorMessage={updateErrorMessage}
          canEdit={false}
          canDelete={false}
          showStatus={false}
          showFavoriteToggle={false}
          showLikeToggle
          onUpdate={async () => false}
          onDelete={async () => {}}
          onClose={() => {
            setUpdateErrorMessage(null);
            setSelectedProject(null);
          }}
        />
      ) : null}
    </>
  );
}
