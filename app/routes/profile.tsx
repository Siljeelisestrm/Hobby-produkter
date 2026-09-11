import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthForm } from "~/components/auth-form";
import { ProjectCard } from "~/components/project-card";
import { useAuth } from "~/context/auth-context";
import { signOut } from "~/lib/auth";
import { fetchSharedProductsByOwner } from "~/lib/products";
import type { ProjectItem } from "~/types/project";

export default function ProfilePage() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    const loadSharedProjects = async () => {
      try {
        const data = await fetchSharedProductsByOwner(user.id, user.id);
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

    void loadSharedProjects();

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

  if (isAuthLoading) {
    return (
      <main className="content">
        <p className="state-message">Laster profil...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="content">
        <section className="intro">
          <h1>Profil</h1>
          <p>Logg inn for å se profilen din.</p>
        </section>
        <AuthForm />
      </main>
    );
  }

  return (
    <main className="content" aria-label="Profil">
      <section className="profile-header">
        <div className="profile-header__avatar" aria-hidden="true">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" />
          ) : (
            <span>{(profile?.username ?? user.email ?? "U").slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div className="profile-header__content">
          <h1>{profile?.username ?? "Min profil"}</h1>
          {profile?.bio ? <p>{profile.bio}</p> : null}
          <p className="profile-header__meta">
            {sortedProjects.length} publiserte{" "}
            {sortedProjects.length === 1 ? "produkt" : "produkter"}
          </p>
          <div className="profile-header__actions">
            <Link className="secondary-button" to="/brukere">
              Se brukere
            </Link>
            <Link className="secondary-button" to="/">
              Gå til Min side
            </Link>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void signOut();
              }}
            >
              Logg ut
            </button>
          </div>
        </div>
      </section>

      <section className="intro">
        <h2>Publiserte objekter</h2>
      </section>

      {isLoading ? <p className="state-message">Laster publiserte produkter...</p> : null}
      {errorMessage ? <p className="state-message error">{errorMessage}</p> : null}
      {!isLoading && !errorMessage && sortedProjects.length === 0 ? (
        <p className="state-message">Du har ikke publisert noen produkter enda.</p>
      ) : null}

      {sortedProjects.length > 0 ? (
        <section className="project-grid" aria-label="Publiserte produkter">
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              showStatus={false}
              showLikes
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
