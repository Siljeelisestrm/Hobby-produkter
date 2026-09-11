import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProjectCard } from "~/components/project-card";
import { useAuth } from "~/context/auth-context";
import { fetchProfileByUsername, type UserProfile } from "~/lib/auth";
import { fetchSharedProductsByOwner } from "~/lib/products";
import type { ProjectItem } from "~/types/project";

export default function UserProfilePage() {
  const { username: encodedUsername = "" } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const username = decodeURIComponent(encodedUsername);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const loadUserProfile = async () => {
      try {
        const foundProfile = await fetchProfileByUsername(username);
        if (!foundProfile) {
          if (!isCancelled) {
            setProfile(null);
            setProjects([]);
            setErrorMessage(null);
          }
          return;
        }

        const sharedProducts = await fetchSharedProductsByOwner(
          foundProfile.id,
          user?.id,
        );
        if (!isCancelled) {
          setProfile(foundProfile);
          setProjects(sharedProducts);
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

    void loadUserProfile();

    return () => {
      isCancelled = true;
    };
  }, [username, user?.id]);

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

  return (
    <main className="content" aria-label="Brukerprofil">
      {isLoading ? <p className="state-message">Laster profil...</p> : null}
      {errorMessage ? <p className="state-message error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && !profile ? (
        <section className="intro">
          <h1>Profil finnes ikke</h1>
          <p>Denne brukeren ble ikke funnet.</p>
          <Link className="secondary-button" to="/utforsk">
            Tilbake til Utforsk
          </Link>
        </section>
      ) : null}

      {!isLoading && !errorMessage && profile ? (
        <>
          <section className="profile-header">
            <div className="profile-header__avatar" aria-hidden="true">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" />
              ) : (
                <span>{profile.username.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="profile-header__content">
              <h1>{profile.username}</h1>
              {profile.bio ? <p>{profile.bio}</p> : null}
              <p className="profile-header__meta">
                {sortedProjects.length} delt{" "}
                {sortedProjects.length === 1 ? "produkt" : "produkter"}
              </p>
              <div className="profile-header__actions">
                <Link className="secondary-button" to="/brukere">
                  Se alle brukere
                </Link>
                <Link className="secondary-button" to="/utforsk">
                  Til Utforsk
                </Link>
              </div>
            </div>
          </section>

          {sortedProjects.length === 0 ? (
            <p className="state-message">Ingen delte produkter enda.</p>
          ) : (
            <section className="project-grid" aria-label="Delte produkter fra bruker">
              {sortedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  showStatus={false}
                  showLikes
                />
              ))}
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}
